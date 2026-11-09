import '../global.css';
import '../i18n';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Image, Text, TextInput, View, StyleSheet } from 'react-native';
import BlobBackground from '../components/ui/BlobBackground';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useFonts } from 'expo-font';

// Helper to resolve font styles dynamically based on font weight
const resolveStyle = (style: any) => {
  if (!style) {
    return { fontFamily: 'Acorn-Regular' };
  }

  // Flatten the style array/object to get the fully resolved styles
  const flatStyle = StyleSheet.flatten(style);

  // If a fontFamily is already defined and it's not an Acorn variant (e.g. Ionicons, MaterialIcons, etc.),
  // return the original style completely untouched to preserve icon fonts!
  if (flatStyle.fontFamily && !flatStyle.fontFamily.startsWith('Acorn')) {
    return style;
  }

  const newStyle = { ...flatStyle };
  let fontFamily = newStyle.fontFamily || 'Acorn-Regular';

  const weight = newStyle.fontWeight;
  if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
    fontFamily = 'Acorn-Bold';
    delete newStyle.fontWeight;
  } else if (weight === '600' || weight === 'semibold') {
    fontFamily = 'Acorn-SemiBold';
    delete newStyle.fontWeight;
  } else if (weight === '500' || weight === 'medium') {
    fontFamily = 'Acorn-Medium';
    delete newStyle.fontWeight;
  } else if (weight === '300' || weight === 'light') {
    fontFamily = 'Acorn-Light';
    delete newStyle.fontWeight;
  } else if (weight === '100' || weight === '200' || weight === 'thin') {
    fontFamily = 'Acorn-Thin';
    delete newStyle.fontWeight;
  }

  newStyle.fontFamily = fontFamily;
  return newStyle;
};

// Monkey-patch React Native Text & TextInput exports
const RN = require('react-native');
const OriginalText = RN.Text;
const OriginalTextInput = RN.TextInput;

const PatchedText = function (props: any) {
  const style = resolveStyle(props.style);
  return <OriginalText {...props} style={style} />;
};
Object.assign(PatchedText, OriginalText);

try {
  const textDesc = Object.getOwnPropertyDescriptor(RN, 'Text');
  if (!textDesc || textDesc.configurable) {
    Object.defineProperty(RN, 'Text', {
      get() {
        return PatchedText;
      },
      configurable: true,
    });
  }
} catch {
  // Non-configurable in certain environments (e.g. Node SSR)
}

const PatchedTextInput = function (props: any) {
  const style = resolveStyle(props.style);
  return <OriginalTextInput {...props} style={style} />;
};
Object.assign(PatchedTextInput, OriginalTextInput);

try {
  const inputDesc = Object.getOwnPropertyDescriptor(RN, 'TextInput');
  if (!inputDesc || inputDesc.configurable) {
    Object.defineProperty(RN, 'TextInput', {
      get() {
        return PatchedTextInput;
      },
      configurable: true,
    });
  }
} catch {
  // Non-configurable in certain environments (e.g. Node SSR)
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function RootLayoutContent() {
  const [splashPhase, setSplashPhase] = useState<'first' | 'second' | 'done'>('first');
  const hasCheckedAuthRef = useRef(false);
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const firstTimer = setTimeout(() => {
      setSplashPhase('second');
    }, 1500);

    const secondTimer = setTimeout(() => {
      setSplashPhase('done');
    }, 3000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, []);

  useEffect(() => {
    if (splashPhase === 'done') {
      if (hasCheckedAuthRef.current) return;
      hasCheckedAuthRef.current = true;
      // Check for existing session
      (async () => {
        try {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          const refreshToken = await AsyncStorage.getItem('refresh_token');
          const userStr = await AsyncStorage.getItem(USER_KEY);
          const isValidSession = token && token !== 'mock-access-token' && refreshToken && userStr;
          
          if (isValidSession) {
            const user = JSON.parse(userStr!);
            const role = user?.role;
            const mustChangePassword = user?.mustChangePassword;
            if (mustChangePassword) {
              if (role === 'farmer') {
                router.replace('/(farmers)/changePassword' as any);
              } else {
                router.replace('/(agent)/changePassword' as any);
              }
            } else {
              if (role === 'farmer') {
                router.replace('/(farmers)');
              } else if (role === 'machine-operator' || role === 'operator') {
                router.replace('/(operators)');
              } else {
                router.replace('/(agent)');
              }
            }
          } else {
            await AsyncStorage.multiRemove([TOKEN_KEY, 'refresh_token', USER_KEY]);
            router.replace('/login');
          }
        } catch {
          await AsyncStorage.multiRemove([TOKEN_KEY, 'refresh_token', USER_KEY]);
          router.replace('/login');
        }
      })();
    }
  }, [splashPhase]);

  if (splashPhase === 'first') {
    return (
      <BlobBackground>
        <StatusBar style={colors.statusBarStyle} />
        <View className="flex-1 items-center justify-center">
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
        </View>
      </BlobBackground>
    );
  }

  if (splashPhase === 'second') {
    return (
      <BlobBackground>
        <StatusBar style={colors.statusBarStyle} />
        <View className="flex-1 items-center justify-center flex-row gap-3">
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
          />
          <Text className="text-[30px] font-bold text-[#0E6F6A]">AgriGATE</Text>
        </View>
      </BlobBackground>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(agent)" />
      <Stack.Screen name="(farmers)" />
      <Stack.Screen name="(operators)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

import { QueryProvider } from '../context/QueryProvider';

import { Toaster } from 'sonner-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Acorn-Regular': require('../assets/Acorn/Acorn-Regular.otf'),
    'Acorn-Medium': require('../assets/Acorn/Acorn-Medium.otf'),
    'Acorn-Bold': require('../assets/Acorn/Acorn-Bold.otf'),
    'Acorn-SemiBold': require('../assets/Acorn/Acorn-SemiBold.otf'),
    'Acorn-ExtraLight': require('../assets/Acorn/Acorn-ExtraLight.otf'),
    'Acorn-Light': require('../assets/Acorn/Acorn-Light.otf'),
    'Acorn-Thin': require('../assets/Acorn/Acorn-Thin.otf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Error loading custom Acorn fonts:', fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
        <Toaster position="top-center" />
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
