import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { glucoseApi } from '../lib/api';

export const useGlucoseReadings = (patientId, from, to) =>
  useQuery({
    queryKey: ['glucose', patientId, from, to],
    queryFn: async () => {
      const { data } = await glucoseApi.getReadings(patientId, from, to);
      return data.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!patientId,
  });

export const useGlucoseStats = (patientId, period = 14) =>
  useQuery({
    queryKey: ['glucose-stats', patientId, period],
    queryFn: async () => {
      const { data } = await glucoseApi.getStats(patientId, period);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!patientId,
  });

export const useAddGlucoseReading = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reading) => glucoseApi.addReading(reading),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['glucose', vars.patientId] });
      qc.invalidateQueries({ queryKey: ['glucose-stats', vars.patientId] });
    },
  });
};
