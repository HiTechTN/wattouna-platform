/* Wattouna skeuomorphic hardware graphics — realistic SVG renderings for the
   Maker Canvas workbench. Plain ESM, no dependencies.
   Usage: import { renderPart } from '/vendor/hardware-graphics.js';
   renderPart(type, uid) -> SVG string (viewBox 0 0 168 104). */

function defs(u) {
  return `<defs>
    <linearGradient id="wrap${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b82f6"/><stop offset=".5" stop-color="#1d4ed8"/><stop offset="1" stop-color="#1e3a8a"/>
    </linearGradient>
    <linearGradient id="metal${u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f1f5f9"/><stop offset=".5" stop-color="#94a3b8"/><stop offset="1" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="pcb${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e40af"/><stop offset="1" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="pcbp${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6d28d9"/><stop offset="1" stop-color="#2e1065"/>
    </linearGradient>
    <radialGradient id="steel${u}" cx=".5" cy=".4" r=".7">
      <stop offset="0" stop-color="#f8fafc"/><stop offset=".6" stop-color="#94a3b8"/><stop offset="1" stop-color="#475569"/>
    </radialGradient>
    <linearGradient id="cu${u}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b45309"/><stop offset=".5" stop-color="#f59e0b"/><stop offset="1" stop-color="#92400e"/>
    </linearGradient>
  </defs>`;
}

const R = {
  battery(u) {
    return `${defs(u)}
    <rect x="6" y="12" width="122" height="80" rx="7" fill="url(#wrap${u})" stroke="#0c1a3a" stroke-width="2"/>
    <line x1="46" y1="14" x2="46" y2="90" stroke="#0c1a3a" stroke-width="2" opacity=".6"/>
    <line x1="88" y1="14" x2="88" y2="90" stroke="#0c1a3a" stroke-width="2" opacity=".6"/>
    <rect x="12" y="22" width="104" height="7" rx="3" fill="url(#metal${u})" opacity=".9"/>
    <rect x="12" y="33" width="104" height="7" rx="3" fill="url(#metal${u})" opacity=".9"/>
    <rect x="12" y="44" width="104" height="7" rx="3" fill="url(#metal${u})" opacity=".9"/>
    <line x1="12" y1="25" x2="116" y2="25" stroke="#475569" stroke-width="1"/>
    <line x1="12" y1="36" x2="116" y2="36" stroke="#475569" stroke-width="1"/>
    <line x1="12" y1="47" x2="116" y2="47" stroke="#475569" stroke-width="1"/>
    <polygon points="20,62 32,62 26,74" fill="#facc15" stroke="#000" stroke-width="1"/>
    <text x="36" y="72" font-size="11" font-weight="bold" fill="#fefce8" font-family="monospace">36V 10S</text>
    <text x="12" y="86" font-size="7" fill="#bfdbfe" font-family="monospace">Li-ion 10.4Ah • 336Wh</text>
    <rect x="132" y="38" width="28" height="26" rx="4" fill="#facc15" stroke="#a16207" stroke-width="2"/>
    <circle cx="140" cy="51" r="3.4" fill="#fbbf24" stroke="#92400e" stroke-width="1.4"/>
    <circle cx="152" cy="51" r="3.4" fill="#fbbf24" stroke="#92400e" stroke-width="1.4"/>
    <text x="132" y="74" font-size="7" fill="#fde68a" font-family="monospace">XT60 ♀</text>`;
  },
  mppt(u) {
    let fins = '';
    for (let i = 0; i < 6; i++) fins += `<rect x="${14 + i * 9}" y="16" width="6" height="30" rx="2" fill="url(#metal${u})" stroke="#475569"/>`;
    return `${defs(u)}
    <rect x="6" y="10" width="156" height="84" rx="5" fill="url(#pcb${u})" stroke="#0b1e4b" stroke-width="2"/>
    ${fins}
    <circle cx="86" cy="30" r="9" fill="none" stroke="#b87333" stroke-width="7"/>
    <circle cx="86" cy="30" r="9" fill="none" stroke="#7c2d12" stroke-width="2" stroke-dasharray="3 2"/>
    <rect x="104" y="18" width="16" height="16" rx="2" fill="#2563eb" stroke="#172554"/>
    <circle cx="112" cy="26" r="3" fill="#fbbf24" stroke="#92400e"/><line x1="110" y1="26" x2="114" y2="26" stroke="#451a03" stroke-width="1.4"/>
    <rect x="124" y="18" width="16" height="16" rx="2" fill="#2563eb" stroke="#172554"/>
    <circle cx="132" cy="26" r="3" fill="#fbbf24" stroke="#92400e"/><line x1="132" y1="24" x2="132" y2="28" stroke="#451a03" stroke-width="1.4"/>
    <rect x="104" y="44" width="20" height="14" rx="2" fill="#16a34a" stroke="#14532d"/>
    <rect x="128" y="44" width="20" height="14" rx="2" fill="#16a34a" stroke="#14532d"/>
    <circle cx="110" cy="51" r="2.4" fill="#052e16"/><circle cx="118" cy="51" r="2.4" fill="#052e16"/>
    <circle cx="134" cy="51" r="2.4" fill="#052e16"/><circle cx="142" cy="51" r="2.4" fill="#052e16"/>
    <line x1="12" y1="66" x2="70" y2="66" stroke="#93c5fd" stroke-width="1" opacity=".7"/>
    <line x1="12" y1="72" x2="50" y2="72" stroke="#93c5fd" stroke-width="1" opacity=".5"/>
    <text x="12" y="86" font-size="8" fill="#dbeafe" font-family="monospace">LTC3780 • MPPT 160W</text>
    <circle cx="152" cy="82" r="4" fill="#22c55e"><animate attributeName="opacity" values="1;.4;1" dur="1.6s" repeatCount="indefinite"/></circle>`;
  },
  latch(u) {
    let ribs = '';
    for (let i = 0; i < 9; i++) ribs += `<line x1="${16 + i * 7}" y1="14" x2="${16 + i * 7}" y2="62" stroke="#020617" stroke-width="3"/>`;
    return `${defs(u)}
    <rect x="10" y="10" width="72" height="56" rx="4" fill="#1e293b" stroke="#000" stroke-width="2"/>
    ${ribs}
    <rect x="92" y="18" width="34" height="48" rx="3" fill="#0f172a" stroke="#000" stroke-width="2"/>
    <rect x="92" y="18" width="34" height="12" rx="3" fill="url(#metal${u})"/>
    <circle cx="109" cy="24" r="3" fill="#020617" stroke="#64748b"/>
    <line x1="98" y1="66" x2="98" y2="78" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="109" y1="66" x2="109" y2="78" stroke="#cbd5e1" stroke-width="4"/>
    <line x1="120" y1="66" x2="120" y2="78" stroke="#cbd5e1" stroke-width="4"/>
    <text x="94" y="88" font-size="7" fill="#94a3b8" font-family="monospace">S G D</text>
    <text x="92" y="97" font-size="8" fill="#e2e8f0" font-family="monospace">IRF4905</text>
    <circle cx="140" cy="30" r="9" fill="none" stroke="#38bdf8" stroke-width="2" opacity=".8"/>
    <text x="133" y="33" font-size="7" fill="#7dd3fc" font-family="monospace">431</text>
    <text x="130" y="60" font-size="7" fill="#94a3b8" font-family="monospace">TL431</text>
    <text x="130" y="80" font-size="8" fill="#f59e0b" font-family="monospace">0.00mA</text>`;
  },
  wago(u) {
    return `${defs(u)}
    <rect x="30" y="18" width="108" height="68" rx="8" fill="#e2e8f0" opacity=".38" stroke="#94a3b8" stroke-width="2"/>
    <rect x="42" y="46" width="84" height="12" rx="3" fill="url(#cu${u})" stroke="#7c2d12"/>
    <circle cx="52" cy="30" r="6" fill="#0f172a"/><circle cx="84" cy="30" r="6" fill="#0f172a"/><circle cx="116" cy="30" r="6" fill="#0f172a"/>
    <rect x="44" y="62" width="16" height="20" rx="4" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
    <rect x="76" y="62" width="16" height="20" rx="4" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
    <rect x="108" y="62" width="16" height="20" rx="4" fill="#f97316" stroke="#9a3412" stroke-width="1.5"/>
    <line x1="52" y1="64" x2="52" y2="72" stroke="#7c2d12" stroke-width="2"/>
    <line x1="84" y1="64" x2="84" y2="72" stroke="#7c2d12" stroke-width="2"/>
    <line x1="116" y1="64" x2="116" y2="72" stroke="#7c2d12" stroke-width="2"/>
    <text x="44" y="97" font-size="8" fill="#475569" font-family="monospace">WAGO 221 • Cu bus</text>`;
  },
  meter(u) {
    return `${defs(u)}
    <rect x="24" y="14" width="120" height="76" rx="8" fill="#1e293b" stroke="#000" stroke-width="2"/>
    <rect x="24" y="14" width="120" height="76" rx="8" fill="none" stroke="#475569" stroke-width="1" stroke-dasharray="4 3" opacity=".6"/>
    <circle cx="32" cy="22" r="2.6" fill="url(#metal${u})"/><circle cx="136" cy="22" r="2.6" fill="url(#metal${u})"/>
    <circle cx="32" cy="82" r="2.6" fill="url(#metal${u})"/><circle cx="136" cy="82" r="2.6" fill="url(#metal${u})"/>
    <rect x="40" y="30" width="88" height="34" rx="4" fill="#000"/>
    <text class="wb-volt" x="84" y="57" font-size="24" text-anchor="middle" fill="#ef4444" font-family="monospace" font-weight="bold">36.0</text>
    <text class="wb-volt" x="84" y="57" font-size="24" text-anchor="middle" fill="#ef4444" font-family="monospace" font-weight="bold" opacity=".35">36.0</text>
    <text x="84" y="76" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="monospace">DC VOLTS</text>`;
  },
  button(u) {
    return `${defs(u)}
    <circle cx="84" cy="52" r="36" fill="url(#steel${u})" stroke="#334155" stroke-width="2"/>
    <circle cx="84" cy="52" r="36" fill="none" stroke="#f8fafc" stroke-width="1" opacity=".5"/>
    <path d="M 52 40 A 33 33 0 0 1 84 19" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round"/>
    <path d="M 116 40 A 33 33 0 0 0 84 19" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" transform="translate(0,66) scale(1,-1)"/>
    <circle cx="84" cy="52" r="22" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <circle cx="84" cy="52" r="14" fill="url(#steel${u})" stroke="#1e293b" stroke-width="2"/>
    <text x="30" y="96" font-size="8" fill="#22c55e" font-family="monospace">START</text>
    <text x="108" y="96" font-size="8" fill="#ef4444" font-family="monospace">STOP</text>`;
  },
  buck(u) {
    return `${defs(u)}
    <path d="M 8 30 C 20 30, 22 40, 34 40" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
    <path d="M 8 52 C 20 52, 22 52, 34 52" fill="none" stroke="#e2e8f0" stroke-width="4" stroke-linecap="round"/>
    <path d="M 8 74 C 20 74, 22 64, 34 64" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    <rect x="34" y="18" width="120" height="68" rx="6" fill="#111827" stroke="#000" stroke-width="2"/>
    <line x1="42" y1="26" x2="146" y2="26" stroke="#374151" stroke-width="4"/>
    <line x1="42" y1="36" x2="146" y2="36" stroke="#374151" stroke-width="4"/>
    <line x1="42" y1="46" x2="146" y2="46" stroke="#374151" stroke-width="4"/>
    <rect x="60" y="58" width="30" height="16" rx="2" fill="#1f2937" stroke="#4b5563"/>
    <circle cx="75" cy="66" r="4" fill="#2563eb" stroke="#172554"/>
    <text x="100" y="70" font-size="9" fill="#e5e7eb" font-family="monospace">12V 10A</text>`;
  },
  usb(u) {
    return `${defs(u)}
    <rect x="14" y="20" width="140" height="64" rx="5" fill="url(#pcbp${u})" stroke="#1e1b4b" stroke-width="2"/>
    <rect x="24" y="34" width="44" height="18" rx="9" fill="url(#metal${u})" stroke="#475569" stroke-width="1.5"/>
    <rect x="32" y="40" width="28" height="6" rx="3" fill="#1e293b"/>
    <rect x="80" y="32" width="40" height="22" rx="2" fill="url(#metal${u})" stroke="#475569" stroke-width="1.5"/>
    <rect x="84" y="46" width="32" height="5" fill="#2563eb"/>
    <circle cx="130" cy="38" r="2" fill="#fbbf24"/><circle cx="138" cy="38" r="2" fill="#fbbf24"/>
    <circle cx="130" cy="48" r="2" fill="#fbbf24"/><circle cx="138" cy="48" r="2" fill="#fbbf24"/>
    <line x1="20" y1="66" x2="60" y2="66" stroke="#c4b5fd" stroke-width="1" opacity=".7"/>
    <text x="20" y="78" font-size="8" fill="#ddd6fe" font-family="monospace">IP2368 • 100W PD</text>`;
  },
};

export function renderPart(type, uid) {
  const fn = R[type];
  if (!fn) return `<rect x="8" y="8" width="152" height="88" rx="8" fill="#16223e"/>`;
  return `<svg viewBox="0 0 168 104" width="100%" height="104" aria-hidden="true">${fn(uid || Math.floor(Math.random() * 1e6))}</svg>`;
}

export const PART_TYPES = Object.keys(R);
