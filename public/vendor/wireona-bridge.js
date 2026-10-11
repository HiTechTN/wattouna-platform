const AI_WIRE_BATCH_EVENT = "wattouna:ai-wire-batch";
const AI_ADD_PART_EVENT = "wattouna:ai-add-part";
const SYNC_EVENT = "wattouna:canvas-sync";
const clone = (v) => JSON.parse(JSON.stringify(v));
function installWireonaBridge(engine) {
  const subs = /* @__PURE__ */ new Set();
  const notify = (source, extra) => {
    const live = engine.getState();
    try {
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { state: live, engine: engine.id, source, ...extra } }));
    } catch {
    }
    subs.forEach((cb) => {
      try {
        cb(live);
      } catch {
      }
    });
  };
  const bridge = {
    get engineId() {
      return engine.id;
    },
    get canvas_state() {
      return engine.getState();
    },
    // live getter — no stale copy
    getState: () => clone(engine.getState()),
    snapshot: () => engine.snapshot(),
    addPart: (type, x, y) => {
      const id = engine.addPart(type, x, y);
      if (id) notify("ai-add-part", { type });
      return id;
    },
    applyWireBatch: (wires) => {
      const seen = new Set(engine.getState().wires.map((w) => [w.a, w.b].sort().join("|")));
      const added = [];
      let skipped = 0;
      (wires || []).forEach((w) => {
        if (!w || !w.a || !w.b) {
          skipped++;
          return;
        }
        const k = [w.a, w.b].sort().join("|");
        if (seen.has(k)) {
          skipped++;
          return;
        }
        const wire = engine.connectWire(w.a, w.b, w.color || "#f59e0b");
        if (wire) {
          seen.add(k);
          added.push(wire);
        } else skipped++;
      });
      if (added.length) notify("ai-wire-batch", { added: added.length, skipped });
      return { added, skipped };
    },
    loadState: (state) => {
      engine.setState(state);
      notify("load-state");
    },
    subscribe: (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    }
  };
  window.addEventListener(AI_ADD_PART_EVENT, (e) => {
    const type = e.detail?.type;
    if (!type) return;
    bridge.addPart(type);
  });
  window.addEventListener(AI_WIRE_BATCH_EVENT, (e) => {
    bridge.applyWireBatch(e.detail?.wires || []);
  });
  window.__wattounaWB = bridge;
  return bridge;
}
export {
  AI_ADD_PART_EVENT,
  AI_WIRE_BATCH_EVENT,
  SYNC_EVENT,
  installWireonaBridge
};
