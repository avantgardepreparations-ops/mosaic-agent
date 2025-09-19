import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../services/fileService';

export const useFileManager = (currentPath = '') => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fileService.listFiles(currentPath);
      setFiles(result.files || []);
    } catch (err) {
      setError(err.message || 'Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  const uploadFiles = async (files, path = '') => {
    setError(null);
    
    try {
      const result = await fileService.uploadFiles(files, path);
      
      // Refresh file list after upload
      await refreshFiles();
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to upload files');
      throw err;
    }
  };

  const deleteFile = async (fileId) => {
    setError(null);
    
    try {
      await fileService.deleteFile(fileId);
      
      // Refresh file list after deletion
      await refreshFiles();
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete file');
      throw err;
    }
  };

  const moveFile = async (fileId, newPath) => {
    setError(null);
    
    try {
      await fileService.moveFile(fileId, newPath);
      
      // Refresh file list after move
      await refreshFiles();
      
      return true;
    } catch (err) {
      setError(err.message || 'Failed to move file');
      throw err;
    }
  };

  const getFileById = async (fileId) => {
    setError(null);
    
    try {
      return await fileService.getFileById(fileId);
    } catch (err) {
      setError(err.message || 'Failed to get file');
      throw err;
    }
  };

  const previewFile = async (fileId) => {
    setError(null);
    
    try {
      return await fileService.previewFile(fileId);
    } catch (err) {
      setError(err.message || 'Failed to preview file');
      throw err;
    }
  };

  const searchFiles = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fileService.searchFiles(query);
      setFiles(result.files || []);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to search files');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when currentPath changes
  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  return {
    files,
    loading,
    error,
    refreshFiles,
    uploadFiles,
    deleteFile,
    moveFile,
    getFileById,
    previewFile,
    searchFiles
  };
};