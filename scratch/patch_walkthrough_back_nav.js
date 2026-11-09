const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Route Navigation Fixes**: Resolved parameter conflicts where loading logActivities with both \`activityId\` and \`stage\` parameter overrode the selected activity to the first item in the stage (e.g. clicking \`PS-02\` opened \`PS-01\`). Modified Alert saving redirections to execute \`router.back()\` instead of hardcoding \`farmerDetails\` home page redirections, allowing agents to naturally return to the screen they navigated from (e.g. \`stageDetails\` checklist views).`;

const replacementStr = `- **Route Navigation Fixes**: Resolved parameter conflicts where loading logActivities with both \`activityId\` and \`stage\` parameter overrode the selected activity to the first item in the stage (e.g. clicking \`PS-02\` opened \`PS-01\`).
- **Global Back-Navigation Alignment**: Modified the on-screen back navigation handlers and alert callback redirections in core agent screens (\`logActivities.tsx\`, \`stageDetails.tsx\`, \`farmerDetails.tsx\`, \`assessFarm.tsx\`, and \`farmDetails.tsx\`) to perform \`router.back()\` directly. This bypasses layout tab contexts conflicts and ensures the agent always returns to the exact previous screen they came from (e.g. checklist or profile detail views), rather than being forced to default fallback homepages.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
