const fs = require('fs');
const path = require('path');

const baseDir = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)";

// 1. Patch mtgDetails.tsx
const mtgPath = path.join(baseDir, "mtgDetails.tsx");
if (fs.existsSync(mtgPath)) {
    let content = fs.readFileSync(mtgPath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    let updated = false;

    // Replace the two onPress occurrences inside farmers tab render
    const target1 = `                                onPress={() => router.push('/(agent)/farmerDetails')}`;
    const replacement1 = `                                onPress={() => router.push({ pathname: '/(agent)/farmerDetails', params: { id: farmer.id } })}`;

    const target2 = `                                    onPress={() => router.push('/(agent)/farmerDetails')}`;
    const replacement2 = `                                    onPress={() => router.push({ pathname: '/(agent)/farmerDetails', params: { id: farmer.id } })}`;

    if (content.includes(target1)) {
        content = content.replace(target1, replacement1);
        updated = true;
    }
    // Perform replacement again for target2 (or double check if they are identical in formatting)
    if (content.includes(target2)) {
        content = content.replace(target2, replacement2);
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(mtgPath, content.replace(/\n/g, '\r\n'), 'utf8');
        console.log("Successfully patched mtgDetails.tsx!");
    } else {
        console.warn("Could not find targets in mtgDetails.tsx!");
    }
}

// 2. Patch selectFarm.tsx
const selectFarmPath = path.join(baseDir, "selectFarm.tsx");
if (fs.existsSync(selectFarmPath)) {
    let content = fs.readFileSync(selectFarmPath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    const target = `onBackPress={() => params.farmerId ? router.replace('/(agent)/farmerDetails') : router.replace('/(agent)' as any)}`;
    const replacement = `onBackPress={() => params.farmerId ? router.replace({ pathname: '/(agent)/farmerDetails', params: { id: params.farmerId } }) : router.replace('/(agent)' as any)}`;

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(selectFarmPath, content.replace(/\n/g, '\r\n'), 'utf8');
        console.log("Successfully patched selectFarm.tsx!");
    } else {
        console.warn("Could not find targets in selectFarm.tsx!");
    }
}
