import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerService } from '../../services/farmerService';

export const useFarmers = () => {
    return useQuery({
        queryKey: ['farmers'],
        queryFn: farmerService.getFarmers,
    });
};

export const useFarmer = (id: string) => {
    return useQuery({
        queryKey: ['farmers', id],
        queryFn: () => farmerService.getFarmerById(id),
        enabled: !!id,
    });
};

export const useCreateFarmer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: farmerService.createFarmer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['farmers'] });
        },
    });
};

export const useOnboardFarmer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ registrationData, projectId }: { registrationData: any; projectId: string }) => 
            farmerService.onboardFarmer(registrationData, projectId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['farmers'] });
            queryClient.invalidateQueries({ queryKey: ['farms'] });
        },
    });
};

export const useUpdateFarmer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, farmerData }: { id: string; farmerData: any }) =>
            farmerService.updateFarmer(id, farmerData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['farmers'] });
            queryClient.invalidateQueries({ queryKey: ['farmers', data.id] });
        },
    });
};

