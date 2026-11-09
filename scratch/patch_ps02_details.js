const fs = require('fs');
const path = require('path');

const filePath = "c:/Users/MTECH COMPUTERS/SMALLHOLDERS-FARM-MANAGEMENT-MOBILE-APPLICATION/app/(agent)/logActivities.tsx";
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Add Type to RECORDED_INPUTS_DB (around line 75)
const typeTarget = `    salesPricePerUnit?: string;
    salesTransactionId?: string;
}`;

const typeReplacement = `    salesPricePerUnit?: string;
    salesTransactionId?: string;
    ps02SelectedItems?: { id: string; name: string; qty: string; unit: string }[];
}`;

if (content.includes(typeTarget)) {
    content = content.replace(typeTarget, typeReplacement);
    console.log("Successfully added ps02SelectedItems to database type!");
} else {
    console.warn("Could not find database type target.");
}

// 2. Add PS-02 pre-seeded value in RECORDED_INPUTS_DB (around lines 84-90)
const ps02DbTarget = `    'PS-02': {
        seedDemandKg: '50',
        seedGapStatus: 'Seed Available (No Gap)',
        notes: 'Improved SAMMAZ 52 maize seeds sourced.',
        attemptStatus: 'completed',
        gps: '8.4921° N, 4.5448° E',
    },`;

const ps02DbReplacement = `    'PS-02': {
        seedDemandKg: '50',
        seedGapStatus: 'Seed Available (No Gap)',
        notes: 'Improved SAMMAZ 52 maize seeds sourced.',
        attemptStatus: 'completed',
        gps: '8.4921° N, 4.5448° E',
        ps02SelectedItems: [
            { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' },
            { id: 'npk-blend', name: 'NPK 15:15:15 Organic Blend', qty: '2', unit: 'bags' }
        ]
    },`;

if (content.includes(ps02DbTarget)) {
    content = content.replace(ps02DbTarget, ps02DbReplacement);
    console.log("Successfully added pre-seeded items to PS-02 database!");
} else {
    console.warn("Could not find PS-02 database target.");
}

// 3. Register PS02_CATALOG right before the Type ActivityMode (around line 194-196)
const modeTarget = `type ActivityMode = 'vcm_seasonal' | 'crop_general' | 'livestock';`;
const catalogReplacement = `const PS02_CATALOG = [
    { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'egusi-seed', name: 'Improved Egusi (Melon) Seed', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'soy-seed', name: 'Soybean Seed (TGX-1448-2E)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'sorghum-seed', name: 'Sorghum Seed (SAMSORG-45)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'rice-seed', name: 'Rice Seed (FARO-44)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'cowpea-seed', name: 'Cowpea Seed (SAMPEA-11)', category: 'Seeds', defaultUnit: 'kg' },
    { id: 'bio-fert', name: 'Bio-Fertilizer (Liquid Organics)', category: 'Bio-Inputs', defaultUnit: 'litres' },
    { id: 'npk-blend', name: 'NPK 15:15:15 Organic Blend', category: 'Fertilizers', defaultUnit: 'bags' },
    { id: 'urea', name: 'Urea Fertilizer', category: 'Fertilizers', defaultUnit: 'bags' },
    { id: 'neem-pest', name: 'Neem Extract Bio-Pesticide', category: 'Bio-Inputs', defaultUnit: 'litres' },
    { id: 'tricho-fung', name: 'Trichoderma Bio-Fungicide', category: 'Bio-Inputs', defaultUnit: 'sachets' },
    { id: 'pics-bags', name: 'Hermetic PICS Bags', category: 'Equipment', defaultUnit: 'bags' },
    { id: 'tractor-credit', name: 'Tractor Prep Voucher', category: 'Services', defaultUnit: 'bundles' },
];

type ActivityMode = 'vcm_seasonal' | 'crop_general' | 'livestock';`;

if (content.includes(modeTarget)) {
    content = content.replace(modeTarget, catalogReplacement);
    console.log("Successfully registered PS02_CATALOG!");
} else {
    console.warn("Could not find ActivityMode definition.");
}

// 4. Add state variables inside the LogActivitiesScreen component (around lines 290-300)
const stateTarget = `    const [salesPricePerUnit, setSalesPricePerUnit] = useState('450');
    const [salesTransactionId, setSalesTransactionId] = useState('TXN-JUR-8839');`;

const stateReplacement = `    const [salesPricePerUnit, setSalesPricePerUnit] = useState('450');
    const [salesTransactionId, setSalesTransactionId] = useState('TXN-JUR-8839');

    // PS-02 Dynamic Input Requirements & Gaps
    const [ps02SearchQuery, setPs02SearchQuery] = useState('');
    const [ps02SelectedItems, setPs02SelectedItems] = useState<{ id: string; name: string; qty: string; unit: string }[]>([
        { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' }
    ]);
    const [ps02AddingItem, setPs02AddingItem] = useState<{ id: string; name: string; category: string; defaultUnit: string } | null>(null);
    const [ps02AddingQty, setPs02AddingQty] = useState('');
    const [ps02AddingUnit, setPs02AddingUnit] = useState('kg');`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
    console.log("Successfully added state variables for PS-02!");
} else {
    console.warn("Could not find state target.");
}

// 5. Add hydration/reset inside useEffect params.activityId (around lines 390-440)
const hydrateTarget = `                if (recorded.salesPricePerUnit) setSalesPricePerUnit(recorded.salesPricePerUnit);
                if (recorded.salesTransactionId) setSalesTransactionId(recorded.salesTransactionId);`;

const hydrateReplacement = `                if (recorded.salesPricePerUnit) setSalesPricePerUnit(recorded.salesPricePerUnit);
                if (recorded.salesTransactionId) setSalesTransactionId(recorded.salesTransactionId);
                if (recorded.ps02SelectedItems) setPs02SelectedItems(recorded.ps02SelectedItems);`;

if (content.includes(hydrateTarget)) {
    content = content.replace(hydrateTarget, hydrateReplacement);
    console.log("Successfully added hydration for ps02SelectedItems!");
} else {
    console.warn("Could not find hydration target.");
}

const resetTarget = `                setSalesPricePerUnit('450');
                setSalesTransactionId('');`;

const resetReplacement = `                setSalesPricePerUnit('450');
                setSalesTransactionId('');
                setPs02SelectedItems([
                    { id: 'tela-maize', name: 'TELA Maize Seed (SAMMAZ-52)', qty: '50', unit: 'kg' }
                ]);
                setPs02SearchQuery('');
                setPs02AddingItem(null);`;

if (content.includes(resetTarget)) {
    content = content.replace(resetTarget, resetReplacement);
    console.log("Successfully added reset values for ps02SelectedItems!");
} else {
    console.warn("Could not find reset target.");
}

// 6. Update handleSave to persist input list inside RECORDED_INPUTS_DB
const handleSaveTarget = `            const isEditMode = !!(selectedActivityId && RECORDED_INPUTS_DB[selectedActivityId]);

            Alert.alert(
                isEditMode ? 'VCM Activity Updated' : 'VCM Activity Recorded',`;

const handleSaveReplacement = `            const isEditMode = !!(selectedActivityId && RECORDED_INPUTS_DB[selectedActivityId]);

            // Save to mock database
            RECORDED_INPUTS_DB[selectedActivityId] = {
                ...RECORDED_INPUTS_DB[selectedActivityId],
                attemptStatus,
                reason: attemptReason,
                notes: notes || undefined,
                gps: gpsCoordinates || undefined,
                intendedCropPlan,
                plannedCropArea,
                seedDemandKg,
                seedGapStatus,
                ps02SelectedItems, // save dynamic gaps
                financeNaira,
                financeInputsNeeded,
                plotAccessibility,
                plotCultivationStatus,
                landPrepMethod,
                soilMoisture,
                bioInputDelivered,
                bioInputDeliveryStatus,
                bioInputAppMethod,
                bioInputAppDate,
                practicesObserved,
                pestDensity,
                cropHealthRating,
                riskWarningType,
                expectedHarvestDate,
                intendedStorageChannel,
                storageCompliance,
                storageBagsCount,
                aggregationHub,
                aggregationTransport,
                salesPricePerUnit,
                salesTransactionId,
            };

            Alert.alert(
                isEditMode ? 'VCM Activity Updated' : 'VCM Activity Recorded',`;

if (content.includes(handleSaveTarget)) {
    content = content.replace(handleSaveTarget, handleSaveReplacement);
    console.log("Successfully updated handleSave to persist database items!");
} else {
    console.warn("Could not find handleSave target.");
}

// 7. Replace the PS-02 subform
const ps02FormTarget = `                            {/* PS-02 Seed Gaps */}
                            {selectedActivityId === 'PS-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Seed Requirement Questions</Text>
                                    <Text style={[styles.subFieldLabel, { color: colors.text }]}>• Estimated Seed Demand Volume (kg)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                                        placeholder="e.g. 50"
                                        value={seedDemandKg}
                                        onChangeText={setSeedDemandKg}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8 }]}>• Seed Sourcing & Gap Status</Text>
                                    <View style={styles.optionWrap}>
                                        {['Seed Available (No Gap)', 'Gap Present (Needs Sourcing Assistance)'].map(status => (
                                            <TouchableOpacity key={status} style={[styles.chipPill, seedGapStatus === status && styles.chipPillActive]} onPress={() => setSeedGapStatus(status)}>
                                                <Text style={[styles.chipText, seedGapStatus === status && styles.chipTextActive]}>{status}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}`;

const ps02FormReplacement = `                            {/* PS-02 Seed Gaps & Input Requirements */}
                            {selectedActivityId === 'PS-02' && (
                                <View style={[styles.cardBox, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.primary + '33', marginTop: 14 }]}>
                                    <Text style={[styles.cardBoxTitle, { color: colors.text, marginBottom: 8 }]}>Input Demand & Seed Requirements</Text>
                                    
                                    {/* 1. Search Box */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginBottom: 4 }]}>• Search for Input Needs (Seeds, Bio-Inputs, etc.)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 8 }}>
                                        <Feather name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                                        <TextInput
                                            style={{ flex: 1, color: colors.text, fontSize: 13, height: '100%', padding: 0 }}
                                            placeholder="Type to search (e.g. maize, bio-input...)"
                                            placeholderTextColor={colors.textMuted}
                                            value={ps02SearchQuery}
                                            onChangeText={setPs02SearchQuery}
                                        />
                                        {ps02SearchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setPs02SearchQuery('')}>
                                                <Feather name="x" size={16} color={colors.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* 2. Search Results list */}
                                    {ps02SearchQuery.trim().length > 0 && (
                                        <View style={{ backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 10, padding: 8, gap: 6, marginBottom: 12 }}>
                                            {PS02_CATALOG.filter(item => 
                                                item.name.toLowerCase().includes(ps02SearchQuery.toLowerCase()) ||
                                                item.category.toLowerCase().includes(ps02SearchQuery.toLowerCase())
                                            ).slice(0, 4).map(item => (
                                                <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
                                                    <View style={{ flex: 1, marginRight: 8 }}>
                                                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Category: {item.category}</Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                                                        onPress={() => {
                                                            setPs02AddingItem(item);
                                                            setPs02AddingQty('');
                                                            setPs02AddingUnit(item.defaultUnit);
                                                        }}
                                                    >
                                                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>+ Select</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                            {PS02_CATALOG.filter(item => 
                                                item.name.toLowerCase().includes(ps02SearchQuery.toLowerCase()) ||
                                                item.category.toLowerCase().includes(ps02SearchQuery.toLowerCase())
                                            ).length === 0 && (
                                                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', fontStyle: 'italic', paddingVertical: 4 }}>No matching inputs found.</Text>
                                            )}
                                        </View>
                                    )}

                                    {/* 3. Add Item Configuration Form */}
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
                                    )}

                                    {/* 4. Selected Inputs Gaps List */}
                                    <Text style={[styles.subFieldLabel, { color: colors.text, marginTop: 8, marginBottom: 6, fontWeight: '700' }]}>• Registered Input Gaps & Requirements</Text>
                                    <View style={{ gap: 8 }}>
                                        {ps02SelectedItems.map((item, idx) => {
                                            const cat = PS02_CATALOG.find(c => c.id === item.id)?.category || 'Input';
                                            return (
                                                <View key={item.id + '_' + idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }}>
                                                    <View style={{ flex: 1, marginRight: 8 }}>
                                                        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{item.name}</Text>
                                                        <Text style={{ color: colors.textSecondary, fontSize: 10 }}>Category: {cat} • Quantity: <Text style={{ fontWeight: '700', color: colors.primary }}>{item.qty} {item.unit}</Text></Text>
                                                    </View>
                                                    <TouchableOpacity 
                                                        style={{ padding: 6 }} 
                                                        onPress={() => {
                                                            setPs02SelectedItems(ps02SelectedItems.filter(i => i.id !== item.id));
                                                        }}
                                                    >
                                                        <Feather name="trash-2" size={15} color="#EF4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            );
                                        })}
                                        {ps02SelectedItems.length === 0 && (
                                            <View style={{ padding: 16, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center' }}>
                                                <Text style={{ color: colors.textMuted, fontSize: 11, fontStyle: 'italic', textAlign: 'center' }}>No input gaps currently listed. Type in search bar above to add seeds or bio-inputs requirements.</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}`;

if (content.includes(ps02FormTarget)) {
    content = content.replace(ps02FormTarget, ps02FormReplacement);
    console.log("Successfully replaced PS-02 subform render code!");
} else {
    // If exact string doesn't match due to newline/space variation
    console.warn("Could not find exact PS-02 subform target. Attempting regex match...");
    const regForm = /\{\/\* PS-02 Seed Gaps \*\/\}[\s\S]*?selectedActivityId === 'PS-02'[\s\S]*?<\/View>\s*?\)\}/;
    if (regForm.test(content)) {
        content = content.replace(regForm, ps02FormReplacement);
        console.log("Successfully replaced PS-02 subform via regex!");
    } else {
        console.error("Failed to replace PS-02 form code with regex!");
        process.exit(1);
    }
}

// Restore CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Completed patching logActivities.tsx for PS-02 detailed inputs!");
