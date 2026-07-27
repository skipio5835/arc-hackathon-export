import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const contractAddress = "0x724038D2B4c1EbE69DC8B29cc5d591C4caA21918";
const contractFile = "contracts/Skipio.sol";
const contractPath = "circle/arc/contracts/Skipio.sol";
const contractName = "contracts/Skipio.sol:Skipio";
const initialSupply = 20200919n * 10n ** 18n;

const sources = new Map<string, { content: string }>();

function resolveImport(importPath: string, fromFile?: string): string {
  const candidates = [
    path.join(root, importPath),
    path.join(root, "node_modules", importPath),
  ];

  if (fromFile && importPath.startsWith(".")) {
    candidates.unshift(path.resolve(root, path.dirname(fromFile), importPath));
    candidates.unshift(path.resolve(root, "node_modules", path.dirname(fromFile), importPath));
    if (fromFile.includes("node_modules")) {
      candidates.unshift(path.resolve(path.dirname(path.join(root, fromFile)), importPath));
    }
  }

  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error(`Unable to resolve import ${importPath} from ${fromFile ?? "<root>"}`);
  }

  return resolved;
}

function sourceKey(absolutePath: string, logicalName?: string): string {
  if (logicalName) return logicalName;

  const relative = path.relative(root, absolutePath).replace(/\\/g, "/");
  return relative.startsWith("node_modules/")
    ? relative.replace(/^node_modules\//, "")
    : relative;
}

function addSource(absolutePath: string, logicalName?: string): void {
  const key = sourceKey(absolutePath, logicalName);
  if (sources.has(key)) return;

  const content = readFileSync(absolutePath, "utf8");
  sources.set(key, { content });

  const importRegex = /import\s+(?:[^"']*from\s+)?["']([^"']+)["'];/g;
  for (const match of content.matchAll(importRegex)) {
    const importedPath = resolveImport(match[1], key);
    addSource(importedPath);
  }
}

addSource(path.join(root, contractPath), contractFile);

const standardJsonInput = {
  language: "Solidity",
  sources: Object.fromEntries(sources),
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};

const compilerVersion = `v${solc.version().replace(/\.Emscripten\.clang$/, "")}`;
const constructorArgs = initialSupply.toString(16).padStart(64, "0");
const verificationInputPath = path.join(root, "circle", "arc", "artifacts", "skipio-standard-input.json");

await import("node:fs").then(({ mkdirSync }) => mkdirSync(path.dirname(verificationInputPath), { recursive: true }));
writeFileSync(verificationInputPath, `${JSON.stringify(standardJsonInput, null, 2)}\n`);

const form = new FormData();
form.set("compiler_version", compilerVersion);
form.set("contract_name", contractName);
form.set("autodetect_constructor_args", "false");
form.set("constructor_args", constructorArgs);
form.set("license_type", "mit");
form.set(
  "files[0]",
  new Blob([JSON.stringify(standardJsonInput)], { type: "application/json" }),
  "skipio-standard-input.json",
);

const response = await fetch(
  `https://testnet.arcscan.app/api/v2/smart-contracts/${contractAddress}/verification/via/standard-input`,
  {
    method: "POST",
    body: form,
  },
);

const body = await response.text();

console.log(
  JSON.stringify(
    {
      status: response.status,
      ok: response.ok,
      compilerVersion,
      constructorArgs,
      standardJsonInput: path.relative(root, verificationInputPath).replace(/\\/g, "/"),
      body,
    },
    null,
    2,
  ),
);
