// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

import fs from 'fs';

export default defineConfig({
  vite: {
    server: {
      allowedHosts: "all",
      port: process.env.PORT || 5173,
      host: "0.0.0.0",
      https: (() => {
          const certPath = 'C:\\navishare\\DCFiles\\Certs\\NVLabs-Wildcard.pfx';
          if (fs.existsSync(certPath)) {
            return {
              pfx: fs.readFileSync(certPath),
              passphrase: 'Naveen@1734'
            };
          }
          return false;
        })(),
      proxy: {
        '/api': {
          target: 'https://localhost:5011',
          ws: true,
          secure: false
        },
        '/hub': {
          target: 'https://localhost:5011',
          ws: true,
          secure: false
        }
      }
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
