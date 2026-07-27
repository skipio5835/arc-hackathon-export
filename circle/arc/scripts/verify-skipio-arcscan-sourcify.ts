import { readFileSync } from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const contractAddress = "0x724038D2B4c1EbE69DC8B29cc5d591C4caA21918";
const standardJsonInputPath = path.join(root, "circle", "arc", "artifacts", "skipio-standard-input.json");

const stdJsonInput = JSON.parse(readFileSync(standardJsonInputPath, "utf8")) as {
  settings: {
    outputSelection: Record<string, Record<string, string[]>>;
  };
  sources: Record<string, { content: string }>;
};
stdJsonInput.settings.outputSelection["*"]["*"].push("metadata");

const output = JSON.parse(solc.compile(JSON.stringify(stdJsonInput)));
const metadata = output.contracts?.["contracts/Skipio.sol"]?.Skipio?.metadata;

if (!metadata) {
  throw new Error("Unable to compile Skipio metadata.");
}

const form = new FormData();
form.set("chosen_contract_index", "0");
form.set("files[0]", new Blob([metadata], { type: "application/json" }), "metadata.json");

let index = 1;
for (const [fileName, source] of Object.entries(stdJsonInput.sources)) {
  form.set(`files[${index}]`, new Blob([source.content], { type: "text/plain" }), fileName);
  index += 1;
}

const response = await fetch(
  `https://testnet.arcscan.app/api/v2/smart-contracts/${contractAddress}/verification/via/sourcify`,
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
      uploadedFiles: index,
      body,
    },
    null,
    2,
  ),
);
