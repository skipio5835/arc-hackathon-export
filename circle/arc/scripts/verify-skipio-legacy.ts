import { readFileSync } from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const contractAddress = "0x724038D2B4c1EbE69DC8B29cc5d591C4caA21918";
const contractName = "contracts/Skipio.sol:Skipio";
const standardJsonInputPath = path.join(root, "circle", "arc", "artifacts", "skipio-standard-input.json");
const initialSupply = 20200919n * 10n ** 18n;

const compilerVersion = `v${solc.version().replace(/\.Emscripten\.clang$/, "")}`;
const constructorArguments = initialSupply.toString(16).padStart(64, "0");
const sourceCode = readFileSync(standardJsonInputPath, "utf8");

const form = new FormData();
form.set("contractaddress", contractAddress);
form.set("sourceCode", sourceCode);
form.set("contractname", contractName);
form.set("codeformat", "solidity-standard-json-input");
form.set("compilerversion", compilerVersion);
form.set("optimizationUsed", "1");
form.set("runs", "200");
form.set("constructorArguments", constructorArguments);
form.set("licenseType", "3");

const verifyResponse = await fetch(
  "https://testnet.arcscan.app/api?module=contract&action=verifysourcecode",
  {
    method: "POST",
    body: form,
  },
);

const verifyBodyText = await verifyResponse.text();
let verifyBody: unknown;
try {
  verifyBody = JSON.parse(verifyBodyText);
} catch {
  verifyBody = verifyBodyText;
}

const result =
  typeof verifyBody === "object" &&
  verifyBody !== null &&
  "result" in verifyBody &&
  typeof verifyBody.result === "string"
    ? verifyBody.result
    : null;

let statusBody: unknown = null;
if (result) {
  const statusUrl = new URL("https://testnet.arcscan.app/api");
  statusUrl.searchParams.set("module", "contract");
  statusUrl.searchParams.set("action", "checkverifystatus");
  statusUrl.searchParams.set("guid", result);

  await new Promise((resolve) => setTimeout(resolve, 5000));
  const statusResponse = await fetch(statusUrl);
  const statusText = await statusResponse.text();
  try {
    statusBody = JSON.parse(statusText);
  } catch {
    statusBody = statusText;
  }
}

console.log(
  JSON.stringify(
    {
      verifyStatus: verifyResponse.status,
      compilerVersion,
      contractName,
      constructorArguments,
      verifyBody,
      statusBody,
    },
    null,
    2,
  ),
);
