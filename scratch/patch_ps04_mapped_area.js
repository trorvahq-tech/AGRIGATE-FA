const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `                            {/* PS-04 Plot Location */}
                            {selectedActivityId === 'PS-04' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Farm Location accessibility questions</Text>`;

const replacementStr = `                            {/* PS-04 Plot Location */}
                            {selectedActivityId === 'PS-04' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Farm Location accessibility questions</Text>
                                    
                                    {/* Already Mapped Land Area */}
                                    <View style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        backgroundColor: isDarkMode ? '#1E293B' : '#F0FDFA', 
                                        borderWidth: 1, 
                                        borderColor: '#0D948833', 
                                        borderRadius: 8, 
                                        padding: 10, 
                                        marginBottom: 12,
                                        gap: 8 
                                    }}>
                                        <Feather name="map" size={16} color="#0D9488" />
                                        <View>
                                            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Already Mapped Land Area</Text>
                                            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>2.5 Hectares (ha)</Text>
                                        </View>
                                    </View>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log("Successfully added Already Mapped Land Area callout to PS-04!");
} else {
    console.error("Could not find the target PS-04 block in logActivities.tsx!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching logActivities.tsx for PS-04!");
