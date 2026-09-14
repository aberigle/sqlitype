import { build } from 'bun'

await build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist/",
  format: "esm",
  minify: false,
  target: "node",
  external: [
    "@sinclair/typebox",
    "@libsql/client",
    "bun:sqlite",
    "bun:test"
  ]
})