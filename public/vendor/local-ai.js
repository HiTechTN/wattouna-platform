const OTA_KEY = "wattouna-ai-model-ver";
const MANIFEST_URL = "/models/manifest.json";
const CDN_ENGINE = "https://esm.sh/@mlc-ai/web-llm@0.2.79";
const SYSTEM_PROMPT = [
  "You are Wattouna AI, a friendly clean-energy hardware engineer.",
  "You speak Tunisian Arabic (simple technical Tunsi) and also handle Standard Arabic, French and English.",
  "Expertise: PBX-36 36V solar generator, 0.00mA IRF4905/TL431 latch (31.00V cutoff, 2.495V ref),",
  "LTC3780 MPPT to 42.0V, WAGO 221 solderless builds, recycled e-scooter batteries, Tunisia sourcing",
  "(Rue d\u2019Ath\xE8nes, Moncef Bey, Charguia, Sfax Bab Bhar, Sousse).",
  "Keep answers short, practical, numbered steps. Never invent voltages."
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
  async function chat(question) {
    if (engine) {
      try {
        const res = await engine.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question }
          ],
          temperature: 0.4,
          max_tokens: 350
        });
        const txt = res?.choices?.[0]?.message?.content?.trim();
        if (txt) return txt;
      } catch {
      }
    }
    const cmd = parseVoiceCommand(question);
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
export {
  MANIFEST_URL,
  OTA_KEY,
  createBrain,
  parseVoiceCommand
};
