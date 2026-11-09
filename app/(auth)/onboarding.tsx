import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BlobBackground from '../../components/ui/BlobBackground';
import ProgressCircle from '../../components/ui/ProgressCircle';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const onboardingData = [
    {
        image: require('../../assets/images/manageFarm.png'),
        title: 'Your farm,\nyour growth.',
        subtitle: 'Track your land, crops, and harvest all in one place. Stay informed, stay empowered.',
    },
    {
        image: require('../../assets/images/manageFarm2.png'),
        title: 'Your farm,\nyour growth.',
        subtitle: 'Track your land, crops, and harvest all in one place. Stay informed, stay empowered.',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = onboardingData.length;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            router.replace('/login');
        }
    };

    const handleSkip = () => {
        router.replace('/login');
    };

    const currentData = onboardingData[currentStep];

    return (
        <BlobBackground>
            <StatusBar style={colors.statusBarStyle} />
            <View style={styles.container}>
                {/* Image Section - Edge to Edge */}
                <View style={styles.imageContainer}>
                    <Image
                        source={currentData.image}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {/* Gradient Container */}
                <LinearGradient
                    colors={[colors.primary, '#09413E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientContainer}
                >
                    {/* Text Content */}
                    <Text style={styles.title}>
                        {currentData.title}
                    </Text>
                    <Text className='-mt-4' style={styles.subtitle}>
                        {currentData.subtitle}
                    </Text>

                    {/* Bottom Navigation */}
                    <View style={styles.navigation}>
                        {/* Skip Button */}
                        <Pressable onPress={handleSkip} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </Pressable>

                        {/* Progress Circle with Next Button */}
                        <ProgressCircle
                            progress={(currentStep + 1) / totalSteps}
                            size={64}
                            strokeWidth={3}
                            progressColor="#FFFFFF"
                        >
                            <Pressable onPress={handleNext} style={styles.nextButton}>
                                <Ionicons name="chevron-forward" size={24} color="#000000" />
                            </Pressable>
                        </ProgressCircle>
                    </View>
                </LinearGradient>
            </View>
        </BlobBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imageContainer: {
        flex: 1,
    },
    image: {
        width: width,
        height: '100%',
    },
    gradientContainer: {
        height: 312,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 40,
        justifyContent: 'space-between',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    skipText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    nextButton: {
        width: 48,
        height: 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
