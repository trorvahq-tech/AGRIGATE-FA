const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)";

// Helper function to read file, normalize to LF, run replacement, restore CRLF, and write back
function patchFile(fileName, patcher) {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`File ${fileName} not found!`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    const newContent = patcher(content);
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent.replace(/\n/g, '\r\n'), 'utf8');
        console.log(`Successfully patched ${fileName}!`);
    } else {
        console.warn(`No changes made to ${fileName}.`);
    }
}

// 1. Patch farmerDetails.tsx
patchFile("farmerDetails.tsx", (content) => {
    // a. Update onStagePress
    const oldStagePress = `                    onStagePress={(stageId) =>
                        router.push({
                            pathname: '/(agent)/stageDetails',
                            params: { stageId: stageId, farmerName: farmerName, farmerId: farmerIdCode },
                        })
                    }`;
    const newStagePress = `                    onStagePress={(stageId) =>
                        router.push({
                            pathname: '/(agent)/stageDetails',
                            params: { stageId: stageId, farmerName: farmerName, farmerId: farmerIdCode, farmerIdParam: id },
                        })
                    }`;
    if (content.includes(oldStagePress)) {
        content = content.replace(oldStagePress, newStagePress);
    }

    // b. Update onLogActivityPress
    const oldLogPress = `                    onLogActivityPress={(actId) =>
                        router.push({
                            pathname: '/(agent)/logActivities',
                            params: { activityId: actId },
                        })
                    }`;
    const newLogPress = `                    onLogActivityPress={(actId) =>
                        router.push({
                            pathname: '/(agent)/logActivities',
                            params: { activityId: actId, farmerIdParam: id },
                        })
                    }`;
    if (content.includes(oldLogPress)) {
        content = content.replace(oldLogPress, newLogPress);
    }

    // c. Update CustomBackNavBar
    const oldNavBar = `<CustomBackNavBar title="Farmer Profile" onBackPress={() => router.back()} />`;
    const newNavBar = `<CustomBackNavBar title="Farmer Profile" onBackPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(agent)/farmers');
                        }
                    }} />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    return content;
});

// 2. Patch stageDetails.tsx
patchFile("stageDetails.tsx", (content) => {
    // a. Update checklist onPress
    const oldOnPress = `                                    onPress={() => router.push({
                                        pathname: '/(agent)/logActivities',
                                        params: { activityId: act.id, stage: stageId }
                                    })}`;
    const newOnPress = `                                    onPress={() => router.push({
                                        pathname: '/(agent)/logActivities',
                                        params: { 
                                            activityId: act.id, 
                                            stage: stageId, 
                                            farmerName: farmerName, 
                                            farmerId: farmerId, 
                                            farmerIdParam: params.farmerIdParam 
                                        }
                                    })}`;
    if (content.includes(oldOnPress)) {
        content = content.replace(oldOnPress, newOnPress);
    }

    // b. Update CustomBackNavBar
    const oldNavBar = `            <CustomBackNavBar
                title={\`\${stageSpec?.label || 'Stage'} Details\`}
                onBackPress={() => router.back()}
                textColor="white"
                blurIntensity={Platform.OS === 'ios' ? 20 : 10}
                backgroundColor="transparent"
                backButtonBackgroundColor="rgba(255,255,255,0.2)"
                iconColor="white"
            />`;
    const newNavBar = `            <CustomBackNavBar
                title={\`\${stageSpec?.label || 'Stage'} Details\`}
                onBackPress={() => {
                    if (params.farmerIdParam) {
                        router.replace({
                            pathname: '/(agent)/farmerDetails',
                            params: { id: params.farmerIdParam }
                        });
                    } else {
                        router.replace('/(agent)/farmers');
                    }
                }}
                textColor="white"
                blurIntensity={Platform.OS === 'ios' ? 20 : 10}
                backgroundColor="transparent"
                backButtonBackgroundColor="rgba(255,255,255,0.2)"
                iconColor="white"
            />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    return content;
});

// 3. Patch logActivities.tsx
patchFile("logActivities.tsx", (content) => {
    // a. Update CustomBackNavBar
    const oldNavBar = `            <CustomBackNavBar 
                title={params.stage 
                    ? \`Log \${SEASONAL_STAGES.find(s => s.id === params.stage)?.label || ''} Activities\` 
                    : "Log Activities (VCM Spec)"
                } 
                onBackPress={() => router.back()} 
            />`;
    const newNavBar = `            <CustomBackNavBar 
                title={params.stage 
                    ? \`Log \${SEASONAL_STAGES.find(s => s.id === params.stage)?.label || ''} Activities\` 
                    : "Log Activities (VCM Spec)"
                } 
                onBackPress={() => {
                    if (params.stage) {
                        router.replace({
                            pathname: '/(agent)/stageDetails',
                            params: {
                                stageId: params.stage,
                                farmerName: params.farmerName,
                                farmerId: params.farmerId,
                                farmerIdParam: params.farmerIdParam
                            }
                        });
                    } else if (params.farmerIdParam) {
                        router.replace({
                            pathname: '/(agent)/farmerDetails',
                            params: { id: params.farmerIdParam }
                        });
                    } else {
                        router.replace('/(agent)/farmers');
                    }
                }} 
            />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    // b. Update Alert saving callbacks
    const oldAlert = `[{ text: 'OK', onPress: () => router.back() }]`;
    const newAlert = `[{ text: 'OK', onPress: () => {
                if (params.stage) {
                    router.replace({
                        pathname: '/(agent)/stageDetails',
                        params: {
                            stageId: params.stage,
                            farmerName: params.farmerName,
                            farmerId: params.farmerId,
                            farmerIdParam: params.farmerIdParam
                        }
                    });
                } else if (params.farmerIdParam) {
                    router.replace({
                        pathname: '/(agent)/farmerDetails',
                        params: { id: params.farmerIdParam }
                    });
                } else {
                    router.replace('/(agent)/farmers');
                }
            } }]`;
    if (content.includes(oldAlert)) {
        content = content.replace(oldAlert, newAlert);
    }

    // c. Update trailing fallback
    const oldFallback = `        router.back();`;
    const newFallback = `        if (params.stage) {
            router.replace({
                pathname: '/(agent)/stageDetails',
                params: {
                    stageId: params.stage,
                    farmerName: params.farmerName,
                    farmerId: params.farmerId,
                    farmerIdParam: params.farmerIdParam
                }
            });
        } else if (params.farmerIdParam) {
            router.replace({
                pathname: '/(agent)/farmerDetails',
                params: { id: params.farmerIdParam }
            });
        } else {
            router.replace('/(agent)/farmers');
        }`;
    if (content.includes(oldFallback)) {
        content = content.replace(oldFallback, newFallback);
    }

    // d. Update continue mapping flow navigate to addSubplot
    const oldMapButton = `{ text: "Continue", onPress: () => router.push('/(agent)/addSubplot') }`;
    const newMapButton = `{ text: "Continue", onPress: () => router.push({ pathname: '/(agent)/addSubplot', params: { referrer: '/(agent)/logActivities', farmerIdParam: params.farmerIdParam, activityId: selectedActivityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } }) }`;
    if (content.includes(oldMapButton)) {
        content = content.replace(oldMapButton, newMapButton);
    }

    return content;
});

// 4. Patch addSubplot.tsx
patchFile("addSubplot.tsx", (content) => {
    // a. Update CustomBackNavBar
    const oldNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => router.replace('/farmTabDetails')} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />`;
    const newNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => {
                if (params.referrer === '/(agent)/logActivities') {
                    router.replace({
                        pathname: '/(agent)/logActivities',
                        params: {
                            activityId: params.activityId,
                            stage: params.stage,
                            farmerName: params.farmerName,
                            farmerId: params.farmerId,
                            farmerIdParam: params.farmerIdParam
                        }
                    });
                } else if (params.farmerIdParam) {
                    router.replace({
                        pathname: '/(agent)/farmerDetails',
                        params: { id: params.farmerIdParam }
                    });
                } else {
                    router.replace('/(agent)/farmers');
                }
            }} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    // b. Update start mapping navigation
    const oldStartMapping = `onPress={() => router.push('/addSubplotDetails')}`;
    const newStartMapping = `onPress={() => router.push({ pathname: '/(agent)/addSubplotDetails', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } })}`;
    if (content.includes(oldStartMapping)) {
        content = content.replace(oldStartMapping, newStartMapping);
    }

    return content;
});

// 5. Patch addSubplotDetails.tsx
patchFile("addSubplotDetails.tsx", (content) => {
    // a. Update CustomBackNavBar
    const oldNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => router.replace('/(agent)/addSubplot')} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />`;
    const newNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => router.replace({ pathname: '/(agent)/addSubplot', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } })} backgroundColor={isDarkMode ? colors.navbarBackground : "#FFFFFF4D"} blurIntensity={20} textColor={isDarkMode ? colors.text : "#0A0C11"} />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    // b. Update edit point button
    const oldEditPoint = `onPress={() => router.replace('/(agent)/addSubplot')}`;
    const newEditPoint = `onPress={() => router.replace({ pathname: '/(agent)/addSubplot', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } })}`;
    if (content.includes(oldEditPoint)) {
        content = content.replace(oldEditPoint, newEditPoint);
    }

    // c. Update save button handleSave function
    const oldHandleSave = `    const handleSave = () => {
        router.push('/(agent)/farmDetailsAfterSave');
    };`;
    const newHandleSave = `    const handleSave = () => {
        router.push({ pathname: '/(agent)/farmDetailsAfterSave', params: { referrer: params.referrer, farmerIdParam: params.farmerIdParam, activityId: params.activityId, stage: params.stage, farmerName: params.farmerName, farmerId: params.farmerId } });
    };`;
    if (content.includes(oldHandleSave)) {
        content = content.replace(oldHandleSave, newHandleSave);
    }

    return content;
});

// 6. Patch farmDetailsAfterSave.tsx
patchFile("farmDetailsAfterSave.tsx", (content) => {
    // a. Update CustomBackNavBar
    const oldNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => router.replace('/farmTabDetails')} backgroundColor={isDarkMode ? colors.cardSecondary : "#FFFFFF4D"} blurIntensity={20} textColor={colors.text} />`;
    const newNavBar = `<CustomBackNavBar title="James Joe" onBackPress={() => {
                if (params.referrer === '/(agent)/logActivities') {
                    router.replace({
                        pathname: '/(agent)/logActivities',
                        params: {
                            activityId: params.activityId,
                            stage: params.stage,
                            farmerName: params.farmerName,
                            farmerId: params.farmerId,
                            farmerIdParam: params.farmerIdParam
                        }
                    });
                } else if (params.farmerIdParam) {
                    router.replace({
                        pathname: '/(agent)/farmerDetails',
                        params: { id: params.farmerIdParam }
                    });
                } else {
                    router.replace('/(agent)/farmers');
                }
            }} backgroundColor={isDarkMode ? colors.cardSecondary : "#FFFFFF4D"} blurIntensity={20} textColor={colors.text} />`;
    if (content.includes(oldNavBar)) {
        content = content.replace(oldNavBar, newNavBar);
    }

    return content;
});

console.log("All agent navigation paths successfully verified and patched!");
