/* Wattouna GitHub Sync — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/github-sync.ts --format=esm --outfile=public/vendor/github-sync.js
   One-click open-source publishing via the GitHub REST API + Contents API
   (per-file PUTs — no git binary, no server round-trip, works offline-first
   for staging and syncs when online). PAT lives in localStorage only. */

export interface GhUser { login: string; name?: string }
export interface GhRepo { full_name: string; html_url: string; default_branch: string }

const API = 'https://api.github.com';

async function gh(token: string, method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  const r = await fetch(API + path, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const txt = await r.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  return { status: r.status, data };
}

/** Validate a PAT and return the login. Throws human-readable errors. */
export async function validateToken(token: string): Promise<GhUser> {
  const { status, data } = await gh(token.trim(), 'GET', '/user');
  if (status === 401) throw new Error('رمز مرفوض (401) — تحقق من الـ Token وصلاحية repo.');
  if (status === 403) throw new Error('معدل API ممتلئ أو حساب مقيد (403).');
  if (status !== 200 || !data?.login) throw new Error(`GitHub رد ${status} — تحقق من الاتصال.`);
  return { login: data.login, name: data.name };
}

export function slugifyTitle(title: string): string {
  const s = (title || 'wattouna-project').toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'wattouna-project';
  return /[a-z0-9]/.test(s) ? s : `wattouna-${Date.now().toString(36)}`;
}

/** Create a public repo under the user or an org. 422 = name taken. */
export async function createRepo(
  token: string,
  opts: { name: string; description: string; org?: string },
): Promise<GhRepo> {
  const path = opts.org ? `/orgs/${encodeURIComponent(opts.org)}/repos` : '/user/repos';
  const { status, data } = await gh(token, 'POST', path, {
    name: opts.name,
    description: opts.description,
    private: false,
    auto_init: false,
  });
  if (status === 201 || status === 200) {
    return { full_name: data.full_name, html_url: data.html_url, default_branch: data.default_branch || 'main' };
  }
  if (status === 422) throw new Error(`الاسم "${opts.name}" مستخدم — غيّره وحاول مجددًا.`);
  if (status === 404 && opts.org) throw new Error(`المنظمة "${opts.org}" غير موجودة أو لا صلاحية لديك عليها.`);
  throw new Error(`فشل الإنشاء (HTTP ${status}).`);
}

/** Create/update one file via Contents API (base64, auto-commit). */
export async function putFile(
  token: string, fullName: string, filePath: string, contentBase64: string, message: string,
): Promise<void> {
  // fetch current sha if the file exists (required for updates)
  let sha: string | undefined;
  try {
    const cur = await gh(token, 'GET', `/repos/${fullName}/contents/${encodeURIComponent(filePath)}`);
    if (cur.status === 200 && cur.data?.sha) sha = cur.data.sha;
  } catch { /* new file */ }
  const { status, data } = await gh(token, 'PUT', `/repos/${fullName}/contents/${encodeURIComponent(filePath)}`, {
    message, content: contentBase64, ...(sha ? { sha } : {}),
  });
  if (status !== 200 && status !== 201) throw new Error(`فشل رفع ${filePath} (${status}): ${data?.message || ''}`);
}

/** UTF-8 safe base64 (chunked, no stack overflow on big PDFs). */
export function toBase64(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)) as number[]);
  }
  return btoa(bin);
}

export interface BomItem { part: string; spec: string }

/** AI-generated README: purpose, safety, BOM. */
export function buildReadme(o: {
  title: string; purpose: string; bom: BomItem[]; wires: number; nodes: number; author: string;
}): string {
  const lines = [
    `# ${o.title}`,
    ``,
    `> Auto-published from the **Wattouna Maker Canvas** (open hardware, MIT).`,
    ``,
    `## Purpose`,
    o.purpose || 'DIY clean-energy hardware project designed in the browser.',
    ``,
    `## Circuit`,
    `- Modules: ${o.nodes} — Wires: ${o.wires}`,
    `- Open \`schematic.json\` in https://wattouna.pages.dev/workbench to remix.`,
    `- Visual blueprint: \`blueprint.pdf\`. Firmware: \`src/main.py\` (MicroPython) — Arduino variant in chat.`,
    ``,
    `## Bill of Materials`,
    ...o.bom.map((b, i) => `${i + 1}. **${b.part}** — ${b.spec}`),
    ``,
    `## ⚠️ Safety`,
    `- 15A blade fuse FIRST after battery+. Never bypass BMS or fuse.`,
    `- AWG 14 silicone for power, AWG 20 for logic. WAGO 221, no solder on power path.`,
    `- Calibrate cut-off to 31.00V; verify 0.00mA standby before touching anything.`,
    ``,
    `---`,
    `Published by ${o.author} via Wattouna one-click sync 🌱`,
  ];
  return lines.join('\n');
}

export const PART_SPECS: Record<string, [string, string]> = {
  battery: ['Battery 10S 36V', 'recycled e-scooter 336Wh'],
  mppt: ['LTC3780 MPPT', '18-36V to 42V, 160W'],
  latch: ['IRF4905 + TL431 latch', 'cutoff 31.00V, 0.00mA'],
  usb: ['IP2368 USB-C PD', '100W + 18W QC'],
  buck: ['Buck converter', '12V 10A'],
  wago: ['WAGO 221', 'lever connectors'],
  meter: ['DC voltmeter', '0-100V panel'],
  button: ['Pushbutton 16mm', 'NO + NC'],
  esp32: ['ESP32 DevKit V1', 'WiFi+BT, 3.3V logic'],
  oled: ['0.96 OLED SSD1306', 'I2C 128x64'],
  sensor: ['BME280 sensor', 'T/H/P I2C'],
};
