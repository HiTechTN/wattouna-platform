/* Wattouna Ghost Blog Publisher — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/ghost-publisher.ts --format=esm --outfile=public/vendor/ghost-publisher.js
   Zero dependencies: Ghost Admin API auth is a short-lived HS256 JWT
   (key format "<id>:<secret-hex>") signed with WebCrypto — fully offline-safe
   code, network only at publish time. Keys live in localStorage (settings
   modal), never in the repo. */

export interface GhostConfig { url: string; key: string }
export interface BlogPost {
  title: string;
  purpose: string;
  svgSnapshot: string;
  bom: Array<{ part: string; spec: string }>;
  firmwareArduino: string;
  firmwareMicro: string;
  wires: Array<{ a: string; b: string; color: string }>;
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)) as number[]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Split "<id>:<secret>" and sign a 5-minute Ghost Admin JWT. */
export async function ghostJwt(key: string): Promise<{ token: string; kid: string }> {
  const idx = key.indexOf(':');
  if (idx < 1) throw new Error('Ghost key must look like <id>:<secret>.');
  const kid = key.slice(0, idx);
  const secretHex = key.slice(idx + 1).replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]+$/.test(secretHex) || secretHex.length < 32) {
    throw new Error('Ghost secret must be hex (check Admin → Integrations).');
  }
  const raw = new Uint8Array(secretHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const ck = await crypto.subtle.importKey('raw', raw as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid })));
  const body = b64url(new TextEncoder().encode(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(`${head}.${body}`)));
  return { token: `${head}.${body}.${b64url(sig)}`, kid };
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Rich HTML article (RTL shell, Latin code) from a workbench project. */
export function buildPost(p: BlogPost): { title: string; html: string } {
  const bomRows = p.bom.map((b, i) =>
    `<tr><td>${i + 1}</td><td><strong>${esc(b.part)}</strong></td><td dir="ltr" style="text-align:left">${esc(b.spec)}</td></tr>`).join('');
  const netRows = p.wires.slice(0, 40).map((w) =>
    `<tr><td dir="ltr"><code>${esc(w.a)}</code></td><td>↔</td><td dir="ltr"><code>${esc(w.b)}</code></td><td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${esc(w.color)}"></span></td></tr>`).join('');
  const html = `<div dir="rtl" lang="ar">
<p>مشروع عتاد مفتوح من <strong>مختبر واطنا</strong> — صُمم وحُوكِم في المتصفح ثم وُثّق آليًا للنشر.</p>
<p>${esc(p.purpose)}</p>
<h2>📸 لقطة الدارة</h2>
${p.svgSnapshot}
<h2>📋 قائمة المكونات</h2>
<table><thead><tr><th>#</th><th>القطعة</th><th>المواصفة</th></tr></thead><tbody>${bomRows}</tbody></table>
<h2>🔌 Netlist</h2>
<table><thead><tr><th>من</th><th></th><th>إلى</th><th>لون</th></tr></thead><tbody>${netRows}</tbody></table>
<h2>💻 البرنامج (Arduino)</h2>
<pre dir="ltr"><code>${esc(p.firmwareArduino)}</code></pre>
<h2>🐍 البرنامج (MicroPython)</h2>
<pre dir="ltr"><code>${esc(p.firmwareMicro)}</code></pre>
<h2>⛑️ تحذيرات السلامة</h2>
<ul><li>فيوز 15A أول عنصر بعد البطارية — لا تتجاوزه أبدًا.</li>
<li>AWG 14 للقدرة / AWG 20 للمنطق. وصلات WAGO 221 بدون لحام.</li>
<li>عاير الفصل على 31.00V وتحقق من 0.00mA قبل اللمس.</li></ul>
<p><em>نُشر آليًا من Wattouna Maker Canvas (MIT).</em></p>
</div>`;
  return { title: p.title, html };
}

/** Publish as a live post tagged #Wattouna. Returns the post URL. */
export async function publishPost(cfg: GhostConfig, post: BlogPost): Promise<string> {
  const base = cfg.url.replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) throw new Error('Ghost URL must start with http(s)://');
  const { token } = await ghostJwt(cfg.key);
  const { title, html } = buildPost(post);
  const r = await fetch(`${base}/ghost/api/admin/posts/?source=html`, {
    method: 'POST',
    headers: { Authorization: `Ghost ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts: [{ title, html, status: 'published', tags: [{ name: '#Wattouna' }] }] }),
  });
  const data = await r.json().catch(() => null);
  if (r.status !== 201 || !data?.posts?.[0]) {
    const msg = (data?.errors || []).map((e: any) => e.message).join('; ') || `HTTP ${r.status}`;
    throw new Error(`Ghost rejected the post: ${msg}`);
  }
  return data.posts[0].url || `${base}/${data.posts[0].slug}/`;
}
