/* Wattouna In-Browser Video Director — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/video-director.ts --format=esm --outfile=public/vendor/video-director.js
   Honest media model (documented in UI):
   - VIDEO: an offscreen 2D canvas re-rendered every frame (dark studio,
     component blocks, live wires) → canvas.captureStream(30) → MediaRecorder
     (.webm vp9/vp8). No DOM scraping, no heavy html2canvas dependency.
   - AUDIO: SpeechSynthesis output CANNOT be captured by any Web API, so the
     director speaks steps live AND optionally muxes a real microphone track
     (getUserMedia) for genuine narration. A timed voiceover script (.txt) is
     always exported alongside for studio dubbing. */

export interface Shot {
  say: string;
  run: () => void;
  holdMs?: number;
}

export interface NodeDraw { id: string; type: string }
export interface WireDraw { a: string; b: string; color: string; x1: number; y1: number; x2: number; y2: number }

const NCOL: Record<string, string> = {
  battery: '#22c55e', mppt: '#f59e0b', latch: '#a855f7', usb: '#38bdf8',
  buck: '#38bdf8', wago: '#eab308', meter: '#f43f5e', button: '#94a3b8',
  esp32: '#10b981', oled: '#22d3ee', sensor: '#84cc16',
};

export interface Director {
  canvas: HTMLCanvasElement;
  start(opts?: { mic?: boolean; onLog?: (l: string) => void }): Promise<void>;
  drawFrame(nodes: NodeDraw[], wires: WireDraw[], caption: string): void;
  stop(): Promise<{ video: Blob; voiceover: string }>;
  readonly recording: boolean;
}

export function supported(): { canvas: boolean; mic: boolean } {
  const c = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  return {
    canvas: Boolean(c && (c as HTMLCanvasElement).captureStream && (window as any).MediaRecorder),
    mic: Boolean(navigator?.mediaDevices?.getUserMedia),
  };
}

export function voiceoverScript(shots: Shot[]): string {
  return shots.map((s, i) => `[${String(Math.floor((i * 4) / 60)).padStart(2, '0')}:${String((i * 4) % 60).padStart(2, '0')}] ${s.say}`).join('\n');
}

export function createDirector(W = 960, H = 540): Director {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  let rec: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let micStream: MediaStream | null = null;
  let recording = false;
  let shots: Shot[] = [];

  function frame(nodes: NodeDraw[], wires: WireDraw[], caption: string) {
    g.fillStyle = '#070c18';
    g.fillRect(0, 0, W, H);
    // dotted grid
    g.fillStyle = 'rgba(56,189,248,.25)';
    for (let x = 20; x < W; x += 44) for (let y = 20; y < H; y += 44) {
      g.beginPath(); g.arc(x, y, 1.6, 0, 6.2832); g.fill();
    }
    // brand bar
    g.fillStyle = '#f59e0b';
    g.fillRect(0, 0, W, 6);
    g.fillStyle = '#e6edf7';
    g.font = 'bold 26px sans-serif';
    g.textAlign = 'right';
    g.fillText('WATTOUNA LAB', W - 24, 44);
    g.textAlign = 'left';
    // nodes (staggered layout)
    const pos: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, i) => {
      const x = 60 + (i % 4) * 220, y = 120 + Math.floor(i / 4) * 170;
      pos[n.id] = { x: x + 90, y: y + 45 };
      g.fillStyle = '#0d1527';
      g.strokeStyle = NCOL[n.type] || '#64748b';
      g.lineWidth = 3;
      g.beginPath();
      (g as any).roundRect ? (g as any).roundRect(x, y, 180, 90) : g.rect(x, y, 180, 90);
      g.fill(); g.stroke();
      g.fillStyle = '#e6edf7';
      g.font = 'bold 20px sans-serif';
      g.fillText(n.type.toUpperCase(), x + 14, y + 40);
      g.fillStyle = '#93a4c4';
      g.font = '15px sans-serif';
      g.fillText(n.id, x + 14, y + 66);
    });
    // wires
    for (const w of wires) {
      const a = pos[w.a.split(':')[0]], b = pos[w.b.split(':')[0]];
      if (!a || !b) continue;
      g.strokeStyle = w.color || '#38bdf8';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.bezierCurveTo(a.x + 80, a.y, b.x - 80, b.y, b.x, b.y);
      g.stroke();
    }
    // caption bar
    g.fillStyle = 'rgba(2,6,23,.85)';
    g.fillRect(0, H - 64, W, 64);
    g.fillStyle = '#fcd34d';
    g.font = 'bold 21px sans-serif';
    g.fillText((caption || '').slice(0, 72), 24, H - 24);
  }

  return {
    canvas,
    get recording() { return recording; },
    drawFrame: (nodes, wires, caption) => frame(nodes, wires, caption),
    async start(opts = {}) {
      if (recording) return;
      const stream: MediaStream = (canvas as HTMLCanvasElement).captureStream(30);
      if (opts.mic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
          micStream.getAudioTracks().forEach((t) => stream.addTrack(t));
          opts.onLog?.('🎙️ mic track muxed');
        } catch {
          opts.onLog?.('⚠️ mic denied — video only');
        }
      }
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || '';
      chunks = [];
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start(500);
      recording = true;
      opts.onLog?.('🔴 recording' + (mime ? ` (${mime.split(';')[0]})` : ''));
    },
    async stop() {
      const done = new Promise<Blob>((resolve) => {
        if (!rec) { resolve(new Blob()); return; }
        rec.onstop = () => resolve(new Blob(chunks, { type: rec!.mimeType || 'video/webm' }));
        try { rec.stop(); } catch { resolve(new Blob(chunks)); }
      });
      const video = await done;
      recording = false;
      try { micStream?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      micStream = null;
      rec = null;
      return { video, voiceover: voiceoverScript(shots) };
    },
  };
}

/** Run the build choreography: caller owns staging state; each shot mutates
    it, then we redraw + narrate. Returns spoken lines (for the .txt dub). */
export async function runChoreography(o: {
  shots: Shot[];
  snapshot: () => { nodes: NodeDraw[]; wires: WireDraw[] };
  draw: (nodes: NodeDraw[], wires: WireDraw[], caption: string) => void;
  speak: (text: string) => void;
  onStep?: (i: number) => void;
}): Promise<string[]> {
  const spoken: string[] = [];
  for (let i = 0; i < o.shots.length; i++) {
    const s = o.shots[i];
    o.onStep?.(i);
    s.run();
    const st = o.snapshot();
    o.draw(st.nodes, st.wires, s.say);
    o.speak(s.say);
    spoken.push(s.say);
    await new Promise((r) => setTimeout(r, s.holdMs ?? 2600));
  }
  return spoken;
}
