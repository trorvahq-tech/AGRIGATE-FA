import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Farm {
    id: string;
    name: string;
    size: string;
    assignedTo: string;
    subPlots: number;
}

export const farmService = {
    getFarms: async (): Promise<Farm[]> => {
        const response = await api.get<any>('/farms');
        const list = response.data?.farms || response.data?.data || (Array.isArray(response.data) ? response.data : []);
        return list;
    },

    getFarmById: async (id: string): Promise<Farm> => {
        const response = await api.get<any>(`/farms/${id}`);
        return response.data?.data || response.data;
    },
};
