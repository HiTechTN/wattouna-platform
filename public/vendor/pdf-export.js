const enc = new TextEncoder();
function strBytes(s) {
  return enc.encode(s);
}
function concat(...arrs) {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}
function jpegSize(data) {
  if (data[0] !== 255 || data[1] !== 216) throw new Error("not-jpeg");
  let i = 2;
  while (i < data.length - 1) {
    if (data[i] !== 255) {
      i++;
      continue;
    }
    const m = data[i + 1];
    if (m === 216 || m === 217 || m >= 208 && m <= 215 || m === 1) {
      i += 2;
      continue;
    }
    const len = (data[i + 2] << 8) + data[i + 3];
    if (m >= 192 && m <= 207 && m !== 196 && m !== 200 && m !== 204) {
      return { h: (data[i + 5] << 8) + data[i + 6], w: (data[i + 7] << 8) + data[i + 8] };
    }
    i += 2 + len;
  }
  throw new Error("sof-not-found");
}
function svgToJpegBytes(svg, w, h) {
  return new Promise((resolve, reject) => {
    const fixed = svg.includes("xmlns") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const url = URL.createObjectURL(new Blob([fixed], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const g = c.getContext("2d");
        if (!g) throw new Error("no-2d");
        g.fillStyle = "#080f22";
        g.fillRect(0, 0, w, h);
        g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const du = g.canvas.toDataURL("image/jpeg", 0.85);
        const bin = atob(du.split(",")[1]);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        resolve(out);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("raster-failed"));
    };
    img.src = url;
  });
}
function latin(s) {
  return s.replace(/[^\x20-\x7e\u00a0-\u00ff€]/g, "").slice(0, 160);
}
const PW = 595, PH = 842, M = 48;
async function generateBlueprint(input) {
  const pages = [{ ops: [], y: PH - M }];
  const cur = () => pages[pages.length - 1];
  const need = (h) => {
    if (cur().y - h < M) pages.push({ ops: [], y: PH - M });
  };
  const text = (t, size, r = 0.9, g = 0.93, b = 0.97, font = "Helvetica-Bold") => {
    need(size + 6);
    const p = cur();
    p.ops.push(`BT /${font} ${size} Tf ${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg ${M} ${p.y.toFixed(1)} Td (${pdfEsc(latin(t))}) Tj ET`);
    p.y -= size + 6;
  };
  const rule = (color = [0.96, 0.62, 0.04]) => {
    const p = cur();
    p.ops.push(`${color.join(" ")} RG 1.2 w ${M} ${p.y.toFixed(1)} m ${PW - M} ${p.y.toFixed(1)} l S`);
    p.y -= 10;
  };
  const gap = (h) => {
    cur().y -= h;
  };
  text("WATTOUNA OPEN HARDWARE BLUEPRINT", 17, 0.96, 0.62, 0.04);
  text(input.title || "Untitled circuit", 13);
  gap(2);
  rule();
  gap(4);
  (input.meta || []).forEach((m) => text("\u2022 " + m, 9, 0.58, 0.64, 0.77, "Helvetica"));
  gap(2);
  text("PURPOSE", 11, 0.22, 0.74, 0.97);
  input.purpose.split("\n").slice(0, 6).forEach((ln) => text(ln.trim() || " ", 9, 0.9, 0.93, 0.97, "Helvetica"));
  gap(4);
  text("CIRCUIT SNAPSHOT", 11, 0.22, 0.74, 0.97);
  const jpeg = await svgToJpegBytes(input.svgSnapshot, 1100, 620);
  const { w: jw, h: jh } = jpegSize(jpeg);
  const maxW = PW - 2 * M, imgH = Math.min(300, maxW * jh / jw), imgW = imgH * jw / jh;
  need(imgH + 8);
  const ip = cur();
  const imgName = "/ImSnap";
  const ix = M + (maxW - imgW) / 2, iy = ip.y - imgH;
  ip.ops.push(`q ${imgW.toFixed(1)} 0 0 ${imgH.toFixed(1)} ${ix.toFixed(1)} ${iy.toFixed(1)} cm ${imgName} Do Q`);
  ip.ops.push(`0.12 0.19 0.33 RG 0.8 w ${ix.toFixed(1)} ${iy.toFixed(1)} ${imgW.toFixed(1)} ${imgH.toFixed(1)} re S`);
  ip.y = iy - 12;
  text("BILL OF MATERIALS", 11, 0.22, 0.74, 0.97);
  input.bom.slice(0, 24).forEach((b, i) => text(`${i + 1}. ${b.part} \u2014 ${b.spec}`, 9, 0.9, 0.93, 0.97, "Helvetica"));
  gap(4);
  text("NETLIST (power first)", 11, 0.22, 0.74, 0.97);
  input.wires.slice(0, 30).forEach((w) => text(`${w.a} <-> ${w.b}  [${w.color}]`, 8, 0.58, 0.64, 0.77, "Helvetica"));
  gap(6);
  text("Generated 100% offline by Wattouna Maker Canvas (MIT open hardware).", 8, 0.58, 0.64, 0.77, "Helvetica");
  const objs = [];
  let n = 1;
  const imgId = n++, contentIds = [];
  const pageIds = [];
  pages.forEach(() => {
    contentIds.push(n++);
    pageIds.push(n++);
  });
  const pagesId = n++, catalogId = n++;
  const content = pages.map((p) => {
    const bg = `0.03 0.05 0.09 rg 0 0 ${PW} ${PH} re f
`;
    return strBytes(bg + p.ops.join("\n") + "\n");
  });
  const f1 = n++, f2 = n++;
  objs.push({ num: f1, body: strBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>") });
  objs.push({ num: f2, body: strBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>") });
  for (let i = 0; i < content.length; i++) {
    let s = new TextDecoder().decode(content[i]);
    s = s.replaceAll("/Helvetica-Bold", "/F2").replaceAll("/Helvetica", "/F1");
    content[i] = strBytes(s);
  }
  objs.push({
    num: imgId,
    body: concat(
      strBytes(`<< /Type /XObject /Subtype /Image /Width ${jw} /Height ${jh} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>
stream
`),
      jpeg,
      strBytes("\nendstream")
    )
  });
  contentIds.forEach((cid, i) => objs.push({ num: cid, body: concat(strBytes(`<< /Length ${content[i].length} >>
stream
`), content[i], strBytes("\nendstream")) }));
  pageIds.forEach((pid, i) => objs.push({
    num: pid,
    body: strBytes(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PW} ${PH}] /Contents ${contentIds[i]} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> /XObject << /ImSnap ${imgId} 0 R >> >> >>`)
  }));
  objs.push({ num: pagesId, body: strBytes(`<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(" ")}] /Count ${pageIds.length} >>`) });
  objs.push({ num: catalogId, body: strBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`) });
  objs.sort((a, b) => a.num - b.num);
  let out = strBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const offsets = [0];
  for (const o of objs) {
    offsets[o.num] = out.length;
    out = concat(out, strBytes(`${o.num} 0 obj
`), o.body, strBytes("\nendobj\n"));
  }
  const xref = out.length;
  let x = `xref
0 ${n}
0000000000 65535 f 
`;
  for (let i = 1; i < n; i++) x += `${String(offsets[i] ?? 0).padStart(10, "0")} 00000 n 
`;
  out = concat(out, strBytes(x + `trailer
<< /Size ${n} /Root ${catalogId} 0 R >>
startxref
${xref}
%%EOF`));
  return new Blob([out], { type: "application/pdf" });
}
function pdfEsc(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 4e3);
}
export {
  downloadBlob,
  generateBlueprint,
  jpegSize
};
