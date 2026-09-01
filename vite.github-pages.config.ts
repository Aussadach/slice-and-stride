import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const githubPagesBase = "/slice-and-stride/";

/**
 * Static-only build for GitHub Pages.
 *
 * This deliberately does not use the Lovable config wrapper because that
 * wrapper adds Nitro. TanStack's SPA prerender step needs its Vite server
 * bundle before Nitro has produced one, which causes dist/server/server.js to
 * be missing in CI. The normal Lovable build continues to use vite.config.ts.
 */
export default defineConfig({
  base: githubPagesBase,
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
        maskPath: githubPagesBase,
        prerender: { outputPath: "/index.html" },
      },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
  ],
});
