import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Report {
    id: string;
    name: string;
    size: string;
    assignedTo: string;
    harvestLogged: string;
    lastVisit: string;
    subPlots: number;
}

export interface ReportStats {
    farmVisits: number;
    activitiesLogged: number;
    assessmentsDone: number;
    harvestLogs: number;
}

export const reportService = {
    getReports: async (): Promise<Report[]> => {
        try {
            const response = await api.get<any>('/reports');
            return response.data?.data || response.data || [];
        } catch {
            return [];
        }
    },

    getReportStats: async (): Promise<ReportStats> => {
        try {
            const response = await api.get<any>('/reports/stats');
            return response.data?.data || response.data || { farmVisits: 0, activitiesLogged: 0, assessmentsDone: 0, harvestLogs: 0 };
        } catch {
            return { farmVisits: 0, activitiesLogged: 0, assessmentsDone: 0, harvestLogs: 0 };
        }
    },

    getReportById: async (id: string): Promise<Report> => {
        const response = await api.get<any>(`/reports/${id}`);
        return response.data?.data || response.data;
    },

    getCroppingSystems: async (): Promise<any[]> => {
        const response = await api.get('/cropping-systems');
        return response.data?.data || [];
    },

    getSeasons: async (): Promise<any[]> => {
        try {
            const response = await api.get('/seasons');
            return response.data?.data || response.data || [];
        } catch (e) {
            console.warn("Error fetching live seasons, returning empty array for fallback:", e);
            return [];
        }
    },
};
