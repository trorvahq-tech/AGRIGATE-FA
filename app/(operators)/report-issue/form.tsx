import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import CustomBackNavBar from '../../../components/ui/CustomBackNavBar';
import NotificationToast from '../../../components/ui/NotificationToast';

const { width } = Dimensions.get('window');

export default function ReportIssueFormScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const machineName = params.machineName || 'Unknown Machine';

    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = () => {
        // Here you would typically send data to backend
        setShowSuccessToast(true);
        setTimeout(() => {
            setShowSuccessToast(false);
            // Navigate back to dashboard or list
            router.dismissAll();
            router.push('/(operators)');
        }, 2000);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <CustomBackNavBar title="Report an issue" onBackPress={() => router.back()} />

            <View style={styles.contentContainer}>
                {/* Background Gradient */}
                <Image source={require('../../../assets/images/backgroundGradient.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Machine Name Header */}
                    <View style={styles.headerCard}>
                        <Text style={styles.machineNameHeader}>{machineName}</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Fill in information</Text>

                        {/* Issue Category */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Issue Category</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Input"
                                placeholderTextColor="#0A0C1199"
                                value={category}
                                onChangeText={setCategory}
                            />
                        </View>

                        {/* Severity Level */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Severity Level</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Input"
                                placeholderTextColor="#0A0C1199"
                                value={severity}
                                onChangeText={setSeverity}
                            />
                        </View>

                        {/* Issue Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Issue Description</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Input"
                                placeholderTextColor="#0A0C1199"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* Evidence Section */}
                    <View style={styles.formSection}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.sectionTitle}>Capture evidence</Text>

                            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.previewImage} contentFit="cover" />
                                ) : (
                                    <Text style={styles.photoButtonText}>Take a photo</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>

            <NotificationToast
                visible={showSuccessToast}
                message="Issue reported successfully"
                title="Success"
                onTimerEnd={() => setShowSuccessToast(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    contentContainer: {
        flex: 1,
        marginTop: 135,
        marginHorizontal: 12,
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    scrollContent: {
        padding: 16,
        gap: 20,
    },
    headerCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F1F1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    machineNameHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A0C11',
    },
    formSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A0C11',
    },
    inputGroup: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 12,
        color: '#5B616D',
    },
    input: {
        height: 48,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        color: '#0A0C11',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    photoButton: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0E6F6A',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    photoButtonText: {
        fontSize: 14,
        color: '#0E6F6A',
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    submitButton: {
        height: 52,
        backgroundColor: '#0E6F6A',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        backgroundColor: '#F5F9F9',
        borderRadius: 12,
        padding: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
});
