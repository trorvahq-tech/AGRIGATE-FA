const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `    React.useEffect(() => {
        if (params.stage) {
            const stg = params.stage as SeasonalStage;
            setSelectedStage(stg);
            setActivityMode('vcm_seasonal');
            
            // Auto-align first activity of that stage
            const firstSpec = Object.values(VCM_ACTIVITY_DICTIONARY).find((a) => a.stage === stg);
            if (firstSpec) {
                setSelectedActivityId(firstSpec.id);
            }
        }
    }, [params.stage]);`;

const replacementStr = `    React.useEffect(() => {
        if (params.stage && !params.activityId) {
            const stg = params.stage as SeasonalStage;
            setSelectedStage(stg);
            setActivityMode('vcm_seasonal');
            
            // Auto-align first activity of that stage
            const firstSpec = Object.values(VCM_ACTIVITY_DICTIONARY).find((a) => a.stage === stg);
            if (firstSpec) {
                setSelectedActivityId(firstSpec.id);
            }
        }
    }, [params.stage, params.activityId]);`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log("Successfully resolved parameter conflict!");
} else {
    console.error("Could not find the target useEffect block!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching useEffect parameter conflict in logActivities.tsx!");
