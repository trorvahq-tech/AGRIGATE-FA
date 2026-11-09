import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService, TaskFilters } from '../../services/taskService';

export const useTasks = (filters: TaskFilters = {}) => {
    return useQuery({
        queryKey: ['tasks', filters],
        queryFn: () => taskService.getTasks(filters),
    });
};

export const useTask = (id: string) => {
    return useQuery({
        queryKey: ['tasks', id],
        queryFn: () => taskService.getTaskById(id),
        enabled: !!id,
    });
};

export const useUpdateTaskStartDate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, date }: { id: string; date: string }) => taskService.updateStartDate(id, date),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
        },
    });
};

export const useMarkTaskStarted = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, date }: { id: string; date: string }) => taskService.markStarted(id, date),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['farmers'] });
        },
    });
};

export const useSetTaskStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => taskService.setStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['farmers'] });
        },
    });
};
