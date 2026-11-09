const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `                            /* Specialized Crop Growth & Health Monitoring Fields */`;
const replacementStr = `                            {/* Specialized Crop Growth & Health Monitoring Fields */}`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log("Successfully fixed the JSX comment syntax!");
} else {
    console.error("Could not find the target comment string in logActivities.tsx!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching JSX comment!");
