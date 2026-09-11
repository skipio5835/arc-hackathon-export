import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const installer = fileURLToPath(new URL("../scripts/install-git-hooks.mjs", import.meta.url));
const template = fileURLToPath(new URL("../../../.githooks/pre-push", import.meta.url));

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "arc prepush test-"));
  const repo = path.join(root, "checkout");
  const remote = path.join(root, "remote.git");
  mkdirSync(repo);
  // Hook tests use foreign repositories: do not inherit the parent push's Git context.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith("GIT_")));
  Object.assign(env, { GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: path.join(root, "empty.gitconfig"), GIT_TERMINAL_PROMPT: "0" });
  const run = (command, args, cwd = repo) => spawnSync(command, args, { cwd, env, encoding: "utf8", timeout: 60000 });
  const git = (...args) => {
    const result = run("git", args);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout.trim();
  };
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    rmSync(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  });
  git("init", "-b", "main");
  git("config", "user.name", "Hook Test");
  git("config", "user.email", "hook-test@example.invalid");
  git("config", "core.autocrlf", "false");
  git("init", "--bare", remote);
  git("remote", "add", "origin", remote);
  mkdirSync(path.join(repo, ".githooks"));
  copyFileSync(template, path.join(repo, ".githooks", "pre-push"));
  writeFileSync(path.join(repo, "package.json"), JSON.stringify({ private: true, scripts: { "check:push": "node check.cjs" } }));
  const setCheck = (source) => writeFileSync(path.join(repo, "check.cjs"), source);
  const commit = () => {
    git("add", ".");
    git("commit", "--allow-empty", "-m", "Local hook fixture");
  };
  const install = () => run(process.execPath, [installer]);
  return { root, repo, remote, run, git, setCheck, commit, install };
}

test("installer is idempotent and preserves custom hooks and hooksPath", (t) => {
  const f = fixture(t);
  assert.equal(f.install().status, 0);
  assert.equal(f.install().status, 0);
  const hook = path.join(f.repo, ".git", "hooks", "pre-push");
  const custom = "#!/bin/sh\n# Existing user hook\nexit 0\n";
  writeFileSync(hook, custom);
  assert.notEqual(f.install().status, 0);
  assert.equal(readFileSync(hook, "utf8"), custom);
  f.git("config", "core.hooksPath", ".custom-hooks");
  const result = f.install();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /core.hooksPath/);
  assert.equal(f.git("config", "core.hooksPath"), ".custom-hooks");
});

test("real local pushes fail closed, pass after checks, and validate the pushed commit", { timeout: 120000 }, (t) => {
  const f = fixture(t);
  f.setCheck("process.exit(7);\n");
  f.commit();
  assert.equal(f.install().status, 0);
  const push = (...refs) => f.run("git", ["push", "origin", ...refs]);
  let result = push("main");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Checks failed/);
  assert.notEqual(f.run("git", ["--git-dir", f.remote, "rev-parse", "--verify", "refs/heads/main"]).status, 0);

  f.setCheck("process.exit(0);\n");
  f.commit();
  result = push("main");
  assert.equal(result.status, 0, result.stderr);
  const pushed = f.git("rev-parse", "HEAD");
  assert.equal(f.git("--git-dir", f.remote, "rev-parse", "refs/heads/main"), pushed);

  f.commit();
  const pending = path.join(f.repo, "pending.txt");
  writeFileSync(pending, "uncommitted");
  result = push("main");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit your changes/);
  unlinkSync(pending);
  f.setCheck("// Uncommitted change\nprocess.exit(0);\n");
  result = push("main");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit your changes/);

  f.setCheck("require('node:fs').writeFileSync('changed-by-check.txt', 'changed');\n");
  f.commit();
  result = push("main");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /changed during checks/);
  assert.equal(f.git("--git-dir", f.remote, "rev-parse", "refs/heads/main"), pushed);
  unlinkSync(path.join(f.repo, "changed-by-check.txt"));

  f.setCheck("process.exit(0);\n");
  f.commit();
  f.git("branch", "other", "HEAD~1");
  result = push("other");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /check out the commit being pushed/);
  assert.notEqual(f.run("git", ["--git-dir", f.remote, "rev-parse", "--verify", "refs/heads/other"]).status, 0);

  f.git("tag", "-a", "fixture-tag", "-m", "Local tag");
  result = push("fixture-tag");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.git("--git-dir", f.remote, "rev-parse", "refs/tags/fixture-tag^{commit}"), f.git("rev-parse", "HEAD"));
  f.setCheck("process.exit(9);\n");
  result = push(":refs/tags/fixture-tag");
  assert.equal(result.status, 0, result.stderr);
});

test("push command includes every local security gate without an audit bypass", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../../package.json", import.meta.url), "utf8"));
  const command = pkg.scripts["check:push"];
  for (const step of ["npm ls --all", "npm audit --audit-level=low", "test-dependency-security", "test-pre-push", "typecheck", "test-arc-radar", "test-security-js", "compile-custom"]) {
    assert.ok(command.includes(step), step);
  }
  assert.doesNotMatch(command, /\|\||--force|--no-verify|--env-file/);
});
