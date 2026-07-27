import { readFileSync } from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const chainId = 5042002;
const contractAddress = "0x724038D2B4c1EbE69DC8B29cc5d591C4caA21918";
const contractIdentifier = "contracts/Skipio.sol:Skipio";
const creationTransactionHash = "0xda1bc354b1a4e4d6656a3a88c6f8a2c4fff36780bfa0dcee02e83318e230e86f";
const standardJsonInputPath = path.join(root, "circle", "arc", "artifacts", "skipio-standard-input.json");

const stdJsonInput = JSON.parse(readFileSync(standardJsonInputPath, "utf8"));
const compilerVersion = solc.version().replace(/\.Emscripten\.clang$/, "");

const verifyResponse = await fetch(
  `https://sourcify.dev/server/v2/verify/${chainId}/${contractAddress}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stdJsonInput,
      compilerVersion,
      contractIdentifier,
      creationTransactionHash,
    }),
  },
);

const verifyBody = await verifyResponse.json();
let jobBody: unknown = null;

if (verifyBody.verificationId) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const jobResponse = await fetch(`https://sourcify.dev/server/v2/verify/${verifyBody.verificationId}`);
    jobBody = await jobResponse.json();

    const job = jobBody as { isJobCompleted?: boolean };
    if (job.isJobCompleted) break;
  }
}

let contractBody: unknown = null;
const contractResponse = await fetch(
  `https://sourcify.dev/server/v2/contract/${chainId}/${contractAddress}?fields=all`,
);
if (contractResponse.ok) {
  contractBody = await contractResponse.json();
}

console.log(
  JSON.stringify(
    {
      verifyStatus: verifyResponse.status,
      compilerVersion,
      contractIdentifier,
      verifyBody,
      jobBody,
      contractLookupStatus: contractResponse.status,
      contractBody,
    },
    null,
    2,
  ),
);
