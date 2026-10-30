/**
 * Wattouna 3D Cyber-Physical Twin & X-Ray Semiconductor Physics Engine
 * Zero-dependency WebGL/Canvas3D interactive laboratory.
 * Syncs with window.__wattounaWB (wireona-bridge) and provides:
 *  - Mode 1: 3D Interactive Breadboard & Volumetric Spline Wires
 *  - Mode 2: MOSFET Atomic X-Ray (Gate Oxide, Silicon Channel, 0V / 3.3V / 10V)
 *  - Mode 3: BJT NPN Atomic X-Ray (Collector/Base/Emitter, Depletion Region, Holes/Electrons)
 *  - Mode 4: 3D Electromagnetic Flux & Steam Turbine AC Generator
 */

export type LabViewMode = 'breadboard3d' | 'xray-mosfet' | 'xray-bjt' | 'em-generator';

export interface Lab3DState {
  mode: LabViewMode;
  gateVoltage: number;       // 0.0 to 10.0V
  logicLevelMosfet: boolean; // IRF540N vs Logic-Level IRLZ44N
  bjtBaseVoltage: number;    // 0.0 to 3.3V
  magnetSpeed: number;       // RPM / oscillation speed
  turbineActive: boolean;
  yaw: number;
  pitch: number;
  zoom: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  charge: 'e' | 'h';
}

export class Wattouna3DLab {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: Lab3DState;
  private particles: Particle[] = [];
  private animId: number = 0;
  private time: number = 0;
  private isDragging: boolean = false;
  private lastMouse = { x: 0, y: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      mode: 'breadboard3d',
      gateVoltage: 10.0,
      logicLevelMosfet: false,
      bjtBaseVoltage: 3.3,
      magnetSpeed: 1.5,
      turbineActive: true,
      yaw: -0.45,
      pitch: 0.55,
      zoom: 1.0,
    };

    this.initParticles();
    this.container.innerHTML = '';
    this.buildUI();

    this.canvas = this.container.querySelector('#w3d-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.bindEvents();
    this.resize();
    this.loop();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.004,
        vy: (Math.random() - 0.5) * 0.004,
        charge: i < 48 ? 'e' : 'h',
      });
    }
  }

  private buildUI(): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative; width: 100%; height: 560px; background: radial-gradient(circle at 50% 25%, #0f172a 0%, #020617 100%);
      border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 14px; overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif; color: #f8fafc; box-shadow: 0 20px 50px rgba(0,0,0,0.65);
    `;

    wrapper.innerHTML = `
      <!-- Top Mode Bar -->
      <div style="position:absolute; top:12px; left:12px; right:12px; display:flex; flex-wrap:wrap; gap:8px; justify-content:space-between; align-items:center; z-index:10; pointer-events:auto;">
        <div style="display:flex; gap:6px; flex-wrap:wrap; background:rgba(2,6,23,0.85); padding:6px; border-radius:10px; border:1px solid rgba(148,163,184,0.2); backdrop-filter:blur(8px);">
          <button data-mode="breadboard3d" class="w3d-tab active" style="padding:7px 13px; border-radius:7px; border:none; cursor:pointer; font-weight:700; font-size:12px; background:#f59e0b; color:#020617;">🧊 3D Breadboard Lab</button>
          <button data-mode="xray-mosfet" class="w3d-tab" style="padding:7px 13px; border-radius:7px; border:none; cursor:pointer; font-weight:700; font-size:12px; background:transparent; color:#e2e8f0;">🔬 X-Ray: MOSFET</button>
          <button data-mode="xray-bjt" class="w3d-tab" style="padding:7px 13px; border-radius:7px; border:none; cursor:pointer; font-weight:700; font-size:12px; background:transparent; color:#e2e8f0;">⚛️ X-Ray: BJT Transistor</button>
          <button data-mode="em-generator" class="w3d-tab" style="padding:7px 13px; border-radius:7px; border:none; cursor:pointer; font-weight:700; font-size:12px; background:transparent; color:#e2e8f0;">⚡ 3D Turbine & Flux</button>
        </div>

        <!-- Bench Power Supply Readout -->
        <div id="w3d-psu" style="background:#090d16; border:2px solid #334155; border-radius:8px; padding:6px 14px; font-family:monospace; display:flex; gap:14px; align-items:center; box-shadow:inset 0 0 12px rgba(6,182,212,0.25);">
          <div>
            <div style="font-size:9px; color:#94a3b8;">BENCH SUPPLY</div>
            <div id="w3d-psu-v" style="font-size:16px; font-weight:800; color:#22d3ee; text-shadow:0 0 8px #06b6d4;">12.00 V</div>
          </div>
          <div style="border-left:1px solid #1e293b; padding-left:12px;">
            <div style="font-size:9px; color:#94a3b8;">CURRENT</div>
            <div id="w3d-psu-a" style="font-size:16px; font-weight:800; color:#f59e0b; text-shadow:0 0 8px #f59e0b;">0.150 A</div>
          </div>
        </div>
      </div>

      <!-- Interactive Parameter Controls -->
      <div id="w3d-controls" style="position:absolute; bottom:14px; left:14px; right:14px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; background:rgba(2,6,23,0.88); padding:10px 16px; border-radius:10px; border:1px solid rgba(148,163,184,0.2); z-index:10; backdrop-filter:blur(8px);">
        <div id="w3d-ctrl-inner" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; font-size:13px;"></div>
        <div id="w3d-caption" style="font-size:12px; color:#38bdf8; font-weight:600;">اسحب لتدوير المشهد 360° • عجلة الماوس للتكبير</div>
      </div>

      <canvas id="w3d-canvas" style="width:100%; height:100%; display:block; cursor:grab;"></canvas>
    `;

    this.container.appendChild(wrapper);
    this.renderModeControls();
  }

  private renderModeControls(): void {
    const ctrl = this.container.querySelector('#w3d-ctrl-inner') as HTMLElement;
    const caption = this.container.querySelector('#w3d-caption') as HTMLElement;
    if (!ctrl) return;

    if (this.state.mode === 'breadboard3d') {
      ctrl.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px;">
          <span>Gate / Control Pin:</span>
          <input id="w3d-gate-slider" type="range" min="0" max="10" step="0.1" value="${this.state.gateVoltage}" style="accent-color:#f59e0b;">
          <strong id="w3d-gate-val" style="color:#f59e0b;">${this.state.gateVoltage.toFixed(1)} V</strong>
        </label>
        <button id="w3d-reset-cam" style="padding:5px 10px; border-radius:6px; border:1px solid #475569; background:#1e293b; color:#fff; cursor:pointer; font-size:12px;">إعادة ضبط الكاميرا</button>
      `;
      caption.textContent = 'محاكاة 3D حية للوحة التجارب مع تدفق الإلكترونات داخل الأسلاك';
    } else if (this.state.mode === 'xray-mosfet') {
      ctrl.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px;">
          <span>Gate Voltage ($V_{GS}$):</span>
          <input id="w3d-gate-slider" type="range" min="0" max="10" step="0.1" value="${this.state.gateVoltage}" style="accent-color:#22d3ee;">
          <strong id="w3d-gate-val" style="color:#22d3ee;">${this.state.gateVoltage.toFixed(1)} V</strong>
        </label>
        <button id="w3d-preset-0" style="padding:4px 8px; border-radius:5px; border:1px solid #475569; background:#0f172a; color:#cbd5e1; cursor:pointer; font-size:11px;">0V (Off)</button>
        <button id="w3d-preset-33" style="padding:4px 8px; border-radius:5px; border:1px solid #475569; background:#0f172a; color:#cbd5e1; cursor:pointer; font-size:11px;">3.3V (ESP32 Pin)</button>
        <button id="w3d-preset-10" style="padding:4px 8px; border-radius:5px; border:1px solid #475569; background:#0f172a; color:#cbd5e1; cursor:pointer; font-size:11px;">10.0V (Full On)</button>
        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
          <input id="w3d-logic-toggle" type="checkbox" ${this.state.logicLevelMosfet ? 'checked' : ''}>
          <span style="color:#fde047;">Logic-Level MOSFET (3.3V Full)</span>
        </label>
      `;
      caption.textContent = 'المجهر الذري: طبقة الزجاج العازلة تمنع مرور تيار البوابة وتجذب الإلكترونات لتكوين قناة توصيل';
    } else if (this.state.mode === 'xray-bjt') {
      ctrl.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px;">
          <span>Base-Emitter ($V_{BE}$):</span>
          <input id="w3d-bjt-slider" type="range" min="0" max="3.3" step="0.1" value="${this.state.bjtBaseVoltage}" style="accent-color:#f97316;">
          <strong id="w3d-bjt-val" style="color:#f97316;">${this.state.bjtBaseVoltage.toFixed(1)} V</strong>
        </label>
        <span style="color:#94a3b8; font-size:12px;">Base: 15mA ➔ Collector Load: 150mA (12V LED Strip)</span>
      `;
      caption.textContent = 'طبقات السيليكون المطعمة (N-P-N): الجهد على القاعدة يقلص منطقة الاستنزاف (Depletion Region)';
    } else if (this.state.mode === 'em-generator') {
      ctrl.innerHTML = `
        <label style="display:flex; align-items:center; gap:8px;">
          <span>سرعة التوربين البخاري:</span>
          <input id="w3d-rpm-slider" type="range" min="0" max="4" step="0.1" value="${this.state.magnetSpeed}" style="accent-color:#eab308;">
        </label>
        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
          <input id="w3d-turbine-toggle" type="checkbox" ${this.state.turbineActive ? 'checked' : ''}>
          <span style="color:#38bdf8;">تفعيل التوربين البخاري الدوار (Steam Turbine AC)</span>
        </label>
      `;
      caption.textContent = 'تغير التدفق المغناطيسي (Magnetic Flux) عبر الوشيعة النحاسية يدفع الإلكترونات ويولد تياراً متناوباً';
    }

    this.bindDynamicControls();
  }

  private bindDynamicControls(): void {
    const gateSlider = this.container.querySelector('#w3d-gate-slider') as HTMLInputElement | null;
    const gateVal = this.container.querySelector('#w3d-gate-val') as HTMLElement | null;
    if (gateSlider) {
      gateSlider.oninput = () => {
        this.state.gateVoltage = parseFloat(gateSlider.value);
        if (gateVal) gateVal.textContent = `${this.state.gateVoltage.toFixed(1)} V`;
      };
    }

    const setGate = (v: number) => {
      this.state.gateVoltage = v;
      this.renderModeControls();
    };
    this.container.querySelector('#w3d-preset-0')?.addEventListener('click', () => setGate(0));
    this.container.querySelector('#w3d-preset-33')?.addEventListener('click', () => setGate(3.3));
    this.container.querySelector('#w3d-preset-10')?.addEventListener('click', () => setGate(10.0));

    const logicToggle = this.container.querySelector('#w3d-logic-toggle') as HTMLInputElement | null;
    if (logicToggle) {
      logicToggle.onchange = () => {
        this.state.logicLevelMosfet = logicToggle.checked;
      };
    }

    const bjtSlider = this.container.querySelector('#w3d-bjt-slider') as HTMLInputElement | null;
    const bjtVal = this.container.querySelector('#w3d-bjt-val') as HTMLElement | null;
    if (bjtSlider) {
      bjtSlider.oninput = () => {
        this.state.bjtBaseVoltage = parseFloat(bjtSlider.value);
        if (bjtVal) bjtVal.textContent = `${this.state.bjtBaseVoltage.toFixed(1)} V`;
      };
    }

    const rpmSlider = this.container.querySelector('#w3d-rpm-slider') as HTMLInputElement | null;
    if (rpmSlider) {
      rpmSlider.oninput = () => {
        this.state.magnetSpeed = parseFloat(rpmSlider.value);
      };
    }

    const turbineToggle = this.container.querySelector('#w3d-turbine-toggle') as HTMLInputElement | null;
    if (turbineToggle) {
      turbineToggle.onchange = () => {
        this.state.turbineActive = turbineToggle.checked;
      };
    }

    this.container.querySelector('#w3d-reset-cam')?.addEventListener('click', () => {
      this.state.yaw = -0.45;
      this.state.pitch = 0.55;
      this.state.zoom = 1.0;
    });
  }

  private bindEvents(): void {
    const tabs = this.container.querySelectorAll('.w3d-tab');
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabs.forEach((b) => {
          (b as HTMLElement).style.background = 'transparent';
          (b as HTMLElement).style.color = '#e2e8f0';
        });
        (btn as HTMLElement).style.background = '#f59e0b';
        (btn as HTMLElement).style.color = '#020617';
        this.state.mode = (btn.getAttribute('data-mode') as LabViewMode) || 'breadboard3d';
        this.renderModeControls();
      });
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouse.x;
      const dy = e.clientY - this.lastMouse.y;
      this.lastMouse = { x: e.clientX, y: e.clientY };
      this.state.yaw += dx * 0.007;
      this.state.pitch = Math.max(0.15, Math.min(1.35, this.state.pitch + dy * 0.007));
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.state.zoom = Math.max(0.6, Math.min(2.2, this.state.zoom - e.deltaY * 0.001));
    }, { passive: false });

    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = Math.max(640, rect.width);
    this.canvas.height = 560;
  }

  private project3D(x: number, y: number, z: number): { sx: number; sy: number; scale: number } {
    const cosY = Math.cos(this.state.yaw);
    const sinY = Math.sin(this.state.yaw);
    const cosP = Math.cos(this.state.pitch);
    const sinP = Math.sin(this.state.pitch);

    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    const fov = 520 * this.state.zoom;
    const dist = 620 + z2;
    const scale = fov / Math.max(120, dist);
    return {
      sx: this.canvas.width * 0.5 + x1 * scale,
      sy: this.canvas.height * 0.54 - y2 * scale,
      scale,
    };
  }

  private updatePSU(volts: number, amps: number): void {
    const vEl = this.container.querySelector('#w3d-psu-v');
    const aEl = this.container.querySelector('#w3d-psu-a');
    if (vEl) vEl.textContent = `${volts.toFixed(2)} V`;
    if (aEl) aEl.textContent = `${amps.toFixed(3)} A`;
  }

  private draw3DBreadboardScene(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Lab Mat Grid
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
    ctx.lineWidth = 1;
    for (let gx = -320; gx <= 320; gx += 40) {
      const p1 = this.project3D(gx, -20, -220);
      const p2 = this.project3D(gx, -20, 220);
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
    }
    for (let gz = -220; gz <= 220; gz += 40) {
      const p1 = this.project3D(-320, -20, gz);
      const p2 = this.project3D(320, -20, gz);
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
    }

    // 3D Breadboard Slab
    const bbCorners = [
      this.project3D(-190, 0, -90),
      this.project3D(190, 0, -90),
      this.project3D(190, 0, 90),
      this.project3D(-190, 0, 90),
    ];
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bbCorners[0].sx, bbCorners[0].sy);
    bbCorners.forEach((p) => ctx.lineTo(p.sx, p.sy));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Breadboard Power Rails & Pinholes
    for (let bx = -165; bx <= 165; bx += 15) {
      for (let bz = -65; bz <= 65; bz += 22) {
        if (Math.abs(bz) < 10) continue;
        const pt = this.project3D(bx, 1, bz);
        ctx.fillStyle = '#334155';
        ctx.fillRect(pt.sx - 2, pt.sy - 2, 4, 4);
      }
    }

    // ESP32 3D Module on Left
    const espCenter = this.project3D(-145, 22, 0);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(espCenter.sx - 48, espCenter.sy - 28, 96, 56);
    ctx.strokeRect(espCenter.sx - 48, espCenter.sy - 28, 96, 56);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(espCenter.sx - 32, espCenter.sy - 18, 48, 36);
    ctx.fillStyle = '#020617';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('ESP32-WROOM', espCenter.sx - 29, espCenter.sy + 3);

    // MOSFET 3D Package (TO-220) in Center
    const mosfetPos = this.project3D(15, 38, -10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(mosfetPos.sx - 26, mosfetPos.sy - 48, 52, 20); // Heatsink tab
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.fillRect(mosfetPos.sx - 26, mosfetPos.sy - 28, 52, 42);
    ctx.strokeRect(mosfetPos.sx - 26, mosfetPos.sy - 28, 52, 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(this.state.logicLevelMosfet ? 'IRLZ44N' : 'IRF540N', mosfetPos.sx - 21, mosfetPos.sy - 8);
    ctx.font = '9px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('G   D   S', mosfetPos.sx - 20, mosfetPos.sy + 10);

    // Glowing Load Lamp / LED Strip on Right
    const threshold = this.state.logicLevelMosfet ? 2.0 : 3.0;
    const fullV = this.state.logicLevelMosfet ? 3.3 : 10.0;
    const conduction = Math.max(0, Math.min(1, (this.state.gateVoltage - threshold) / (fullV - threshold)));
    this.updatePSU(12.0, conduction * 0.15);

    const lampPos = this.project3D(155, 42, -15);
    if (conduction > 0.05) {
      const grad = ctx.createRadialGradient(lampPos.sx, lampPos.sy, 4, lampPos.sx, lampPos.sy, 65 * conduction);
      grad.addColorStop(0, `rgba(254, 240, 138, ${0.95 * conduction})`);
      grad.addColorStop(0.5, `rgba(245, 158, 11, ${0.45 * conduction})`);
      grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lampPos.sx, lampPos.sy, 65 * conduction, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = conduction > 0.1 ? '#fef08a' : '#475569';
    ctx.beginPath();
    ctx.arc(lampPos.sx, lampPos.sy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    // 3D Volumetric Wires with Flowing Electron Particles
    this.draw3DWire([-100, 18, 12], [-5, 14, -10], '#eab308', this.state.gateVoltage > 0.1 ? 0.4 : 0);
    this.draw3DWire([15, 14, -10], [155, 22, -15], '#ef4444', conduction);
    this.draw3DWire([32, 14, -10], [155, 10, 45], '#38bdf8', conduction);

    // Floating Telemetry Callout
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    ctx.fillRect(mosfetPos.sx - 68, mosfetPos.sy - 82, 74, 24);
    ctx.strokeRect(mosfetPos.sx - 68, mosfetPos.sy - 82, 74, 24);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${this.state.gateVoltage.toFixed(1)} V`, mosfetPos.sx - 54, mosfetPos.sy - 66);
  }

  private draw3DWire(
    start: [number, number, number],
    end: [number, number, number],
    color: string,
    flowIntensity: number
  ): void {
    const ctx = this.ctx;
    const mid: [number, number, number] = [
      (start[0] + end[0]) * 0.5,
      Math.max(start[1], end[1]) + 42,
      (start[2] + end[2]) * 0.5,
    ];
    const p0 = this.project3D(...start);
    const p1 = this.project3D(...mid);
    const p2 = this.project3D(...end);

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.quadraticCurveTo(p1.sx, p1.sy, p2.sx, p2.sy);
    ctx.stroke();

    if (flowIntensity > 0.02) {
      const count = 8;
      for (let i = 0; i < count; i++) {
        const t = ((this.time * 0.8 * flowIntensity + i / count) % 1);
        const inv = 1 - t;
        const x = inv * inv * p0.sx + 2 * inv * t * p1.sx + t * t * p2.sx;
        const y = inv * inv * p0.sy + 2 * inv * t * p1.sy + t * t * p2.sy;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawXRayMosfet(): void {
    const ctx = this.ctx;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.5;

    const v = this.state.gateVoltage;
    const fullV = this.state.logicLevelMosfet ? 3.3 : 10.0;
    const channelRatio = Math.max(0, Math.min(1, (v - 1.5) / (fullV - 1.5)));
    this.updatePSU(12.0, channelRatio * 0.25);

    // Outer TO-220 X-Ray Outline
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 170, cy - 170, 340, 270);
    ctx.strokeRect(cx - 170, cy - 220, 340, 50);

    // Silicon P-Substrate Body
    ctx.fillStyle = '#090d16';
    ctx.fillRect(cx - 125, cy - 95, 250, 145);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(cx - 125, cy - 95, 250, 145);

    // N+ Source & Drain Wells
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 115, cy - 95, 65, 50);
    ctx.fillRect(cx + 50, cy - 95, 65, 50);

    // Thin Glass Insulator (SiO2)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(cx - 55, cy - 112, 110, 17);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(cx - 55, cy - 112, 110, 17);
    ctx.fillStyle = '#bae6fd';
    ctx.font = '11px monospace';
    ctx.fillText('SiO₂ Glass Insulator', cx - 54, cy - 100);

    // Metal Gate Plate
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 55, cy - 124, 110, 10);

    // Conductive Inversion Channel under Glass
    if (channelRatio > 0) {
      const chHeight = 6 + channelRatio * 22;
      const grad = ctx.createLinearGradient(cx - 50, cy - 95, cx + 50, cy - 95);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.85)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - 50, cy - 95, 100, chHeight);
    }

    // Positive Holes (pushed down by Gate electric field) & Free Electrons (pulled up)
    this.particles.forEach((p, idx) => {
      if (p.charge === 'h') {
        const pushDown = channelRatio * 0.35;
        const px = cx - 105 + p.x * 210;
        const py = cy - 40 + Math.min(0.85, p.y + pushDown) * 75;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Electrons flowing from Source to Drain when channel forms
        if (channelRatio > 0.05) {
          p.x = (p.x + 0.008 * channelRatio) % 1;
        }
        const px = cx - 100 + p.x * 200;
        const py = channelRatio > 0.05
          ? cy - 90 + (idx % 3) * (6 * channelRatio)
          : cy - 85 + (idx % 5) * 6;
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Three Pins: G, D, S
    const pins = [
      { label: 'G', x: cx - 95 },
      { label: 'D', x: cx },
      { label: 'S', x: cx + 95 },
    ];
    pins.forEach((pin) => {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(pin.x - 14, cy + 100, 28, 95);
      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#cbd5e1';
      ctx.fillRect(pin.x - 18, cy + 75, 36, 32);
      ctx.strokeRect(pin.x - 18, cy + 75, 36, 32);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(pin.label, pin.x - 6, cy + 97);
    });

    // Voltage Callout Box
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 150, cy - 160, 88, 34);
    ctx.strokeRect(cx - 150, cy - 160, 88, 34);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${v.toFixed(1)} V`, cx - 135, cy - 137);
  }

  private drawXRayBJT(): void {
    const ctx = this.ctx;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.48;

    const vbe = this.state.bjtBaseVoltage;
    const active = Math.max(0, Math.min(1, (vbe - 0.65) / 2.65));
    this.updatePSU(12.0, active * 0.15);

    // Three Doped Silicon Regions: Collector (N), Base (P), Emitter (N)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 210, cy - 130, 140, 220); // Collector
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(cx - 70, cy - 130, 90, 220);   // Thin Base
    ctx.fillStyle = '#0f3f5c';
    ctx.fillRect(cx + 20, cy - 130, 150, 220);  // Emitter

    // Depletion Region Barrier (shrinks as V_BE increases)
    const barrierWidth = 34 * (1 - active * 0.82);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(cx + 20 - barrierWidth * 0.5, cy - 130, barrierWidth, 220);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx + 20 - barrierWidth * 0.5, cy - 130, barrierWidth, 220);

    // Labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('COLLECTOR (N)', cx - 190, cy - 142);
    ctx.fillText('BASE (P)', cx - 58, cy - 142);
    ctx.fillText('EMITTER (N)', cx + 48, cy - 142);

    // Holes in Base (Orange Rings)
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx - 42 + c * 34, cy - 95 + r * 34, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Free Electrons flowing from Emitter across thin Base into Collector
    this.particles.forEach((p) => {
      if (active > 0.05) {
        p.x = (p.x - 0.011 * active + 1) % 1;
      }
      const px = cx - 195 + p.x * 350;
      const py = cy - 115 + p.y * 190;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawEMGenerator(): void {
    const ctx = this.ctx;
    const cx = this.canvas.width * 0.5;
    const cy = this.canvas.height * 0.52;

    const speed = this.state.magnetSpeed;
    const phase = this.time * speed * 2.5;
    const acVal = Math.sin(phase);
    const power = Math.abs(acVal) * (speed / 2.5);
    this.updatePSU(Math.abs(acVal) * 12.0, power * 0.35);

    // Magnetic Field Flux Ellipses (Yellow)
    const magnetOffsetX = this.state.turbineActive ? Math.cos(phase) * 28 : Math.sin(phase) * 90;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = 1.5;
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath();
      ctx.ellipse(cx + magnetOffsetX, cy, 70 + r * 28, 35 + r * 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // N / S Magnet Bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx + magnetOffsetX - 85, cy - 26, 85, 52);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(cx + magnetOffsetX, cy - 26, 85, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('N', cx + magnetOffsetX - 52, cy + 7);
    ctx.fillText('S', cx + magnetOffsetX + 36, cy + 7);

    // Copper Coil Windings
    for (let i = -3; i <= 3; i++) {
      const wx = cx + i * 22;
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(wx, cy, 14, 64, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Electron Flow Arrows on Coil
      if (speed > 0.1) {
        ctx.fillStyle = '#4ade80';
        const ey = cy + Math.sin(phase + i) * 45;
        ctx.beginPath();
        ctx.arc(wx + 12, ey, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Connected Light Bulb above Coil
    const bulbY = cy - 135;
    if (power > 0.05) {
      const grad = ctx.createRadialGradient(cx, bulbY, 5, cx, bulbY, 75 * power);
      grad.addColorStop(0, `rgba(254, 240, 138, ${Math.min(1, power)})`);
      grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, bulbY, 75 * power, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = power > 0.1 ? '#fef08a' : '#475569';
    ctx.beginPath();
    ctx.arc(cx, bulbY, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  private loop(): void {
    this.time += 0.016;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state.mode === 'breadboard3d') {
      this.draw3DBreadboardScene();
    } else if (this.state.mode === 'xray-mosfet') {
      this.drawXRayMosfet();
    } else if (this.state.mode === 'xray-bjt') {
      this.drawXRayBJT();
    } else {
      this.drawEMGenerator();
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }
}

export function mountWattouna3DLab(selector = '#wattouna-3d-lab-root'): Wattouna3DLab | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  return new Wattouna3DLab(el);
}

if (typeof window !== 'undefined') {
  (window as any).Wattouna3DLab = Wattouna3DLab;
  (window as any).mountWattouna3DLab = mountWattouna3DLab;
}
