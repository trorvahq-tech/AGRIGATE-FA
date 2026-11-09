const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). The planned cultivation area is set to the farmer's mapped farm size (2.5 ha) by default. Added an action button "+ Map New Subplot / Piece of Land" that triggers the mapping/subplot onboarding flow. Completely disabled/removed Step 5 (Quantity & Unit) and Step 7 (Verification Evidence Photo) from the layout for all activities, as they are not needed in the current log flow.`;

const replacementStr = `- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). The planned cultivation area is set to the farmer's mapped farm size (2.5 ha) by default. Added an action button "+ Map New Subplot / Piece of Land" that triggers the mapping/subplot onboarding flow. Completely disabled/removed Step 5 (Quantity & Unit) and Step 7 (Verification Evidence Photo) from the layout for all activities, as they are not needed in the current log flow.
- **PS-04 Mapped Area Display**: Added a dedicated layout highlight block inside the \`PS-04\` (Farm Location & Status Verification) card to display the farmer's already mapped land area (2.5 ha) prominently, positioned directly before the VCM captures the farm's latitude and longitude GPS coordinates.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
