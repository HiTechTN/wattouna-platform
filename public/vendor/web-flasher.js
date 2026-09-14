function serialSupported() {
  try {
    return typeof navigator !== "undefined" && "serial" in navigator;
  } catch {
    return false;
  }
}
function chunkPython(code, size = 180) {
  const out = [];
  for (let i = 0; i < code.length; i += size) out.push(code.slice(i, i + size));
  return out;
}
async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function readUntil(reader, marker, timeoutMs, onLog) {
  const dec = new TextDecoder();
  let buf = "";
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const chunk = dec.decode(value, { stream: true });
      buf += chunk;
      if (onLog && chunk.trim()) onLog(chunk.replace(/\s+$/g, ""), "dim");
      if (buf.includes(marker)) return buf;
    }
  }
  throw new Error(`timeout waiting for ${JSON.stringify(marker)}`);
}
async function expectOk(reader, what) {
  const tail = await readUntil(reader, "OK", 2500).catch(() => "");
  if (!/OK/.test(tail)) throw new Error(`${what} rejected by device`);
}
async function writeStr(port, s) {
  const w = port.writable.getWriter();
  try {
    await w.write(new TextEncoder().encode(s));
  } finally {
    w.releaseLock();
  }
}
async function drain(port, ms = 250) {
  if (!port.readable) return;
  const reader = port.readable.getReader();
  const t0 = Date.now();
  try {
    while (Date.now() - t0 < ms) {
      const t = Promise.race([
        reader.read(),
        sleep(60).then(() => ({ value: void 0, done: true }))
      ]);
      const r = await t;
      if (r.done) break;
    }
  } catch {
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
}
async function requestEspPort() {
  try {
    const nav = navigator;
    return await nav.serial.requestPort({
      filters: [{ usbVendorId: 4292 }, { usbVendorId: 6790 }, { usbVendorId: 12346 }]
    });
  } catch {
    return null;
  }
}
async function flashMicroPython(port, code, filename, onLog, baudRate = 115200) {
  onLog(`\u23F3 \u0641\u062A\u062D \u0627\u0644\u0645\u0646\u0641\u0630 @ ${baudRate} baud\u2026`);
  await port.open({ baudRate });
  try {
    await writeStr(port, "\r");
    await sleep(150);
    await drain(port);
    onLog("\u2328\uFE0F \u062F\u062E\u0648\u0644 raw REPL\u2026");
    const reader = port.readable.getReader();
    try {
      await writeStr(port, "\r");
      await readUntil(reader, "raw REPL; CTRL-B to exit", 4e3);
      onLog("\u2705 raw REPL \u062C\u0627\u0647\u0632", "ok");
      const setup = `import os
try:
 os.remove('${filename}')
except: pass
f=open('${filename}','w')
f.write('')
f.close()
print('READY')
`;
      await writeStr(port, setup);
      await readUntil(reader, "READY", 5e3);
      await expectOk(reader, "setup");
      const chunks = chunkPython(code);
      onLog(`\u2B06\uFE0F \u0625\u0631\u0633\u0627\u0644 ${chunks.length} \u0645\u0642\u0637\u0639\u2026`);
      for (let i = 0; i < chunks.length; i++) {
        const line = `f=open('${filename}','ab')
f.write(${JSON.stringify(chunks[i])})
f.close()
print('C${i}')
`;
        await writeStr(port, line);
        await readUntil(reader, `C${i}`, 8e3);
        await expectOk(reader, `chunk ${i + 1}/${chunks.length}`);
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) onLog(`\u2026 ${i + 1}/${chunks.length}`);
      }
      onLog("\u{1F50D} \u062A\u062D\u0642\u0642\u2026");
      await writeStr(port, `print('SIZE:'+str(__import__('os').stat('${filename}')[6]))
`);
      const rv = await readUntil(reader, "SIZE:", 5e3);
      const m = rv.match(/SIZE:(\d+)/);
      onLog(`\u{1F4E6} \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632: ${m ? m[1] : "?"} \u0628\u0627\u064A\u062A (\u0627\u0644\u0645\u0635\u062F\u0631: ${code.length})`, m ? "ok" : void 0);
      await writeStr(port, "");
      onLog(`\u2705 \u062A\u0645 \u0627\u0644\u062D\u0631\u0642 \u0641\u064A ${filename} \u2014 \u0623\u0639\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0628\u0632\u0631 EN`, "ok");
    } finally {
      try {
        reader.releaseLock();
      } catch {
      }
    }
  } finally {
    try {
      await port.close();
    } catch {
    }
  }
}
async function runMonitor(port, onData, shouldStop, baudRate = 115200) {
  await port.open({ baudRate });
  const dec = new TextDecoder();
  try {
    await writeStr(port, "\r\n");
    const reader = port.readable.getReader();
    try {
      while (!shouldStop()) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) onData(dec.decode(value, { stream: true }));
      }
    } finally {
      try {
        reader.cancel();
      } catch {
      }
      try {
        reader.releaseLock();
      } catch {
      }
    }
  } finally {
    try {
      await port.close();
    } catch {
    }
  }
}
export {
  chunkPython,
  flashMicroPython,
  requestEspPort,
  runMonitor,
  serialSupported
};
