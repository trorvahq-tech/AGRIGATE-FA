const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `  - **LS-01 (Harvest Start)**: Added *Actual Harvest Commencement Date* field alongside expected harvest window projections.`;

const replacementStr = `  - **LS-01 (Harvest Start)**: Added *Actual Harvest Commencement Date* field alongside expected harvest window projections.
- **Premium Custom Calendar Date Picker**: Replaced all 7 static text inputs for date fields (Land Prep Started, Land Prep Ended, Planting Started, Bio-Input Application, Actual Harvest Commencement, Expected Harvest Commencement, and Harvest Date) with touchable date selector rows. Tapping these rows triggers a customized, inline calendar picker modal where the agent can easily select year, month, and day dynamically.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
