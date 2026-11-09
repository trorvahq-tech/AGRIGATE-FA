import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';

export const useReports = () => {
    return useQuery({
        queryKey: ['reports'],
        queryFn: reportService.getReports,
    });
};

export const useReportStats = () => {
    return useQuery({
        queryKey: ['reports', 'stats'],
        queryFn: reportService.getReportStats,
    });
};

export const useReport = (id: string) => {
    return useQuery({
        queryKey: ['reports', id],
        queryFn: () => reportService.getReportById(id),
        enabled: !!id,
    });
};

export const useCroppingSystems = () => {
    return useQuery({
        queryKey: ['cropping-systems'],
        queryFn: reportService.getCroppingSystems,
        staleTime: 0,
        refetchOnMount: 'always',
    });
};

export const useSeasons = () => {
    return useQuery({
        queryKey: ['seasons'],
        queryFn: reportService.getSeasons,
        staleTime: 0,
        refetchOnMount: 'always',
    });
};
