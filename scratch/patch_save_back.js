const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Update Alert.alert OK press
const alertOkTarget = `[{ text: 'OK', onPress: () => router.push('/(agent)/farmerDetails') }]`;
const alertOkReplacement = `[{ text: 'OK', onPress: () => { if (router.canGoBack()) { router.back(); } else { router.replace('/(agent)/farmerDetails'); } } }]`;

if (content.includes(alertOkTarget)) {
    content = content.replace(alertOkTarget, alertOkReplacement);
    console.log("Successfully updated Alert.alert OK redirection!");
} else {
    console.warn("Could not find Alert.alert OK redirection target.");
}

// 2. Update final fallback route
const finalRedirTarget = `        router.push('/(agent)/farmerDetails');`;
const finalRedirReplacement = `        if (router.canGoBack()) { router.back(); } else { router.replace('/(agent)/farmerDetails'); }`;

if (content.includes(finalRedirTarget)) {
    content = content.replace(finalRedirTarget, finalRedirReplacement);
    console.log("Successfully updated final fallback redirection!");
} else {
    console.warn("Could not find final fallback redirection target.");
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching save redirection in logActivities.tsx!");
