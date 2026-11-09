import api from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Task {
    id: string;
    seasonId: string;
    stageId: string;
    stageName: string;
    stageCode?: string;
    farmerId: string;
    farmerName?: string;
    assignedStaffId: string | null;
    sclsPlannedDate: string;
    farmerStatedStartDate: string | null;
    farmerStatedStartedDate: string | null;
    validationDate: string | null;
    status: 'not_started' | 'in_progress' | 'delayed' | 'awaiting_validation' | 'completed' | 'overdue';
    delayDays: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface TaskFilters {
    page?: number;
    limit?: number;
    farmerId?: string;
    status?: string;
    overdue?: 'true' | 'false';
    awaitingValidation?: 'true' | 'false';
}

export const taskService = {
    getTasks: async (filters: TaskFilters = {}): Promise<{ data: Task[]; total: number }> => {
        const response = await api.get<any>('/tasks', { params: filters });
        if (response.data && Array.isArray(response.data.data)) {
            return response.data;
        }
        if (response.data && Array.isArray(response.data.tasks)) {
            return { data: response.data.tasks, total: response.data.total || response.data.tasks.length };
        }
        if (Array.isArray(response.data)) {
            return { data: response.data, total: response.data.length };
        }
        return { data: [], total: 0 };
    },

    getTaskById: async (id: string): Promise<Task> => {
        const response = await api.get<any>(`/tasks/${id}`);
        return response.data?.data || response.data;
    },

    updateStartDate: async (id: string, date: string): Promise<Task> => {
        const response = await api.patch<Task>(`/tasks/${id}/update-start-date`, { farmerStatedStartDate: date });
        return response.data;
    },

    markStarted: async (id: string, date: string): Promise<Task> => {
        const response = await api.patch<Task>(`/tasks/${id}/mark-started`, { farmerStatedStartedDate: date });
        return response.data;
    },

    setStatus: async (id: string, status: string): Promise<Task> => {
        const response = await api.patch<Task>(`/tasks/${id}/status`, { status });
        return response.data;
    },
};
