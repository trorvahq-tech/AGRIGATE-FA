const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). The planned cultivation area is set to the farmer's mapped farm size (2.5 ha) by default. Added an action button "+ Map New Subplot / Piece of Land" that triggers the mapping/subplot onboarding flow. Removed the temporary quantity sync notice callout, and conditionally hid Step 5 (Quantity & Unit) and Step 7 (Verification Evidence Photo) since they are not required for crop plan confirmations.`;

const replacementStr = `- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). The planned cultivation area is set to the farmer's mapped farm size (2.5 ha) by default. Added an action button "+ Map New Subplot / Piece of Land" that triggers the mapping/subplot onboarding flow. Removed the temporary quantity sync notice callout, and conditionally hid Step 5 (Quantity & Unit) and Step 7 (Verification Evidence Photo) since they are not required for crop plan confirmations.
- **Dynamic Input Gaps Search Builder**: Updated \`PS-02\` (Seed Gaps & Input Requirements) to replace the simple single seed weight input with an interactive search-and-add builder. VCM agents can search over a curated catalog of inputs (seeds, organic bio-fertilizers, herbicides, hermetic bags, tractor service credits), input exact demand quantities and select standard units (\`kg\`, \`litres\`, \`bags\`, \`sachets\`, \`bundles\`), building a customized requested input gap checklist per farmer. These selections are dynamically stored and populated in the mock DB.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
