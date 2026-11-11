import { defineConfig, mergeConfig } from 'vite'
import original from './vite.config.js'

// Preview-only wrapper: loads the original vite config and injects the local worker URL
// so the frontend talks to the local Cloudflare Worker instead of the production one.
// Only active when BASE44_PREVIEW_MODE === '1'.

const WORKER_URL = process.env.VITE_WORKER_URL || '';

export default defineConfig((env) => {
  const base = typeof original === 'function' ? original(env) : original;

  if (process.env.BASE44_PREVIEW_MODE !== '1' || !WORKER_URL) {
    return base;
  }

  return mergeConfig(base, {
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
    },
    plugins: [
      {
        name: 'homa-preview-worker-url',
        enforce: 'pre',
        transformIndexHtml(html) {
          const script = `<script>window.localStorage.setItem('homa_worker_url', ${JSON.stringify(WORKER_URL)});</script>`;
          // Inject right before the closing </body> so it runs after other scripts
          return html.replace('</body>', `${script}\n</body>`);
        },
      },
    ],
  });
});
