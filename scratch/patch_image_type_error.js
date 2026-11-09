const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `                                            <Image source={{ uri: evidenceImage }} style={styles.imagePreview} />`;
const replacementStr = `                                            <Image source={{ uri: evidenceImage || undefined }} style={styles.imagePreview} />`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log("Successfully fixed Image uri type checking!");
} else {
    console.error("Could not find the target Image component!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching Image type checking!");
