import { mkdtemp, cp, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { packager } from "@electron/packager";
import { build, Platform, Arch } from "electron-builder";
const { version } = JSON.parse(await readFile("package.json", "utf8"));

const stage = await mkdtemp(path.join(os.tmpdir(), "notas-no-bolso-"));
await cp("dist", path.join(stage, "dist"), { recursive: true });
await cp("electron", path.join(stage, "electron"), { recursive: true });
await writeFile(
  path.join(stage, "package.json"),
  JSON.stringify(
    {
      name: "notas-no-bolso",
      version,
      main: "electron/main.cjs",
      description: "Caderno interativo de blues para iniciantes",
      author: "Notas no Bolso",
    },
    null,
    2,
  ),
);
const paths = await packager({
  dir: stage,
  out: `entrega-notas-${version}`,
  name: "Notas no Bolso",
  platform: "win32",
  arch: "x64",
  electronVersion: "44.1.1",
  asar: true,
  prune: false,
  overwrite: true,
});
console.log(JSON.stringify({ stage, paths }));
await build({
  targets: Platform.WINDOWS.createTarget("portable", Arch.x64),
  prepackaged: paths[0],
  config: {
    directories: { output: `entrega-notas-${version}` },
    artifactName: `Notas-no-Bolso-${version}.exe`,
    win: { signAndEditExecutable: false },
  },
});
