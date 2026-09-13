/* Wattouna In-Browser AI Co-Designer — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/local-ai.ts --format=esm --outfile=public/vendor/local-ai.js
   Architecture (honest offline story):
   - Engine + weights lazy-load on explicit user action and persist in the
     browser (WebLLM Cache API + IndexedDB) → subsequent runs are offline.
   - Default model: Qwen2-0.5B-Instruct-q4f16_1 (~400MB, WebGPU). Heavy
     models (Llama-3-8B class, 4GB+) are deliberately NOT default: they
     crash most phones and break the offline-installable promise.
   - OTA: /models/manifest.json {version, modelId} vs localStorage; when the
     server ships a fine-tuned brain, the UI prompts an update.
   - Voice: Web Speech API STT (ar-TN → ar-SA → fr-FR → en-US fallback
     chain) + speechSynthesis TTS. No network needed for on-device voices.
   - No WebGPU / engine failure → rule-based responder keeps every feature
     (including voice→canvas commands) working. */

export type AiStatus =
  | 'idle' | 'loading-engine' | 'downloading-model' | 'ready-local'
  | 'rule-mode' | 'error';

export interface VoiceCommand {
  reply: string;
  actions: Array<{ add: string }>;
}

export const OTA_KEY = 'wattouna-ai-model-ver';
export const MANIFEST_URL = '/models/manifest.json';

const CDN_ENGINE = 'https://esm.sh/@mlc-ai/web-llm@0.2.79';

const SYSTEM_PROMPT = [
  'You are Wattouna AI, a friendly clean-energy hardware engineer.',
  'You speak Tunisian Arabic (simple technical Tunsi) and also handle Standard Arabic, French and English.',
  'Expertise: PBX-36 36V solar generator, 0.00mA IRF4905/TL431 latch (31.00V cutoff, 2.495V ref),',
  'LTC3780 MPPT to 42.0V, WAGO 221 solderless builds, recycled e-scooter batteries, Tunisia sourcing',
  '(Rue d\u2019Athènes, Moncef Bey, Charguia, Sfax Bab Bhar, Sousse).',
  'Keep answers short, practical, numbered steps. Never invent voltages.',
].join(' ');

/* Keyword → workbench part (AR / FR / EN). Shared with the voice parser. */
const PART_WORDS: Array<[string, RegExp]> = [
  ['battery', /بطاري|battery|batterie|10s/i],
  ['mppt', /شمس|mppt|solair|panneau|solar|ltc3780/i],
  ['latch', /قفل|latch|mosfet|0\.00|tl431|irf4905/i],
  ['usb', /usb|pd|هاتف|phone|تليفون/i],
  ['buck', /buck|12v|باك|راوتر|router|إنارة|led/i],
  ['wago', /wago|موصل|connecteur|ترمينال/i],
  ['meter', /فولتميتر|volt|شاشة|قياس|multim/i],
  ['button', /زر|button|bouton|start|stop|تشغيل/i],
];

export function parseVoiceCommand(text: string): VoiceCommand {
  const found: string[] = [];
  for (const [part, re] of PART_WORDS) {
    if (re.test(text) && !found.includes(part)) found.push(part);
  }
  if (!found.length) {
    return {
      reply: 'سمعتك 👍 قولي مثلًا: «أضف بطارية» أو «add MPPT» وأنا نحط القطعة في المختبر.',
      actions: [],
    };
  }
  const names: Record<string, string> = {
    battery: 'بطارية 10S 🔋', mppt: 'وحدة MPPT ☀️', latch: 'قفل 0.00mA 🔌',
    usb: 'USB-C PD ⚡', buck: 'Buck 12V 🔽', wago: 'WAGO 221 🔗',
    meter: 'فولتميتر 📟', button: 'زر 16mm 🔘',
  };
  return {
    reply: `تم ✅ حطيتلك: ${found.map((f) => names[f]).join(' + ')} — شوف اللوحة!`,
    actions: found.map((add) => ({ add })),
  };
}

export interface AiBrain {
  status: AiStatus;
  progress: string;
  ensureLoaded(onProgress?: (t: string) => void): Promise<boolean>;
  chat(question: string): Promise<string>;
  checkOTA(): Promise<{ update: boolean; remote: string; local: string }>;
  speak(text: string, lang?: string): void;
  stopSpeak(): void;
  listen(lang?: string): Promise<string>;
  listeningSupported(): boolean;
}

export function createBrain(): AiBrain {
  let engine: any = null;
  let status: AiStatus = 'idle';
  let progress = '';
  let modelId = 'Qwen2-0.5B-Instruct-q4f16_1-MLC';

  async function readManifest(): Promise<any> {
    try {
      const r = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch { /* offline → keep defaults */ }
    return null;
  }

  async function ensureLoaded(onProgress?: (t: string) => void): Promise<boolean> {
    if (engine) return true;
    const say = (t: string) => { progress = t; onProgress?.(t); };
    try {
      const man = await readManifest();
      if (man?.modelId) modelId = man.modelId;
      if (!navigator.gpu) {
        status = 'rule-mode';
        say('⚠️ WebGPU غير متوفر — وضع القواعد الذكي مفعّل (كل الميزات شغالة).');
        return false;
      }
      status = 'loading-engine';
      say('⏳ تحميل محرك الذكاء (مرة واحدة، يُحفظ في المتصفح)…');
      const webllm = await import(/* @vite-ignore */ CDN_ENGINE);
      status = 'downloading-model';
      const initProgress = (rep: any) => say(`⬇️ ${rep.text || Math.round((rep.progress || 0) * 100) + '%'}`);
      engine = await webllm.CreateMLCEngine(modelId, { initProgressCallback: initProgress, logLevel: 'SILENT' });
      status = 'ready-local';
      say('✅ العقل المحلي جاهز — يخدم دون اتصال.');
      try { localStorage.setItem(OTA_KEY, man?.version || modelId); } catch { /* ignore */ }
      return true;
    } catch (e) {
      status = 'rule-mode';
      say('⚠️ تعذر تحميل النموذج — وضع القواعد الذكي مفعّل.');
      return false;
    }
  }

  async function chat(question: string): Promise<string> {
    if (engine) {
      try {
        const res = await engine.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: question },
          ],
          temperature: 0.4,
          max_tokens: 350,
        });
        const txt = res?.choices?.[0]?.message?.content?.trim();
        if (txt) return txt;
      } catch { /* fall through to rules */ }
    }
    // rule-based fallback: command-aware, always available
    const cmd = parseVoiceCommand(question);
    if (cmd.actions.length) return cmd.reply;
    return ruleAnswer(question);
  }

  async function checkOTA(): Promise<{ update: boolean; remote: string; local: string }> {
    let local = '';
    try { local = localStorage.getItem(OTA_KEY) || ''; } catch { /* ignore */ }
    const man = await readManifest();
    const remote = man?.version || '';
    return { update: Boolean(remote && local && remote !== local), remote, local };
  }

  function speak(text: string, lang?: string): void {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/<[^>]+>/g, '').slice(0, 400);
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang || pickVoiceLang();
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }

  function stopSpeak(): void {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }

  function pickVoiceLang(): string {
    try {
      const vs = window.speechSynthesis?.getVoices() || [];
      const langs = vs.map((v) => v.lang || '');
      if (langs.some((l) => l.startsWith('ar'))) return 'ar-SA';
      if (langs.some((l) => l.startsWith('fr'))) return 'fr-FR';
    } catch { /* ignore */ }
    return 'ar-SA';
  }

  function listeningSupported(): boolean {
    return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  function listen(lang?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) { reject(new Error('no-stt')); return; }
      const rec = new SR();
      rec.lang = lang || 'ar-TN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev: any) => resolve(ev.results[0][0].transcript);
      rec.onerror = (ev: any) => reject(new Error(ev.error || 'stt-error'));
      rec.onend = () => reject(new Error('no-speech'));
      try { rec.start(); } catch (e) { reject(e as Error); }
      setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, 12000);
    });
  }

  return {
    get status() { return status; },
    get progress() { return progress; },
    ensureLoaded, chat, checkOTA, speak, stopSpeak, listen, listeningSupported,
  };
}

/* Compact rule-based responder (offline, zero-config). Tunisian Arabic. */
function ruleAnswer(q: string): string {
  const n = q.toLowerCase();
  const has = (...ws: string[]) => ws.some((w) => n.includes(w));
  if (has('0.00', 'standby', 'تسريب', 'latch', 'قفل')) return '🔌 دارة 0.00mA: موسفت IRF4905 يعزل الحمل فيزيائيًا عند 31.00V (TL431، مرجع 2.495V) — صفر حقيقي، موش وضع نوم.';
  if (has('31', 'tl431', 'عتبة', 'threshold')) return '🎯 العتبة 31.00V ± 0.05V: ‏Vtrip = 2.495 × (1 + 102k/8.2k) — عاير RV1 بمصدر متغير.';
  if (has('mppt', 'شمسي', 'solar', '42', 'شحن')) return '☀️ اضبط LTC3780 على 42.0V بدون حمل أولًا. لوح 160W ≈ 3.4A شحن — مناسب للخلايا المعاد تدويرها.';
  if (has('بطارية', 'سكوتر', 'batterie', 'سعر', 'نشري')) return '🔋 سوق منصف باي للبكك المستعملة (80–150 د.ت)، ونهج أثينا للخلايا والشواحن. ارفض أي خلية تحت 3.0V.';
  if (has('مودام', 'تلفزة', 'يشد', 'runtime', 'autonomie')) return '⏱️ بك 336Wh: مودام+إنارة ≈ 18h، +تلفزة ≈ 4h، لابتوب ≈ 7h. جرّب حاسبة الموقع.';
  if (has('start', 'تخدم', 'مشكلة', 'panne', 'عطل')) return '⚠️ تفقد بالترتيب: جهد فوق 31V؟ فيوز 15A؟ زر STOP (NC) مسكر؟ Gate يهبط كي تنزل START؟';
  if (has('سلامة', 'fuse', 'فيوز', 'safety')) return '🛡️ فيوز 15A أول عنصر دائمًا، AWG 14 للقدرة، WAGO 221 بلا لحام، قِس مرتين وشغّل مرة.';
  if (has('سلام', 'اهلا', 'bonjour', 'hello', 'عسلامة')) return '👋 أهلًا! أنا مساعد واطنا — اسألني بالصوت ولا الكتابة، ونجم نحطلك قطع في المختبر مباشرة.';
  return '🤔 جرّب: «أضف بطارية» / «add MPPT» / «حط فولتميتر» — أو اسألني على 0.00mA، الشمسي، البطاريات، والأعطاب.';
}
