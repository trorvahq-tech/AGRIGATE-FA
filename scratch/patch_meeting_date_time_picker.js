const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/mtgDetails.tsx";
if (!fs.existsSync(filePath)) {
    console.error("mtgDetails.tsx does not exist!");
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Declare state variables
const oldStates = `    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingPurpose, setMeetingPurpose] = useState('planting_intent');
    const [meetingVenue, setMeetingVenue] = useState('Village Primary School Field');
    const [meetingDate, setMeetingDate] = useState('2026-05-12 at 10:00 AM');
    const [meetingNotes, setMeetingNotes] = useState('');`;

const newStates = `    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingPurpose, setMeetingPurpose] = useState('planting_intent');
    const [meetingVenue, setMeetingVenue] = useState('Village Primary School Field');
    const [meetingDate, setMeetingDate] = useState('2026-05-12');
    const [meetingTime, setMeetingTime] = useState('10:00 AM');
    const [meetingNotes, setMeetingNotes] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(2026);
    const [pickerMonth, setPickerMonth] = useState(4); // May is 4
    const [pickerHour, setPickerHour] = useState(10);
    const [pickerMinute, setPickerMinute] = useState('00');
    const [pickerPeriod, setPickerPeriod] = useState('AM');`;

if (content.includes(oldStates)) {
    content = content.replace(oldStates, newStates);
} else {
    console.error("Could not find state declaration section in mtgDetails.tsx!");
    process.exit(1);
}

// 2. Update handleLogMeeting parser
const oldParser = `        let isoDate = new Date().toISOString();
        try {
            const cleanDateStr = meetingDate.replace(' at ', ' ');
            const parsed = Date.parse(cleanDateStr);
            if (!isNaN(parsed)) {
                isoDate = new Date(parsed).toISOString();
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                isoDate = tomorrow.toISOString();
            }
        } catch (e) {
            console.warn("Could not parse date string", e);
        }`;

const newParser = `        let isoDate = new Date().toISOString();
        try {
            const cleanDateStr = \`\${meetingDate} \${meetingTime}\`;
            const parsed = Date.parse(cleanDateStr);
            if (!isNaN(parsed)) {
                isoDate = new Date(parsed).toISOString();
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                isoDate = tomorrow.toISOString();
            }
        } catch (e) {
            console.warn("Could not parse date string", e);
        }`;

if (content.includes(oldParser)) {
    content = content.replace(oldParser, newParser);
} else {
    console.error("Could not find date parser in handleLogMeeting!");
    process.exit(1);
}

// 3. Replace text input with separate date/time touchable picker buttons in the modal markup
const oldInputsMarkup = `                        <Text style={styles.inputLabelText}>3. Date & Time</Text>
                        <TextInput
                            style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                            value={meetingDate}
                            onChangeText={setMeetingDate}
                            placeholder="e.g. May 12 at 10:00 AM"
                            placeholderTextColor={colors.textMuted}
                        />

                        <Text style={styles.inputLabelText}>4. Key Outcomes & Crop/Input Intent Notes</Text>`;

const newInputsMarkup = `                        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabelText}>3. Date</Text>
                                <TouchableOpacity 
                                    onPress={() => setIsDatePickerOpen(true)}
                                    style={{ 
                                        borderColor: colors.border,
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        height: 44,
                                        paddingHorizontal: 12,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF'
                                    }}
                                >
                                    <Text style={{ color: colors.text, fontSize: 13 }}>{meetingDate}</Text>
                                    <Feather name="calendar" size={16} color="#0E6F6A" />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabelText}>4. Time</Text>
                                <TouchableOpacity 
                                    onPress={() => setIsTimePickerOpen(true)}
                                    style={{ 
                                        borderColor: colors.border,
                                        flexDirection: 'row', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        height: 44,
                                        paddingHorizontal: 12,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF'
                                    }}
                                >
                                    <Text style={{ color: colors.text, fontSize: 13 }}>{meetingTime}</Text>
                                    <Feather name="clock" size={16} color="#0E6F6A" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.inputLabelText}>5. Key Outcomes & Crop/Input Intent Notes</Text>`;

if (content.includes(oldInputsMarkup)) {
    content = content.replace(oldInputsMarkup, newInputsMarkup);
} else {
    console.error("Could not find input markup section in modal!");
    process.exit(1);
}

// Adjust label 5 to 6 in modal
content = content.replace(
    `<Text style={styles.inputLabelText}>5. Roll Call Attendance</Text>`,
    `<Text style={styles.inputLabelText}>6. Roll Call Attendance</Text>`
);

// 4. Append Date and Time picker modals just before final closing tag </View>
const closingView = `        </View>
    );
}`;

const pickersMarkup = `
            {/* Custom Premium Calendar Date Picker Modal */}
            <Modal
                isVisible={isDatePickerOpen}
                onBackdropPress={() => setIsDatePickerOpen(false)}
                style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
                useNativeDriver
            >
                <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 16, width: '90%', maxWidth: 340, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }}>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Select Date</Text>
                        <TouchableOpacity onPress={() => setIsDatePickerOpen(false)}>
                            <Feather name="x" size={20} color={colors.textSecondary || colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderRadius: 10, padding: 8 }}>
                        <TouchableOpacity 
                            onPress={() => {
                                if (pickerMonth === 0) {
                                    setPickerMonth(11);
                                    setPickerYear(pickerYear - 1);
                                } else {
                                    setPickerMonth(pickerMonth - 1);
                                }
                            }}
                            style={{ padding: 6 }}
                        >
                            <Feather name="chevron-left" size={18} color="#0E6F6A" />
                        </TouchableOpacity>
                        
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                            {new Date(pickerYear, pickerMonth).toLocaleString('default', { month: 'long' })} {pickerYear}
                        </Text>
                        
                        <TouchableOpacity 
                            onPress={() => {
                                if (pickerMonth === 11) {
                                    setPickerMonth(0);
                                    setPickerYear(pickerYear + 1);
                                } else {
                                    setPickerMonth(pickerMonth + 1);
                                }
                            }}
                            style={{ padding: 6 }}
                        >
                            <Feather name="chevron-right" size={18} color="#0E6F6A" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <View key={day} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>{day}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {Array.from({ length: new Date(pickerYear, pickerMonth, 1).getDay() }).map((_, i) => (
                            <View key={\`empty-\${i}\`} style={{ width: '14.28%', height: 36 }} />
                        ))}
                        
                        {Array.from({ length: new Date(pickerYear, pickerMonth + 1, 0).getDate() }).map((_, i) => {
                            const dayNum = i + 1;
                            const mm = String(pickerMonth + 1).padStart(2, '0');
                            const dd = String(dayNum).padStart(2, '0');
                            const dateString = \`\${pickerYear}-\${mm}-\${dd}\`;
                            
                            const isSelected = meetingDate === dateString;

                            return (
                                <TouchableOpacity 
                                    key={\`day-\${dayNum}\`} 
                                    onPress={() => {
                                        setMeetingDate(dateString);
                                        setIsDatePickerOpen(false);
                                    }}
                                    style={{ 
                                        width: '14.28%', 
                                        height: 36, 
                                        justifyContent: 'center', 
                                        alignItems: 'center', 
                                        borderRadius: 18, 
                                        backgroundColor: isSelected ? '#0E6F6A' : 'transparent',
                                        marginVertical: 1
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>
                                        {dayNum}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </View>
            </Modal>

            {/* Custom Premium Time Picker Modal */}
            <Modal
                isVisible={isTimePickerOpen}
                onBackdropPress={() => setIsTimePickerOpen(false)}
                style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
                useNativeDriver
            >
                <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderRadius: 16, width: '90%', maxWidth: 300, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }}>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Select Time</Text>
                        <TouchableOpacity onPress={() => setIsTimePickerOpen(false)}>
                            <Feather name="x" size={20} color={colors.textSecondary || colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>Hour</Text>
                            <ScrollView style={{ height: 120, width: '100%' }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
                                    const isSelected = pickerHour === h;
                                    return (
                                        <TouchableOpacity 
                                            key={\`hour-\${h}\`} 
                                            onPress={() => setPickerHour(h)}
                                            style={{ paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: isSelected ? '#0E6F6A' : 'transparent', marginVertical: 2 }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>{h}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>Minute</Text>
                            <ScrollView style={{ height: 120, width: '100%' }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                                {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => {
                                    const isSelected = pickerMinute === m;
                                    return (
                                        <TouchableOpacity 
                                            key={\`minute-\${m}\`} 
                                            onPress={() => setPickerMinute(m)}
                                            style={{ paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: isSelected ? '#0E6F6A' : 'transparent', marginVertical: 2 }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>{m}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View style={{ width: 60, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 }}>Period</Text>
                            <View style={{ gap: 4, width: '100%' }}>
                                {['AM', 'PM'].map(p => {
                                    const isSelected = pickerPeriod === p;
                                    return (
                                        <TouchableOpacity 
                                            key={\`period-\${p}\`} 
                                            onPress={() => setPickerPeriod(p)}
                                            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 8, backgroundColor: isSelected ? '#0E6F6A' : 'transparent' }}
                                        >
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>{p}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={() => {
                            setMeetingTime(\`\${pickerHour}:\${pickerMinute} \${pickerPeriod}\`);
                            setIsTimePickerOpen(false);
                        }}
                        style={{ backgroundColor: '#0E6F6A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                    >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Confirm Time</Text>
                    </TouchableOpacity>

                </View>
            </Modal>
`;

if (content.includes(closingView)) {
    content = content.replace(closingView, pickersMarkup + closingView);
    fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
    console.log("Successfully patched Date and Time pickers into mtgDetails.tsx!");
} else {
    console.error("Could not find closing view tag in mtgDetails.tsx!");
    process.exit(1);
}
