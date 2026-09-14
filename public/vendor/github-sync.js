const API = "https://api.github.com";
async function gh(token, method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: body === void 0 ? void 0 : JSON.stringify(body)
  });
  const txt = await r.text();
  let data = null;
  try {
    data = txt ? JSON.parse(txt) : null;
  } catch {
    data = txt;
  }
  return { status: r.status, data };
}
async function validateToken(token) {
  const { status, data } = await gh(token.trim(), "GET", "/user");
  if (status === 401) throw new Error("\u0631\u0645\u0632 \u0645\u0631\u0641\u0648\u0636 (401) \u2014 \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0640 Token \u0648\u0635\u0644\u0627\u062D\u064A\u0629 repo.");
  if (status === 403) throw new Error("\u0645\u0639\u062F\u0644 API \u0645\u0645\u062A\u0644\u0626 \u0623\u0648 \u062D\u0633\u0627\u0628 \u0645\u0642\u064A\u062F (403).");
  if (status !== 200 || !data?.login) throw new Error(`GitHub \u0631\u062F ${status} \u2014 \u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062A\u0635\u0627\u0644.`);
  return { login: data.login, name: data.name };
}
function slugifyTitle(title) {
  const s = (title || "wattouna-project").toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "wattouna-project";
  return /[a-z0-9]/.test(s) ? s : `wattouna-${Date.now().toString(36)}`;
}
async function createRepo(token, opts) {
  const path = opts.org ? `/orgs/${encodeURIComponent(opts.org)}/repos` : "/user/repos";
  const { status, data } = await gh(token, "POST", path, {
    name: opts.name,
    description: opts.description,
    private: false,
    auto_init: false
  });
  if (status === 201 || status === 200) {
    return { full_name: data.full_name, html_url: data.html_url, default_branch: data.default_branch || "main" };
  }
  if (status === 422) throw new Error(`\u0627\u0644\u0627\u0633\u0645 "${opts.name}" \u0645\u0633\u062A\u062E\u062F\u0645 \u2014 \u063A\u064A\u0651\u0631\u0647 \u0648\u062D\u0627\u0648\u0644 \u0645\u062C\u062F\u062F\u064B\u0627.`);
  if (status === 404 && opts.org) throw new Error(`\u0627\u0644\u0645\u0646\u0638\u0645\u0629 "${opts.org}" \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629 \u0623\u0648 \u0644\u0627 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u062F\u064A\u0643 \u0639\u0644\u064A\u0647\u0627.`);
  throw new Error(`\u0641\u0634\u0644 \u0627\u0644\u0625\u0646\u0634\u0627\u0621 (HTTP ${status}).`);
}
async function putFile(token, fullName, filePath, contentBase64, message) {
  let sha;
  try {
    const cur = await gh(token, "GET", `/repos/${fullName}/contents/${encodeURIComponent(filePath)}`);
    if (cur.status === 200 && cur.data?.sha) sha = cur.data.sha;
  } catch {
  }
  const { status, data } = await gh(token, "PUT", `/repos/${fullName}/contents/${encodeURIComponent(filePath)}`, {
    message,
    content: contentBase64,
    ...sha ? { sha } : {}
  });
  if (status !== 200 && status !== 201) throw new Error(`\u0641\u0634\u0644 \u0631\u0641\u0639 ${filePath} (${status}): ${data?.message || ""}`);
}
function toBase64(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  const CH = 32768;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)));
  }
  return btoa(bin);
}
function buildReadme(o) {
  const lines = [
    `# ${o.title}`,
    ``,
    `> Auto-published from the **Wattouna Maker Canvas** (open hardware, MIT).`,
    ``,
    `## Purpose`,
    o.purpose || "DIY clean-energy hardware project designed in the browser.",
    ``,
    `## Circuit`,
    `- Modules: ${o.nodes} \u2014 Wires: ${o.wires}`,
    `- Open \`schematic.json\` in https://wattouna.pages.dev/workbench to remix.`,
    `- Visual blueprint: \`blueprint.pdf\`. Firmware: \`src/main.py\` (MicroPython) \u2014 Arduino variant in chat.`,
    ``,
    `## Bill of Materials`,
    ...o.bom.map((b, i) => `${i + 1}. **${b.part}** \u2014 ${b.spec}`),
    ``,
    `## \u26A0\uFE0F Safety`,
    `- 15A blade fuse FIRST after battery+. Never bypass BMS or fuse.`,
    `- AWG 14 silicone for power, AWG 20 for logic. WAGO 221, no solder on power path.`,
    `- Calibrate cut-off to 31.00V; verify 0.00mA standby before touching anything.`,
    ``,
    `---`,
    `Published by ${o.author} via Wattouna one-click sync \u{1F331}`
  ];
  return lines.join("\n");
}
const PART_SPECS = {
  battery: ["Battery 10S 36V", "recycled e-scooter 336Wh"],
  mppt: ["LTC3780 MPPT", "18-36V to 42V, 160W"],
  latch: ["IRF4905 + TL431 latch", "cutoff 31.00V, 0.00mA"],
  usb: ["IP2368 USB-C PD", "100W + 18W QC"],
  buck: ["Buck converter", "12V 10A"],
  wago: ["WAGO 221", "lever connectors"],
  meter: ["DC voltmeter", "0-100V panel"],
  button: ["Pushbutton 16mm", "NO + NC"],
  esp32: ["ESP32 DevKit V1", "WiFi+BT, 3.3V logic"],
  oled: ["0.96 OLED SSD1306", "I2C 128x64"],
  sensor: ["BME280 sensor", "T/H/P I2C"]
};
export {
  PART_SPECS,
  buildReadme,
  createRepo,
  putFile,
  slugifyTitle,
  toBase64,
  validateToken
};
