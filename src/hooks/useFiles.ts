import { useState, useCallback } from 'react';
import { filesApi } from '../services/api';

interface UseFileViewOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export const useFileView = (options: UseFileViewOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const viewFile = useCallback((fileId: string | undefined) => {
    if (!fileId) {
      const err = new Error('No file ID provided');
      setError(err);
      options.onError?.(err);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      filesApi.viewFile(fileId);
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to view file');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const downloadFile = useCallback((fileId: string | undefined, fileName: string) => {
    if (!fileId) {
      const err = new Error('No file ID provided');
      setError(err);
      options.onError?.(err);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      filesApi.downloadFile(fileId, fileName);
      options.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to download file');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return {
    viewFile,
    downloadFile,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Hook for getting file metadata
export const useFileMetadata = () => {
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(async (fileId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await filesApi.getMetadata(fileId);
      setMetadata(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch metadata');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    metadata,
    fetchMetadata,
    isLoading,
    error,
    clearMetadata: () => setMetadata(null),
    clearError: () => setError(null),
  };
};
