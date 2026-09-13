#!/usr/bin/env node
/**
 * Wattouna Autonomous AI Hardware R&D Engine (4-hour pulse).
 *
 * Explores a built-in open-hardware catalog, synthesizes a complete project
 * (AR title/description, BOM, impact Wh, workbench-compatible canvas_state),
 * validates it with a Union-Find netlist check (no VCC-GND shorts, key power
 * path logically closed), then publishes it as the wattouna_ai_lab bot.
 *
 * Usage:
 *   node scripts/autonomous-harvester.mjs          # live run (insert)
 *   node scripts/autonomous-harvester.mjs --check  # validate catalog only
 *
 * Env: SUPABASE_URL (default http://localhost:8004), SERVICE_ROLE_KEY
 *      (default: read from ~/supabase-docker/docker/.env)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHECK_ONLY = process.argv.includes('--check');
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:8004';
const DOCKER_ENV = '/home/hitech/supabase-docker/docker/.env';
const BOT_ID = '00000000-0000-0000-0000-000000000001';

function loadServiceKey() {
  if (process.env.SERVICE_ROLE_KEY) return process.env.SERVICE_ROLE_KEY;
  try {
    const env = fs.readFileSync(DOCKER_ENV, 'utf8');
    const m = env.match(/^SERVICE_ROLE_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  return null;
}

/* ------------------------------------------------------------------ */
/* Terminal nets mirror src/pages/workbench.astro PARTS (keep in sync) */
/* ------------------------------------------------------------------ */
const NETS = {
  battery: { plus: 'PWR', gnd: 'GND' },
  mppt: { 'sol+': 'PWR', 'sol-': 'GND', 'out+': 'PWR', 'out-': 'GND' },
  latch: { in: 'PWR', gate: 'SIG', out: 'PWR', gnd: 'GND' },
  usb: { vin: 'PWR', gnd: 'GND', usbc: 'SIG' },
  buck: { vin: 'PWR', gnd: 'GND', vout: 'PWR' },
  wago: { p1: 'BUS', p2: 'BUS', p3: 'BUS' },
  meter: { 'v+': 'PWR', 'v-': 'GND' },
  button: { com: 'SIG', no: 'SIG', nc: 'SIG' },
};
const LOADS = new Set(['buck', 'usb', 'meter']);
const RED = '#ef4444', BLK = '#94a3b8', ORG = '#f59e0b', GRN = '#22c55e', PUR = '#a855f7';

const N = (id, type, x, y) => ({ id, type, x, y });
const W = (a, b, color) => ({ id: `${a}>${b}`, a, b, color });

const CATALOG = [
  {
    key: 'pbx36-starter', impactWh: 336,
    title: 'مختبر PBX-36 الأساسي — بطارية + قفل + باك 12V',
    desc: 'الدارة المرجعية للمولد PBX-36: بك 10S يغذي قفل 0.00mA (IRF4905/TL431) ثم محول Buck 12V للأحمال، مع فولتميتر لمراقبة القضبان. ابدأ من هنا قبل أي تطوير.',
    bom: ['بطارية سكوتر 10S مستعملة', 'وحدة Latch IRF4905 + TL431', 'محول Buck 12V/10A', 'فولتميتر DC', 'فيوز 15A', 'سلك AWG 14'],
    nodes: [N('batt', 'battery', 40, 90), N('latch', 'latch', 270, 90), N('buck', 'buck', 500, 90), N('meter', 'meter', 500, 260)],
    wires: [W('batt:plus', 'latch:in', RED), W('batt:gnd', 'latch:gnd', BLK), W('latch:out', 'buck:vin', ORG),
            W('batt:gnd', 'buck:gnd', BLK), W('latch:out', 'meter:v+', ORG), W('batt:gnd', 'meter:v-', BLK)],
  },
  {
    key: 'solar-mppt-guard', impactWh: 420,
    title: 'حارس الشحن الشمسي MPPT مع توزيع WAGO',
    desc: 'لوح شمسي عبر LTC3780 يشحن البك حتى 42.0V، والقفل يحرس التفريغ عند 31.00V. قضيب WAGO يوزع الطاقة على الأحمال والقياس. كفاءة شحن ~90%.',
    bom: ['لوح شمسي 100-160W', 'وحدة LTC3780', 'بطارية 10S', 'قفل IRF4905', 'مكعبات WAGO 221', 'فولتميتر'],
    nodes: [N('batt', 'battery', 40, 90), N('mppt', 'mppt', 270, 60), N('latch', 'latch', 270, 260), N('wago', 'wago', 500, 150), N('meter', 'meter', 500, 330)],
    wires: [W('batt:plus', 'mppt:out+', RED), W('batt:gnd', 'mppt:out-', BLK), W('batt:plus', 'latch:in', RED),
            W('batt:gnd', 'latch:gnd', BLK), W('latch:out', 'wago:p1', ORG), W('wago:p2', 'meter:v+', ORG), W('batt:gnd', 'meter:v-', BLK)],
  },
  {
    key: 'usb-pd-field-kit', impactWh: 252,
    title: 'عدة الميدان USB-PD بزر تشغيل لحظي',
    desc: 'محطة 100W PD متنقلة: زر START اللحظي يمسك القفل، ومنفذ IP2368 يشحن اللابتوب والهاتف. مثالية للورشات الميدانية.',
    bom: ['بطارية 10S', 'قفل IRF4905', 'وحدة IP2368 USB-PD', 'زر START أخضر NO', 'فيوز 15A'],
    nodes: [N('batt', 'battery', 40, 90), N('latch', 'latch', 270, 90), N('usb', 'usb', 500, 90), N('btn', 'button', 270, 280)],
    wires: [W('batt:plus', 'latch:in', RED), W('batt:gnd', 'latch:gnd', BLK), W('latch:out', 'usb:vin', ORG),
            W('batt:gnd', 'usb:gnd', BLK), W('latch:gate', 'btn:no', GRN), W('btn:com', 'batt:gnd', GRN)],
  },
  {
    key: '7s-recycler-hub', impactWh: 504,
    title: 'مركز تدوير 7S/10S مع توزيع مزدوج',
    desc: 'يستقبل بكك سكوتر مستعملة (7S أو 10S بعد الفحص)، يغذي مخرجي 12V وUSB معًا عبر قضيب مشترك. كل خلية تحت 3.0V تُرفض.',
    bom: ['بطارية سكوتر مستعملة', 'قفل IRF4905', 'Buck 12V', 'IP2368', 'WAGO 221', 'فيوز 15A ×2'],
    nodes: [N('batt', 'battery', 40, 90), N('latch', 'latch', 260, 90), N('wago', 'wago', 470, 90), N('buck', 'buck', 660, 40), N('usb', 'usb', 660, 220)],
    wires: [W('batt:plus', 'latch:in', RED), W('batt:gnd', 'latch:gnd', BLK), W('latch:out', 'wago:p1', ORG),
            W('wago:p2', 'buck:vin', ORG), W('wago:p3', 'usb:vin', ORG), W('batt:gnd', 'buck:gnd', BLK), W('batt:gnd', 'usb:gnd', BLK)],
  },
  {
    key: 'deepsleep-monitor', impactWh: 168,
    title: 'محطة مراقبة منخفضة الاستهلاك مع قياس دائم',
    desc: 'تصميم مرجعي لعقدة قياس (ESP32 لاحقًا): فولتميتر دائم على القضيب، وأحمال 12V مفصولة بالقفل ليلًا. استهلاك الاستعداد 0.00mA.',
    bom: ['بطارية 10S صغيرة', 'قفل IRF4905', 'Buck 12V', 'فولتميتر', 'WAGO 221'],
    nodes: [N('batt', 'battery', 40, 90), N('latch', 'latch', 270, 90), N('buck', 'buck', 500, 90), N('meter', 'meter', 270, 280), N('wago', 'wago', 500, 280)],
    wires: [W('batt:plus', 'latch:in', RED), W('batt:gnd', 'latch:gnd', BLK), W('latch:out', 'buck:vin', ORG),
            W('batt:gnd', 'buck:gnd', BLK), W('latch:out', 'wago:p1', ORG), W('wago:p2', 'meter:v+', ORG), W('batt:gnd', 'meter:v-', BLK)],
  },
  {
    key: 'zero-quiescent-demo', impactWh: 120,
    title: 'عرض القاطع الصفري — زرّان وفولتميتر',
    desc: 'أبسط دارة تثبت مفهوم 0.00mA: زر START يمسك، زر STOP يفصل، والفولتميتر يشهد. ضع الملتيميتر على mA وشاهد 0.00.',
    bom: ['بطارية 10S', 'قفل IRF4905 + TL431', 'زر START NO', 'زر STOP NC', 'فولتميتر', 'فيوز 15A'],
    nodes: [N('batt', 'battery', 40, 90), N('latch', 'latch', 270, 90), N('btn', 'button', 270, 280), N('meter', 'meter', 500, 90)],
    wires: [W('batt:plus', 'latch:in', RED), W('batt:gnd', 'latch:gnd', BLK), W('latch:gate', 'btn:no', PUR),
            W('btn:com', 'batt:gnd', GRN), W('latch:out', 'meter:v+', ORG), W('batt:gnd', 'meter:v-', BLK)],
  },
];

/* ---------------- Union-Find validator (mirrors workbench) ---------------- */
function validate(state) {
  const parent = {};
  const find = (x) => { parent[x] = parent[x] ?? x; return parent[x] === x ? x : (parent[x] = find(parent[x])); };
  const uni = (a, b) => { parent[find(a)] = find(b); };
  const key = (n, t) => `${n}:${t}`;
  const netOf = {};
  for (const nd of state.nodes) {
    const terms = NETS[nd.type];
    if (!terms) return { ok: false, reason: `unknown part type ${nd.type}` };
    for (const [tid, net] of Object.entries(terms)) {
      const k = key(nd.id, tid);
      netOf[k] = net; parent[k] = k;
    }
  }
  for (const nd of state.nodes) {
    const bus = Object.entries(NETS[nd.type]).filter(([, n]) => n === 'BUS').map(([t]) => key(nd.id, t));
    for (let i = 1; i < bus.length; i++) uni(bus[0], bus[i]);
  }
  for (const w of state.wires) {
    if (!netOf[w.a] || !netOf[w.b]) return { ok: false, reason: `dangling wire ${w.a}→${w.b}` };
    uni(w.a, w.b);
  }
  const sets = {};
  for (const k of Object.keys(netOf)) (sets[find(k)] ??= []).push(k);
  for (const members of Object.values(sets)) {
    if (members.some((m) => netOf[m] === 'PWR') && members.some((m) => netOf[m] === 'GND'))
      return { ok: false, reason: 'VCC-GND short detected' };
  }
  const byId = Object.fromEntries(state.nodes.map((n) => [n.id, n]));
  const batt = state.nodes.find((n) => n.type === 'battery');
  const latch = state.nodes.find((n) => n.type === 'latch');
  if (!batt || !latch) return { ok: false, reason: 'missing battery or latch' };
  if (find(key(batt.id, 'plus')) !== find(key(latch.id, 'in')))
    return { ok: false, reason: 'battery+ not feeding latch.in' };
  const outSet = find(key(latch.id, 'out'));
  const closed = Object.keys(netOf).some((k) => {
    const [nid] = k.split(':');
    return find(k) === outSet && LOADS.has(byId[nid]?.type);
  });
  if (!closed) return { ok: false, reason: 'latch.out reaches no load' };
  return { ok: true };
}

/* ---------------- Supabase REST ---------------- */
async function api(method, p, body, key) {
  const r = await fetch(SUPABASE_URL + p, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { status: r.status, data };
}

async function main() {
  console.log(`[harvester] validating ${CATALOG.length} templates (offline)…`);
  for (const t of CATALOG) {
    const v = validate({ nodes: t.nodes, wires: t.wires });
    console.log(`  ${v.ok ? 'PASS' : 'FAIL'} ${t.key}${v.ok ? '' : ' — ' + v.reason}`);
    if (!v.ok) { console.error('[harvester] catalog template invalid, aborting'); process.exit(2); }
  }
  if (CHECK_ONLY) { console.log('[harvester] --check OK, no DB writes'); return; }

  const SVC = loadServiceKey();
  if (!SVC) { console.error('[harvester] SERVICE_ROLE_KEY not found'); process.exit(1); }

  const me = await api('GET', `/rest/v1/profiles?id=eq.${BOT_ID}&select=id,upcycled_energy_wh`, null, SVC);
  if (me.status !== 200 || !me.data?.length) {
    console.error('[harvester] bot profile missing — run supabase/bot-profile.sql first');
    process.exit(1);
  }
  const energy = Number(me.data[0].upcycled_energy_wh || 0);

  const mine = await api('GET', `/rest/v1/projects?author_id=eq.${BOT_ID}&select=id&order=created_at.desc&limit=50`, null, SVC);
  const runCount = mine.data?.length || 0;

  let pick = null;
  for (let attempt = 0; attempt < CATALOG.length; attempt++) {
    const t = CATALOG[(runCount + attempt) % CATALOG.length];
    const jitter = (runCount * 13 + attempt * 7) % 23;
    const state = {
      v: 1,
      nodes: t.nodes.map((n) => ({ ...n, x: n.x + jitter, y: n.y + ((jitter * 3) % 17) })),
      wires: t.wires.map((w) => ({ ...w })),
      meta: { bom: t.bom, impactWh: t.impactWh, generatedBy: 'wattouna-harvester', template: t.key },
    };
    const v = validate(state);
    if (v.ok) { pick = { t, state }; break; }
    console.log(`[harvester] template ${t.key} failed (${v.reason}), regenerating…`);
  }
  if (!pick) { console.error('[harvester] all templates failed validation'); process.exit(2); }

  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  // clean URL slug: wattouna-ai-<template-key>-<stamp> (unique per cycle)
  const slug = `wattouna-ai-${pick.t.key}-${stamp}`;
  const wires = pick.state.wires.map((w) => `- \`${w.a}\` ↔ \`${w.b}\` (${w.color})`).join('\n');
  const description = [
    `## نظرة هندسية`,
    pick.t.desc,
    ``,
    `## مسار الطاقة`,
    `بطارية 10S (36V) ← قفل 0.00mA (IRF4905/TL431، عتبة 31.00V) ← قضيب Latched ← الأحمال. الشحن عبر MPPT حتى 42.0V بكفاءة ~90%.`,
    ``,
    `## قائمة المكونات (BOM)`,
    ...pick.t.bom.map((b, i) => `${i + 1}. ${b}`),
    ``,
    `## التوصيلات (Netlist)`,
    wires,
    ``,
    `## السلامة`,
    `- فيوز 15A أول عنصر بعد البطارية. لا تتجاوز BMS أو الفيوز أبدًا.`,
    `- أسلاك AWG 14 للقدرة / AWG 20 للمنطق. وصلات WAGO 221 بدون لحام.`,
    `- تحقق 0.00mA بالملتيميتر بعد STOP قبل أي تعديل.`,
    ``,
    `*تأثير تقديري: **${pick.t.impactWh}Wh** طاقة معاد تدويرها 🌱 — مولّد آليًا ومفحوص (Union-Find) بواسطة مختبر واطنا.*`,
  ].join('\n');
  const ins = await api('POST', '/rest/v1/projects', {
    author_id: BOT_ID,
    title: `${pick.t.title} — #${runCount + 1}`,
    description,
    slug,
    canvas_state: pick.state,
    is_public: true,
    forked_from: null,
  }, SVC);
  if (ins.status !== 200 && ins.status !== 201) {
    console.error('[harvester] insert failed:', ins.status, JSON.stringify(ins.data)?.slice(0, 200));
    process.exit(1);
  }
  const pid = ins.data?.[0]?.id;
  await api('PATCH', `/rest/v1/profiles?id=eq.${BOT_ID}`, { upcycled_energy_wh: energy + pick.t.impactWh }, SVC);
  console.log(`[harvester] PUBLISHED "${pick.t.title}" id=${pid} slug=${slug} +${pick.t.impactWh}Wh (total ${energy + pick.t.impactWh}Wh)`);
}

main().catch((e) => { console.error('[harvester] fatal:', e.message); process.exit(1); });
