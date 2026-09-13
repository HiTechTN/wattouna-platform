function sniffDevice() {
  const nav = navigator;
  const cores = nav.hardwareConcurrency || 2;
  const memGB = nav.deviceMemory ?? null;
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  let gpu = "unknown";
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    const ext = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;
    if (gl && ext) {
      gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || gpu);
    }
  } catch {
  }
  const g = gpu.toLowerCase();
  const weakGPU = /mali-[34]|mali-t|adreno [34]|powervr|swiftshader|llvmpipe|basic render|angle \(google/i.test(g);
  const strongGPU = /apple|adreno [678]|mali-g[67]|mali-g7|nvidia|radeon|geforce|arc |rdna/i.test(g);
  let score = 0;
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;
  if (memGB !== null) {
    if (memGB >= 8) score += 2;
    else if (memGB >= 4) score += 1;
  }
  if (strongGPU) score += 2;
  if (weakGPU) score -= 3;
  if (mobile) score -= 1;
  return { tier: score >= 3 ? "high" : "eco", cores, memGB, gpu, mobile };
}
export {
  sniffDevice
};
