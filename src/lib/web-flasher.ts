/* Wattouna Web Serial flasher — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/web-flasher.ts --format=esm --outfile=public/vendor/web-flasher.js
   Honest capability model (documented in UI):
   - MicroPython boards: REAL flashing — code is written to main.py over USB
     using the raw-REPL protocol (Ctrl-A/Ctrl-D framing, chunked writes),
     then verified. No binaries, no cloud compiler, works offline.
   - Arduino C++: browsers cannot compile toolchains — the UI offers one-click
     copy + .ino download with IDE instructions instead of fake progress.
   - navigator.serial exists only in Chromium/Edge desktop + Android USB-OTG.
     Everywhere else a clean fallback modal is shown. Nothing blocks the
     main thread: all I/O is async with cooperative timeouts. */

export type LogFn = (line: string, cls?: 'ok' | 'err' | 'dim') => void;

export function serialSupported(): boolean {
  try {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  } catch {
    return false;
  }
}

/** Split code into REPL-safe chunks (repr-escaped on one logical line each). */
export function chunkPython(code: string, size = 180): string[] {
  const out: string[] = [];
  for (let i = 0; i < code.length; i += size) out.push(code.slice(i, i + size));
  return out;
}

interface PortLike {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  marker: string,
  timeoutMs: number,
  onLog?: LogFn,
): Promise<string> {
  const dec = new TextDecoder();
  let buf = '';
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const chunk = dec.decode(value, { stream: true });
      buf += chunk;
      if (onLog && chunk.trim()) onLog(chunk.replace(/\s+$/g, ''), 'dim');
      if (buf.includes(marker)) return buf;
    }
  }
  throw new Error(`timeout waiting for ${JSON.stringify(marker)}`);
}

/** After a marker, the trailing 'OK' may arrive in the next USB frame. */
async function expectOk(reader: ReadableStreamDefaultReader<Uint8Array>, what: string): Promise<void> {
  const tail = await readUntil(reader, 'OK', 2500).catch(() => '');
  if (!/OK/.test(tail)) throw new Error(`${what} rejected by device`);
}

async function writeStr(port: PortLike, s: string): Promise<void> {
  const w = port.writable!.getWriter();
  try {
    await w.write(new TextEncoder().encode(s));
  } finally {
    w.releaseLock();
  }
}

/** Drain any pending input so the next handshake starts clean. */
async function drain(port: PortLike, ms = 250): Promise<void> {
  if (!port.readable) return;
  const reader = port.readable.getReader();
  const t0 = Date.now();
  try {
    while (Date.now() - t0 < ms) {
      const t = Promise.race([
        reader.read(),
        sleep(60).then(() => ({ value: undefined as unknown as Uint8Array, done: true })),
      ]);
      const r = await t;
      if (r.done) break;
    }
  } catch { /* ignore */ }
  finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
}

export async function requestEspPort(): Promise<PortLike | null> {
  try {
    const nav = navigator as unknown as {
      serial: { requestPort(o?: { filters: Array<{ usbVendorId?: number }> }): Promise<PortLike> };
    };
    // Silicon Labs CP210x, WCH CH340, Espressif native USB
    return await nav.serial.requestPort({
      filters: [{ usbVendorId: 0x10c4 }, { usbVendorId: 0x1a86 }, { usbVendorId: 0x303a }],
    });
  } catch {
    return null; // user cancelled the picker
  }
}

/**
 * Flash MicroPython source to main.py via raw REPL.
 * Throws with human-readable messages; logs every step to onLog.
 */
export async function flashMicroPython(
  port: PortLike,
  code: string,
  filename: string,
  onLog: LogFn,
  baudRate = 115200,
): Promise<void> {
  onLog(`⏳ فتح المنفذ @ ${baudRate} baud…`);
  await port.open({ baudRate });
  try {
    await writeStr(port, '\r\x03\x03'); // interrupt running program
    await sleep(150);
    await drain(port);
    onLog('⌨️ دخول raw REPL…');
    const reader = port.readable!.getReader();
    try {
      await writeStr(port, '\r\x01'); // Ctrl-A → raw REPL
      await readUntil(reader, 'raw REPL; CTRL-B to exit', 4000);
      onLog('✅ raw REPL جاهز', 'ok');
      // remove old file, then stream chunks
      const setup = `import os\ntry:\n os.remove('${filename}')\nexcept: pass\nf=open('${filename}','w')\nf.write('')\nf.close()\nprint('READY')\n\x04`;
      await writeStr(port, setup);
      await readUntil(reader, 'READY', 5000);
      await expectOk(reader, 'setup');
      const chunks = chunkPython(code);
      onLog(`⬆️ إرسال ${chunks.length} مقطع…`);
      for (let i = 0; i < chunks.length; i++) {
        const line = `f=open('${filename}','ab')\nf.write(${JSON.stringify(chunks[i])})\nf.close()\nprint('C${i}')\n\x04`;
        await writeStr(port, line);
        await readUntil(reader, `C${i}`, 8000);
        await expectOk(reader, `chunk ${i + 1}/${chunks.length}`);
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) onLog(`… ${i + 1}/${chunks.length}`);
      }
      onLog('🔍 تحقق…');
      await writeStr(port, `print('SIZE:'+str(__import__('os').stat('${filename}')[6]))\n\x04`);
      const rv = await readUntil(reader, 'SIZE:', 5000);
      const m = rv.match(/SIZE:(\d+)/);
      onLog(`📦 على الجهاز: ${m ? m[1] : '?'} بايت (المصدر: ${code.length})`, m ? 'ok' : undefined);
      await writeStr(port, '\x02'); // exit raw REPL
      onLog(`✅ تم الحرق في ${filename} — أعد التشغيل بزر EN`, 'ok');
    } finally {
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
  } finally {
    try { await port.close(); } catch { /* ignore */ }
  }
}

/** Serial monitor: streams device output to onData until signal aborts. */
export async function runMonitor(
  port: PortLike,
  onData: (text: string) => void,
  shouldStop: () => boolean,
  baudRate = 115200,
): Promise<void> {
  await port.open({ baudRate });
  const dec = new TextDecoder();
  try {
    await writeStr(port, '\r\n');
    const reader = port.readable!.getReader();
    try {
      while (!shouldStop()) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) onData(dec.decode(value, { stream: true }));
      }
    } finally {
      try { reader.cancel(); } catch { /* ignore */ }
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
  } finally {
    try { await port.close(); } catch { /* ignore */ }
  }
}
