const GSI = "https://accounts.google.com/gsi/client";
const YT = "https://www.googleapis.com";
let gsiLoading = null;
function gsiReady() {
  try {
    return typeof google !== "undefined" && !!google.accounts?.oauth2;
  } catch {
    return false;
  }
}
function ensureGsi() {
  if (gsiReady()) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = GSI;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("GSI load failed (offline?)"));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error("GSI timeout")), 2e4);
    });
  }
  return gsiLoading;
}
async function requestYtToken(clientId) {
  await ensureGsi();
  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl",
        callback: (res) => {
          if (res?.access_token) resolve(res.access_token);
          else reject(new Error(res?.error || "oauth-denied"));
        }
      });
      client.requestAccessToken({ prompt: "" });
    } catch (e) {
      reject(e);
    }
  });
}
function buildMetadata(m) {
  return {
    snippet: { title: m.title.slice(0, 100), description: m.description.slice(0, 5e3), categoryId: "28" },
    status: { privacyStatus: m.privacy || "unlisted", selfDeclaredMadeForKids: false }
  };
}
function buildDescription(o) {
  return [
    `${o.title} \u2014 built live in the Wattouna Maker Canvas (open hardware, MIT).`,
    ``,
    `BOM:`,
    ...o.bom.map((b, i) => `${i + 1}. ${b.part} \u2014 ${b.spec}`),
    ``,
    `Full tutorial: ${o.blogUrl}`,
    `Remix the circuit: ${o.projectUrl}`,
    `#Wattouna #SolarDIY #ESP32 #OpenHardware`
  ].join("\n");
}
async function api(token, method, path, body) {
  const r = await fetch(YT + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === void 0 ? void 0 : JSON.stringify(body)
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`YouTube API ${r.status}: ${data?.error?.message || ""}`.trim());
  return data;
}
async function uploadVideo(token, blob, meta, onProgress) {
  const { snippet, status } = buildMetadata(meta);
  const init = await fetch(`${YT}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Upload-Content-Length": String(blob.size), "X-Upload-Content-Type": blob.type || "video/webm" },
    body: JSON.stringify({ snippet, status })
  });
  if (!init.ok) throw new Error(`upload init failed (${init.status})`);
  const session = init.headers.get("location");
  if (!session) throw new Error("no upload session URL");
  const CH = 8 * 1024 * 1024;
  let offset = 0;
  for (; ; ) {
    const end = Math.min(offset + CH, blob.size);
    const r = await fetch(session, {
      method: "PUT",
      headers: { "Content-Length": String(end - offset), "Content-Range": `bytes ${offset}-${end - 1}/${blob.size}` },
      body: blob.slice(offset, end)
    });
    onProgress?.(end / blob.size);
    if (r.status === 200 || r.status === 201) {
      const data = await r.json();
      return { videoId: data.id, url: `https://youtu.be/${data.id}` };
    }
    if (r.status !== 308) throw new Error(`upload chunk failed (${r.status})`);
    const range = r.headers.get("range") || "";
    const m = range.match(/bytes=0-(\d+)/);
    offset = m ? Number(m[1]) + 1 : end;
    if (offset >= blob.size) throw new Error("upload stalled");
  }
}
async function addToPlaylist(token, videoId, playlistId) {
  await api(token, "POST", "/youtube/v3/playlistItems?part=snippet", {
    snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } }
  });
}
export {
  addToPlaylist,
  buildDescription,
  buildMetadata,
  gsiReady,
  requestYtToken,
  uploadVideo
};
