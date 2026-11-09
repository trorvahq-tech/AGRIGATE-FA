import { useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/projectService';

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
    });
};
