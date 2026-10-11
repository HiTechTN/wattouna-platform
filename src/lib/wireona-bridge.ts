/* Wattouna State Bridge — TypeScript source of truth.
   Compiled via:
     npx esbuild src/lib/wireona-bridge.ts --format=esm --outfile=public/vendor/wireona-bridge.js

   WireONa Integration milestone, part 3 (State Bridge: visuals ↔ logic).
   NOTE (verified 2026-10-11): the ENGDOKHA/watchparty releases ship WireONa
   only as compiled Flutter/Dart natives (Windows .exe/.zip, Android .apk) —
   there is no embeddable web engine (JS/CSS) to mount. This bridge therefore
   targets a narrow, engine-agnostic contract (CircuitEngine) so that:
   - today it adapts the legacy in-page SVG canvas, and
   - tomorrow, if WireONa ever ships a web build, only a new engine adapter
     implementing CircuitEngine is needed — no changes in the AI tools,
     Union-Find validation, save/share or PDF export.

   Guarantees provided to the rest of the app:
   1. window.__wattounaWB.canvas_state is ALWAYS the engine's live state
      (getter, not a stale copy) → the Union-Find short-circuit detector in
      workbench.astro and analyzeCircuit() in local-ai.ts keep working.
   2. window.__wattounaWB.getState()/snapshot() keep their legacy shape
      (VoiceAI/DeviceSync/CreatorStudio already call them).
   3. AI tools (auto_wire_circuit, ai-add-part) reach the canvas through
      bridge.applyWireBatch()/bridge.addPart() — engine API calls that draw
      real wires visually — whether triggered by voice, chat or code.
   4. Every mutation emits a `wattouna:canvas-sync` CustomEvent with the fresh
      state so observers (future WireONa UI, telemetry) can react. */

export interface WBNode {
  id: string;
  type: string;
  x: number;
  y: number;
  rot?: number;
  pressed?: boolean;
  [k: string]: unknown;
}

export interface WBWire {
  id: string;
  a: string;          // "nodeId:terminalId"
  b: string;          // "nodeId:terminalId"
  color: string;
}

export interface CanvasState {
  nodes: WBNode[];
  wires: WBWire[];
  meta?: Record<string, unknown>;
}

/** The minimal contract any canvas engine must satisfy to run in the Workbench. */
export interface CircuitEngine {
  /** Human-readable id, e.g. 'legacy-svg' or 'wireona'. */
  readonly id: string;
  /** Current live state. */
  getState(): CanvasState;
  /** Replace the whole state (project load / clear) and re-render. */
  setState(state: CanvasState): void;
  /** Add a part by type at optional coords. Returns the new node id or null. */
  addPart(type: string, x?: number, y?: number): string | null;
  /** Draw a wire between two "nodeId:terminalId" endpoints.
      Returns the created wire, or null when the engine rejects it. */
  connectWire(a: string, b: string, color: string): WBWire | null;
  /** SVG (or SVG-compatible) snapshot for PDF/Ghost exports. */
  snapshot(): string;
}

export interface WireBatchResult {
  added: WBWire[];
  skipped: number;    // duplicates, malformed entries or engine-rejected
}

export interface WireonaBridge {
  readonly engineId: string;
  /** Live canvas state — ALWAYS current, safe for Union-Find. */
  readonly canvas_state: CanvasState;
  /** Legacy-compatible deep copy (VoiceAI/DeviceSync/CreatorStudio). */
  getState(): CanvasState;
  snapshot(): string;
  /** auto_wire_circuit path: draw wires through the engine's API. */
  applyWireBatch(wires: Array<{ a: string; b: string; color?: string }>): WireBatchResult;
  /** AI add-part path. Returns node id or null when the type is unknown. */
  addPart(type: string, x?: number, y?: number): string | null;
  /** Load a full project state (from cloud/local store). */
  loadState(state: CanvasState): void;
  /** Subscribe to state changes; returns an unsubscribe function. */
  subscribe(cb: (state: CanvasState) => void): () => void;
}

/** Inbound AI events (already used by VoiceAI.astro). */
export const AI_WIRE_BATCH_EVENT = 'wattouna:ai-wire-batch';
export const AI_ADD_PART_EVENT = 'wattouna:ai-add-part';
/** Outbound state-change notification, fired after every bridge mutation. */
export const SYNC_EVENT = 'wattouna:canvas-sync';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Build the bridge around any engine; publishes window.__wattounaWB and
    routes the AI CustomEvents through the engine API. Idempotent per window. */
export function installWireonaBridge(engine: CircuitEngine): WireonaBridge {
  const subs = new Set<(s: CanvasState) => void>();

  const notify = (source?: string, extra?: Record<string, unknown>) => {
    const live = engine.getState();
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { state: live, engine: engine.id, source, ...extra } }));
    } catch { /* non-browser env */ }
    subs.forEach((cb) => { try { cb(live); } catch { /* observer error must not break canvas */ } });
  };

  const bridge: WireonaBridge = {
    get engineId() { return engine.id; },
    get canvas_state() { return engine.getState(); }, // live getter — no stale copy
    getState: () => clone(engine.getState()),
    snapshot: () => engine.snapshot(),
    addPart: (type, x, y) => {
      const id = engine.addPart(type, x, y);
      if (id) notify('ai-add-part', { type });
      return id;
    },
    applyWireBatch: (wires) => {
      const seen = new Set(engine.getState().wires.map((w) => [w.a, w.b].sort().join('|')));
      const added: WBWire[] = [];
      let skipped = 0;
      (wires || []).forEach((w) => {
        if (!w || !w.a || !w.b) { skipped++; return; }
        const k = [w.a, w.b].sort().join('|');
        if (seen.has(k)) { skipped++; return; }
        const wire = engine.connectWire(w.a, w.b, w.color || '#f59e0b');
        if (wire) { seen.add(k); added.push(wire); }
        else skipped++;
      });
      if (added.length) notify('ai-wire-batch', { added: added.length, skipped });
      return { added, skipped };
    },
    loadState: (state) => {
      engine.setState(state);
      notify('load-state');
    },
    subscribe: (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
  };

  // Inbound AI events → engine API (works for ANY engine, present or future).
  window.addEventListener(AI_ADD_PART_EVENT, (e: Event) => {
    const type = (e as CustomEvent).detail?.type;
    if (!type) return;
    bridge.addPart(type);
  });
  window.addEventListener(AI_WIRE_BATCH_EVENT, (e: Event) => {
    bridge.applyWireBatch((e as CustomEvent).detail?.wires || []);
  });

  (window as unknown as Record<string, unknown>).__wattounaWB = bridge;
  return bridge;
}
