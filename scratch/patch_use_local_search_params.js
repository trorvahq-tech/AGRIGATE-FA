const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)";

const targetFiles = [
    "addSubplot.tsx",
    "addSubplotDetails.tsx",
    "farmDetailsAfterSave.tsx"
];

targetFiles.forEach(fileName => {
    const filePath = path.join(baseDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`File ${fileName} does not exist!`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    let updated = false;

    // 1. Update import
    const oldImport = `import { useRouter } from 'expo-router';`;
    const newImport = `import { useRouter, useLocalSearchParams } from 'expo-router';`;
    if (content.includes(oldImport)) {
        content = content.replace(oldImport, newImport);
        updated = true;
    }

    // 2. Declare params
    const oldDecl = `    const router = useRouter();`;
    const newDecl = `    const router = useRouter();\n    const params = useLocalSearchParams();`;
    if (content.includes(oldDecl) && !content.includes(`useLocalSearchParams();`)) {
        content = content.replace(oldDecl, newDecl);
        updated = true;
    }

    if (updated) {
        content = content.replace(/\n/g, '\r\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Successfully added useLocalSearchParams to ${fileName}!`);
    } else {
        console.warn(`No changes needed or found in ${fileName}.`);
    }
});
console.log("Completed useLocalSearchParams patching!");
