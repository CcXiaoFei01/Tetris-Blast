import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");
const configPath = join(root, "minigame.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const outputDir = resolve(root, config.build?.outputDir || "dist");

const fileWhitelist = [
  "index.html",
  "styles.css",
  "script.js",
  "runtime-config.js",
  "platform-runtime.js",
];

const directoryWhitelist = ["assets", "audio", "fonts", "images"];

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const relativePath of fileWhitelist) {
  const sourcePath = join(root, relativePath);
  if (!existsSync(sourcePath)) {
    continue;
  }
  cpSync(sourcePath, join(outputDir, relativePath));
}

for (const relativePath of directoryWhitelist) {
  const sourcePath = join(root, relativePath);
  if (!existsSync(sourcePath) || !statSync(sourcePath).isDirectory()) {
    continue;
  }
  cpSync(sourcePath, join(outputDir, relativePath), { recursive: true });
}

writeFileSync(join(outputDir, "minigame.config.json"), `${JSON.stringify(config, null, 2)}\n`, "utf8");

const manifest = {
  name: "minigame.manifest.json",
  resource_list: buildManifestTree(outputDir),
};

writeFileSync(join(outputDir, "minigame.manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Mini game package generated at ${outputDir}`);

function buildManifestTree(folderPath) {
  return readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.name !== "minigame.manifest.json")
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .map((entry) => {
      if (entry.isDirectory()) {
        return {
          type: "folder",
          name: entry.name,
          children: buildManifestTree(join(folderPath, entry.name)),
        };
      }
      return {
        type: "file",
        name: entry.name,
      };
    });
}
