import { defineConfig } from 'astro/config';

// Wattouna — Static Site Generation (SSG), RTL Arabic-first
export default defineConfig({
  output: 'static',
  server: {
    port: 4321,
    host: true
  },
  preview: {
    port: 4321,
    host: true
  },
  vite: {
    server: {
      host: true,
      port: 4321,
      allowedHosts: ['pop-os']
    }
  }
});
