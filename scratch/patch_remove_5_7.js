const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Replace Step 5 conditional check (around line 1603)
const step5Check = `{selectedActivityId !== 'PS-01' && (
                                <>
                                    {/* 5. Quantity & Unit Selection */}`;

const step5Replacement = `{false && (
                                <>
                                    {/* 5. Quantity & Unit Selection */}`;

if (content.includes(step5Check)) {
    content = content.replace(step5Check, step5Replacement);
    console.log("Successfully disabled Step 5 JSX rendering!");
} else {
    console.warn("Could not find Step 5 JSX conditional check target.");
}

// 2. Replace Step 7 conditional check (around line 1656)
const step7Check = `{selectedActivityId !== 'PS-01' && (
                                <>
                                    {/* 7. Photo Evidence */}`;

const step7Replacement = `{false && (
                                <>
                                    {/* 7. Photo Evidence */}`;

if (content.includes(step7Check)) {
    content = content.replace(step7Check, step7Replacement);
    console.log("Successfully disabled Step 7 JSX rendering!");
} else {
    console.warn("Could not find Step 7 JSX conditional check target.");
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed disabling Step 5 and Step 7 globally!");
