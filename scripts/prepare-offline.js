// Changing the generated worker with each build triggers its update lifecycle.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const buildRoot = path.resolve(__dirname, "../build");
const manifest = fs.readFileSync(
  path.join(buildRoot, "asset-manifest.json"),
  "utf8",
);
const revision =
  "v3-" +
  crypto.createHash("sha256").update(manifest).digest("hex").slice(0, 16);
const source = fs.readFileSync(
  path.resolve(__dirname, "../public/serviceWorker.js"),
  "utf8",
);
if (!source.includes("__BUILD_REVISION__"))
  throw new Error("Missing offline build revision marker.");
fs.writeFileSync(
  path.join(buildRoot, "serviceWorker.js"),
  source.replace("__BUILD_REVISION__", revision),
);
console.log(`Offline build prepared: ${revision}`);
