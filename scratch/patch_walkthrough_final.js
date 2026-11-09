const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- **Strictly Isolated Sub-Forms**: Fully replaced generic and sequence-step selectors with a static detail card when \`params.activityId\` is active, completely hiding option pickers for other activities.
- **Targeted Custom Form Questions**: Added 17 conditional React Native JSX blocks strictly mapping \`selectedActivityId\` to accurate, tailored inputs matching each specific activity code (e.g. crop varieties and intercropping combos for \`ES-02\`, germination rates for \`ES-03\`, weeding observations for \`MS-03\`, risk warnings for \`MS-04\`, storage bags counts for \`END-01\`, aggregation locations for \`END-02\`, and average transaction details for \`END-03\`).


#### [MODIFY] [VcmScorecardCard.tsx](file:///c:/Users/MTECH%20COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/components/ui/VcmScorecardCard.tsx)`;

const replacementStr = `- **Strictly Isolated Sub-Forms**: Fully replaced generic and sequence-step selectors with a static detail card when \`params.activityId\` is active, completely hiding option pickers for other activities.
- **Targeted Custom Form Questions**: Added 17 conditional React Native JSX blocks strictly mapping \`selectedActivityId\` to accurate, tailored inputs matching each specific activity code (e.g. crop varieties and intercropping combos for \`ES-02\`, germination rates for \`ES-03\`, weeding observations for \`MS-03\`, risk warnings for \`MS-04\`, storage bags counts for \`END-01\`, aggregation locations for \`END-02\`, and average transaction details for \`END-03\`).
- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). The planned cultivation area is set to the farmer's mapped farm size (2.5 ha) by default. Added an action button "+ Map New Subplot / Piece of Land" that triggers the mapping/subplot onboarding flow. Removed the temporary quantity sync notice callout.
- **Layout Overlap Adjustment**: Fixed top layout spacing constraints by adding \`marginTop: 130\` to \`mainContainer\`, moving the header subplot card down to prevent it from overlapping with the floating \`CustomBackNavBar\`.

#### [MODIFY] [assessFarm.tsx](file:///c:/Users/MTECH%20COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/%28agent%29/assessFarm.tsx)
- **Layout Overlap Adjustment**: Pushed the main content card down by adding \`marginTop: 130\` to \`mainContainer\` style, preventing the subplot info card at the top from sliding behind the absolutely positioned \`CustomBackNavBar\`.

#### [MODIFY] [VcmScorecardCard.tsx](file:///c:/Users/MTECH%20COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/components/ui/VcmScorecardCard.tsx)`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully patched walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
