const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Global Back-Navigation Alignment**: Modified the on-screen back navigation handlers and alert callback redirections in core agent screens (\`logActivities.tsx\`, \`stageDetails.tsx\`, \`farmerDetails.tsx\`, \`assessFarm.tsx\`, and \`farmDetails.tsx\`) to perform \`router.back()\` directly. This bypasses layout tab contexts conflicts and ensures the agent always returns to the exact previous screen they came from (e.g. checklist or profile detail views), rather than being forced to default fallback homepages.`;

const replacementStr = `- **Global Back-Navigation Alignment**: Modified the on-screen back navigation handlers and alert callback redirections in core agent screens (\`logActivities.tsx\`, \`stageDetails.tsx\`, \`farmerDetails.tsx\`, \`assessFarm.tsx\`, and \`farmDetails.tsx\`) to navigate back to parent screens deterministically using parameter state context, preventing layout conflicts from switching layout context back to default homepage landing screens.
- **Farmer Profile ID Integration Fix**: Updated \`mtgDetails.tsx\` and \`selectFarm.tsx\` to ensure the clicked farmer's \`id\` is always passed in routing parameters when opening the profile page (\`farmerDetails.tsx\`). This resolves the issue where navigating to stage details (like Pre-Season) from an MTG group and pressing the back button incorrectly redirected the agent to the home page because of an undefined database ID.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
