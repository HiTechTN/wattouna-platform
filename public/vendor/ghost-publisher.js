function b64url(bytes) {
  let bin = "";
  const CH = 32768;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ghostJwt(key) {
  const idx = key.indexOf(":");
  if (idx < 1) throw new Error("Ghost key must look like <id>:<secret>.");
  const kid = key.slice(0, idx);
  const secretHex = key.slice(idx + 1).replace(/\s+/g, "");
  if (!/^[0-9a-fA-F]+$/.test(secretHex) || secretHex.length < 32) {
    throw new Error("Ghost secret must be hex (check Admin \u2192 Integrations).");
  }
  const raw = new Uint8Array(secretHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const ck = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1e3);
  const head = b64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT", kid })));
  const body = b64url(new TextEncoder().encode(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", ck, new TextEncoder().encode(`${head}.${body}`)));
  return { token: `${head}.${body}.${b64url(sig)}`, kid };
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function buildPost(p) {
  const bomRows = p.bom.map((b, i) => `<tr><td>${i + 1}</td><td><strong>${esc(b.part)}</strong></td><td dir="ltr" style="text-align:left">${esc(b.spec)}</td></tr>`).join("");
  const netRows = p.wires.slice(0, 40).map((w) => `<tr><td dir="ltr"><code>${esc(w.a)}</code></td><td>\u2194</td><td dir="ltr"><code>${esc(w.b)}</code></td><td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${esc(w.color)}"></span></td></tr>`).join("");
  const html = `<div dir="rtl" lang="ar">
<p>\u0645\u0634\u0631\u0648\u0639 \u0639\u062A\u0627\u062F \u0645\u0641\u062A\u0648\u062D \u0645\u0646 <strong>\u0645\u062E\u062A\u0628\u0631 \u0648\u0627\u0637\u0646\u0627</strong> \u2014 \u0635\u064F\u0645\u0645 \u0648\u062D\u064F\u0648\u0643\u0650\u0645 \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u062B\u0645 \u0648\u064F\u062B\u0651\u0642 \u0622\u0644\u064A\u064B\u0627 \u0644\u0644\u0646\u0634\u0631.</p>
<p>${esc(p.purpose)}</p>
<h2>\u{1F4F8} \u0644\u0642\u0637\u0629 \u0627\u0644\u062F\u0627\u0631\u0629</h2>
${p.svgSnapshot}
<h2>\u{1F4CB} \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062A</h2>
<table><thead><tr><th>#</th><th>\u0627\u0644\u0642\u0637\u0639\u0629</th><th>\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0629</th></tr></thead><tbody>${bomRows}</tbody></table>
<h2>\u{1F50C} Netlist</h2>
<table><thead><tr><th>\u0645\u0646</th><th></th><th>\u0625\u0644\u0649</th><th>\u0644\u0648\u0646</th></tr></thead><tbody>${netRows}</tbody></table>
<h2>\u{1F4BB} \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C (Arduino)</h2>
<pre dir="ltr"><code>${esc(p.firmwareArduino)}</code></pre>
<h2>\u{1F40D} \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062C (MicroPython)</h2>
<pre dir="ltr"><code>${esc(p.firmwareMicro)}</code></pre>
<h2>\u26D1\uFE0F \u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0633\u0644\u0627\u0645\u0629</h2>
<ul><li>\u0641\u064A\u0648\u0632 15A \u0623\u0648\u0644 \u0639\u0646\u0635\u0631 \u0628\u0639\u062F \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 \u2014 \u0644\u0627 \u062A\u062A\u062C\u0627\u0648\u0632\u0647 \u0623\u0628\u062F\u064B\u0627.</li>
<li>AWG 14 \u0644\u0644\u0642\u062F\u0631\u0629 / AWG 20 \u0644\u0644\u0645\u0646\u0637\u0642. \u0648\u0635\u0644\u0627\u062A WAGO 221 \u0628\u062F\u0648\u0646 \u0644\u062D\u0627\u0645.</li>
<li>\u0639\u0627\u064A\u0631 \u0627\u0644\u0641\u0635\u0644 \u0639\u0644\u0649 31.00V \u0648\u062A\u062D\u0642\u0642 \u0645\u0646 0.00mA \u0642\u0628\u0644 \u0627\u0644\u0644\u0645\u0633.</li></ul>
<p><em>\u0646\u064F\u0634\u0631 \u0622\u0644\u064A\u064B\u0627 \u0645\u0646 Wattouna Maker Canvas (MIT).</em></p>
</div>`;
  return { title: p.title, html };
}
async function publishPost(cfg, post) {
  const base = cfg.url.replace(/\/+$/, "");
  if (!/^https?:\/\//.test(base)) throw new Error("Ghost URL must start with http(s)://");
  const { token } = await ghostJwt(cfg.key);
  const { title, html } = buildPost(post);
  const r = await fetch(`${base}/ghost/api/admin/posts/?source=html`, {
    method: "POST",
    headers: { Authorization: `Ghost ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ posts: [{ title, html, status: "published", tags: [{ name: "#Wattouna" }] }] })
  });
  const data = await r.json().catch(() => null);
  if (r.status !== 201 || !data?.posts?.[0]) {
    const msg = (data?.errors || []).map((e) => e.message).join("; ") || `HTTP ${r.status}`;
    throw new Error(`Ghost rejected the post: ${msg}`);
  }
  return data.posts[0].url || `${base}/${data.posts[0].slug}/`;
}
export {
  buildPost,
  ghostJwt,
  publishPost
};
