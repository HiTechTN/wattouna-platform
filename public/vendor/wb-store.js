/* Wattouna local fallback store (used when Supabase cloud is not configured).
   Plain ESM, no dependencies — imported by workbench/profile/community. */
const LS_PROJECTS = 'wattouna-local-projects-v1';

export function localListProjects() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROJECTS) || '[]');
  } catch (e) {
    return [];
  }
}

export function localSaveProject(p) {
  const all = localListProjects();
  const i = all.findIndex((x) => x.id === p.id);
  if (i > -1) all[i] = p;
  else all.unshift(p);
  try {
    localStorage.setItem(LS_PROJECTS, JSON.stringify(all));
  } catch (e) { /* private mode — ignore */ }
}

export function localGetProject(id) {
  return localListProjects().find((x) => x.id === id) || null;
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxx-xxxx-4xxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16),
  ) + Date.now().toString(16);
}
