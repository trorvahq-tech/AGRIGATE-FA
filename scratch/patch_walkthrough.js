const fs = require('fs');

const path = "C:/Users/MTECH COMPUTERS/.gemini/antigravity-ide/brain/34749d55-83cc-4069-8382-5753e8489402/walkthrough.md";
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\r\n/g, '\n');

const targetStr = `- Added a \`useEffect\` that listens to incoming \`params.activityId\` query arguments. It automatically sets the selected activity, stage, and farming cycle steps when coming from the progress timeline or checklist.

- Re-architected stage header click behavior: when \`isFarmerProfile={true}\` is set, clicking a stage header no longer opens accordions in-place. Instead, it fires the \`onStagePress\` callback to route directly to the dedicated \`stageDetails\` page for that stage.`;

const replacementStr = `- Added a \`useEffect\` that listens to incoming \`params.activityId\` query arguments. It automatically sets the selected activity, stage, and farming cycle steps when coming from the progress timeline or checklist.
- Corrected step label numbering sequence (1 to 7) to prevent number collisions in the walkthrough wizard.
- **Strictly Isolated Sub-Forms**: Fully replaced generic and sequence-step selectors with a static detail card when \`params.activityId\` is active, completely hiding option pickers for other activities.
- **Targeted Custom Form Questions**: Added 17 conditional React Native JSX blocks strictly mapping \`selectedActivityId\` to accurate, tailored inputs matching each specific activity code (e.g. crop varieties and intercropping combos for \`ES-02\`, germination rates for \`ES-03\`, weeding observations for \`MS-03\`, risk warnings for \`MS-04\`, storage bags counts for \`END-01\`, aggregation locations for \`END-02\`, and average transaction details for \`END-03\`).
- **Crop Plan & Layout Customization**: Updated \`PS-01\` (Farmer Crop Plan Confirmation) to select one of SCL's three decided crop options (Option 1: Egusi + Drop Corn → Sesame/Cowpea, Option 2: Groundnut → Sesame, Option 3: Soybean + Drop Corn). Added an info alert explaining why entering planned acreage into the general Quantity field is required for SCL's regional area aggregation models, and added a \`useEffect\` auto-synchronization hook.
- **Layout Overlap Adjustment**: Fixed top layout spacing constraints by adding \`marginTop: 130\` to \`mainContainer\`, moving the header subplot card down to prevent it from overlapping with the floating \`CustomBackNavBar\`.

#### [MODIFY] [assessFarm.tsx](file:///c:/Users/MTECH%20COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/%28agent%29/assessFarm.tsx)
- **Layout Overlap Adjustment**: Pushed the main content card down by adding \`marginTop: 130\` to \`mainContainer\` style, preventing the subplot info card at the top from sliding behind the absolutely positioned \`CustomBackNavBar\`.

#### [MODIFY] [VcmScorecardCard.tsx](file:///c:/Users/MTECH%20COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/components/ui/VcmScorecardCard.tsx)
- Added progressive stage-by-stage locking logic: a seasonal phase (Pre-Season, Early-Season, Mid-Season, Late-Season, End-Season) is only unlocked if all activities in the previous phase are fully logged (Completed, Farmer Unavailable, or Farm Inaccessible).
- Handled touch-based validation: if a VCM attempts to open a locked phase, a native alert is displayed advising them to complete the preceding activities first.
- Re-architected stage header click behavior: when \`isFarmerProfile={true}\` is set, clicking a stage header no longer opens accordions in-place. Instead, it fires the \`onStagePress\` callback to route directly to the dedicated \`stageDetails\` page for that stage.`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated walkthrough.md!");
} else {
    console.error("Could not find target string in walkthrough.md!");
}
