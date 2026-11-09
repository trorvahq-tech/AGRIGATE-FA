const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Farmer Profile ID Integration Fix**: Updated \`mtgDetails.tsx\` and \`selectFarm.tsx\` to ensure the clicked farmer's \`id\` is always passed in routing parameters when opening the profile page (\`farmerDetails.tsx\`). This resolves the issue where navigating to stage details (like Pre-Season) from an MTG group and pressing the back button incorrectly redirected the agent to the home page because of an undefined database ID.`;

const replacementStr = `- **Farmer Profile ID Integration Fix**: Updated \`mtgDetails.tsx\` and \`selectFarm.tsx\` to ensure the clicked farmer's \`id\` is always passed in routing parameters when opening the profile page (\`farmerDetails.tsx\`). This resolves the issue where navigating to stage details (like Pre-Season) from an MTG group and pressing the back button incorrectly redirected the agent to the home page because of an undefined database ID.
- **Separate Date & Time Pickers for MTG Meetings**: Separated the single text input for Date & Time in the MTG Log Group Meeting modal into two distinct touchable selectors. Created custom premium modals featuring an interactive Calendar Picker for date selection, and scrollable columns (Hour, Minute, AM/PM Period) for time selection, maintaining full color-harmony with the rest of the application.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
