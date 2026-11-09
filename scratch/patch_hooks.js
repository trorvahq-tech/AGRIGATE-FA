const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Locate the target area right after setSalesTransactionId('');
const targetStr = `                setSalesTransactionId('');
            }
`;

const insertIndex = content.indexOf(targetStr);

if (insertIndex === -1) {
    console.error("Could not find reset end target!");
    process.exit(1);
}

// 2. We want to replace from targetStr up to mediaTypes: ['images'],
const startOfRest = content.indexOf(`            mediaTypes: ['images'],`);

if (startOfRest === -1) {
    console.error("Could not find startOfRest!");
    process.exit(1);
}

const replacement = `                setSalesTransactionId('');
            }
        }
    }, [params.activityId]);

    React.useEffect(() => {
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
    }, [params.stage]);

    React.useEffect(() => {
        if (selectedActivityId === 'PS-01') {
            setQuantityValue(plannedCropArea);
            setSelectedUnit('bags');
        }
    }, [plannedCropArea, selectedActivityId]);

    const activeSpec = VCM_ACTIVITY_DICTIONARY[selectedActivityId];

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
`;

// Do the replacement
content = content.slice(0, insertIndex) + replacement + content.slice(startOfRest + `            mediaTypes: ['images'],\n`.length);

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully restored hooks, pickImage, and activeSpec!");
