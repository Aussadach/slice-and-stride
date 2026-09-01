// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBase = "/slice-and-stride/";

export default defineConfig({
  vite: {
    // GitHub project pages are served below /<repository>/, while Lovable is
    // served from the domain root. Keep the two builds independent.
    base: isGitHubPages ? githubPagesBase : "/",
  },
  tanstackStart: {
    ...(isGitHubPages
      ? {
          // GitHub Pages has no server runtime. Generate a client-only shell
          // directly as index.html so it can be uploaded as a static artifact.
          spa: {
            enabled: true,
            maskPath: githubPagesBase,
            prerender: { outputPath: "/index.html" },
          },
        }
      : {}),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
