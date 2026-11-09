import api from './apiClient';

export interface Project {
    id: string;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
}

export const projectService = {
    getProjects: async (): Promise<Project[]> => {
        const response = await api.get<{ data: Project[] }>('/projects');
        return response.data.data || [];
    }
};
