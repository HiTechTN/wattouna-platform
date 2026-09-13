#!/usr/bin/env python3
"""Wattouna Nightly Self-Improving Loop — LoRA fine-tune + quantize + deploy.

Pipeline (runs 02:00 via systemd timer wattouna-trainer.timer):
  1. Load data/wattouna_training.jsonl (System/User/Assistant instruction pairs
     appended by scripts/autonomous-harvester.mjs every 4 hours).
  2. LoRA fine-tune Qwen2-0.5B-Instruct (transformers + peft + trl, bf16,
     gradient checkpointing — fits a 12GB RTX 3060).
  3. Merge adapter → fp16 base. Quantize to WebGPU MLC format if `mlc_llm`
     is installed; otherwise stage the merged model and mark quant pending.
  4. Publish to public/models/wattouna-latest/ + bump public/models/manifest.json
     so the PWA prompts "Update Wattouna AI Brain? (Offline Mode)".

Usage:
  python3 scripts/nightly-trainer.py --self-test     # validate only, no weights
  python3 scripts/nightly-trainer.py --max-steps 5   # smoke train
  python3 scripts/nightly-trainer.py                 # full nightly run
"""
import argparse
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'wattouna_training.jsonl')
BASE_MODEL = 'Qwen/Qwen2-0.5B-Instruct'
RUNS = os.path.join(ROOT, 'runs')
DEPLOY_DIR = os.path.join(ROOT, 'public', 'models', 'wattouna-latest')
OTA_MANIFEST = os.path.join(ROOT, 'public', 'models', 'manifest.json')
MAX_LEN = 1024


def load_pairs():
    if not os.path.exists(DATA):
        print(f'[trainer] no dataset yet at {DATA}; nothing to train on.')
        return []
    rows = []
    with open(DATA) as f:
        for i, ln in enumerate(f):
            ln = ln.strip()
            if not ln:
                continue
            o = json.loads(ln)
            assert {'system', 'user', 'assistant'} <= set(o), f'line {i} keys'
            rows.append(o)
    return rows


def format_chat(tok, o):
    msgs = [
        {'role': 'system', 'content': o['system']},
        {'role': 'user', 'content': o['user']},
        {'role': 'assistant', 'content': o['assistant']},
    ]
    return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=False)


def self_test():
    print('[trainer] --self-test: validating pipeline without weights…')
    import transformers, peft, trl  # noqa: F401  (fail fast if stack broken)
    print(f"[trainer] transformers={transformers.__version__} peft + trl OK")
    try:
        import torch
        print(f"[trainer] torch CUDA: {torch.cuda.is_available()}")
    except Exception as e:
        print(f'[trainer] torch issue: {e}')
    rows = load_pairs()
    print(f'[trainer] dataset rows: {len(rows)}')
    if rows:
        from transformers import AutoTokenizer
        tok = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
        lens = []
        for o in rows[:4]:
            ids = tok(format_chat(tok, o), truncation=True, max_length=MAX_LEN)['input_ids']
            lens.append(len(ids))
        print(f'[trainer] sample token lengths: {lens} (cap {MAX_LEN})')
    print('[trainer] SELF-TEST PASS ✔ (run without --self-test for a real cycle)')


def train(max_steps):
    import torch
    from transformers import (
        AutoModelForCausalLM, AutoTokenizer, TrainingArguments,
        DataCollatorForLanguageModeling,
    )
    try:
        from transformers import BitsAndBytesConfig  # noqa
        _ = BitsAndBytesConfig
    except Exception:
        pass
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

    rows = load_pairs()
    if not rows:
        print('[trainer] empty dataset — skipping cycle (exit 0).')
        return
    use_cuda = torch.cuda.is_available()
    print(f"[trainer] rows={len(rows)} cuda={use_cuda} base={BASE_MODEL}")

    tok = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    texts = [format_chat(tok, o) for o in rows]
    enc = tok(texts, truncation=True, max_length=MAX_LEN, padding=False)

    class DS(torch.utils.data.Dataset):
        def __len__(self):
            return len(enc['input_ids'])

        def __getitem__(self, i):
            ids = enc['input_ids'][i]
            return {'input_ids': torch.tensor(ids), 'labels': torch.tensor(ids)}

    ds = DS()
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, trust_remote_code=True,
        torch_dtype=torch.bfloat16 if use_cuda else torch.float32,
        device_map='auto' if use_cuda else None,
    )
    model.gradient_checkpointing_enable()
    model = prepare_model_for_kbit_training(model)
    peft_cfg = LoraConfig(
        r=8, lora_alpha=16, lora_dropout=0.05, bias='none', task_type='CAUSAL_LM',
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
    )
    model = get_peft_model(model, peft_cfg)
    model.print_trainable_parameters()

    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M')
    outdir = os.path.join(RUNS, f'lora-{stamp}')
    args = TrainingArguments(
        output_dir=outdir,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=3,
        max_steps=max_steps if max_steps > 0 else -1,
        logging_steps=5,
        save_steps=50,
        save_total_limit=2,
        bf16=use_cuda,
        fp16=False,
        optim='adamw_torch',
        report_to='none',
        seed=42,
    )
    trainer = None
    try:  # preferred: TRL SFT trainer
        from trl import SFTTrainer
        try:
            trainer = SFTTrainer(model=model, args=args, train_dataset=ds, processing_class=tok)
        except TypeError:
            trainer = SFTTrainer(model=model, args=args, train_dataset=ds, tokenizer=tok)
        print('[trainer] using trl.SFTTrainer')
    except Exception as e:
        print(f'[trainer] SFTTrainer unavailable ({e}); falling back to transformers.Trainer')
        from transformers import Trainer
        trainer = Trainer(
            model=model, args=args, train_dataset=ds,
            data_collator=DataCollatorForLanguageModeling(tokenizer=tok, mlm=False),
        )
    trainer.train()
    adapter_dir = os.path.join(outdir, 'adapter')
    model.save_pretrained(adapter_dir)
    tok.save_pretrained(adapter_dir)

    # merge LoRA into fp16 base for quantization
    merged_dir = os.path.join(outdir, 'merged-fp16')
    merged = model.merge_and_unload()
    merged.save_pretrained(merged_dir)
    tok.save_pretrained(merged_dir)
    print(f'[trainer] adapter + merged model saved → {outdir}')

    metrics = {'stamp': stamp, 'rows': len(rows), 'adapter': adapter_dir, 'merged': merged_dir}
    quantize(merged_dir, metrics)
    os.makedirs(RUNS, exist_ok=True)
    with open(os.path.join(RUNS, f'nightly-{stamp}.json'), 'w') as f:
        json.dump(metrics, f, indent=2)
    print('[trainer] NIGHTLY CYCLE COMPLETE ✔')


def quantize(merged_dir, metrics):
    """MLC WebGPU packaging. Falls back to staged weights + pending manifest."""
    stamp = metrics['stamp']
    try:
        import mlc_llm  # noqa: F401
        have_mlc = True
    except ImportError:
        have_mlc = False
    if not have_mlc:
        metrics['quant'] = 'pending'
        metrics['quant_note'] = 'mlc_llm not installed; merged fp16 staged. Install: pip install mlc-llm, then re-run.'
        print('[trainer] mlc_llm missing — merged model staged, quantization deferred.')
        print('[trainer] to enable: pip install mlc-llm   (then nightly runs quantize automatically)')
        return
    from mlc_llm import gen_config, convert_weight  # type: ignore
    workdir = os.path.join(RUNS, f'mlc-{stamp}')
    os.makedirs(workdir, exist_ok=True)
    model_id = 'Qwen2-0.5B-Instruct'
    gen_config(config_path=os.path.join(workdir, 'mlc-chat-config.json'),
               model=model_id, quantization='q4f16_1', conv_template='chatml',
               context_window_size=2048, prefill_chunk_size=512)
    convert_weight(model_path=merged_dir,
                   quant_config={'name': 'q4f16_1'},
                   output_path=os.path.join(workdir, 'params'))
    os.makedirs(DEPLOY_DIR, exist_ok=True)
    for fn in ('mlc-chat-config.json',):
        src = os.path.join(workdir, fn)
        if os.path.exists(src):
            import shutil
            shutil.copy(src, os.path.join(DEPLOY_DIR, fn))
    import shutil
    params_src = os.path.join(workdir, 'params')
    params_dst = os.path.join(DEPLOY_DIR, 'params')
    if os.path.isdir(params_dst):
        shutil.rmtree(params_dst)
    shutil.copytree(params_src, params_dst)
    version = f'wattouna-nightly-{stamp}'
    with open(OTA_MANIFEST, 'w') as f:
        json.dump({'version': version, 'modelId': model_id,
                   'notes': f'Nightly fine-tune on {metrics["rows"]} pairs.'}, f, indent=2)
    metrics['quant'] = 'mlc-q4f16_1'
    metrics['deployed'] = DEPLOY_DIR
    metrics['ota_version'] = version
    print(f'[trainer] quantized + deployed {version} → OTA manifest bumped')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--self-test', action='store_true')
    ap.add_argument('--max-steps', type=int, default=0)
    a = ap.parse_args()
    if a.self_test:
        self_test()
    else:
        train(a.max_steps)


if __name__ == '__main__':
    main()
