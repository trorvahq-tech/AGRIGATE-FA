const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)";

const targetFiles = [
    "logActivities.tsx",
    "farmerDetails.tsx",
    "assessFarm.tsx",
    "farmDetails.tsx"
];

targetFiles.forEach(fileName => {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`File ${fileName} does not exist!`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    let updated = false;

    // 1. Replace CustomBackNavBar onBackPress
    const navbarTarget1 = `onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/farmers')}`;
    const navbarTarget2 = `onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/farms')}`;
    const navbarTarget3 = `onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/farmerDetails')}`;
    const navbarTarget4 = `onBackPress={() => router.canGoBack() ? router.back() : router.replace('/(agent)/farmerDetails')}`;

    if (content.includes(navbarTarget1)) {
        content = content.replace(navbarTarget1, `onBackPress={() => router.back()}`);
        updated = true;
    }
    if (content.includes(navbarTarget2)) {
        content = content.replace(navbarTarget2, `onBackPress={() => router.back()}`);
        updated = true;
    }
    if (content.includes(navbarTarget3)) {
        content = content.replace(navbarTarget3, `onBackPress={() => router.back()}`);
        updated = true;
    }
    if (content.includes(navbarTarget4)) {
        content = content.replace(navbarTarget4, `onBackPress={() => router.back()}`);
        updated = true;
    }

    // Generic match for other instances of canGoBack in NavBar onBackPress
    const regexNavBar = /onBackPress\=\{\(\)\s*\=\>\s*router\.canGoBack\(\)\s*\?\s*router\.back\(\)\s*\:\s*router\.replace\([^\)]+\)\}/g;
    if (regexNavBar.test(content)) {
        content = content.replace(regexNavBar, `onBackPress={() => router.back()}`);
        updated = true;
    }

    // 2. Specific Alert/Redirection save callbacks inside logActivities.tsx
    if (fileName === "logActivities.tsx") {
        const logAlertTarget = `[{ text: 'OK', onPress: () => { if (router.canGoBack()) { router.back(); } else { router.replace('/(agent)/farmerDetails'); } } }]`;
        if (content.includes(logAlertTarget)) {
            content = content.replace(logAlertTarget, `[{ text: 'OK', onPress: () => router.back() }]`);
            updated = true;
        }

        const logFallbackTarget = `if (router.canGoBack()) { router.back(); } else { router.replace('/(agent)/farmerDetails'); }`;
        if (content.includes(logFallbackTarget)) {
            content = content.replace(logFallbackTarget, `router.back();`);
            updated = true;
        }
    }

    // 3. Specific Alert save callback inside assessFarm.tsx
    if (fileName === "assessFarm.tsx") {
        const assessAlertTarget = `[{ text: 'OK', onPress: () => router.push('/(agent)/farmerDetails') }]`;
        if (content.includes(assessAlertTarget)) {
            content = content.replace(assessAlertTarget, `[{ text: 'OK', onPress: () => router.back() }]`);
            updated = true;
        }
    }

    if (updated) {
        content = content.replace(/\n/g, '\r\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully patched back button redirection in ${fileName}!`);
    } else {
        console.warn(`No back button redirection target was found or modified in ${fileName}.`);
    }
});
console.log("Back button patching completed!");
