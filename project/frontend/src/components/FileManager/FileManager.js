import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import FileList from './FileList';
import FilePreview from './FilePreview';
import FileUpload from './FileUpload';
import './FileManager.css';
import { useFileManager } from '../../hooks/useFileManager';

const FileManager = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  
  const {
    files,
    loading,
    error,
    uploadFiles,
    deleteFile,
    moveFile,
    refreshFiles
  } = useFileManager(currentPath);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles, currentPath);
      }
    },
    noClick: true, // We'll handle clicks manually
    multiple: true
  });

  useEffect(() => {
    refreshFiles();
  }, [currentPath, refreshFiles]);

  const handleNavigate = (path) => {
    setCurrentPath(path);
    setSelectedFiles([]);
    setPreviewFile(null);
  };

  const handleFileSelect = (file) => {
    if (selectedFiles.includes(file.id)) {
      setSelectedFiles(selectedFiles.filter(id => id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, file.id]);
    }
  };

  const handleFilePreview = (file) => {
    setPreviewFile(file);
  };

  const handleFileDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId);
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
      if (previewFile && previewFile.id === fileId) {
        setPreviewFile(null);
      }
    }
  };

  const handleFileMove = async (fileId, newPath) => {
    await moveFile(fileId, newPath);
    setSelectedFiles([]);
  };

  const breadcrumbParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <div className="file-manager" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <div className="file-manager-header">
        <div className="breadcrumb">
          <button 
            className="breadcrumb-item"
            onClick={() => handleNavigate('')}
          >
            🏠 Home
          </button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="breadcrumb-separator">/</span>
              <button 
                className="breadcrumb-item"
                onClick={() => handleNavigate(breadcrumbParts.slice(0, index + 1).join('/'))}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="file-manager-actions">
          <button 
            className="btn btn-primary btn-small"
            onClick={() => setShowUpload(!showUpload)}
          >
            📤 Upload
          </button>
          <button 
            className="btn btn-secondary btn-small"
            onClick={() => refreshFiles()}
            disabled={loading}
          >
            {loading ? '🔄' : '🔄'} Refresh
          </button>
          {selectedFiles.length > 0 && (
            <button 
              className="btn btn-danger btn-small"
              onClick={() => {
                if (window.confirm(`Delete ${selectedFiles.length} selected file(s)?`)) {
                  selectedFiles.forEach(id => handleFileDelete(id));
                }
              }}
            >
              🗑️ Delete ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="upload-section">
          <FileUpload 
            onUpload={(files) => uploadFiles(files, currentPath)}
            currentPath={currentPath}
          />
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-message">
            <div className="drag-icon">📁</div>
            <h3>Drop files here to upload</h3>
            <p>Files will be uploaded to: /{currentPath || 'root'}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content */}
      <div className="file-manager-content">
        <div className="file-list-panel">
          <FileList
            files={files}
            loading={loading}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFilePreview={handleFilePreview}
            onFileDelete={handleFileDelete}
            onNavigate={handleNavigate}
            currentPath={currentPath}
          />
        </div>
        
        {previewFile && (
          <div className="file-preview-panel">
            <FilePreview
              file={previewFile}
              onClose={() => setPreviewFile(null)}
              onDelete={() => handleFileDelete(previewFile.id)}
              onMove={(newPath) => handleFileMove(previewFile.id, newPath)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;