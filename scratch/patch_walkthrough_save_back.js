const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Dynamic Input Gaps Search Builder**: Updated \`PS-02\` (Seed Gaps & Input Requirements) to replace the simple single seed weight input with an interactive search-and-add builder. VCM agents can search over a curated catalog of inputs (seeds, organic bio-fertilizers, herbicides, hermetic bags, tractor service credits), input exact demand quantities and select standard units (\`kg\`, \`litres\`, \`bags\`, \`sachets\`, \`bundles\`), building a customized requested input gap checklist per farmer. These selections are dynamically stored and populated in the mock DB.`;

const replacementStr = `- **Dynamic Input Gaps Search Builder**: Updated \`PS-02\` (Seed Gaps & Input Requirements) to replace the simple single seed weight input with an interactive search-and-add builder. VCM agents can search over a curated catalog of inputs (seeds, organic bio-fertilizers, herbicides, hermetic bags, tractor service credits), input exact demand quantities and select standard units (\`kg\`, \`litres\`, \`bags\`, \`sachets\`, \`bundles\`), building a customized requested input gap checklist per farmer. These selections are dynamically stored and populated in the mock DB.
- **Route Navigation Fixes**: Resolved parameter conflicts where loading logActivities with both \`activityId\` and \`stage\` parameter overrode the selected activity to the first item in the stage (e.g. clicking \`PS-02\` opened \`PS-01\`). Modified Alert saving redirections to execute \`router.back()\` instead of hardcoding \`farmerDetails\` home page redirections, allowing agents to naturally return to the screen they navigated from (e.g. \`stageDetails\` checklist views).`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
