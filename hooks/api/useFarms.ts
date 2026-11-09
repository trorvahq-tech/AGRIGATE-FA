import { useQuery } from '@tanstack/react-query';
import { farmService } from '../../services/farmService';

export const useFarms = () => {
    return useQuery({
        queryKey: ['farms'],
        queryFn: farmService.getFarms,
    });
};

export const useFarm = (id: string) => {
    return useQuery({
        queryKey: ['farms', id],
        queryFn: () => farmService.getFarmById(id),
        enabled: !!id,
    });
};
