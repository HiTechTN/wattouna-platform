/* Wattouna Visual Singularity — Smart Canvas kernel (vanilla, zero deps).
   TypeScript source of truth. Compiled via:
     npx esbuild src/lib/wattouna-canvas.ts --format=esm --outfile=public/vendor/wattouna-canvas.js

   Three independently-testable subsystems, framework-free (Astro/Vanilla):
   1. autoLayout() — layered-DAG layout (EDA/academic style):
      battery/sources on the top layer, converters next, appliances after,
      terminal nodes last. In-layer ordering uses barycenter/median sweeps to
      minimise wire crossings, then a collision-relaxation pass guarantees
      ZERO overlapping rectangles in world space.
   2. routeOrtho() — A* grid router on a world-space obstacle map (node
      bounding boxes inflated by CLEAR). Wires escape their terminal through a
      short stub to the nearest free cell (escape routing, as real EDA tools
      do), then route orthogonally around every component. Manhattan fallback
      when no corridor exists.
   3. snapping + minimap + collision helpers shared by the canvas shell.

   Designed to plug the workbench engine into the WireONa bridge (CircuitEngine):
   layout and routing are pure functions over engine state and DOM node rects. */

/* ---------- shared types ---------- */

export interface LayoutNode {
  id: string;
  type: string;
  x: number; y: number;
  w: number; h: number;
}

export interface LayoutWire {
  a: string;       /* "nodeId:terminalId" */
  b: string;
  color?: string;
}

export interface Rect { x: number; y: number; w: number; h: number }
export interface Pt { x: number; y: number }

/* ---------- MILESTONE 1: auto-layout engine ---------- */

const COLLIDE_PAD = 18;      /* extra spacing between nodes in world units */
const LAYER_GAP = 200;       /* vertical gap between layers: dense orthogonal
                               routing corridors + clear net separation */
const NODE_GAP = 64;         /* horizontal gap within a layer: room for routing */

/** Rank graph: 0=sources (battery/mppt) → 1=converters (latch/buck/usb) → 2=distribution (wago) → 3=controllers (esp32/button) → 4=terminal nodes (oled/meter/sensor). */
function rank(type: string): number {
  return ({ battery: 0, mppt: 0, latch: 1, buck: 1, usb: 1, wago: 2, esp32: 3, button: 3, oled: 4, meter: 4, sensor: 4 } as Record<string, number>)[type] ?? 2;
}

/** Layer by rank → order within each layer with median/barycenter sweeps to
    minimise crossings → pack centred → relaxation pass guarantees ZERO
    overlaps → re-centre rows. Returns id → {x,y} (top-left) map. */
export function autoLayout(
  nodes: LayoutNode[],
  wires: LayoutWire[],
): Map<string, Pt> {
  if (!nodes.length) return new Map();
  const layers: LayoutNode[][] = [];
  const maxRank = Math.max(...nodes.map((n) => rank(n.type)));
  for (let r = 0; r <= maxRank; r++) {
    const ls = nodes.filter((n) => rank(n.type) === r);
    if (ls.length) layers.push(ls);
  }
  const deg = new Map<string, number>();
  (wires || []).forEach((w) => {
    const a = w.a.split(':')[0] || w.a, b = w.b.split(':')[0] || w.b;
    deg.set(a, (deg.get(a) || 0) + 1);
    deg.set(b, (deg.get(b) || 0) + 1);
  });

  /* median/barycenter ordering sweeps */
  const idx = new Map<string, number>();
  layers.forEach((L) => L.forEach((n, i) => idx.set(n.id, i)));
  const layerOf = new Map<string, number>();
  layers.forEach((L, li) => L.forEach((n) => layerOf.set(n.id, li)));
  const neighborMedian = (id: string, dir: 1 | -1) => {
    const li = layerOf.get(id)!;
    const other = li + dir;
    if (other < 0 || other >= layers.length) return idx.get(id)!;
    const ms: number[] = [];
    for (const w of wires || []) {
      const a = w.a.split(':')[0] || w.a, b = w.b.split(':')[0] || w.b;
      let otherId: string | null = null;
      if (a === id && layerOf.get(b) === other) otherId = b;
      else if (b === id && layerOf.get(a) === other) otherId = a;
      if (otherId != null) ms.push(idx.get(otherId) ?? idx.get(id)!);
    }
    if (!ms.length) return idx.get(id)!;
    ms.sort((x, y) => x - y);
    return ms.length & 1 ? ms[(ms.length - 1) >> 1] : (ms[ms.length >> 1] + ms[(ms.length >> 1) - 1]) / 2;
  };
  for (let pass = 0; pass < 2; pass++) {
    const sweep = pass === 0 ? (li: number) => li : (li: number) => layers.length - 1 - li;
    for (let i = 0; i < layers.length; i++) {
      const li = sweep(i);
      const L = [...layers[li]];
      L.sort((a, b) =>
        neighborMedian(a.id, li === 0 ? 1 : -1) - neighborMedian(b.id, li === 0 ? 1 : -1) ||
        (deg.get(b.id) || 0) - (deg.get(a.id) || 0) ||
        a.type.localeCompare(b.type));
      layers[li] = L;
      L.forEach((n, j) => idx.set(n.id, j));
    }
  }

  /* pack: layer-by-layer, centred */
  const positions = new Map<string, Pt>();
  let y = 0;
  layers.forEach((L) => {
    const totW = L.reduce((s, n) => s + n.w, 0) + NODE_GAP * (L.length - 1);
    let x = -totW / 2;
    for (const n of L) {
      positions.set(n.id, { x: Math.round(x), y: Math.round(y) });
      x += n.w + NODE_GAP;
    }
    const hMax = Math.max(...L.map((n) => n.h));
    y += hMax + LAYER_GAP;
  });
  const posOf = (id: string) => positions.get(id)!;

  /* relaxation — if two rects overlap, push them apart (deterministic) */
  layers.forEach((L) => {
    const rects = L.map((n) => ({ n, r: { ...posOf(n.id), w: n.w, h: n.h } }));
    let moved = true, guard = 0;
    while (moved && guard++ < 60) {
      moved = false;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const A = rects[i].r, B = rects[j].r;
          const hOverlap = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
          const vOverlap = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          if (hOverlap > 0 && vOverlap > 0) {
            const push = Math.max(hOverlap, vOverlap) + COLLIDE_PAD;
            if (A.x <= B.x) { A.x -= push / 2; B.x += push / 2; }
            else { A.x += push / 2; B.x -= push / 2; }
            moved = true;
          }
        }
      }
    }
    rects.forEach(({ n, r }) => { positions.set(n.id, { x: Math.round(r.x), y: Math.round(r.y) }); });
  });

  /* re-centre rows horizontally after relaxation */
  layers.forEach((L) => {
    let cMin = Infinity, cMax = -Infinity;
    L.forEach((n) => {
      const p = posOf(n.id);
      cMin = Math.min(cMin, p.x); cMax = Math.max(cMax, p.x + n.w);
    });
    const shift = -(cMin + cMax) / 2;
    L.forEach((n) => { const p = posOf(n.id); p.x = Math.round(p.x + shift); });
  });

  return positions;
}

/* ---------- MILESTONE 3: orthogonal A* router + obstacle avoidance ---------- */

const CLEAR = 26;            /* clearance around components, world units */
const GRID = 14;             /* routing grid size */

function inflated(r: Rect): Rect {
  return { x: r.x - CLEAR, y: r.y - CLEAR, w: r.w + CLEAR * 2, h: r.h + CLEAR * 2 };
}

const key = (x: number, y: number) => x + ',' + y;
const parseKey = (k: string): Pt => { const [x, y] = k.split(',').map(Number); return { x, y }; };
const snapTo = (v: number) => Math.round(v / GRID) * GRID;

/** Nearest grid cell (spiral scan) not blocked; `allow` cells count as free. */
function nearestFree(c: Pt, blocked: Set<string>, allow: Set<string>): Pt | null {
  const k0 = key(c.x, c.y);
  if (allow.has(k0) || !blocked.has(k0)) return c;
  for (let r = 1; r <= 10; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const kk = key(c.x + dx * GRID, c.y + dy * GRID);
        if (allow.has(kk) || !blocked.has(kk)) return { x: c.x + dx * GRID, y: c.y + dy * GRID };
      }
    }
  }
  return null;
}

/** Manhattan A* on a grid (4-neighbour). Returns an orthogonal world polyline
    that avoids every obstacle rect, with short escape stubs at both ends —
    or a Manhattan fallback when no corridor exists. */
export function routeOrtho(
  startWorld: Pt,
  targetWorld: Pt,
  obstacles: Rect[],
): Pt[] {
  const blocked = new Set<string>();
  for (const r of obstacles) {
    const ri = inflated(r);
    const x0 = Math.floor(ri.x / GRID), x1 = Math.ceil((ri.x + ri.w) / GRID);
    const y0 = Math.floor(ri.y / GRID), y1 = Math.ceil((ri.y + ri.h) / GRID);
    for (let gx = x0; gx <= x1; gx++)
      for (let gy = y0; gy <= y1; gy++)
        blocked.add(key(gx * GRID, gy * GRID));
  }
  const s = { x: snapTo(startWorld.x), y: snapTo(startWorld.y) };
  const t = { x: snapTo(targetWorld.x), y: snapTo(targetWorld.y) };
  if (s.x === t.x && s.y === t.y) return [startWorld, targetWorld];

  const allow = new Set([key(s.x, s.y), key(t.x, t.y)]);
  const fs = nearestFree(s, blocked, allow);
  const ft = nearestFree(t, blocked, allow);
  if (!fs || !ft) return manhattanFallback(startWorld, targetWorld);

  /* A* between the escape cells */
  const open = new Map<string, number>();
  const came = new Map<string, string>();
  const g = new Map<string, number>();
  const h = (p: Pt) => (Math.abs(p.x - ft.x) + Math.abs(p.y - ft.y)) * 0.999;
  const sk = key(fs.x, fs.y), tk = key(ft.x, ft.y);
  open.set(sk, h(fs));
  g.set(sk, 0);
  const neighbors = (p: Pt): Pt[] => {
    const out: Pt[] = [];
    [[GRID, 0], [-GRID, 0], [0, GRID], [0, -GRID]].forEach(([dx, dy]) => {
      const q = { x: p.x + dx, y: p.y + dy };
      const kk = key(q.x, q.y);
      if (allow.has(kk) || !blocked.has(kk)) out.push(q);
    });
    return out;
  };

  let found = sk === tk;
  let guard = 0;
  while (open.size && !found && guard++ < 40000) {
    /* pop lowest f */
    let bk: string | null = null, bf = Infinity;
    for (const [k, f] of open) if (f < bf) { bf = f; bk = k; }
    if (!bk) break;
    open.delete(bk);
    if (bk === tk) { found = true; break; }
    for (const n of neighbors(parseKey(bk))) {
      const nk = key(n.x, n.y);
      const tentative = g.get(bk)! + GRID;
      if (tentative < (g.get(nk) ?? Infinity)) {
        came.set(nk, bk);
        g.set(nk, tentative);
        open.set(nk, tentative + h(n));
      }
    }
  }

  const linePts: Pt[] = [];
  if (found) {
    const cells: string[] = [];
    let cur = tk;
    while (cur !== sk) { cells.unshift(cur); cur = came.get(cur)!; if (cur === undefined) { break; } }
    linePts.push(startWorld, fs, ...cells.map(parseKey), ft, targetWorld);
  } else {
    linePts.push(...manhattanFallback(startWorld, targetWorld));
  }
  /* Enforce strict orthogonality: between any two consecutive points that
     differ on BOTH axes, insert an L-bend (horizontal first, escape-stub end
     prefers vertical-first so the stub leaves the terminal cleanly). */
  const orthoPts: Pt[] = [linePts[0]];
  for (let i = 1; i < linePts.length; i++) {
    const prev = orthoPts[orthoPts.length - 1], b = linePts[i];
    const dx = Math.abs(b.x - prev.x), dy = Math.abs(b.y - prev.y);
    if (dx > 0.5 && dy > 0.5) {
      /* elbow: order depends on segment role (escape stubs bend vertical-first) */
      const isStubEnd = i === 1 || i === linePts.length - 1;
      const elbow = isStubEnd
        ? { x: prev.x, y: b.y }   /* vertical first, then horizontal → terminal */
        : { x: b.x, y: prev.y };  /* horizontal first, then vertical */
      orthoPts.push(elbow, b);
    } else {
      orthoPts.push(b);
    }
  }
  /* compress collinear runs */
  const out: Pt[] = [orthoPts[0]];
  for (let i = 1; i < orthoPts.length; i++) {
    const a = out[out.length - 1], b = orthoPts[i];
    if (Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5) continue;
    if (out.length >= 2) {
      const prev = out[out.length - 2];
      const collinear = (Math.abs(prev.x - a.x) < 0.5 && Math.abs(a.x - b.x) < 0.5) ||
                        (Math.abs(prev.y - a.y) < 0.5 && Math.abs(a.y - b.y) < 0.5);
      if (collinear) { out[out.length - 1] = b; continue; }
    }
    out.push(b);
  }
  return out;
}

function manhattanFallback(a: Pt, b: Pt): Pt[] {
  const midY = (a.y + b.y) / 2;
  return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b];
}

/* ---------- snapping: magnetic terminals ---------- */

const SNAP_RADIUS = 34;      /* world distance at which a terminal attracts */

/** Nearest terminal to a world point; null when none is within SNAP_RADIUS. */
export function nearestTerminal(
  worldPt: Pt,
  terminals: Array<{ node: string; term: string; x: number; y: number }>,
  maxDist = SNAP_RADIUS,
): { node: string; term: string; x: number; y: number } | null {
  let best: { node: string; term: string; d: number; x: number; y: number } | null = null;
  for (const t of terminals) {
    const d = Math.hypot(t.x - worldPt.x, t.y - worldPt.y);
    if (d <= maxDist && (!best || d < best.d)) best = { node: t.node, term: t.term, d, x: t.x, y: t.y };
  }
  return best ? { node: best.node, term: best.term, x: best.x, y: best.y } : null;
}

/* ---------- minimap ---------- */

export function computeBounds(nodes: LayoutNode[], wirePts: Pt[]): Rect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w); maxY = Math.max(maxY, n.y + n.h);
  }
  for (const p of wirePts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}

/* ---------- post-drag collision resolution ---------- */

/** Push a dragged rect out of every other rect (axis of least movement). */
export function resolveCollisions(
  moving: { id: string; x: number; y: number; w: number; h: number },
  others: Array<{ id: string; x: number; y: number; w: number; h: number }>,
): Pt {
  let x = moving.x, y = moving.y;
  let guard = 0, hit = false;
  do {
    hit = false;
    for (const o of others) {
      const overlapX = x < o.x + o.w && x + moving.w > o.x;
      const overlapY = y < o.y + o.h && y + moving.h > o.y;
      if (overlapX && overlapY) {
        const pushLeft = x - (o.x - moving.w - COLLIDE_PAD);
        const pushRight = (o.x + o.w + COLLIDE_PAD) - x;
        const pushUp = y - (o.y - moving.h - COLLIDE_PAD);
        const pushDown = (o.y + o.h + COLLIDE_PAD) - y;
        const mx = Math.min(pushLeft, pushRight);
        const my = Math.min(pushUp, pushDown);
        if (mx <= my) x += (mx <= pushLeft) ? mx : -pushLeft;
        else y += (my <= pushUp) ? my : -pushUp;
        hit = true;
      }
    }
  } while (hit && guard++ < 40);
  return { x: Math.round(x), y: Math.round(y) };
}
