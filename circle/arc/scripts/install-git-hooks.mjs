import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const launcher = `#!/bin/sh
# ARCROW managed pre-push launcher v1
set -eu
root=$(git rev-parse --show-toplevel)
exec sh "$root/.githooks/pre-push" "$@"
`;

try {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const root = git("rev-parse", "--show-toplevel");
  const configured = spawnSync("git", ["config", "--get", "core.hooksPath"], { encoding: "utf8" });
  if (configured.error) throw configured.error;
  if (configured.status !== 1) {
    throw new Error("An existing core.hooksPath setting is present or cannot be read. Merge the hook manually; no settings changed.");
  }
  if (!existsSync(path.join(root, ".githooks", "pre-push"))) {
    throw new Error("Missing .githooks/pre-push. Run this from the project checkout.");
  }
  const directory = path.resolve(git("rev-parse", "--git-path", "hooks"));
  const target = path.join(directory, "pre-push");
  if (existsSync(target)) {
    if (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink() || readFileSync(target, "utf8") !== launcher) {
      throw new Error("An existing custom pre-push hook was found. It has not been overwritten.");
    }
  } else {
    mkdirSync(directory, { recursive: true });
    writeFileSync(target, launcher, { flag: "wx", mode: 0o755 });
  }
  chmodSync(target, 0o755);
  console.log(`Installed repository-local pre-push checks: ${target}`);
} catch (error) {
  console.error(`[hooks:install] ${error.message}`);
  process.exitCode = 1;
}
