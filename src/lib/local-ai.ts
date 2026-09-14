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
  'CANVAS RULE: when the user says "check my circuit", "analyze", "افحص" or pastes a [CANVAS] digest,',
  'read it as ground truth: report shorts, missing grounds and unconnected terminals first,',
  'then answer. Never claim to see more than the digest contains.',
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
  chat(question: string, canvasSummary?: string): Promise<string>;
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

  async function chat(question: string, canvasSummary?: string): Promise<string> {
    const q = canvasSummary ? `${canvasSummary}\n\nUSER: ${question}` : question;
    if (engine) {
      try {
        const res = await engine.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: q },
          ],
          temperature: 0.4,
          max_tokens: 350,
        });
        const txt = res?.choices?.[0]?.message?.content?.trim();
        if (txt) return txt;
      } catch { /* fall through to rules */ }
    }
    // rule-based fallback: command-aware, always available
    const cmd = parseVoiceCommand(q);
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

/* ================================================================== */
/* Agentic layer: canvas awareness, analysis, auto-wiring (offline).   */
/* Terminal nets mirror workbench PARTS + harvester NETS (keep synced).*/
/* ================================================================== */

export interface CanvasNode { id: string; type: string; x?: number; y?: number }
export interface CanvasWire { a: string; b: string; color: string }
export interface CanvasState { nodes: CanvasNode[]; wires: CanvasWire[] }

const NETS: Record<string, Record<string, string>> = {
  battery: { plus: 'PWR', gnd: 'GND' },
  mppt: { 'sol+': 'PWR', 'sol-': 'GND', 'out+': 'PWR', 'out-': 'GND' },
  latch: { in: 'PWR', gate: 'SIG', out: 'PWR', gnd: 'GND' },
  usb: { vin: 'PWR', gnd: 'GND', usbc: 'SIG' },
  buck: { vin: 'PWR', gnd: 'GND', vout: 'PWR' },
  wago: { p1: 'BUS', p2: 'BUS', p3: 'BUS' },
  meter: { 'v+': 'PWR', 'v-': 'GND' },
  button: { com: 'SIG', no: 'SIG', nc: 'SIG' },
};

const TLABEL: Record<string, Record<string, string>> = {
  battery: { plus: 'Battery+36V', gnd: 'Battery-GND' },
  mppt: { 'sol+': 'MPPT-S+', 'sol-': 'MPPT-S-', 'out+': 'MPPT-B+', 'out-': 'MPPT-B-' },
  latch: { in: 'Latch-IN', gate: 'Latch-GATE', out: 'Latch-OUT', gnd: 'Latch-GND' },
  usb: { vin: 'USB-V+', gnd: 'USB-GND', usbc: 'USB-C' },
  buck: { vin: 'Buck-Vin', gnd: 'Buck-GND', vout: 'Buck-12V' },
  wago: { p1: 'WAGO-1', p2: 'WAGO-2', p3: 'WAGO-3' },
  meter: { 'v+': 'Meter+', 'v-': 'Meter-' },
  button: { com: 'BTN-COM', no: 'BTN-NO', nc: 'BTN-NC' },
};

function unionsOf(state: CanvasState) {
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    parent[x] = parent[x] ?? x;
    return parent[x] === x ? x : (parent[x] = find(parent[x]));
  };
  const uni = (a: string, b: string) => { parent[find(a)] = find(b); };
  const netOf: Record<string, string> = {};
  for (const nd of state.nodes || []) {
    for (const [tid, net] of Object.entries(NETS[nd.type] || {})) {
      const k = `${nd.id}:${tid}`;
      netOf[k] = net; parent[k] = k;
    }
  }
  for (const nd of state.nodes || []) {
    const bus = Object.entries(NETS[nd.type] || {}).filter(([, n]) => n === 'BUS').map(([t]) => `${nd.id}:${t}`);
    for (let i = 1; i < bus.length; i++) uni(bus[0], bus[i]);
  }
  for (const w of state.wires || []) {
    if (netOf[w.a] && netOf[w.b]) uni(w.a, w.b);
  }
  return { find, netOf };
}

export interface Finding {
  level: 'danger' | 'warn' | 'info';
  ar: string;
  voice: string;
}

export function analyzeCircuit(state: CanvasState): { ok: boolean; findings: Finding[]; summary: string } {
  const findings: Finding[] = [];
  const nodes = state.nodes || [], wires = state.wires || [];
  if (!nodes.length) {
    return { ok: false, findings: [{ level: 'info', ar: 'اللوحة فارغة — أضف بطارية أولًا 🔋', voice: 'Empty canvas. Add a battery first.' }], summary: 'empty canvas' };
  }
  const { find, netOf } = unionsOf(state);
  const label = (k: string) => {
    const [nid, tid] = k.split(':');
    const nd = nodes.find((n) => n.id === nid);
    return TLABEL[nd?.type || '']?.[tid] || k;
  };
  // 1. shorts
  const sets: Record<string, string[]> = {};
  for (const k of Object.keys(netOf)) (sets[find(k)] ??= []).push(k);
  for (const members of Object.values(sets)) {
    const p = members.filter((m) => netOf[m] === 'PWR');
    const g = members.filter((m) => netOf[m] === 'GND');
    if (p.length && g.length) {
      findings.push({
        level: 'danger',
        ar: `⚡ ماس كهربائي! ${label(p[0])} متصل مباشرة بـ ${label(g[0])} — افصل السلك قبل التشغيل.`,
        voice: `Warning: Short circuit detected between ${label(p[0])} and ${label(g[0])}.`,
      });
    }
  }
  // 2. missing grounds + unconnected terminals
  const touched = new Set<string>();
  wires.forEach((w) => { touched.add(w.a); touched.add(w.b); });
  const floating: string[] = [];
  for (const nd of nodes) {
    for (const [tid, net] of Object.entries(NETS[nd.type] || {})) {
      if (!touched.has(`${nd.id}:${tid}`)) floating.push(`${nd.id}:${tid}`);
    }
  }
  const gndMissing = floating.filter((k) => netOf[k] === 'GND');
  if (gndMissing.length) {
    findings.push({
      level: 'warn',
      ar: `🟡 أرضي غير موصول: ${gndMissing.slice(0, 3).map(label).join('، ')} — كل GND لازم يرجع للبطارية.`,
      voice: `Warning: unconnected ground on ${gndMissing.slice(0, 2).map(label).join(', ')}.`,
    });
  }
  const rest = floating.filter((k) => netOf[k] !== 'GND');
  if (rest.length) {
    findings.push({
      level: 'info',
      ar: `🔵 ${rest.length} أطراف غير موصولة (${rest.slice(0, 4).map(label).join('، ')}) — طبيعي أثناء البناء.`,
      voice: `${rest.length} unconnected terminals. Normal while building.`,
    });
  }
  // 3. power path battery → latch → load
  const batt = nodes.find((n) => n.type === 'battery');
  const latch = nodes.find((n) => n.type === 'latch');
  if (!batt) findings.push({ level: 'warn', ar: '🔋 لا توجد بطارية — أضف مصدر طاقة.', voice: 'No battery found.' });
  if (batt && latch && find(`${batt.id}:plus`) !== find(`${latch.id}:in`)) {
    findings.push({ level: 'warn', ar: '🔌 البطارية غير موصولة بمدخل القفل (IN+) — الدارة لن تعمل.', voice: 'Battery is not connected to the latch input.' });
  }
  const ok = !findings.some((f) => f.level === 'danger');
  if (ok && !findings.length) {
    findings.push({ level: 'info', ar: '✅ الدارة سليمة ظاهريًا — لا ماس، والأرضيات موصولة. جرّب المحاكاة ▶️', voice: 'Circuit looks good. No shorts detected.' });
  }
  const summary = `nodes:${nodes.map((n) => n.type).join(',') || 'none'} wires:${wires.length} ` +
    `findings:${findings.map((f) => f.level).join(',') || 'clean'}`;
  return { ok, findings, summary };
}

/** Compact canvas digest for LLM context (token-cheap). */
export function summarizeCanvas(state: CanvasState): string {
  const a = analyzeCircuit(state);
  const parts = (state.nodes || []).map((n) => n.type).join(',');
  return `[CANVAS] parts:{${parts || 'empty'}} wires:${(state.wires || []).length} analysis:{${a.summary}} ` +
    a.findings.slice(0, 4).map((f) => f.ar.replace(/<[^>]+>/g, '')).join(' | ');
}

/* ---------------- auto_wire_circuit tool ---------------- */
const RED = '#ef4444', BLK = '#94a3b8', ORG = '#f59e0b', GRN = '#22c55e';

export function autoWire(nodes: CanvasNode[]): { wires: CanvasWire[]; notesAr: string[] } {
  const wires: CanvasWire[] = [];
  const notesAr: string[] = [];
  const byType = (t: string) => nodes.filter((n) => n.type === t);
  const batt = byType('battery')[0], latch = byType('latch')[0];
  const wago = byType('wago')[0], meter = byType('meter')[0];
  const btn = byType('button')[0], mppt = byType('mppt')[0];
  const loads = nodes.filter((n) => n.type === 'buck' || n.type === 'usb');
  const add = (a: string, b: string, color: string) => wires.push({ a, b, color });
  if (!batt) return { wires, notesAr: ['لا توجد بطارية — أضف واحدة أولًا 🔋'] };
  if (latch) {
    add(`${batt.id}:plus`, `${latch.id}:in`, RED);
    add(`${batt.id}:gnd`, `${latch.id}:gnd`, BLK);
    notesAr.push('البطارية ← القفل (أحمر/أسود)');
  }
  if (mppt) {
    add(`${mppt.id}:out+`, `${batt.id}:plus`, RED);
    add(`${mppt.id}:out-`, `${batt.id}:gnd`, BLK);
    notesAr.push('MPPT ← البطارية (مسار الشحن 42V)');
  }
  const busSrc = latch ? `${latch.id}:out` : `${batt.id}:plus`;
  if (wago && (latch || batt)) {
    add(busSrc, `${wago.id}:p1`, ORG);
    notesAr.push('القضيب البرتقالي ← WAGO');
    const ports = [`${wago.id}:p2`, `${wago.id}:p3`];
    loads.slice(0, 2).forEach((ld, i) => {
      const vin = ld.type === 'buck' ? 'vin' : 'vin';
      add(ports[i % 2], `${ld.id}:${vin}`, ORG);
    });
    if (loads.length) notesAr.push('الأحمال ← قضيب WAGO المشترك');
  } else {
    loads.forEach((ld) => add(busSrc, `${ld.id}:vin`, ORG));
    if (loads.length) notesAr.push('الأحمال ← القضيب مباشرة');
  }
  loads.forEach((ld) => add(`${batt.id}:gnd`, `${ld.id}:gnd`, BLK));
  if (meter && (latch || batt)) {
    add(busSrc, `${meter.id}:v+`, ORG);
    add(`${batt.id}:gnd`, `${meter.id}:v-`, BLK);
    notesAr.push('الفولتميتر عبر القضيب');
  }
  if (btn && latch) {
    add(`${latch.id}:gate`, `${btn.id}:no`, GRN);
    add(`${btn.id}:com`, `${batt.id}:gnd`, GRN);
    notesAr.push('زر START في مسار البوابة');
  }
  if (!wires.length) notesAr.push('لا أحمال — أضف Buck أو USB أو فولتميتر.');
  return { wires, notesAr };
}
