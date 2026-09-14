/* Wattouna YouTube Publisher — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/youtube-publisher.ts --format=esm --outfile=public/vendor/youtube-publisher.js
   Zero dependencies: Google Identity Services is lazy-loaded ONLY when the
   user clicks connect (keeps the PWA offline-first); uploads use the
   resumable protocol with progress; access tokens stay in memory. */

const GSI = 'https://accounts.google.com/gsi/client';
const YT = 'https://www.googleapis.com';

export interface YtMeta {
  title: string;
  description: string;
  playlistId?: string;
  privacy?: 'public' | 'unlisted' | 'private';
}

declare const google: any;

let gsiLoading: Promise<void> | null = null;

export function gsiReady(): boolean {
  try {
    return typeof google !== 'undefined' && !!google.accounts?.oauth2;
  } catch {
    return false;
  }
}

function ensureGsi(): Promise<void> {
  if (gsiReady()) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('GSI load failed (offline?)'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('GSI timeout')), 20000);
    });
  }
  return gsiLoading;
}

/** OAuth2 token for youtube.upload scope (user gesture required). */
export async function requestYtToken(clientId: string): Promise<string> {
  await ensureGsi();
  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
        callback: (res: any) => {
          if (res?.access_token) resolve(res.access_token);
          else reject(new Error(res?.error || 'oauth-denied'));
        },
      });
      client.requestAccessToken({ prompt: '' });
    } catch (e) {
      reject(e as Error);
    }
  });
}

export function buildMetadata(m: YtMeta): { snippet: object; status: object } {
  return {
    snippet: { title: m.title.slice(0, 100), description: m.description.slice(0, 5000), categoryId: '28' },
    status: { privacyStatus: m.privacy || 'unlisted', selfDeclaredMadeForKids: false },
  };
}

export function buildDescription(o: { title: string; bom: Array<{ part: string; spec: string }>; blogUrl: string; projectUrl: string }): string {
  return [
    `${o.title} — built live in the Wattouna Maker Canvas (open hardware, MIT).`,
    ``,
    `BOM:`,
    ...o.bom.map((b, i) => `${i + 1}. ${b.part} — ${b.spec}`),
    ``,
    `Full tutorial: ${o.blogUrl}`,
    `Remix the circuit: ${o.projectUrl}`,
    `#Wattouna #SolarDIY #ESP32 #OpenHardware`,
  ].join('\n');
}

async function api(token: string, method: string, path: string, body?: unknown): Promise<any> {
  const r = await fetch(YT + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`YouTube API ${r.status}: ${data?.error?.message || ''}`.trim());
  return data;
}

/** Resumable upload with progress (chunked PUT, 8MB parts). */
export async function uploadVideo(
  token: string, blob: Blob, meta: YtMeta, onProgress?: (p: number) => void,
): Promise<{ videoId: string; url: string }> {
  const { snippet, status } = buildMetadata(meta);
  const init = await fetch(`${YT}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Upload-Content-Length': String(blob.size), 'X-Upload-Content-Type': blob.type || 'video/webm' },
    body: JSON.stringify({ snippet, status }),
  });
  if (!init.ok) throw new Error(`upload init failed (${init.status})`);
  const session = init.headers.get('location');
  if (!session) throw new Error('no upload session URL');
  const CH = 8 * 1024 * 1024;
  let offset = 0;
  for (;;) {
    const end = Math.min(offset + CH, blob.size);
    const r = await fetch(session, {
      method: 'PUT',
      headers: { 'Content-Length': String(end - offset), 'Content-Range': `bytes ${offset}-${end - 1}/${blob.size}` },
      body: blob.slice(offset, end),
    });
    onProgress?.(end / blob.size);
    if (r.status === 200 || r.status === 201) {
      const data = await r.json();
      return { videoId: data.id, url: `https://youtu.be/${data.id}` };
    }
    if (r.status !== 308) throw new Error(`upload chunk failed (${r.status})`);
    const range = r.headers.get('range') || '';
    const m = range.match(/bytes=0-(\d+)/);
    offset = m ? Number(m[1]) + 1 : end;
    if (offset >= blob.size) throw new Error('upload stalled');
  }
}

/** Append to a playlist (best-effort; upload survives without it). */
export async function addToPlaylist(token: string, videoId: string, playlistId: string): Promise<void> {
  await api(token, 'POST', '/youtube/v3/playlistItems?part=snippet', {
    snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } },
  });
}
