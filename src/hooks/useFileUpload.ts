import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileProcessor } from '@/lib/utils/file-processor';
import { Report } from '@/lib/types/amazon';

interface UploadState {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  error: string | null;
}

interface UseFileUploadOptions {
  onSuccess?: (data: Report) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: 'idle',
    error: null
  });

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadState({ progress: 0, status: 'uploading', error: null });

      try {
        // Process the file
        const result = await FileProcessor.processFile(file);
        
        setUploadState(prev => ({ ...prev, progress: 100, status: 'success' }));
        return result;
      } catch (error) {
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }));
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    }
  });

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      await uploadMutation.mutateAsync(file);
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [uploadMutation]);

  return {
    uploadState,
    handleFileUpload,
    isUploading: uploadMutation.isPending,
    reset: () => {
      setUploadState({ progress: 0, status: 'idle', error: null });
    }
  };
}