const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

const formTarget = `                                    {/* 3. Add Item Configuration Form */}
                                    {ps02AddingItem && (
                                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.primary + '33', gap: 8, marginBottom: 12 }}>
                                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>Configure Requirement: {ps02AddingItem.name}</Text>
                                            
                                            <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Quantity Required</Text>
                                            <TextInput
                                                style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, height: 38 }]}
                                                placeholder="e.g. 50"
                                                placeholderTextColor={colors.textMuted}
                                                value={ps02AddingQty}
                                                onChangeText={setPs02AddingQty}
                                                keyboardType="numeric"
                                            />

                                            <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>Measurement Unit</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                                {['kg', 'litres', 'bags', 'sachets', 'bundles'].map(u => (
                                                    <TouchableOpacity 
                                                        key={u} 
                                                        style={{ 
                                                            paddingHorizontal: 8, 
                                                            paddingVertical: 4, 
                                                            borderRadius: 12, 
                                                            backgroundColor: ps02AddingUnit === u ? colors.primary : (isDarkMode ? '#334155' : '#E2E8F0') 
                                                        }}
                                                        onPress={() => setPs02AddingUnit(u)}
                                                    >
                                                        <Text style={{ color: ps02AddingUnit === u ? '#FFF' : colors.text, fontSize: 10, fontWeight: '600' }}>{u}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                                <TouchableOpacity 
                                                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: colors.border }}
                                                    onPress={() => setPs02AddingItem(null)}
                                                >
                                                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity 
                                                    style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                                                    onPress={() => {
                                                        if (!ps02AddingQty.trim() || isNaN(parseFloat(ps02AddingQty))) {
                                                            Alert.alert("Invalid Quantity", "Please enter a valid numeric quantity.");
                                                            return;
                                                        }
                                                        // Check if already in list, if so update it
                                                        const exists = ps02SelectedItems.some(i => i.id === ps02AddingItem.id);
                                                        if (exists) {
                                                            setPs02SelectedItems(ps02SelectedItems.map(i => 
                                                                i.id === ps02AddingItem.id ? { ...i, qty: ps02AddingQty, unit: ps02AddingUnit } : i
                                                            ));
                                                        } else {
                                                            setPs02SelectedItems([...ps02SelectedItems, {
                                                                id: ps02AddingItem.id,
                                                                name: ps02AddingItem.name,
                                                                qty: ps02AddingQty,
                                                                unit: ps02AddingUnit
                                                            }]);
                                                        }
                                                        setPs02AddingItem(null);
                                                        setPs02SearchQuery('');
                                                    }}
                                                >
                                                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Add Input</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}`;

const formReplacement = `                                    {/* 3. Add Item Configuration Row */}
                                    {ps02AddingItem && (
                                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.primary + '33', marginBottom: 12 }}>
                                            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                                                Adding: {ps02AddingItem.name}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                {/* Quantity Input */}
                                                <View style={{ flex: 1.5 }}>
                                                    <TextInput
                                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, height: 38, paddingHorizontal: 8, fontSize: 12 }]}
                                                        placeholder="Qty (e.g. 50)"
                                                        placeholderTextColor={colors.textMuted}
                                                        value={ps02AddingQty}
                                                        onChangeText={setPs02AddingQty}
                                                        keyboardType="numeric"
                                                    />
                                                </View>

                                                {/* Metric/Unit Selector */}
                                                <View style={{ flex: 2, flexDirection: 'row', backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 8, height: 38, padding: 2, gap: 2 }}>
                                                    {['kg', 'litres', 'bags', 'sachets', 'bundles'].map(u => {
                                                        const selected = ps02AddingUnit === u;
                                                        return (
                                                            <TouchableOpacity 
                                                                key={u} 
                                                                style={{ 
                                                                    flex: 1,
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    borderRadius: 6,
                                                                    backgroundColor: selected ? colors.primary : 'transparent'
                                                                }}
                                                                onPress={() => setPs02AddingUnit(u)}
                                                            >
                                                                <Text style={{ color: selected ? '#FFF' : colors.textSecondary, fontSize: 9, fontWeight: '700' }}>
                                                                    {u}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>

                                                {/* Add Button */}
                                                <TouchableOpacity 
                                                    style={{ backgroundColor: colors.primary, height: 38, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                                                    onPress={() => {
                                                        if (!ps02AddingQty.trim() || isNaN(parseFloat(ps02AddingQty))) {
                                                            Alert.alert("Invalid Quantity", "Please enter a valid numeric quantity.");
                                                            return;
                                                        }
                                                        const exists = ps02SelectedItems.some(i => i.id === ps02AddingItem.id);
                                                        if (exists) {
                                                            setPs02SelectedItems(ps02SelectedItems.map(i => 
                                                                i.id === ps02AddingItem.id ? { ...i, qty: ps02AddingQty, unit: ps02AddingUnit } : i
                                                            ));
                                                        } else {
                                                            setPs02SelectedItems([...ps02SelectedItems, {
                                                                id: ps02AddingItem.id,
                                                                name: ps02AddingItem.name,
                                                                qty: ps02AddingQty,
                                                                unit: ps02AddingUnit
                                                            }]);
                                                        }
                                                        setPs02AddingItem(null);
                                                        setPs02SearchQuery('');
                                                    }}
                                                >
                                                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Add</Text>
                                                </TouchableOpacity>

                                                {/* Cancel Button */}
                                                <TouchableOpacity 
                                                    style={{ borderColor: colors.border, borderWidth: 1, height: 38, width: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inputBackground }}
                                                    onPress={() => setPs02AddingItem(null)}
                                                >
                                                    <Feather name="x" size={14} color={colors.textSecondary} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}`;

if (content.includes(formTarget)) {
    content = content.replace(formTarget, formReplacement);
    console.log("Successfully replaced configure form with horizontal layout!");
} else {
    console.error("Could not find the target configuration form block!");
    process.exit(1);
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching logActivities.tsx for PS-02 horizontal config form!");
