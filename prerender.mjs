// prerender.mjs
// Runs after `vite build`. Builds an SSR bundle, renders the app to HTML,
// and injects it into dist/index.html so crawlers see real content.

import { build } from "vite";
import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
  console.log("[prerender] Building SSR bundle...");

  // Build the server-side entry
  await build({
    build: {
      ssr: true,
      rollupOptions: {
        input: "./src/entry-server.tsx",
        output: { format: "esm" },
      },
      outDir: "dist/server",
      emptyOutDir: true,
    },
    // Suppress output noise
    logLevel: "warn",
  });

  console.log("[prerender] Rendering app to string...");

  // Dynamically import the built SSR module
  const serverEntryPath = path.resolve(__dirname, "dist/server/entry-server.js");
  const { render } = await import(serverEntryPath);

  // Render the app
  const appHtml = render();

  // Read the client-side index.html
  const template = readFileSync(path.resolve(__dirname, "dist/index.html"), "utf-8");

  // Inject rendered HTML into the root div
  const html = template.replace(
    `<div id="root"></div>`,
    `<div id="root">${appHtml}</div>`
  );

  // Write back
  writeFileSync(path.resolve(__dirname, "dist/index.html"), html);

  console.log("[prerender] ✅ dist/index.html prerendered successfully");
}

prerender().catch((err) => {
  console.error("[prerender] ❌ Failed:", err);
  process.exit(1);
});
