import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import CustomNavBar from '../../components/ui/CustomNavBar';
import DonutChart from '../../components/ui/DonutChart';
import VcmScorecardCard from '../../components/ui/VcmScorecardCard';
import { useTheme } from '../../context/ThemeContext';
import { useFarmers } from '../../hooks/api/useFarmers';
import { useFarms } from '../../hooks/api/useFarms';
import { useTasks } from '../../hooks/api/useTasks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMe } from '../../hooks/api/useAuth';
import api from '../../services/apiClient';
import SyncDataModal from '../../components/ui/SyncDataModal';
import { useSyncStatus } from '../../services/syncService';
import { draftService } from '../../services/draftService';

const DASHBOARD_BG = require('../../assets/images/agentDashboardBg.png');
const { width } = Dimensions.get('window');

const WEATHER_PRESETS = {
    'Kaduna, Nigeria': {
        temp: '28°C',
        desc: 'Sunny / Warm',
        humidity: '55%',
        precip: '0 mm',
        wind: '12 km/h',
        icon: 'sunny',
        iconColor: '#F59E0B',
    },
    'Nassarawa, Nigeria': {
        temp: '30°C',
        desc: 'Clear Sky / Hot',
        humidity: '48%',
        precip: '0 mm',
        wind: '10 km/h',
        icon: 'sunny',
        iconColor: '#F59E0B',
    },
    'Adamawa, Nigeria': {
        temp: '32°C',
        desc: 'Sunny / Dry',
        humidity: '38%',
        precip: '0 mm',
        wind: '14 km/h',
        icon: 'sunny',
        iconColor: '#F59E0B',
    },
    'Abuja, Nigeria': {
        temp: '31°C',
        desc: 'Partly Cloudy',
        humidity: '60%',
        precip: '0 mm',
        wind: '9 km/h',
        icon: 'sunny',
        iconColor: '#FDE047',
    },
} as const;

type WeatherLocation = keyof typeof WEATHER_PRESETS;

export interface CalendarActivity {
    name: string;
    key: 'land_prep' | 'planting' | 'fertilizing' | 'weeding' | 'harvesting';
    dateRange: string;
    start: number;
    duration: number;
    progress: number;
    status: 'Completed' | 'In Progress' | 'Upcoming' | 'Scheduled';
    color: string;
}

export interface CalendarCrop {
    name: string;
    dateRange?: string;
    start: number;
    duration: number;
    progress: number;
    color: string;
}

const STATE_CALENDARS = {
    'Adamawa State': [
        {
            id: 'ada-opt1',
            optionCode: 'OPTION 1',
            title: 'Egusi + Drop Corn → Sesame / Cowpea Relay',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Tier 1 (May–Jul)',
            tier2Title: 'Tier 2 (Aug–Nov)',
            tier1Months: ['May', 'Jun', 'Jul'],
            tier2Months: ['Aug', 'Sep', 'Oct', 'Nov'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'Apr 25 – May 10', start: 0, duration: 0.8, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'May 10 – May 24', start: 0.3, duration: 0.8, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'May 25 – Jun 08', start: 0.8, duration: 0.8, progress: 0.85, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jun 05 – Jun 22', start: 1.2, duration: 0.9, progress: 0.40, status: 'In Progress', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Jul 15 – Jul 31', start: 2.3, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Land / Relay Bed Prep', key: 'land_prep', dateRange: 'Jul 28 – Aug 12', start: 0, duration: 0.6, progress: 0.0, status: 'Upcoming', color: '#D97706' },
                { name: 'Relay Planting', key: 'planting', dateRange: 'Aug 12 – Aug 26', start: 0.4, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Aug 28 – Sep 12', start: 0.9, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Sep 10 – Sep 28', start: 1.3, duration: 0.9, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Oct 25 – Nov 20', start: 2.8, duration: 1.0, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Egusi (Melon)', dateRange: 'May 10 – Jul 31', start: 0, duration: 3, progress: 1.0, color: '#10B981' },
                { name: 'Drop Maize', dateRange: 'May 12 – Jul 31', start: 0, duration: 3, progress: 0.8, color: '#3B82F6' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 01 – Jul 31', start: 1, duration: 2, progress: 0.6, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'May 10 – Jul 31', start: 0, duration: 3, progress: 0.4, color: '#F59E0B' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Sesame Relay', dateRange: 'Aug 12 – Nov 20', start: 0, duration: 4, progress: 0.2, color: '#A855F7' },
                { name: 'Drop Sorghum', dateRange: 'Aug 15 – Nov 20', start: 0, duration: 4, progress: 0.1, color: '#EC4899' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Aug 12 – Nov 20', start: 0, duration: 4, progress: 0.3, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Aug 12 – Nov 20', start: 0, duration: 4, progress: 0.5, color: '#F59E0B' },
            ] as CalendarCrop[]
        },
        {
            id: 'ada-opt2',
            optionCode: 'OPTION 2',
            title: 'Groundnut → Sesame Relay',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Tier 1 (Jun–Aug)',
            tier2Title: 'Tier 2 (Aug–Nov)',
            tier1Months: ['Jun', 'Jul', 'Aug'],
            tier2Months: ['Aug', 'Sep', 'Oct', 'Nov'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'May 20 – Jun 05', start: 0, duration: 0.8, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'Jun 05 – Jun 18', start: 0.2, duration: 0.7, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Jun 20 – Jul 04', start: 0.7, duration: 0.8, progress: 0.70, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jun 28 – Jul 15', start: 1.0, duration: 0.8, progress: 0.30, status: 'Upcoming', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Aug 10 – Aug 28', start: 2.3, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Land / Stubble Prep', key: 'land_prep', dateRange: 'Aug 08 – Aug 20', start: 0.2, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#D97706' },
                { name: 'Relay Planting', key: 'planting', dateRange: 'Aug 22 – Sep 05', start: 0.7, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Sep 08 – Sep 20', start: 1.2, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Sep 22 – Oct 08', start: 1.7, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Nov 05 – Nov 25', start: 3.1, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Groundnut', dateRange: 'Jun 05 – Aug 28', start: 0, duration: 3, progress: 0.9, color: '#F59E0B' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 05 – Aug 28', start: 0, duration: 3, progress: 0.7, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Jun 05 – Aug 28', start: 0, duration: 3, progress: 0.5, color: '#F97316' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Sesame Relay', dateRange: 'Aug 22 – Nov 25', start: 0, duration: 4, progress: 0.2, color: '#A855F7' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Aug 22 – Nov 25', start: 0, duration: 4, progress: 0.4, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Aug 22 – Nov 25', start: 0, duration: 4, progress: 0.6, color: '#F97316' },
            ] as CalendarCrop[]
        },
        {
            id: 'ada-opt3',
            optionCode: 'OPTION 3',
            title: 'Soybean + Drop Corn (Single Season)',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Full Season (Jun–Oct)',
            tier2Title: 'No Second Tier',
            tier1Months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            tier2Months: ['Nov', 'Dec'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'May 25 – Jun 08', start: 0, duration: 0.6, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'Jun 08 – Jun 22', start: 0.2, duration: 0.6, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Jun 24 – Jul 10', start: 0.8, duration: 0.8, progress: 0.80, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jul 05 – Jul 25', start: 1.1, duration: 1.0, progress: 0.50, status: 'In Progress', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Sep 25 – Oct 20', start: 3.8, duration: 1.0, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Perimeter / Veg Prep', key: 'land_prep', dateRange: 'Nov 01 – Nov 12', start: 0, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#D97706' },
                { name: 'Vegetable Planting', key: 'planting', dateRange: 'Nov 12 – Nov 24', start: 0.5, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Weeding & Irrigation', key: 'weeding', dateRange: 'Nov 25 – Dec 15', start: 0.9, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Dec 15 – Dec 30', start: 1.5, duration: 0.5, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Soybean', dateRange: 'Jun 08 – Oct 20', start: 0, duration: 5, progress: 0.8, color: '#8B5CF6' },
                { name: 'Drop Maize', dateRange: 'Jun 12 – Oct 20', start: 0, duration: 5, progress: 0.6, color: '#3B82F6' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 08 – Oct 20', start: 0, duration: 5, progress: 0.5, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Jun 08 – Oct 20', start: 0, duration: 5, progress: 0.4, color: '#F59E0B' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Zobo (Hibiscus)', dateRange: 'Nov 12 – Dec 30', start: 0, duration: 2, progress: 0.8, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Nov 12 – Dec 30', start: 0, duration: 2, progress: 0.7, color: '#F59E0B' },
            ] as CalendarCrop[]
        }
    ],
    'Kaduna State': [
        {
            id: 'kad-opt1',
            optionCode: 'OPTION 1',
            title: 'Soybean + Drop Maize → Sesame Relay',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Tier 1 (Jun–Sep)',
            tier2Title: 'Tier 2 (Sep–Dec)',
            tier1Months: ['Jun', 'Jul', 'Aug', 'Sep'],
            tier2Months: ['Sep', 'Oct', 'Nov', 'Dec'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'May 22 – Jun 06', start: 0, duration: 0.6, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'Jun 06 – Jun 20', start: 0.2, duration: 0.7, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Jun 22 – Jul 08', start: 0.7, duration: 0.8, progress: 0.85, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jul 02 – Jul 20', start: 1.0, duration: 0.9, progress: 0.45, status: 'In Progress', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Aug 28 – Sep 20', start: 2.9, duration: 1.0, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Land / Stubble Prep', key: 'land_prep', dateRange: 'Aug 25 – Sep 08', start: 0, duration: 0.6, progress: 0.0, status: 'Upcoming', color: '#D97706' },
                { name: 'Relay Planting', key: 'planting', dateRange: 'Sep 08 – Sep 20', start: 0.3, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Sep 22 – Oct 06', start: 0.7, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Oct 05 – Oct 22', start: 1.1, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Nov 25 – Dec 18', start: 2.8, duration: 1.0, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Soybean', dateRange: 'Jun 06 – Sep 20', start: 0, duration: 4, progress: 0.9, color: '#8B5CF6' },
                { name: 'Drop Maize', dateRange: 'Jun 10 – Sep 20', start: 0, duration: 4, progress: 0.7, color: '#3B82F6' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 06 – Sep 20', start: 0, duration: 4, progress: 0.6, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Jun 06 – Sep 20', start: 0, duration: 4, progress: 0.5, color: '#F59E0B' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Sesame Relay', dateRange: 'Sep 08 – Dec 18', start: 0, duration: 4, progress: 0.2, color: '#A855F7' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Sep 08 – Dec 18', start: 0, duration: 3, progress: 0.7, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Sep 08 – Dec 18', start: 0, duration: 3, progress: 0.6, color: '#F59E0B' },
            ] as CalendarCrop[]
        },
        {
            id: 'kad-opt2',
            optionCode: 'OPTION 2',
            title: 'Groundnut + Drop Sorghum → Cowpea Relay',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Tier 1 (Jun–Sep)',
            tier2Title: 'Tier 2 (Sep–Dec)',
            tier1Months: ['Jun', 'Jul', 'Aug', 'Sep'],
            tier2Months: ['Sep', 'Oct', 'Nov', 'Dec'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'May 25 – Jun 08', start: 0, duration: 0.6, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'Jun 08 – Jun 22', start: 0.2, duration: 0.7, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Jun 25 – Jul 10', start: 0.8, duration: 0.8, progress: 0.75, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jul 05 – Jul 22', start: 1.1, duration: 0.8, progress: 0.35, status: 'Upcoming', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Sep 01 – Sep 24', start: 3.0, duration: 0.9, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Land / Relay Prep', key: 'land_prep', dateRange: 'Sep 01 – Sep 14', start: 0, duration: 0.5, progress: 0.0, status: 'Scheduled', color: '#D97706' },
                { name: 'Relay Planting', key: 'planting', dateRange: 'Sep 14 – Sep 26', start: 0.4, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Sep 28 – Oct 12', start: 0.9, duration: 0.7, progress: 0.0, status: 'Scheduled', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Oct 10 – Oct 26', start: 1.3, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Nov 28 – Dec 20', start: 2.9, duration: 1.0, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Groundnut', dateRange: 'Jun 08 – Sep 24', start: 0, duration: 4, progress: 0.8, color: '#F59E0B' },
                { name: 'Drop Sorghum', dateRange: 'Jun 12 – Sep 24', start: 0, duration: 4, progress: 0.6, color: '#EC4899' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 08 – Sep 24', start: 0, duration: 4, progress: 0.5, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Jun 08 – Sep 24', start: 0, duration: 4, progress: 0.4, color: '#F59E0B' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Cowpea Relay', dateRange: 'Sep 14 – Dec 20', start: 0, duration: 4, progress: 0.1, color: '#10B981' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Sep 14 – Dec 20', start: 0, duration: 3, progress: 0.8, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Sep 14 – Dec 20', start: 0, duration: 3, progress: 0.7, color: '#F59E0B' },
            ] as CalendarCrop[]
        },
        {
            id: 'kad-opt3',
            optionCode: 'OPTION 3',
            title: 'Maize Mono-cropping (Single Season)',
            systemName: '1 Acre Integrated Cropping System',
            tier1Title: 'Full Season (Jun–Oct)',
            tier2Title: 'No Second Tier',
            tier1Months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            tier2Months: ['Nov', 'Dec'],
            tier1Activities: [
                { name: 'Land Preparation', key: 'land_prep', dateRange: 'May 20 – Jun 05', start: 0, duration: 0.6, progress: 1.0, status: 'Completed', color: '#D97706' },
                { name: 'Planting / Sowing', key: 'planting', dateRange: 'Jun 05 – Jun 18', start: 0.2, duration: 0.6, progress: 1.0, status: 'Completed', color: '#10B981' },
                { name: 'Fertilizer Application', key: 'fertilizing', dateRange: 'Jun 20 – Jul 06', start: 0.7, duration: 0.8, progress: 0.90, status: 'In Progress', color: '#8B5CF6' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Jul 01 – Jul 20', start: 1.0, duration: 0.9, progress: 0.50, status: 'In Progress', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Sep 20 – Oct 18', start: 3.6, duration: 1.2, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier2Activities: [
                { name: 'Perimeter Veg Prep', key: 'land_prep', dateRange: 'Nov 01 – Nov 15', start: 0, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#D97706' },
                { name: 'Vegetable Planting', key: 'planting', dateRange: 'Nov 15 – Nov 28', start: 0.5, duration: 0.6, progress: 0.0, status: 'Scheduled', color: '#10B981' },
                { name: 'Weeding & Care', key: 'weeding', dateRange: 'Dec 01 – Dec 20', start: 1.0, duration: 0.8, progress: 0.0, status: 'Scheduled', color: '#3B82F6' },
                { name: 'Harvesting', key: 'harvesting', dateRange: 'Dec 20 – Jan 10', start: 1.6, duration: 0.5, progress: 0.0, status: 'Scheduled', color: '#F59E0B' },
            ] as CalendarActivity[],
            tier1Crops: [
                { name: 'Maize (Mono)', dateRange: 'Jun 05 – Oct 18', start: 0, duration: 5, progress: 0.9, color: '#3B82F6' },
                { name: 'Zobo (Hibiscus)', dateRange: 'Jun 05 – Oct 18', start: 0, duration: 5, progress: 0.6, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Jun 05 – Oct 18', start: 0, duration: 5, progress: 0.5, color: '#F59E0B' },
            ] as CalendarCrop[],
            tier2Crops: [
                { name: 'Zobo (Hibiscus)', dateRange: 'Nov 15 – Jan 10', start: 0, duration: 2, progress: 0.8, color: '#EF4444' },
                { name: 'Chili Pepper', dateRange: 'Nov 15 – Jan 10', start: 0, duration: 2, progress: 0.7, color: '#F59E0B' },
            ] as CalendarCrop[]
        }
    ]
};

const QUICK_ACTIONS = [
    { label: 'Add Farmer', icon: 'person-add', color: '#16A34A' },
    { label: 'Add Farm', icon: 'leaf', color: '#2563EB' },
    { label: 'Log Activity', icon: 'clipboard', color: '#EA580C' },
    { label: 'View MTGs', icon: 'people', color: '#9333EA' },
    { label: 'Map View', icon: 'map', color: '#16A34A' },
];

export default function AgentHomeScreen() {
    const router = useRouter();
    const navigation = useNavigation<any>();
    const { colors, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [weatherLocation, setWeatherLocation] = useState<WeatherLocation>('Kaduna, Nigeria');
    
    const activeState = weatherLocation.startsWith('Kaduna') ? 'Kaduna State' : 'Adamawa State';
    const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
    const [activeTier, setActiveTier] = useState<1 | 2>(1);
    const [calendarViewMode, setCalendarViewMode] = useState<'activities' | 'crops'>('activities');

    const activeOption = STATE_CALENDARS[activeState][selectedOptionIdx] || STATE_CALENDARS[activeState][0];
    const activeSeason = useMemo(() => {
        const months = activeTier === 1 ? activeOption.tier1Months : activeOption.tier2Months;
        const activities = (activeTier === 1 ? activeOption.tier1Activities : activeOption.tier2Activities) || [];
        const crops = (activeTier === 1 ? activeOption.tier1Crops : activeOption.tier2Crops) || [];
        const tasks = calendarViewMode === 'activities' ? activities : crops;
        return {
            id: activeOption.id,
            name: activeOption.title,
            months,
            tasks,
            activities,
            crops,
            tierTitle: activeTier === 1 ? activeOption.tier1Title : activeOption.tier2Title,
        };
    }, [activeOption, activeTier, calendarViewMode]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showScorecardModal, setShowScorecardModal] = useState(false);
    const [showSyncModal, setShowSyncModal] = useState(false);

    const { data: apiFarmers, refetch: refetchFarmers } = useFarmers();
    const { data: apiFarms, refetch: refetchFarms } = useFarms();
    const { data: apiTasksData, refetch: refetchTasks } = useTasks({ limit: 100 });

    const { data: meData, refetch: refetchMe } = useMe(true);
    const { lastSyncShort, recordSync } = useSyncStatus();

    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refetchFarmers?.(),
                refetchFarms?.(),
                refetchTasks?.(),
                refetchMe?.(),
                recordSync()
            ]);
        } catch (e) {
            console.error("Dashboard refresh error:", e);
        } finally {
            setRefreshing(false);
        }
    }, [refetchFarmers, refetchFarms, refetchTasks, refetchMe, recordSync]);

    const greetingName = useMemo(() => {
        return meData?.staff?.firstName || meData?.staff?.fullName?.split(' ')[0] || meData?.email?.split('@')[0] || 'Agent';
    }, [meData]);

    React.useEffect(() => {
        const stateName = meData?.staff?.location?.state?.name;
        if (stateName) {
            const cleanState = stateName.trim();
            const matchingKey = Object.keys(WEATHER_PRESETS).find(
                (key) => key.toLowerCase().includes(cleanState.toLowerCase())
            );
            if (matchingKey) {
                setWeatherLocation(matchingKey as WeatherLocation);
            } else {
                setWeatherLocation(`${cleanState}, Nigeria` as any);
            }
        }
    }, [meData]);

    const isCallTask = (task: any) => {
        if (task.channel === 'call') return true;
        if (task.channel === 'visit') return false;
        const code = task.stageCode || task.stage_code || '';
        return ['PS-01', 'PS-02', 'PS-03', 'MS-01', 'LS-01', 'END-02', 'END-03', 'T1-01', 'T1-02', 'T2-01', 'T3-01'].some(c => code.startsWith(c)) ||
               /plan|seed|finance|supply|outcome|availability/i.test(task.stageName || task.stage_name || '');
    };

    const isVisitTask = (task: any) => {
        if (task.channel === 'visit') return true;
        if (task.channel === 'call') return false;
        const code = task.stageCode || task.stage_code || '';
        return ['PS-04', 'ES-01', 'ES-02', 'ES-03', 'MS-02', 'MS-03', 'MS-04', 'LS-02', 'END-01', 'T1-03', 'T1-04', 'T1-05', 'T1-06', 'T2-02', 'T2-03', 'T2-04', 'T2-05', 'T3-02', 'T3-03', 'T3-04', 'T3-05'].some(c => code.startsWith(c)) ||
               /location|land|planting|germination|application|practice|condition|harvest|storage|weeding/i.test(task.stageName || task.stage_name || '');
    };

    const summary = useMemo(() => {
        const tasks = apiTasksData?.data || [];
        
        let needsCall = 0;
        let needsVisit = 0;
        let awaitingValidation = 0;
        let completed = 0;

        tasks.forEach((t: any) => {
            if (t.status === 'completed') {
                completed++;
            } else if (t.status === 'awaiting_validation') {
                awaitingValidation++;
            } else if (isCallTask(t)) {
                needsCall++;
            } else if (isVisitTask(t)) {
                needsVisit++;
            }
        });

        return {
            needsCall,
            needsVisit,
            awaitingValidation,
            completed
        };
    }, [apiTasksData]);

    const [seasons, setSeasons] = useState<any[]>([
        { id: '1', name: '2026 Wet Season (Tier 1)' },
        { id: '2', name: '2026 Dry Season (Tier 2)' },
        { id: '3', name: '2026 Off Season (Tier 3)' },
        { id: '4', name: '2025 Wet Season (Tier 1)' },
        { id: '5', name: '2025 Dry Season (Tier 2)' },
        { id: '6', name: '2025 Off Season (Tier 3)' },
    ]);
    const [selectedSeason, setSelectedSeason] = useState('2026 Wet Season (Tier 1)');
    const [showSeasonModal, setShowSeasonModal] = useState(false);

    React.useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await api.get('/seasons');
                if (response.data && Array.isArray(response.data.data)) {
                    setSeasons(response.data.data);
                    if (response.data.data.length > 0 && !response.data.data.some((s: any) => s.name === selectedSeason)) {
                        setSelectedSeason(response.data.data[0].name);
                    }
                }
            } catch (err) {
                console.log("Failed to load seasons from server, using offline presets:", err);
            }
        };
        fetchSeasons();
    }, []);

    const overview = useMemo(() => {
        let multiplier = 1.0;
        if (selectedSeason.includes("2025")) {
            multiplier = selectedSeason.includes("Wet") || selectedSeason.includes("Tier 1") ? 0.75 : 0.6;
        }
        const baseFarmers = (apiFarmers && Array.isArray(apiFarmers)) ? apiFarmers.length : 0;
        const baseFarms = (apiFarms && Array.isArray(apiFarms)) ? apiFarms.length : 0;
        const baseTasks = (apiTasksData && Array.isArray(apiTasksData.data)) ? apiTasksData.data.length : 0;

        return {
            farmers: Math.round(baseFarmers * multiplier),
            farms: Math.round(baseFarms * multiplier),
            tasks: Math.round(baseTasks * multiplier),
            sync: baseFarmers > 0 ? 3 : 0
        };
    }, [apiFarmers, apiFarms, apiTasksData, selectedSeason]);

    const earnings = useMemo(() => {
        const baseFarmers = (apiFarmers && Array.isArray(apiFarmers)) ? apiFarmers.length : 0;
        if (baseFarmers === 0) {
            return { baseEarn: 0, avgPt: 0, count: 0, potential: 0, pending: 0 };
        }

        const tasks = (apiTasksData?.data && Array.isArray(apiTasksData.data)) ? apiTasksData.data : [];
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;

        let multiplier = 1.0;
        if (selectedSeason.includes("2025")) {
            multiplier = selectedSeason.includes("Wet") || selectedSeason.includes("Tier 1") ? 0.85 : 0.6;
        }

        const count = Math.round(baseFarmers * multiplier);
        const potential = count * 10000;
        const avgPt = tasks.length > 0
            ? Math.min(100, Math.round((completedTasks / tasks.length) * 100))
            : (baseFarmers > 0 && completedTasks > 0 ? Math.min(100, Math.round((completedTasks / (baseFarmers * 16)) * 100)) : 0);
        const baseEarn = Math.round((avgPt / 100) * 10000 * count);
        const pending = Math.max(0, potential - baseEarn);

        return { baseEarn, avgPt, count, potential, pending };
    }, [apiFarmers, apiTasksData, selectedSeason]);

    const priorities = useMemo(() => {
        return [
            { key: 'call', title: `Call Farmers (${summary.needsCall})`, subtitle: 'Find out start dates', icon: 'call' as const, color: '#16A34A', bgColor: '#DCFCE7', count: summary.needsCall },
            { key: 'visit', title: `Visit Farmers (${summary.needsVisit})`, subtitle: 'Field visits due', icon: 'walk' as const, color: '#D97706', bgColor: '#FEF3C7', count: summary.needsVisit },
            { key: 'validate', title: `Validate Activities (${summary.awaitingValidation})`, subtitle: 'Confirm work has started', icon: 'checkmark-circle-outline' as const, color: '#D97706', bgColor: '#FEF9C3', count: summary.awaitingValidation }
        ];
    }, [summary]);

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 50) {
            if (!isScrolled) setIsScrolled(true);
        } else {
            if (isScrolled) setIsScrolled(false);
        }
    };

    const getFormattedDate = () => {
        const d = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} / ${hrs}:${mins}`;
    };

    const weather = useMemo(() => {
        const defaultWeather = {
            temp: '28°C',
            desc: 'Sunny / Warm',
            humidity: '55%',
            precip: '0 mm',
            wind: '12 km/h',
            icon: 'sunny' as const,
            iconColor: '#F59E0B',
        };
        return WEATHER_PRESETS[weatherLocation as WeatherLocation] || defaultWeather;
    }, [weatherLocation]);

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style={isScrolled ? "dark" : "light"} hidden={false} />

            <Image
                source={DASHBOARD_BG}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />

            <CustomNavBar 
                textColor={isScrolled ? "#000000" : "#FFFFFF"} 
                blurIntensity={Platform.OS === 'ios' ? 20 : 10} 
            />

            <ScrollView
                style={{ flex: 1 }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingTop: 130, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#16A34A']}
                        tintColor="#16A34A"
                    />
                }
            >
                {/* ═══════ GREETING HEADER ═══════ */}
                <View style={[styles.greetingRow, { paddingHorizontal: 16 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.greetingText}>{t('hi_user', { name: greetingName })}</Text>
                        <Text style={styles.greetingSubtext}>{"Here's your mission for today."}</Text>
                    </View>
                </View>

                {/* ═══════ SEASON & SYNC CAPSULES ═══════ */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, marginTop: 4 }}>
                    <TouchableOpacity 
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            gap: 6
                        }} 
                        onPress={() => setShowSeasonModal(true)}
                    >
                        <Ionicons name="calendar-outline" size={14} color="#fff" style={{ marginRight: 2 }} />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{selectedSeason}</Text>
                        <Ionicons name="chevron-down-outline" size={10} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.syncStatusTop} onPress={() => setShowSyncModal(true)}>
                        <Ionicons name="cloud-done-outline" size={14} color="#fff" />
                        <Text style={styles.syncStatusTopText}>Last sync: {lastSyncShort}</Text>
                        <Ionicons name="checkmark-circle" size={14} color="#86EFAC" />
                    </TouchableOpacity>
                </View>

                {/* ═══════ GLASSMORPHIC WEATHER CARD ═══════ */}
                <View style={styles.weatherCard}>
                    {/* Location selector header row */}
                    <View style={styles.weatherHeader}>
                        <TouchableOpacity 
                            style={styles.weatherLocationBtn} 
                            onPress={() => setShowLocationModal(true)}
                        >
                            <Ionicons name="location-sharp" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.weatherLocationText}>{weatherLocation}</Text>
                            <Ionicons name="chevron-down-outline" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                        
                        <View style={styles.weatherIconWrap}>
                            <Ionicons name={weather.icon as any} size={24} color={weather.iconColor} />
                        </View>
                    </View>

                    {/* Temp and description middle block */}
                    <View style={styles.weatherInfoRow}>
                        <Text style={styles.weatherTempText}>{weather.temp}</Text>
                        <View style={styles.weatherConditionCol}>
                            <Text style={styles.weatherDescText}>{weather.desc}</Text>
                            <Text style={styles.weatherDateText}>{getFormattedDate()}</Text>
                        </View>
                    </View>

                    {/* Horizontal 3-column detailed metrics */}
                    <View style={styles.weatherGrid}>
                        <View style={styles.weatherGridCol}>
                            <Text style={styles.weatherMetricVal}>{weather.humidity}</Text>
                            <Text style={styles.weatherMetricLabel}>Humidity</Text>
                        </View>
                        <View style={[styles.weatherGridCol, styles.weatherGridColBorder]}>
                            <Text style={styles.weatherMetricVal}>{weather.precip}</Text>
                            <Text style={styles.weatherMetricLabel}>Precipitation</Text>
                        </View>
                        <View style={styles.weatherGridCol}>
                            <Text style={styles.weatherMetricVal}>{weather.wind}</Text>
                            <Text style={styles.weatherMetricLabel}>Wind Speed</Text>
                        </View>
                    </View>
                </View>

                {/* ═══════ MAIN WHITE CONTAINER ═══════ */}
                <View style={styles.mainWhiteContainer}>

                    {/* Today's Overview */}
                    <Text style={[styles.sectionTitle, { color: '#065F46', marginTop: 0 }]}>{"Today's Overview"}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overviewScroll}>
                        {/* Farmers Card */}
                        <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#F0FDF4' }]} activeOpacity={0.8} onPress={() => router.push('/(agent)/farmers')}>
                            <View style={[styles.overviewIconWrap, { backgroundColor: '#22C55E' }]}>
                                <Ionicons name="people" size={18} color="#fff" />
                            </View>
                            <Text style={styles.overviewCount}>{overview.farmers}</Text>
                            <Text style={styles.overviewLabelPrimary}>Farmers</Text>
                            <Text style={styles.overviewLabelSecondary}>Under your care</Text>
                            <Text style={[styles.overviewLink, { color: '#16A34A' }]}>View all</Text>
                        </TouchableOpacity>

                        {/* Farms Card */}
                        <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#EFF6FF' }]} activeOpacity={0.8} onPress={() => router.push('/(agent)/farms')}>
                            <View style={[styles.overviewIconWrap, { backgroundColor: '#3B82F6' }]}>
                                <Ionicons name="leaf" size={18} color="#fff" />
                            </View>
                            <Text style={styles.overviewCount}>{overview.farms}</Text>
                            <Text style={styles.overviewLabelPrimary}>Farms</Text>
                            <Text style={styles.overviewLabelSecondary}>Under management</Text>
                            <Text style={[styles.overviewLink, { color: '#2563EB' }]}>View all</Text>
                        </TouchableOpacity>

                        {/* Tasks Card */}
                        <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#FFFBEB' }]} activeOpacity={0.8} onPress={() => router.push('/(agent)/tasks')}>
                            <View style={[styles.overviewIconWrap, { backgroundColor: '#F59E0B' }]}>
                                <Ionicons name="clipboard" size={18} color="#fff" />
                            </View>
                            <Text style={styles.overviewCount}>{overview.tasks}</Text>
                            <Text style={styles.overviewLabelPrimary}>Tasks Today</Text>
                            <Text style={styles.overviewLabelSecondary}>Due today</Text>
                            <Text style={[styles.overviewLink, { color: '#D97706' }]}>View tasks</Text>
                        </TouchableOpacity>

                        {/* Sync Card */}
                        <TouchableOpacity style={[styles.overviewCard, { backgroundColor: '#FAF5FF' }]} activeOpacity={0.8} onPress={() => setShowSyncModal(true)}>
                            <View style={[styles.overviewIconWrap, { backgroundColor: '#A855F7' }]}>
                                <Ionicons name="sync" size={18} color="#fff" />
                            </View>
                            <Text style={styles.overviewCount}>{overview.sync}</Text>
                            <Text style={styles.overviewLabelPrimary}>Pending Sync</Text>
                            <Text style={styles.overviewLabelSecondary}>Tap to sync data</Text>
                            <Text style={[styles.overviewLink, { color: '#9333EA' }]}>Sync now</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity
                        style={{
                            backgroundColor: '#0E6F6A',
                            borderRadius: 18,
                            padding: 18,
                            marginTop: 16,
                            shadowColor: '#0E6F6A',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.3,
                            shadowRadius: 10,
                            elevation: 5,
                        }}
                        activeOpacity={0.9}
                        onPress={() => router.push('/(agent)/vcmScorecard')}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons name="cash" size={22} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>VCM Portfolio Earnings & Scorecard</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                                        {earnings.count} Farmers Supported • {earnings.count > 0 ? `${Math.ceil(earnings.count / 25)} MTG Clusters` : '0 MTG Clusters'}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>{earnings.avgPt} Avg Pts</Text>
                            </View>
                        </View>
 
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                            <View>
                                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' }}>Total VCM Fee Earned To Date</Text>
                                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>
                                    ₦{earnings.baseEarn.toLocaleString()}{' '}
                                    <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.75)' }}>
                                        / ₦{earnings.potential.toLocaleString()} Potential
                                    </Text>
                                </Text>
                            </View>
                            
                            <TouchableOpacity
                                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
                                onPress={() => router.push('/(agent)/vcmScorecard')}
                            >
                                <Text style={{ color: '#0E6F6A', fontSize: 12, fontWeight: '800' }}>View Full Scorecard</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Portfolio Progress Bar */}
                        <View style={{ marginTop: 12, gap: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Portfolio Target Achieved</Text>
                                <Text style={{ color: '#86EFAC', fontSize: 10, fontWeight: '700' }}>
                                    {earnings.avgPt}% Earned (₦{earnings.pending.toLocaleString()} Pending)
                                </Text>
                            </View>
                            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                                <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, earnings.avgPt))}%`, backgroundColor: '#86EFAC', borderRadius: 3 }} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Task Summary */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Task Summary</Text>
                        <TouchableOpacity onPress={() => router.push('/(agent)/tasks')}>
                            <Text style={styles.seeAllLink}>See all tasks</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskSummaryScroll}>
                        {/* Needs Call */}
                        <TouchableOpacity style={styles.taskSummaryItem} onPress={() => router.push('/(agent)/needs-call')}>
                            <View>
                                <View style={styles.taskSummaryIconRow}>
                                    <View style={[styles.taskSummaryIconBg, { backgroundColor: '#FEE2E2' }]}>
                                        <Ionicons name="call" size={16} color="#DC2626" />
                                    </View>
                                    <Text style={styles.taskSummaryCount}>{summary.needsCall}</Text>
                                </View>
                                <Text style={styles.taskSummaryLabel}>Needs Call</Text>
                                <Text style={styles.taskSummarySub}>Farmers to call</Text>
                            </View>
                            <View style={[styles.taskSummaryLine, { backgroundColor: '#DC2626' }]} />
                        </TouchableOpacity>

                        {/* Needs Visit */}
                        <TouchableOpacity style={styles.taskSummaryItem} onPress={() => router.push('/(agent)/needs-visit')}>
                            <View>
                                <View style={styles.taskSummaryIconRow}>
                                    <View style={[styles.taskSummaryIconBg, { backgroundColor: '#FFEDD5' }]}>
                                        <Ionicons name="eye" size={16} color="#EA580C" />
                                    </View>
                                    <Text style={styles.taskSummaryCount}>{summary.needsVisit}</Text>
                                </View>
                                <Text style={styles.taskSummaryLabel}>Needs Visit</Text>
                                <Text style={styles.taskSummarySub}>Farmers to visit</Text>
                            </View>
                            <View style={[styles.taskSummaryLine, { backgroundColor: '#EA580C' }]} />
                        </TouchableOpacity>

                        {/* Awaiting Validation */}
                        <TouchableOpacity style={styles.taskSummaryItem} onPress={() => router.push('/(agent)/awaiting-validation')}>
                            <View>
                                <View style={styles.taskSummaryIconRow}>
                                    <View style={[styles.taskSummaryIconBg, { backgroundColor: '#FEF3C7' }]}>
                                        <Ionicons name="time" size={16} color="#D97706" />
                                    </View>
                                    <Text style={styles.taskSummaryCount}>{summary.awaitingValidation}</Text>
                                </View>
                                <Text style={styles.taskSummaryLabel}>Awaiting Validation</Text>
                                <Text style={styles.taskSummarySub}>Start validation</Text>
                            </View>
                            <View style={[styles.taskSummaryLine, { backgroundColor: '#F59E0B' }]} />
                        </TouchableOpacity>

                        {/* Completed */}
                        <TouchableOpacity style={styles.taskSummaryItem} onPress={() => router.push('/(agent)/tasks')}>
                            <View>
                                <View style={styles.taskSummaryIconRow}>
                                    <View style={[styles.taskSummaryIconBg, { backgroundColor: '#DCFCE7' }]}>
                                        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                    </View>
                                    <Text style={styles.taskSummaryCount}>{summary.completed}</Text>
                                </View>
                                <Text style={styles.taskSummaryLabel}>Completed</Text>
                                <Text style={styles.taskSummarySub}>Tasks done</Text>
                            </View>
                            <View style={[styles.taskSummaryLine, { backgroundColor: '#22C55E' }]} />
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Task Timeline Schedule (Gantt Chart) */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Tier Calendar</Text>
                        <TouchableOpacity onPress={() => router.push('/(agent)/reports')}>
                            <Text style={styles.seeAllLink}>See details</Text>
                        </TouchableOpacity>
                    </View>

                    {activeSeason && (
                        <View style={[styles.ganttCard, { backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                            {/* Cropping System Option Pill Selector */}
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.tierToggleScrollContainer}
                                style={styles.tierToggleScrollView}
                            >
                                {STATE_CALENDARS[activeState].map((opt, idx) => {
                                    const isSelected = selectedOptionIdx === idx;
                                    return (
                                        <TouchableOpacity 
                                            key={opt.id} 
                                            style={[
                                                styles.optionToggleBtn, 
                                                { borderColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' },
                                                isSelected ? styles.optionToggleBtnActive : null,
                                                isSelected ? { backgroundColor: colors.primary || '#0E6F6A', borderColor: 'transparent' } : null
                                            ]} 
                                            onPress={() => setSelectedOptionIdx(idx)}
                                        >
                                            <Text style={[styles.optionToggleText, { color: isSelected ? '#FFFFFF' : '#64748B' }]}>
                                                {opt.optionCode}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Tier Selector Tab Segment */}
                            <View style={[styles.tierToggleContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <TouchableOpacity 
                                    style={[styles.tierToggleBtn, activeTier === 1 ? [styles.tierToggleBtnActive, { backgroundColor: colors.primary || '#0E6F6A' }] : null]} 
                                    onPress={() => setActiveTier(1)}
                                >
                                    <Text style={[styles.tierToggleText, { color: activeTier === 1 ? '#FFFFFF' : '#64748B' }]}>
                                        {activeOption.tier1Title}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.tierToggleBtn, activeTier === 2 ? [styles.tierToggleBtnActive, { backgroundColor: colors.primary || '#0E6F6A' }] : null]} 
                                    onPress={() => setActiveTier(2)}
                                >
                                    <Text style={[styles.tierToggleText, { color: activeTier === 2 ? '#FFFFFF' : '#64748B' }]}>
                                        {activeOption.tier2Title}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* View Mode Toggle: Operations & Dates vs Crops System */}
                            <View style={[styles.modeToggleContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <TouchableOpacity 
                                    style={[styles.modeToggleBtn, calendarViewMode === 'activities' ? [styles.modeToggleBtnActive, { backgroundColor: colors.primary || '#0E6F6A' }] : null]} 
                                    onPress={() => setCalendarViewMode('activities')}
                                >
                                    <Ionicons 
                                        name="calendar-outline" 
                                        size={12} 
                                        color={calendarViewMode === 'activities' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')} 
                                    />
                                    <Text style={[styles.modeToggleText, { color: calendarViewMode === 'activities' ? '#FFFFFF' : '#64748B' }]}>
                                        Operations & Dates
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.modeToggleBtn, calendarViewMode === 'crops' ? [styles.modeToggleBtnActive, { backgroundColor: colors.primary || '#0E6F6A' }] : null]} 
                                    onPress={() => setCalendarViewMode('crops')}
                                >
                                    <Ionicons 
                                        name="leaf-outline" 
                                        size={12} 
                                        color={calendarViewMode === 'crops' ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')} 
                                    />
                                    <Text style={[styles.modeToggleText, { color: calendarViewMode === 'crops' ? '#FFFFFF' : '#64748B' }]}>
                                        Crops System
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Timeline Header Row (Months) */}
                            <View style={styles.ganttHeaderRow}>
                                <View style={styles.ganttTaskNameColHeader} />
                                <View style={styles.ganttDaysContainer}>
                                    {activeSeason.months.map((month, idx) => (
                                        <Text key={idx} style={styles.ganttDayHeaderLabel}>{month}</Text>
                                    ))}
                                </View>
                            </View>

                            {/* Timeline Rows per Task */}
                            {activeSeason.tasks.map((task, index) => {
                                const totalMonths = activeSeason.months.length;
                                const leftPercent = `${(task.start / totalMonths) * 100}%` as `${number}%`;
                                const widthPercent = `${(task.duration / totalMonths) * 100}%` as `${number}%`;
                                const progressPercent = `${task.progress * 100}%` as `${number}%`;
                                const activeProgressLeft = `${(task.start + (task.duration * task.progress)) / totalMonths * 100}%` as `${number}%`;

                                return (
                                    <TouchableOpacity 
                                        key={task.name} 
                                        style={styles.ganttTaskRow} 
                                        activeOpacity={0.7}
                                        onPress={() => router.push('/(agent)/reports')}
                                    >
                                        {/* Left label with task index, name, date badge and status indicator */}
                                        <View style={[styles.ganttLabelContainer, { borderRightColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                                            <View style={styles.ganttIndexContainer}>
                                                <Text style={[styles.ganttIndex, { color: colors.textMuted || '#94A3B8' }]}>
                                                    {String(index + 1).padStart(2, '0')}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, gap: 3 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                    <View style={[styles.ganttStatusRing, { borderColor: task.color }]} />
                                                    <Text style={[styles.ganttTaskName, { color: colors.text || '#1F2937' }]} numberOfLines={1}>
                                                        {task.name}
                                                    </Text>
                                                </View>

                                                {/* Date badge showing dates for land prep, planting, weeding, etc. */}
                                                {task.dateRange ? (
                                                    <View style={[styles.ganttDateBadge, { backgroundColor: isDarkMode ? 'rgba(14, 111, 106, 0.22)' : '#E6F4FE' }]}>
                                                        <Ionicons name="calendar-outline" size={9} color={colors.primary || '#0E6F6A'} />
                                                        <Text style={[styles.ganttDateBadgeText, { color: colors.primary || '#0E6F6A' }]}>
                                                            {task.dateRange}
                                                        </Text>
                                                    </View>
                                                ) : null}

                                                <View style={[styles.ganttProgressBadge, { backgroundColor: `${task.color}15` }]}>
                                                    <Text style={[styles.ganttProgressBadgeText, { color: task.color }]}>
                                                        {(task as any).status ? (task as any).status.toUpperCase() : `${Math.round(task.progress * 100)}% DONE`}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Right timeline track */}
                                        <View style={styles.ganttTimelineTrackContainer}>
                                            <View style={[styles.ganttTimelineTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                                {/* Vertical light grid lines */}
                                                <View style={styles.ganttGridLines} pointerEvents="none">
                                                    {Array.from({ length: totalMonths + 1 }).map((_, idx) => (
                                                        <View key={idx} style={[styles.ganttGridLine, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: 0.4 }]} />
                                                    ))}
                                                </View>

                                                {/* Highlight active month column (simulated as middle column of the season) */}
                                                <View style={{
                                                    position: 'absolute',
                                                    left: `${Math.floor(totalMonths / 2) / totalMonths * 100}%`,
                                                    width: `${1 / totalMonths * 100}%`,
                                                    top: -12,
                                                    bottom: -12,
                                                    backgroundColor: isDarkMode ? 'rgba(13, 148, 136, 0.05)' : 'rgba(14, 111, 106, 0.03)',
                                                    borderLeftWidth: 1,
                                                    borderRightWidth: 1,
                                                    borderStyle: 'dashed',
                                                    borderColor: isDarkMode ? 'rgba(13, 148, 136, 0.2)' : 'rgba(14, 111, 106, 0.1)',
                                                }} pointerEvents="none" />

                                                {/* Gantt Bar track background */}
                                                <View style={[
                                                    styles.ganttBar, 
                                                    { 
                                                        left: leftPercent, 
                                                        width: widthPercent, 
                                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                                        borderWidth: 1 
                                                    }
                                                ]}>
                                                    {/* Progress sub-bar (glow styled) */}
                                                    {task.progress > 0 && (
                                                        <View style={[
                                                            styles.ganttProgressBar, 
                                                            { 
                                                                width: progressPercent, 
                                                                backgroundColor: task.color,
                                                            }
                                                        ]} />
                                                    )}
                                                </View>

                                                {/* Futuristic Pulsing Dot at the frontier of progress */}
                                                {task.progress > 0 && task.progress < 1 && (
                                                    <View style={[
                                                        styles.ganttProgressDot, 
                                                        { 
                                                            left: activeProgressLeft,
                                                            backgroundColor: task.color,
                                                            shadowColor: task.color,
                                                            shadowOffset: { width: 0, height: 0 },
                                                            shadowOpacity: 0.9,
                                                            shadowRadius: 6,
                                                            elevation: 4,
                                                        }
                                                    ]} />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}

                            {/* Scheduled Agronomic Operations & Dates Summary */}
                            <View style={[styles.milestonesSummaryCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                                <View style={styles.milestonesSummaryHeader}>
                                    <Ionicons name="calendar" size={14} color={colors.primary || '#0E6F6A'} />
                                    <Text style={[styles.milestonesSummaryTitle, { color: colors.text || '#0F172A' }]}>
                                        Agronomic Cycle & Planned Dates
                                    </Text>
                                    <Text style={[styles.milestonesSummarySub, { color: colors.textMuted || '#64748B' }]}>
                                        {activeSeason.tierTitle}
                                    </Text>
                                </View>

                                <View style={styles.milestonesList}>
                                    {activeSeason.activities.map((act) => {
                                        const iconName = 
                                            act.key === 'land_prep' ? 'construct-outline' :
                                            act.key === 'planting' ? 'leaf-outline' :
                                            act.key === 'fertilizing' ? 'flask-outline' :
                                            act.key === 'weeding' ? 'cut-outline' : 'basket-outline';

                                        return (
                                            <View key={act.name} style={[styles.milestoneRow, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                                    <View style={[styles.milestoneIconCircle, { backgroundColor: `${act.color}18` }]}>
                                                        <Ionicons name={iconName as any} size={13} color={act.color} />
                                                    </View>
                                                    <Text style={[styles.milestoneLabel, { color: colors.text || '#1F2937' }]}>
                                                        {act.name}
                                                    </Text>
                                                </View>

                                                <View style={styles.milestoneRightBadge}>
                                                    <View style={[styles.milestoneDatePill, { backgroundColor: isDarkMode ? 'rgba(14, 111, 106, 0.22)' : '#E6F4FE' }]}>
                                                        <Ionicons name="calendar-outline" size={10} color={colors.primary || '#0E6F6A'} style={{ marginRight: 4 }} />
                                                        <Text style={[styles.milestoneDateText, { color: colors.primary || '#0E6F6A' }]}>
                                                            {act.dateRange}
                                                        </Text>
                                                    </View>
                                                    <View style={[styles.milestoneStatusBadge, { backgroundColor: `${act.color}15` }]}>
                                                        <Text style={[styles.milestoneStatusBadgeText, { color: act.color }]}>
                                                            {act.status}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Upcoming Priorities */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Upcoming Priorities</Text>
                        <TouchableOpacity onPress={() => router.push('/(agent)/tasks')}>
                            <Text style={styles.seeAllLink}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.prioritiesList}>
                        {priorities.map((priority, index) => {
                            const route = priority.icon === 'call' ? '/(agent)/needs-call' : 
                                         priority.icon === 'walk' ? '/(agent)/needs-visit' : 
                                         '/(agent)/awaiting-validation';
                            return (
                                <TouchableOpacity key={index} style={styles.priorityRow} onPress={() => router.push(route as any)}>
                                    <View style={[styles.priorityIconBg, { backgroundColor: priority.bgColor }]}>
                                        <Ionicons name={priority.icon as any} size={20} color={priority.color} />
                                    </View>
                                    <View style={styles.priorityTextCol}>
                                        <Text style={styles.priorityTitle}>{priority.title}</Text>
                                        <Text style={styles.prioritySub}>{priority.subtitle}</Text>
                                    </View>
                                    {priority.count > 0 && (
                                        <View style={styles.priorityAvatars}>
                                            <View style={styles.avatarWrap}>
                                                <Image source={{ uri: 'https://i.pravatar.cc/100?u=12' + index }} style={styles.avatarImg} />
                                            </View>
                                            {priority.count > 1 && (
                                                <View style={[styles.avatarWrap, { marginLeft: -10 }]}>
                                                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=13' + index }} style={styles.avatarImg} />
                                                </View>
                                            )}
                                            {priority.count > 2 && (
                                                <View style={[styles.avatarWrap, { marginLeft: -10 }]}>
                                                    <Image source={{ uri: 'https://i.pravatar.cc/100?u=14' + index }} style={styles.avatarImg} />
                                                </View>
                                            )}
                                            {priority.count > 3 && (
                                                <View style={[styles.avatarWrap, styles.avatarMore, { marginLeft: -10 }]}>
                                                    <Text style={styles.avatarMoreText}>+{priority.count - 3}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    <View style={styles.priorityActionIcon}>
                                        <Ionicons name="chevron-forward-circle" size={24} color="#16A34A" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Yellow Training Banner */}
                        {(apiFarmers && apiFarmers.length > 0) && (
                            <TouchableOpacity style={styles.trainingBanner} onPress={() => router.push('/(agent)/mtgTraining')}>
                                <View style={styles.trainingIconBg}>
                                    <Ionicons name="calendar" size={20} color="#D97706" />
                                </View>
                                <View style={styles.trainingTextCol}>
                                    <Text style={styles.trainingTitle}>2 upcoming trainings this week</Text>
                                    <Text style={styles.trainingSub}>{"Don't forget to mark attendance"}</Text>
                                </View>
                                <View style={styles.trainingBtn}>
                                    <Text style={styles.trainingBtnText}>View Trainings</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Quick Actions */}
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {QUICK_ACTIONS.map((action, i) => {
                            const route = action.label === 'Add Farmer' ? '/(agent)/register-farmer/personal-details' :
                                         action.label === 'Add Farm' ? '/(agent)/farms' :
                                         action.label === 'Log Activity' ? '/(agent)/selectFarm' :
                                         action.label === 'View MTGs' ? '/(agent)/mtgGroups' :
                                         '/(agent)/farms'; // Map View usually on farms
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.quickActionCard}
                                    activeOpacity={0.7}
                                    onPress={async () => {
                                        if (action.label === 'Add Farmer') {
                                            try {
                                                await draftService.startNewRegistration();
                                            } catch (e) {
                                                console.warn('startNewRegistration error:', e);
                                            }
                                            if (navigation?.navigate) {
                                                navigation.navigate('register-farmer/personal-details', { isFromHome: 'true' });
                                            } else {
                                                router.navigate({
                                                    pathname: '/(agent)/register-farmer/personal-details' as any,
                                                    params: { isFromHome: 'true' }
                                                });
                                            }
                                        } else {
                                            const routeName = route.replace('/(agent)/', '');
                                            if (navigation?.navigate) {
                                                navigation.navigate(routeName, action.label === 'Log Activity' ? { isFromHome: 'true' } : {});
                                            } else {
                                                router.navigate({
                                                    pathname: route as any,
                                                    params: action.label === 'Log Activity' ? { isFromHome: 'true' } : {}
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <View style={styles.quickActionIconBorder}>
                                        <Ionicons name={action.icon as any} size={24} color={action.color} />
                                    </View>
                                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                </View>
            </ScrollView>

            {/* ═══════ LOCATION SELECTOR DROPDOWN MODAL ═══════ */}
            {showLocationModal && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Backdrop to close overlay when clicking outside */}
                    <TouchableOpacity
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }]}
                        activeOpacity={1}
                        onPress={() => setShowLocationModal(false)}
                    />
                    {/* Floating modal dropdown card */}
                    <View style={styles.dropdownOverlay}>
                        <Text style={styles.dropdownTitle}>Select Location</Text>
                        {(Object.keys(WEATHER_PRESETS) as WeatherLocation[]).map((loc) => (
                            <TouchableOpacity
                                key={loc}
                                style={[
                                    styles.dropdownItem,
                                    weatherLocation === loc && styles.dropdownItemActive
                                ]}
                                onPress={() => {
                                    setWeatherLocation(loc);
                                    setShowLocationModal(false);
                                }}
                            >
                                <Ionicons
                                    name="location-sharp"
                                    size={16}
                                    color={weatherLocation === loc ? '#0E6F6A' : '#6B7280'}
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        weatherLocation === loc && styles.dropdownItemTextActive
                                    ]}
                                >
                                    {loc}
                                </Text>
                                {weatherLocation === loc && (
                                    <Ionicons name="checkmark-circle" size={18} color="#0E6F6A" style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* ═══════ SEASON SELECTOR DROPDOWN MODAL ═══════ */}
            {showSeasonModal && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Backdrop to close overlay when clicking outside */}
                    <TouchableOpacity
                        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }]}
                        activeOpacity={1}
                        onPress={() => setShowSeasonModal(false)}
                    />
                    {/* Floating modal dropdown card */}
                    <View style={styles.dropdownOverlay}>
                        <Text style={styles.dropdownTitle}>Select Planting Season</Text>
                        {seasons.map((season) => (
                            <TouchableOpacity
                                key={season.id}
                                style={[
                                    styles.dropdownItem,
                                    selectedSeason === season.name && styles.dropdownItemActive
                                ]}
                                onPress={() => {
                                    setSelectedSeason(season.name);
                                    setShowSeasonModal(false);
                                }}
                            >
                                <Ionicons
                                    name="calendar-sharp"
                                    size={16}
                                    color={selectedSeason === season.name ? '#0E6F6A' : '#6B7280'}
                                    style={{ marginRight: 8 }}
                                />
                                <Text
                                    style={[
                                        styles.dropdownItemText,
                                        selectedSeason === season.name && styles.dropdownItemTextActive
                                    ]}
                                >
                                    {season.name}
                                </Text>
                                {selectedSeason === season.name && (
                                    <Ionicons name="checkmark-circle" size={18} color="#0E6F6A" style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* ═══════ VCM SCORECARD FULL MODAL ═══════ */}
            <Modal
                visible={showScorecardModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowScorecardModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: colors.card,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        maxHeight: '92%',
                        padding: 16,
                        paddingBottom: 28,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Agent Seasonal Scorecard</Text>
                            <TouchableOpacity
                                onPress={() => setShowScorecardModal(false)}
                                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="close" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <VcmScorecardCard
                                farmerName={earnings.count > 0 ? `All Assigned Farmers (${earnings.count})` : 'Assigned Farmers (0)'}
                                farmerId="VCM-SEASON-2026"
                                totalFarmers={earnings.count}
                                totalEarned={earnings.baseEarn}
                                totalPotential={earnings.potential}
                                loggedActivitiesCount={(apiTasksData?.data || []).filter((t: any) => t.status === 'completed').length}
                                onLogActivityPress={(actId) => {
                                    setShowScorecardModal(false);
                                    router.push({ pathname: '/(agent)/logActivities', params: { activityId: actId } });
                                }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <SyncDataModal
                visible={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                pendingCount={overview.sync}
                onSyncComplete={() => {
                    refetchFarmers();
                    refetchFarms();
                    refetchTasks();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    // Greeting
    greetingRow: {
        marginBottom: 16,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between'
    },
    greetingText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 34,
    },
    greetingSubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
        fontWeight: '500'
    },
    syncStatusTop: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6
    },
    syncStatusTopText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600'
    },

    // Main Container
    mainWhiteContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 40,
        minHeight: Dimensions.get('window').height - 200,
    },
    sectionTitleGreen: {
        fontSize: 16,
        fontWeight: '700',
        color: '#065F46',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
    },
    seeAllLink: {
        fontSize: 13,
        color: '#2563EB',
        fontWeight: '600'
    },

    // Overview Scroll
    overviewScroll: {
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 4
    },
    overviewCard: {
        width: 130,
        borderRadius: 16,
        padding: 12, // Reduced from 14
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        justifyContent: 'space-between'
    },
    overviewIconWrap: {
        width: 30, // Reduced from 32
        height: 30, // Reduced from 32
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8 // Reduced from 12
    },
    overviewCount: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4
    },
    overviewLabelPrimary: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151'
    },
    overviewLabelSecondary: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 8 // Reduced from 12
    },
    overviewLink: {
        fontSize: 12,
        fontWeight: '700'
    },

    // Task Summary Scroll
    taskSummaryScroll: {
        gap: 12,
        paddingBottom: 4
    },
    taskSummaryItem: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 16,
        padding: 12,
        width: 130,
        // Height naturally wraps content with space-between
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        position: 'relative',
        overflow: 'hidden',
        justifyContent: 'space-between'
    },
    taskSummaryIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    taskSummaryIconBg: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskSummaryCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827'
    },
    taskSummaryLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 2
    },
    taskSummarySub: {
        fontSize: 11,
        color: '#6B7280'
    },
    taskSummaryLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3
    },

    // Crop Cycle
    cropCycleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cropChartCard: {
        flex: 1.5,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 16,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
        justifyContent: 'center',
    },
    chartLegend: {
        marginLeft: 8,
        justifyContent: 'center',
        flex: 1
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4
    },
    legendLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#4B5563',
        flex: 1
    },
    legendValue: {
        fontSize: 9,
        color: '#111827',
        fontWeight: '700'
    },
    legendPercent: {
        fontSize: 9,
        color: '#9CA3AF'
    },
    cropStageCard: {
        flex: 1,
        backgroundColor: '#F0FDF4', // Very light green
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    stageIconRow: {
        marginBottom: 8
    },
    stageSub: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2
    },
    stageTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#065F46', // Dark green text
        marginBottom: 4
    },
    stageDesc: {
        fontSize: 10,
        color: '#4B5563',
        marginBottom: 8
    },
    stageLink: {
        fontSize: 11,
        fontWeight: '600',
        color: '#16A34A'
    },

    // Priorities
    prioritiesList: {
        gap: 12,
    },
    priorityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    priorityIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    priorityTextCol: {
        flex: 1
    },
    priorityTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937'
    },
    prioritySub: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2
    },
    priorityAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12
    },
    avatarWrap: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        overflow: 'hidden'
    },
    avatarImg: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    avatarMore: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
    },
    avatarMoreText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#374151'
    },
    priorityActionIcon: {
        padding: 4
    },
    trainingBanner: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    trainingIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    trainingTextCol: {
        flex: 1
    },
    trainingTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937'
    },
    trainingSub: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2
    },
    trainingBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#FCD34D',
        borderRadius: 16
    },
    trainingBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#D97706'
    },

    // Quick Actions
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 4
    },
    quickActionCard: {
        alignItems: 'center',
        width: '18%',
    },
    quickActionIconBorder: {
        width: 52,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    quickActionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center'
    },

    // ── Weather Card Glassmorphism styles ──
    weatherCard: {
        backgroundColor: 'rgba(12, 45, 28, 0.88)', // rich forest green, less transparent
        borderColor: 'rgba(255, 255, 255, 0.20)', // higher border contrast
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 18,
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    weatherLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    weatherLocationText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },
    weatherIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    weatherInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    weatherTempText: {
        fontSize: 48,
        fontWeight: '300',
        color: '#FFFFFF',
        marginRight: 14,
        fontFamily: 'Acorn-Regular',
    },
    weatherConditionCol: {
        flex: 1,
        justifyContent: 'center',
    },
    weatherDescText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },
    weatherDateText: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    weatherGrid: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
        paddingTop: 12,
    },
    weatherGridCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weatherGridColBorder: {
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.15)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.15)',
    },
    weatherMetricVal: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        fontFamily: 'Acorn-Bold',
    },
    weatherMetricLabel: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },

    // ── Location selector overlay dropdown modal styles ──
    dropdownOverlay: {
        position: 'absolute',
        top: '30%',
        left: '8%',
        right: '8%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 15,
        zIndex: 1001,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 14,
        fontFamily: 'Acorn-Bold',
        textAlign: 'center',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        marginBottom: 6,
        backgroundColor: '#F9FAFB',
    },
    dropdownItemActive: {
        backgroundColor: '#E6F4F0',
    },
    dropdownItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    dropdownItemTextActive: {
        color: '#0E6F6A',
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },

    // ── Gantt Chart Styles ──
    tierToggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tierToggleScrollView: {
        marginBottom: 16,
        maxHeight: 46,
    },
    tierToggleScrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    tierToggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    tierToggleBtnActive: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    tierToggleText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ganttCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    ganttHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.08)',
        paddingBottom: 10,
        marginBottom: 16,
    },
    ganttTaskNameColHeader: {
        width: 125,
    },
    ganttDaysContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    ganttDayHeaderLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1.5,
    },
    ganttTaskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.03)',
    },
    ganttLabelContainer: {
        width: 125,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        gap: 6,
        borderRightWidth: 1,
    },
    ganttIndexContainer: {
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
        borderRadius: 6,
        paddingHorizontal: 4,
        paddingVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ganttIndex: {
        fontSize: 9,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    ganttStatusRing: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
    },
    ganttTaskName: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
        lineHeight: 14,
    },
    ganttDateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    ganttDateBadgeText: {
        fontSize: 8.5,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    ganttProgressBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    ganttProgressBadgeText: {
        fontSize: 7.5,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    ganttTimelineTrackContainer: {
        flex: 1,
        height: 32,
        position: 'relative',
        justifyContent: 'center',
        paddingLeft: 8,
    },
    ganttTimelineTrack: {
        flex: 1,
        height: 6,
        position: 'relative',
        justifyContent: 'center',
        borderRadius: 3,
        overflow: 'visible',
    },
    ganttGridLines: {
        ...StyleSheet.absoluteFill,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    ganttGridLine: {
        width: 1,
        height: '100%',
    },
    ganttBar: {
        position: 'absolute',
        height: 6,
        borderRadius: 3,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    ganttProgressBar: {
        height: '100%',
        borderRadius: 3,
    },
    ganttProgressDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: -5,
        zIndex: 5,
    },
    modeToggleContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 3,
        marginBottom: 14,
        gap: 6,
    },
    modeToggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    modeToggleBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    modeToggleText: {
        fontSize: 10.5,
        fontWeight: '700',
        fontFamily: 'Acorn-Bold',
    },
    milestonesSummaryCard: {
        marginTop: 16,
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
    },
    milestonesSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.15)',
    },
    milestonesSummaryTitle: {
        fontSize: 12,
        fontWeight: '800',
        fontFamily: 'Acorn-Bold',
        letterSpacing: 0.2,
    },
    milestonesSummarySub: {
        marginLeft: 'auto',
        fontSize: 10,
        fontWeight: '600',
    },
    milestonesList: {
        gap: 6,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
    },
    milestoneIconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    milestoneLabel: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Acorn-SemiBold',
    },
    milestoneRightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milestoneDatePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    milestoneDateText: {
        fontSize: 9,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    milestoneStatusBadge: {
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
    },
    milestoneStatusBadgeText: {
        fontSize: 7.5,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    optionSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    optionToggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    optionToggleBtnActive: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1,
    },
    optionToggleText: {
        fontSize: 10,
        fontWeight: '800',
    },
});
