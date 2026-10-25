import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "pages",
  base: "/Standpunktprotokoll/",
  publicDir: "../public",
  plugins: [react()],
  define: { __APP_BASE__: JSON.stringify("/Standpunktprotokoll/") },
  build: { outDir: "../dist-pages", emptyOutDir: true },
});
