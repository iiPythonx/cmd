import { defineConfig } from "vite";
import pkg from './package.json' with { type: "json" }

export default defineConfig({
    root: ".",
    base: "./",
    build: {
        outDir: "dist",
        assetsDir: "assets",
    },
    define: {
        __VERSION__: `"${pkg.version}"`
    },
});
