import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";

const root = process.cwd();
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const virtualBrowserShims = new Map([
  [
    "browser-shim:util",
    `const noop = () => {};
const util = {
  format: (...args) => args.map((value) => typeof value === "string" ? value : JSON.stringify(value)).join(" "),
  debuglog: () => noop,
  deprecate: (fn) => fn,
  inherits: (ctor, superCtor) => {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
  },
};
export const format = util.format;
export const debuglog = util.debuglog;
export const deprecate = util.deprecate;
export const inherits = util.inherits;
export default util;`,
  ],
  [
    "browser-shim:http",
    `class Agent {
  constructor(options = {}) {
    this.options = options;
  }
  on() { return this; }
  keepSocketAlive() { return true; }
  reuseSocket() {}
  addRequest() {}
  createConnection() {}
}
const http = { Agent };
export { Agent };
export default http;`,
  ],
  [
    "browser-shim:https",
    `class Agent {
  constructor(options = {}) {
    this.options = options;
  }
  on() { return this; }
  keepSocketAlive() { return true; }
  reuseSocket() {}
  addRequest() {}
  createConnection() {}
}
const https = { Agent };
export { Agent };
export default https;`,
  ],
]);

const targets = {
  "appkit-send": ["circle/arc/src/appkit-send.ts", "circle/arc/public/appkit-send.bundle.js"],
  "appkit-swap": ["circle/arc/src/appkit-swap.ts", "circle/arc/public/appkit-swap.bundle.js"],
  "appkit-bridge": ["circle/arc/src/appkit-bridge.ts", "circle/arc/public/appkit-bridge.bundle.js"],
  "appkit-unified": [
    "circle/arc/src/appkit-unified-balance.ts",
    "circle/arc/public/appkit-unified-balance.bundle.js",
  ],
  "arc-usdc-tools": ["circle/arc/src/arc-usdc-tools.ts", "circle/arc/public/arc-usdc-tools.bundle.js"],
  "arc-invoice": ["circle/arc/src/arc-invoice.ts", "circle/arc/public/arc-invoice.bundle.js"],
  "arc-escrow": ["circle/arc/src/arc-escrow.ts", "circle/arc/public/arc-escrow.bundle.js"],
  "arc-subscription": ["circle/arc/src/arc-subscription.ts", "circle/arc/public/arc-subscription.bundle.js"],
  "arc-membership": ["circle/arc/src/arc-membership.ts", "circle/arc/public/arc-membership.bundle.js"],
  "arc-savings-vault": ["circle/arc/src/arc-savings-vault.ts", "circle/arc/public/arc-savings-vault.bundle.js"],
  "arc-poll": ["circle/arc/src/arc-poll.ts", "circle/arc/public/arc-poll.bundle.js"],
  "arc-airdrop": ["circle/arc/src/arc-airdrop.ts", "circle/arc/public/arc-airdrop.bundle.js"],
  "arc-bounty": ["circle/arc/src/arc-bounty.ts", "circle/arc/public/arc-bounty.bundle.js"],
  "arc-milestone": ["circle/arc/src/arc-milestone.ts", "circle/arc/public/arc-milestone.bundle.js"],
  "arc-expense": ["circle/arc/src/arc-expense.ts", "circle/arc/public/arc-expense.bundle.js"],
  "arc-event-tickets": ["circle/arc/src/arc-event-tickets.ts", "circle/arc/public/arc-event-tickets.bundle.js"],
  "arc-marketplace": ["circle/arc/src/arc-marketplace.ts", "circle/arc/public/arc-marketplace.bundle.js"],
  "arc-service-bookings": ["circle/arc/src/arc-service-bookings.ts", "circle/arc/public/arc-service-bookings.bundle.js"],
  "arc-donation": ["circle/arc/src/arc-donation.ts", "circle/arc/public/arc-donation.bundle.js"],
  "arc-preorder": ["circle/arc/src/arc-preorder.ts", "circle/arc/public/arc-preorder.bundle.js"],
  "arc-payroll": ["circle/arc/src/arc-payroll.ts", "circle/arc/public/arc-payroll.bundle.js"],
  "arc-refundable-deposit": [
    "circle/arc/src/arc-refundable-deposit.ts",
    "circle/arc/public/arc-refundable-deposit.bundle.js",
  ],
  "arc-installments": ["circle/arc/src/arc-installments.ts", "circle/arc/public/arc-installments.bundle.js"],
  "arc-vesting": ["circle/arc/src/arc-vesting.ts", "circle/arc/public/arc-vesting.bundle.js"],
  "arc-gift-card": ["circle/arc/src/arc-gift-card.ts", "circle/arc/public/arc-gift-card.bundle.js"],
  "arc-reward": ["circle/arc/src/arc-reward.ts", "circle/arc/public/arc-reward.bundle.js"],
  "arc-coupon": ["circle/arc/src/arc-coupon.ts", "circle/arc/public/arc-coupon.bundle.js"],
  "arc-referral": ["circle/arc/src/arc-referral.ts", "circle/arc/public/arc-referral.bundle.js"],
  "arc-cashback": ["circle/arc/src/arc-cashback.ts", "circle/arc/public/arc-cashback.bundle.js"],
  "arc-auction": ["circle/arc/src/arc-auction.ts", "circle/arc/public/arc-auction.bundle.js"],
  "arc-rental": ["circle/arc/src/arc-rental.ts", "circle/arc/public/arc-rental.bundle.js"],
  "arc-warranty": ["circle/arc/src/arc-warranty.ts", "circle/arc/public/arc-warranty.bundle.js"],
  "arc-support-desk": ["circle/arc/src/arc-support-desk.ts", "circle/arc/public/arc-support-desk.bundle.js"],
  "arc-access": ["circle/arc/src/arc-access.ts", "circle/arc/public/arc-access.bundle.js"],
  "raw-cctp": ["circle/arc/src/raw-cctp.ts", "circle/arc/public/raw-cctp.bundle.js"],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function splitPackage(specifier) {
  const parts = specifier.split("/");
  if (specifier.startsWith("@")) {
    return {
      packageName: `${parts[0]}/${parts[1]}`,
      subpath: parts.length > 2 ? `./${parts.slice(2).join("/")}` : ".",
    };
  }

  return {
    packageName: parts[0],
    subpath: parts.length > 1 ? `./${parts.slice(1).join("/")}` : ".",
  };
}

function pickExportTarget(target) {
  if (typeof target === "string") return target;
  if (!target || typeof target !== "object") return undefined;

  for (const key of ["browser", "import", "module", "default", "require"]) {
    const picked = pickExportTarget(target[key]);
    if (picked) return picked;
  }

  return undefined;
}

function resolveExports(exportsField, subpath) {
  if (typeof exportsField === "string") {
    return subpath === "." ? exportsField : undefined;
  }

  if (!exportsField || typeof exportsField !== "object") return undefined;

  const exact = exportsField[subpath];
  const exactTarget = pickExportTarget(exact);
  if (exactTarget) return exactTarget;

  for (const [key, value] of Object.entries(exportsField)) {
    if (!key.includes("*")) continue;
    const [prefix, suffix] = key.split("*");
    if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix ?? "")) continue;
    const wildcard = subpath.slice(prefix.length, subpath.length - (suffix?.length ?? 0));
    const target = pickExportTarget(value);
    if (target) return target.replace("*", wildcard);
  }

  return subpath === "." ? pickExportTarget(exportsField) : undefined;
}

function resolveFileOrDirectory(candidate) {
  const extensions = ["", ".ts", ".tsx", ".mjs", ".js", ".cjs", ".json"];

  for (const extension of extensions) {
    const filePath = `${candidate}${extension}`;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    const packagePath = path.join(candidate, "package.json");
    if (fs.existsSync(packagePath)) {
      const pkg = readJson(packagePath);
      const entry = typeof pkg.browser === "string" ? pkg.browser : pkg.module ?? pkg.main ?? "index.js";
      return resolveFileOrDirectory(path.join(candidate, entry));
    }

    for (const extension of [".mjs", ".js", ".cjs", ".ts", ".json"]) {
      const indexPath = path.join(candidate, `index${extension}`);
      if (fs.existsSync(indexPath)) return indexPath;
    }
  }

  throw new Error(`Could not resolve ${candidate}`);
}

function findPackageRoot(packageName, startDir) {
  let current = startDir;

  while (current.startsWith(root)) {
    const candidate = path.join(current, "node_modules", packageName);
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const rootCandidate = path.join(root, "node_modules", packageName);
  if (fs.existsSync(path.join(rootCandidate, "package.json"))) {
    return rootCandidate;
  }

  throw new Error(`Package not found: ${packageName}`);
}

function resolvePackage(specifier, startDir) {
  const { packageName, subpath } = splitPackage(specifier);
  const packageRoot = findPackageRoot(packageName, startDir);
  const packagePath = path.join(packageRoot, "package.json");

  const pkg = readJson(packagePath);
  const exported = resolveExports(pkg.exports, subpath);
  const target =
    exported ??
    (subpath !== "."
      ? subpath
      : typeof pkg.browser === "string"
        ? pkg.browser
        : pkg.module ?? pkg.main ?? "index.js");

  return resolveFileOrDirectory(path.join(packageRoot, target));
}

function resolveSpecifier(specifier, importer) {
  if (specifier === "buffer" || specifier === "node:buffer") {
    return { path: resolvePackage("buffer", path.dirname(importer)) };
  }

  if (specifier === "util" || specifier === "node:util") {
    return { path: "browser-shim:util", namespace: "browser-shim" };
  }

  if (specifier === "http" || specifier === "node:http") {
    return { path: "browser-shim:http", namespace: "browser-shim" };
  }

  if (specifier === "https" || specifier === "node:https") {
    return { path: "browser-shim:https", namespace: "browser-shim" };
  }

  if (builtins.has(specifier)) {
    return { path: specifier.replace(/^node:/, ""), external: true };
  }

  if (specifier.startsWith(".") || specifier.startsWith("/") || /^[A-Za-z]:[\\/]/.test(specifier)) {
    const base = specifier.startsWith(".") ? path.dirname(importer) : "";
    return { path: resolveFileOrDirectory(path.resolve(base, specifier)) };
  }

  return { path: resolvePackage(specifier, path.dirname(importer)) };
}

function loaderFor(filePath) {
  const extension = path.extname(filePath);
  if (extension === ".json") return "json";
  if (extension === ".ts" || extension === ".tsx") return "ts";
  return "js";
}

const localFsPlugin = {
  name: "local-fs",
  setup(build) {
    build.onLoad({ filter: /.*/, namespace: "browser-shim" }, (args) => ({
      contents: virtualBrowserShims.get(args.path) ?? "",
      loader: "js",
    }));

    build.onResolve({ filter: /.*/ }, (args) => {
      if (!args.importer && args.namespace !== "file") {
        return;
      }

      return resolveSpecifier(args.path, args.importer || path.join(root, "entry.ts"));
    });

    build.onLoad({ filter: /.*/ }, (args) => {
      if (args.path === "crypto" || args.path === "stream") {
        return;
      }

      return {
        contents: fs.readFileSync(args.path, "utf8"),
        loader: loaderFor(args.path),
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function buildTarget(name) {
  const target = targets[name];
  if (!target) {
    throw new Error(`Unknown build target "${name}". Known targets: ${Object.keys(targets).join(", ")}`);
  }

  const [entry, outfile] = target;
  await esbuild.build({
    stdin: {
      contents: fs.readFileSync(path.join(root, entry), "utf8"),
      sourcefile: entry,
      resolveDir: root,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    banner: {
      js: `var process = globalThis.process || { version: "v20.0.0", env: {}, browser: true };
var global = globalThis;`,
    },
    inject: [path.join(root, "circle", "arc", "scripts", "browser-buffer-global.js")],
    outfile,
    plugins: [localFsPlugin],
    logLevel: "info",
  });
}

const requested = process.argv.slice(2);
const names = requested.length > 0 ? requested : Object.keys(targets);

for (const name of names) {
  await buildTarget(name);
}
