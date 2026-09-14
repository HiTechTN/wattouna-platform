const OTA_KEY = "wattouna-ai-model-ver";
const MANIFEST_URL = "/models/manifest.json";
const CDN_ENGINE = "https://esm.sh/@mlc-ai/web-llm@0.2.79";
const SYSTEM_PROMPT = [
  "You are Wattouna AI, a friendly clean-energy hardware engineer.",
  "You speak Tunisian Arabic (simple technical Tunsi) and also handle Standard Arabic, French and English.",
  "Expertise: PBX-36 36V solar generator, 0.00mA IRF4905/TL431 latch (31.00V cutoff, 2.495V ref),",
  "LTC3780 MPPT to 42.0V, WAGO 221 solderless builds, recycled e-scooter batteries, Tunisia sourcing",
  "(Rue d\u2019Ath\xE8nes, Moncef Bey, Charguia, Sfax Bab Bhar, Sousse).",
  "Keep answers short, practical, numbered steps. Never invent voltages.",
  'CANVAS RULE: when the user says "check my circuit", "analyze", "\u0627\u0641\u062D\u0635" or pastes a [CANVAS] digest,',
  "read it as ground truth: report shorts, missing grounds and unconnected terminals first,",
  "then answer. Never claim to see more than the digest contains."
].join(" ");
const PART_WORDS = [
  ["battery", /بطاري|battery|batterie|10s/i],
  ["mppt", /شمس|mppt|solair|panneau|solar|ltc3780/i],
  ["latch", /قفل|latch|mosfet|0\.00|tl431|irf4905/i],
  ["usb", /usb|pd|هاتف|phone|تليفون/i],
  ["buck", /buck|12v|باك|راوتر|router|إنارة|led/i],
  ["wago", /wago|موصل|connecteur|ترمينال/i],
  ["meter", /فولتميتر|volt|شاشة|قياس|multim/i],
  ["button", /زر|button|bouton|start|stop|تشغيل/i]
];
function parseVoiceCommand(text) {
  const found = [];
  for (const [part, re] of PART_WORDS) {
    if (re.test(text) && !found.includes(part)) found.push(part);
  }
  if (!found.length) {
    return {
      reply: "\u0633\u0645\u0639\u062A\u0643 \u{1F44D} \u0642\u0648\u0644\u064A \u0645\u062B\u0644\u064B\u0627: \xAB\u0623\u0636\u0641 \u0628\u0637\u0627\u0631\u064A\u0629\xBB \u0623\u0648 \xABadd MPPT\xBB \u0648\u0623\u0646\u0627 \u0646\u062D\u0637 \u0627\u0644\u0642\u0637\u0639\u0629 \u0641\u064A \u0627\u0644\u0645\u062E\u062A\u0628\u0631.",
      actions: []
    };
  }
  const names = {
    battery: "\u0628\u0637\u0627\u0631\u064A\u0629 10S \u{1F50B}",
    mppt: "\u0648\u062D\u062F\u0629 MPPT \u2600\uFE0F",
    latch: "\u0642\u0641\u0644 0.00mA \u{1F50C}",
    usb: "USB-C PD \u26A1",
    buck: "Buck 12V \u{1F53D}",
    wago: "WAGO 221 \u{1F517}",
    meter: "\u0641\u0648\u0644\u062A\u0645\u064A\u062A\u0631 \u{1F4DF}",
    button: "\u0632\u0631 16mm \u{1F518}"
  };
  return {
    reply: `\u062A\u0645 \u2705 \u062D\u0637\u064A\u062A\u0644\u0643: ${found.map((f) => names[f]).join(" + ")} \u2014 \u0634\u0648\u0641 \u0627\u0644\u0644\u0648\u062D\u0629!`,
    actions: found.map((add) => ({ add }))
  };
}
function createBrain() {
  let engine = null;
  let status = "idle";
  let progress = "";
  let modelId = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
  async function readManifest() {
    try {
      const r = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch {
    }
    return null;
  }
  async function ensureLoaded(onProgress) {
    if (engine) return true;
    const say = (t) => {
      progress = t;
      onProgress?.(t);
    };
    try {
      const man = await readManifest();
      if (man?.modelId) modelId = man.modelId;
      if (!navigator.gpu) {
        status = "rule-mode";
        say("\u26A0\uFE0F WebGPU \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u2014 \u0648\u0636\u0639 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0645\u0641\u0639\u0651\u0644 (\u0643\u0644 \u0627\u0644\u0645\u064A\u0632\u0627\u062A \u0634\u063A\u0627\u0644\u0629).");
        return false;
      }
      status = "loading-engine";
      say("\u23F3 \u062A\u062D\u0645\u064A\u0644 \u0645\u062D\u0631\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 (\u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629\u060C \u064A\u064F\u062D\u0641\u0638 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D)\u2026");
      const webllm = await import(
        /* @vite-ignore */
        CDN_ENGINE
      );
      status = "downloading-model";
      const initProgress = (rep) => say(`\u2B07\uFE0F ${rep.text || Math.round((rep.progress || 0) * 100) + "%"}`);
      engine = await webllm.CreateMLCEngine(modelId, { initProgressCallback: initProgress, logLevel: "SILENT" });
      status = "ready-local";
      say("\u2705 \u0627\u0644\u0639\u0642\u0644 \u0627\u0644\u0645\u062D\u0644\u064A \u062C\u0627\u0647\u0632 \u2014 \u064A\u062E\u062F\u0645 \u062F\u0648\u0646 \u0627\u062A\u0635\u0627\u0644.");
      try {
        localStorage.setItem(OTA_KEY, man?.version || modelId);
      } catch {
      }
      return true;
    } catch (e) {
      status = "rule-mode";
      say("\u26A0\uFE0F \u062A\u0639\u0630\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u2014 \u0648\u0636\u0639 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u0645\u0641\u0639\u0651\u0644.");
      return false;
    }
  }
  async function chat(question, canvasSummary) {
    const q = canvasSummary ? `${canvasSummary}

USER: ${question}` : question;
    if (engine) {
      try {
        const res = await engine.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: q }
          ],
          temperature: 0.4,
          max_tokens: 350
        });
        const txt = res?.choices?.[0]?.message?.content?.trim();
        if (txt) return txt;
      } catch {
      }
    }
    const cmd = parseVoiceCommand(q);
    if (cmd.actions.length) return cmd.reply;
    return ruleAnswer(question);
  }
  async function checkOTA() {
    let local = "";
    try {
      local = localStorage.getItem(OTA_KEY) || "";
    } catch {
    }
    const man = await readManifest();
    const remote = man?.version || "";
    return { update: Boolean(remote && local && remote !== local), remote, local };
  }
  function speak(text, lang) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const clean = text.replace(/<[^>]+>/g, "").slice(0, 400);
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = lang || pickVoiceLang();
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch {
    }
  }
  function stopSpeak() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
    }
  }
  function pickVoiceLang() {
    try {
      const vs = window.speechSynthesis?.getVoices() || [];
      const langs = vs.map((v) => v.lang || "");
      if (langs.some((l) => l.startsWith("ar"))) return "ar-SA";
      if (langs.some((l) => l.startsWith("fr"))) return "fr-FR";
    } catch {
    }
    return "ar-SA";
  }
  function listeningSupported() {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function listen(lang) {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error("no-stt"));
        return;
      }
      const rec = new SR();
      rec.lang = lang || "ar-TN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (ev) => resolve(ev.results[0][0].transcript);
      rec.onerror = (ev) => reject(new Error(ev.error || "stt-error"));
      rec.onend = () => reject(new Error("no-speech"));
      try {
        rec.start();
      } catch (e) {
        reject(e);
      }
      setTimeout(() => {
        try {
          rec.stop();
        } catch {
        }
      }, 12e3);
    });
  }
  return {
    get status() {
      return status;
    },
    get progress() {
      return progress;
    },
    ensureLoaded,
    chat,
    checkOTA,
    speak,
    stopSpeak,
    listen,
    listeningSupported
  };
}
function ruleAnswer(q) {
  const n = q.toLowerCase();
  const has = (...ws) => ws.some((w) => n.includes(w));
  if (has("0.00", "standby", "\u062A\u0633\u0631\u064A\u0628", "latch", "\u0642\u0641\u0644")) return "\u{1F50C} \u062F\u0627\u0631\u0629 0.00mA: \u0645\u0648\u0633\u0641\u062A IRF4905 \u064A\u0639\u0632\u0644 \u0627\u0644\u062D\u0645\u0644 \u0641\u064A\u0632\u064A\u0627\u0626\u064A\u064B\u0627 \u0639\u0646\u062F 31.00V (TL431\u060C \u0645\u0631\u062C\u0639 2.495V) \u2014 \u0635\u0641\u0631 \u062D\u0642\u064A\u0642\u064A\u060C \u0645\u0648\u0634 \u0648\u0636\u0639 \u0646\u0648\u0645.";
  if (has("31", "tl431", "\u0639\u062A\u0628\u0629", "threshold")) return "\u{1F3AF} \u0627\u0644\u0639\u062A\u0628\u0629 31.00V \xB1 0.05V: \u200FVtrip = 2.495 \xD7 (1 + 102k/8.2k) \u2014 \u0639\u0627\u064A\u0631 RV1 \u0628\u0645\u0635\u062F\u0631 \u0645\u062A\u063A\u064A\u0631.";
  if (has("mppt", "\u0634\u0645\u0633\u064A", "solar", "42", "\u0634\u062D\u0646")) return "\u2600\uFE0F \u0627\u0636\u0628\u0637 LTC3780 \u0639\u0644\u0649 42.0V \u0628\u062F\u0648\u0646 \u062D\u0645\u0644 \u0623\u0648\u0644\u064B\u0627. \u0644\u0648\u062D 160W \u2248 3.4A \u0634\u062D\u0646 \u2014 \u0645\u0646\u0627\u0633\u0628 \u0644\u0644\u062E\u0644\u0627\u064A\u0627 \u0627\u0644\u0645\u0639\u0627\u062F \u062A\u062F\u0648\u064A\u0631\u0647\u0627.";
  if (has("\u0628\u0637\u0627\u0631\u064A\u0629", "\u0633\u0643\u0648\u062A\u0631", "batterie", "\u0633\u0639\u0631", "\u0646\u0634\u0631\u064A")) return "\u{1F50B} \u0633\u0648\u0642 \u0645\u0646\u0635\u0641 \u0628\u0627\u064A \u0644\u0644\u0628\u0643\u0643 \u0627\u0644\u0645\u0633\u062A\u0639\u0645\u0644\u0629 (80\u2013150 \u062F.\u062A)\u060C \u0648\u0646\u0647\u062C \u0623\u062B\u064A\u0646\u0627 \u0644\u0644\u062E\u0644\u0627\u064A\u0627 \u0648\u0627\u0644\u0634\u0648\u0627\u062D\u0646. \u0627\u0631\u0641\u0636 \u0623\u064A \u062E\u0644\u064A\u0629 \u062A\u062D\u062A 3.0V.";
  if (has("\u0645\u0648\u062F\u0627\u0645", "\u062A\u0644\u0641\u0632\u0629", "\u064A\u0634\u062F", "runtime", "autonomie")) return "\u23F1\uFE0F \u0628\u0643 336Wh: \u0645\u0648\u062F\u0627\u0645+\u0625\u0646\u0627\u0631\u0629 \u2248 18h\u060C +\u062A\u0644\u0641\u0632\u0629 \u2248 4h\u060C \u0644\u0627\u0628\u062A\u0648\u0628 \u2248 7h. \u062C\u0631\u0651\u0628 \u062D\u0627\u0633\u0628\u0629 \u0627\u0644\u0645\u0648\u0642\u0639.";
  if (has("start", "\u062A\u062E\u062F\u0645", "\u0645\u0634\u0643\u0644\u0629", "panne", "\u0639\u0637\u0644")) return "\u26A0\uFE0F \u062A\u0641\u0642\u062F \u0628\u0627\u0644\u062A\u0631\u062A\u064A\u0628: \u062C\u0647\u062F \u0641\u0648\u0642 31V\u061F \u0641\u064A\u0648\u0632 15A\u061F \u0632\u0631 STOP (NC) \u0645\u0633\u0643\u0631\u061F Gate \u064A\u0647\u0628\u0637 \u0643\u064A \u062A\u0646\u0632\u0644 START\u061F";
  if (has("\u0633\u0644\u0627\u0645\u0629", "fuse", "\u0641\u064A\u0648\u0632", "safety")) return "\u{1F6E1}\uFE0F \u0641\u064A\u0648\u0632 15A \u0623\u0648\u0644 \u0639\u0646\u0635\u0631 \u062F\u0627\u0626\u0645\u064B\u0627\u060C AWG 14 \u0644\u0644\u0642\u062F\u0631\u0629\u060C WAGO 221 \u0628\u0644\u0627 \u0644\u062D\u0627\u0645\u060C \u0642\u0650\u0633 \u0645\u0631\u062A\u064A\u0646 \u0648\u0634\u063A\u0651\u0644 \u0645\u0631\u0629.";
  if (has("\u0633\u0644\u0627\u0645", "\u0627\u0647\u0644\u0627", "bonjour", "hello", "\u0639\u0633\u0644\u0627\u0645\u0629")) return "\u{1F44B} \u0623\u0647\u0644\u064B\u0627! \u0623\u0646\u0627 \u0645\u0633\u0627\u0639\u062F \u0648\u0627\u0637\u0646\u0627 \u2014 \u0627\u0633\u0623\u0644\u0646\u064A \u0628\u0627\u0644\u0635\u0648\u062A \u0648\u0644\u0627 \u0627\u0644\u0643\u062A\u0627\u0628\u0629\u060C \u0648\u0646\u062C\u0645 \u0646\u062D\u0637\u0644\u0643 \u0642\u0637\u0639 \u0641\u064A \u0627\u0644\u0645\u062E\u062A\u0628\u0631 \u0645\u0628\u0627\u0634\u0631\u0629.";
  return "\u{1F914} \u062C\u0631\u0651\u0628: \xAB\u0623\u0636\u0641 \u0628\u0637\u0627\u0631\u064A\u0629\xBB / \xABadd MPPT\xBB / \xAB\u062D\u0637 \u0641\u0648\u0644\u062A\u0645\u064A\u062A\u0631\xBB \u2014 \u0623\u0648 \u0627\u0633\u0623\u0644\u0646\u064A \u0639\u0644\u0649 0.00mA\u060C \u0627\u0644\u0634\u0645\u0633\u064A\u060C \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0627\u062A\u060C \u0648\u0627\u0644\u0623\u0639\u0637\u0627\u0628.";
}
const NETS = {
  battery: { plus: "PWR", gnd: "GND" },
  mppt: { "sol+": "PWR", "sol-": "GND", "out+": "PWR", "out-": "GND" },
  latch: { in: "PWR", gate: "SIG", out: "PWR", gnd: "GND" },
  usb: { vin: "PWR", gnd: "GND", usbc: "SIG" },
  buck: { vin: "PWR", gnd: "GND", vout: "PWR" },
  wago: { p1: "BUS", p2: "BUS", p3: "BUS" },
  meter: { "v+": "PWR", "v-": "GND" },
  button: { com: "SIG", no: "SIG", nc: "SIG" }
};
const TLABEL = {
  battery: { plus: "Battery+36V", gnd: "Battery-GND" },
  mppt: { "sol+": "MPPT-S+", "sol-": "MPPT-S-", "out+": "MPPT-B+", "out-": "MPPT-B-" },
  latch: { in: "Latch-IN", gate: "Latch-GATE", out: "Latch-OUT", gnd: "Latch-GND" },
  usb: { vin: "USB-V+", gnd: "USB-GND", usbc: "USB-C" },
  buck: { vin: "Buck-Vin", gnd: "Buck-GND", vout: "Buck-12V" },
  wago: { p1: "WAGO-1", p2: "WAGO-2", p3: "WAGO-3" },
  meter: { "v+": "Meter+", "v-": "Meter-" },
  button: { com: "BTN-COM", no: "BTN-NO", nc: "BTN-NC" }
};
function unionsOf(state) {
  const parent = {};
  const find = (x) => {
    parent[x] = parent[x] ?? x;
    return parent[x] === x ? x : parent[x] = find(parent[x]);
  };
  const uni = (a, b) => {
    parent[find(a)] = find(b);
  };
  const netOf = {};
  for (const nd of state.nodes || []) {
    for (const [tid, net] of Object.entries(NETS[nd.type] || {})) {
      const k = `${nd.id}:${tid}`;
      netOf[k] = net;
      parent[k] = k;
    }
  }
  for (const nd of state.nodes || []) {
    const bus = Object.entries(NETS[nd.type] || {}).filter(([, n]) => n === "BUS").map(([t]) => `${nd.id}:${t}`);
    for (let i = 1; i < bus.length; i++) uni(bus[0], bus[i]);
  }
  for (const w of state.wires || []) {
    if (netOf[w.a] && netOf[w.b]) uni(w.a, w.b);
  }
  return { find, netOf };
}
function analyzeCircuit(state) {
  const findings = [];
  const nodes = state.nodes || [], wires = state.wires || [];
  if (!nodes.length) {
    return { ok: false, findings: [{ level: "info", ar: "\u0627\u0644\u0644\u0648\u062D\u0629 \u0641\u0627\u0631\u063A\u0629 \u2014 \u0623\u0636\u0641 \u0628\u0637\u0627\u0631\u064A\u0629 \u0623\u0648\u0644\u064B\u0627 \u{1F50B}", voice: "Empty canvas. Add a battery first." }], summary: "empty canvas" };
  }
  const { find, netOf } = unionsOf(state);
  const label = (k) => {
    const [nid, tid] = k.split(":");
    const nd = nodes.find((n) => n.id === nid);
    return TLABEL[nd?.type || ""]?.[tid] || k;
  };
  const sets = {};
  for (const k of Object.keys(netOf)) (sets[find(k)] ??= []).push(k);
  for (const members of Object.values(sets)) {
    const p = members.filter((m) => netOf[m] === "PWR");
    const g = members.filter((m) => netOf[m] === "GND");
    if (p.length && g.length) {
      findings.push({
        level: "danger",
        ar: `\u26A1 \u0645\u0627\u0633 \u0643\u0647\u0631\u0628\u0627\u0626\u064A! ${label(p[0])} \u0645\u062A\u0635\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0640 ${label(g[0])} \u2014 \u0627\u0641\u0635\u0644 \u0627\u0644\u0633\u0644\u0643 \u0642\u0628\u0644 \u0627\u0644\u062A\u0634\u063A\u064A\u0644.`,
        voice: `Warning: Short circuit detected between ${label(p[0])} and ${label(g[0])}.`
      });
    }
  }
  const touched = /* @__PURE__ */ new Set();
  wires.forEach((w) => {
    touched.add(w.a);
    touched.add(w.b);
  });
  const floating = [];
  for (const nd of nodes) {
    for (const [tid, net] of Object.entries(NETS[nd.type] || {})) {
      if (!touched.has(`${nd.id}:${tid}`)) floating.push(`${nd.id}:${tid}`);
    }
  }
  const gndMissing = floating.filter((k) => netOf[k] === "GND");
  if (gndMissing.length) {
    findings.push({
      level: "warn",
      ar: `\u{1F7E1} \u0623\u0631\u0636\u064A \u063A\u064A\u0631 \u0645\u0648\u0635\u0648\u0644: ${gndMissing.slice(0, 3).map(label).join("\u060C ")} \u2014 \u0643\u0644 GND \u0644\u0627\u0632\u0645 \u064A\u0631\u062C\u0639 \u0644\u0644\u0628\u0637\u0627\u0631\u064A\u0629.`,
      voice: `Warning: unconnected ground on ${gndMissing.slice(0, 2).map(label).join(", ")}.`
    });
  }
  const rest = floating.filter((k) => netOf[k] !== "GND");
  if (rest.length) {
    findings.push({
      level: "info",
      ar: `\u{1F535} ${rest.length} \u0623\u0637\u0631\u0627\u0641 \u063A\u064A\u0631 \u0645\u0648\u0635\u0648\u0644\u0629 (${rest.slice(0, 4).map(label).join("\u060C ")}) \u2014 \u0637\u0628\u064A\u0639\u064A \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0628\u0646\u0627\u0621.`,
      voice: `${rest.length} unconnected terminals. Normal while building.`
    });
  }
  const batt = nodes.find((n) => n.type === "battery");
  const latch = nodes.find((n) => n.type === "latch");
  if (!batt) findings.push({ level: "warn", ar: "\u{1F50B} \u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u0637\u0627\u0631\u064A\u0629 \u2014 \u0623\u0636\u0641 \u0645\u0635\u062F\u0631 \u0637\u0627\u0642\u0629.", voice: "No battery found." });
  if (batt && latch && find(`${batt.id}:plus`) !== find(`${latch.id}:in`)) {
    findings.push({ level: "warn", ar: "\u{1F50C} \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u0635\u0648\u0644\u0629 \u0628\u0645\u062F\u062E\u0644 \u0627\u0644\u0642\u0641\u0644 (IN+) \u2014 \u0627\u0644\u062F\u0627\u0631\u0629 \u0644\u0646 \u062A\u0639\u0645\u0644.", voice: "Battery is not connected to the latch input." });
  }
  const ok = !findings.some((f) => f.level === "danger");
  if (ok && !findings.length) {
    findings.push({ level: "info", ar: "\u2705 \u0627\u0644\u062F\u0627\u0631\u0629 \u0633\u0644\u064A\u0645\u0629 \u0638\u0627\u0647\u0631\u064A\u064B\u0627 \u2014 \u0644\u0627 \u0645\u0627\u0633\u060C \u0648\u0627\u0644\u0623\u0631\u0636\u064A\u0627\u062A \u0645\u0648\u0635\u0648\u0644\u0629. \u062C\u0631\u0651\u0628 \u0627\u0644\u0645\u062D\u0627\u0643\u0627\u0629 \u25B6\uFE0F", voice: "Circuit looks good. No shorts detected." });
  }
  const summary = `nodes:${nodes.map((n) => n.type).join(",") || "none"} wires:${wires.length} findings:${findings.map((f) => f.level).join(",") || "clean"}`;
  return { ok, findings, summary };
}
function summarizeCanvas(state) {
  const a = analyzeCircuit(state);
  const parts = (state.nodes || []).map((n) => n.type).join(",");
  return `[CANVAS] parts:{${parts || "empty"}} wires:${(state.wires || []).length} analysis:{${a.summary}} ` + a.findings.slice(0, 4).map((f) => f.ar.replace(/<[^>]+>/g, "")).join(" | ");
}
const RED = "#ef4444", BLK = "#94a3b8", ORG = "#f59e0b", GRN = "#22c55e";
function autoWire(nodes) {
  const wires = [];
  const notesAr = [];
  const byType = (t) => nodes.filter((n) => n.type === t);
  const batt = byType("battery")[0], latch = byType("latch")[0];
  const wago = byType("wago")[0], meter = byType("meter")[0];
  const btn = byType("button")[0], mppt = byType("mppt")[0];
  const loads = nodes.filter((n) => n.type === "buck" || n.type === "usb");
  const add = (a, b, color) => wires.push({ a, b, color });
  if (!batt) return { wires, notesAr: ["\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u0637\u0627\u0631\u064A\u0629 \u2014 \u0623\u0636\u0641 \u0648\u0627\u062D\u062F\u0629 \u0623\u0648\u0644\u064B\u0627 \u{1F50B}"] };
  if (latch) {
    add(`${batt.id}:plus`, `${latch.id}:in`, RED);
    add(`${batt.id}:gnd`, `${latch.id}:gnd`, BLK);
    notesAr.push("\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 \u2190 \u0627\u0644\u0642\u0641\u0644 (\u0623\u062D\u0645\u0631/\u0623\u0633\u0648\u062F)");
  }
  if (mppt) {
    add(`${mppt.id}:out+`, `${batt.id}:plus`, RED);
    add(`${mppt.id}:out-`, `${batt.id}:gnd`, BLK);
    notesAr.push("MPPT \u2190 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 (\u0645\u0633\u0627\u0631 \u0627\u0644\u0634\u062D\u0646 42V)");
  }
  const busSrc = latch ? `${latch.id}:out` : `${batt.id}:plus`;
  if (wago && (latch || batt)) {
    add(busSrc, `${wago.id}:p1`, ORG);
    notesAr.push("\u0627\u0644\u0642\u0636\u064A\u0628 \u0627\u0644\u0628\u0631\u062A\u0642\u0627\u0644\u064A \u2190 WAGO");
    const ports = [`${wago.id}:p2`, `${wago.id}:p3`];
    loads.slice(0, 2).forEach((ld, i) => {
      const vin = ld.type === "buck" ? "vin" : "vin";
      add(ports[i % 2], `${ld.id}:${vin}`, ORG);
    });
    if (loads.length) notesAr.push("\u0627\u0644\u0623\u062D\u0645\u0627\u0644 \u2190 \u0642\u0636\u064A\u0628 WAGO \u0627\u0644\u0645\u0634\u062A\u0631\u0643");
  } else {
    loads.forEach((ld) => add(busSrc, `${ld.id}:vin`, ORG));
    if (loads.length) notesAr.push("\u0627\u0644\u0623\u062D\u0645\u0627\u0644 \u2190 \u0627\u0644\u0642\u0636\u064A\u0628 \u0645\u0628\u0627\u0634\u0631\u0629");
  }
  loads.forEach((ld) => add(`${batt.id}:gnd`, `${ld.id}:gnd`, BLK));
  if (meter && (latch || batt)) {
    add(busSrc, `${meter.id}:v+`, ORG);
    add(`${batt.id}:gnd`, `${meter.id}:v-`, BLK);
    notesAr.push("\u0627\u0644\u0641\u0648\u0644\u062A\u0645\u064A\u062A\u0631 \u0639\u0628\u0631 \u0627\u0644\u0642\u0636\u064A\u0628");
  }
  if (btn && latch) {
    add(`${latch.id}:gate`, `${btn.id}:no`, GRN);
    add(`${btn.id}:com`, `${batt.id}:gnd`, GRN);
    notesAr.push("\u0632\u0631 START \u0641\u064A \u0645\u0633\u0627\u0631 \u0627\u0644\u0628\u0648\u0627\u0628\u0629");
  }
  if (!wires.length) notesAr.push("\u0644\u0627 \u0623\u062D\u0645\u0627\u0644 \u2014 \u0623\u0636\u0641 Buck \u0623\u0648 USB \u0623\u0648 \u0641\u0648\u0644\u062A\u0645\u064A\u062A\u0631.");
  return { wires, notesAr };
}
export {
  MANIFEST_URL,
  OTA_KEY,
  analyzeCircuit,
  autoWire,
  createBrain,
  parseVoiceCommand,
  summarizeCanvas
};
