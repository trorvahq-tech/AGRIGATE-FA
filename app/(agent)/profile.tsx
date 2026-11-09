import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomNavBar from '../../components/ui/CustomNavBar';
import { useTheme } from '../../context/ThemeContext';
import { useMe } from '../../hooks/api/useAuth';
import { toast } from 'sonner-native';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../services/apiClient';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('../../assets/images/whoLogin2.png');

export default function ProfileScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const queryClient = useQueryClient();

    const { data: meData, isLoading } = useMe();

    // Fetch stored custom display picture uri on mount/user load
    useEffect(() => {
        const loadStoredAvatar = async () => {
            const userId = meData?.id || 'vcm_agent';
            try {
                const storedUri = await AsyncStorage.getItem(`vcm_avatar_uri_${userId}`);
                if (storedUri) {
                    setAvatarUri(storedUri);
                }
            } catch (err) {
                console.error('Failed to load custom avatar:', err);
            }
        };
        loadStoredAvatar();
    }, [meData]);

    const handlePickImage = async () => {
        // Request media library permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            toast.error('Permission to access library was denied');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedUri = result.assets[0].uri;
            setIsImageLoading(true);
            try {
                // Copy selected image file to permanent DocumentDirectory to survive cache clears
                const filename = selectedUri.split('/').pop() || 'avatar.jpg';
                const newPath = `${FileSystem.documentDirectory}${filename}`;
                await FileSystem.copyAsync({
                    from: selectedUri,
                    to: newPath
                });

                let finalUri = newPath;

                try {
                    const formData = new FormData();
                    formData.append('avatar', {
                        uri: Platform.OS === 'android' ? newPath : newPath.replace('file://', ''),
                        name: filename,
                        type: 'image/jpeg',
                    } as any);

                    const response = await api.post('/auth/avatar', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (response.data && response.data.avatarUri) {
                        finalUri = response.data.avatarUri;
                    }
                } catch (uploadErr) {
                    console.log('Avatar upload to server skipped or offline:', uploadErr);
                }

                setAvatarUri(finalUri);
                const userId = meData?.id || 'vcm_agent';
                await AsyncStorage.setItem(`vcm_avatar_uri_${userId}`, finalUri);
                
                queryClient.invalidateQueries({ queryKey: ['me'] });
                toast.success('Display picture updated successfully');
            } catch (err) {
                console.error('Failed to save avatar:', err);
                toast.error('Failed to save avatar');
            } finally {
                setIsImageLoading(false);
            }
        }
    };

    const handleRemoveImage = async () => {
        try {
            setAvatarUri(null);
            const userId = meData?.id || 'vcm_agent';
            const storedUri = await AsyncStorage.getItem(`vcm_avatar_uri_${userId}`);
            
            try {
                await api.delete('/auth/avatar');
            } catch {}

            if (storedUri && storedUri.startsWith('file://')) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(storedUri);
                    if (fileInfo.exists) {
                        await FileSystem.deleteAsync(storedUri, { idempotent: true });
                    }
                } catch (fileErr) {
                    console.error('Failed to delete avatar file:', fileErr);
                }
            }
            await AsyncStorage.removeItem(`vcm_avatar_uri_${userId}`);
            queryClient.invalidateQueries({ queryKey: ['me'] });
            toast.success('Display picture removed');
        } catch (err) {
            console.error('Failed to remove avatar:', err);
            toast.error('Failed to remove avatar');
        }
    };

    const staffDetails = meData?.staff;
    const fullName = staffDetails?.fullName || (staffDetails ? `${staffDetails.firstName || ''} ${staffDetails.lastName || ''}`.trim() : (meData?.email ? meData.email.split('@')[0] : 'Field Officer'));
    const jobTitle = staffDetails?.jobTitle || (meData?.role === 'farmer' ? 'Smallholder Farmer' : 'Field Agent (VCM)');
    const phone = staffDetails?.phone || 'Not Provided';
    const email = meData?.email || '—';
    const activeStatus = staffDetails?.isActive !== false ? 'Active' : 'Inactive';

    // Parse location
    const stateName = staffDetails?.location?.state?.name || '—';
    const lgaName = staffDetails?.location?.lga?.name || '—';
    const wardName = staffDetails?.location?.ward?.name || '—';
    const community = staffDetails?.location?.community || '—';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={colors.statusBarStyle} />

            <CustomNavBar 
                title={t('profile') || "My Profile"} 
                backgroundColor={isDarkMode ? colors.navbarBackground : "#0E6F6A0D"} 
                textColor={colors.textSecondary} 
            />

            <View style={[styles.mainContainer, { backgroundColor: colors.card }]}>
                {/* Background Gradient */}
                <Image 
                    source={require('../../assets/images/backgroundGradient.png')} 
                    style={[StyleSheet.absoluteFill, { opacity: isDarkMode ? 0.3 : 1 }]} 
                    contentFit="cover" 
                />

                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#0E6F6A" />
                        <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading profile...</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* DP Upload / Avatar Block */}
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatarWrapper, { borderColor: colors.border }]}>
                                {isImageLoading ? (
                                    <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <ActivityIndicator size="small" color="#0E6F6A" />
                                    </View>
                                ) : (
                                    <Image 
                                        source={avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR} 
                                        style={styles.avatar}
                                        contentFit="cover"
                                    />
                                )}
                                <TouchableOpacity style={styles.editBadge} onPress={handlePickImage} activeOpacity={0.8}>
                                    <Feather name="camera" size={14} color="white" />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.profileNameText, { color: colors.text }]}>{fullName}</Text>
                            <Text style={[styles.jobTitleText, { color: colors.textMuted }]}>{jobTitle}</Text>

                            {avatarUri && (
                                <TouchableOpacity style={styles.removeDpBtn} onPress={handleRemoveImage}>
                                    <Feather name="trash-2" size={13} color="#DC2626" />
                                    <Text style={styles.removeDpText}>Remove Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Details Cards */}
                        <View style={styles.detailsGroup}>
                            <Text style={styles.sectionHeading}>Account Details</Text>
                            
                            <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                                <View style={styles.infoRow}>
                                    <Feather name="mail" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>Email Address</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Feather name="phone" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>Phone Number</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{phone}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Feather name="activity" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>Account Status</Text>
                                        <View style={[styles.statusTag, { backgroundColor: activeStatus === 'Active' ? '#ECFDF5' : '#FEF2F2' }]}>
                                            <Text style={[styles.statusTagText, { color: activeStatus === 'Active' ? '#047857' : '#B91C1C' }]}>{activeStatus}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Assigned Location</Text>

                            <View style={[styles.infoCard, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }]}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="map-outline" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>State</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{stateName} State</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>LGA</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{lgaName}</Text>
                                    </View>
                                </View>

                                <View style={styles.infoRow}>
                                    <Ionicons name="navigate-outline" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>Ward</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{wardName}</Text>
                                    </View>
                                </View>

                                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                                    <Ionicons name="home-outline" size={16} color="#6B7280" />
                                    <View style={styles.infoCol}>
                                        <Text style={styles.infoLabel}>Community</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{community}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        marginTop: 155,
        marginHorizontal: 12,
        marginBottom: 125,
        borderRadius: 16,
        overflow: 'hidden',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        position: 'relative',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0E6F6A',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    profileNameText: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
    },
    jobTitleText: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 10,
    },
    removeDpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    removeDpText: {
        color: '#DC2626',
        fontSize: 11,
        fontWeight: '700',
    },
    detailsGroup: {
        width: '100%',
        paddingHorizontal: 16,
        marginTop: 10,
    },
    sectionHeading: {
        fontSize: 11,
        fontWeight: '800',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingLeft: 4,
    },
    infoCard: {
        borderRadius: 14,
        paddingVertical: 4,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusTag: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '700',
    },
});
