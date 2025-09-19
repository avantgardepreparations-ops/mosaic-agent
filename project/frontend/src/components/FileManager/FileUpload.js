import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onUpload, currentPath }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadResults, setUploadResults] = useState([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles, rejectedFiles) => {
      setUploading(true);
      setUploadProgress({});
      setUploadResults([]);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejectedResults = rejectedFiles.map(({ file, errors }) => ({
          name: file.name,
          status: 'error',
          message: errors.map(e => e.message).join(', ')
        }));
        setUploadResults(prev => [...prev, ...rejectedResults]);
      }

      // Upload accepted files
      if (acceptedFiles.length > 0) {
        try {
          await handleUpload(acceptedFiles);
        } catch (error) {
          console.error('Upload error:', error);
          setUploadResults(prev => [...prev, {
            name: 'Upload',
            status: 'error',
            message: error.message || 'Upload failed'
          }]);
        }
      }

      setUploading(false);
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'text/*': ['.txt', '.md', '.html', '.css', '.js', '.json', '.xml'],
      'application/javascript': ['.js'],
      'application/json': ['.json'],
      'application/xml': ['.xml']
    },
    multiple: true
  });

  const handleUpload = async (files) => {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (currentPath) {
      formData.append('path', currentPath);
    }

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          // Note: This won't work with fetch, need to use XMLHttpRequest for progress
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({
            ...prev,
            overall: percentCompleted
          }));
        }
      });

      const result = await response.json();

      if (response.ok) {
        const successResults = result.files.map(file => ({
          name: file.originalName || file.filename,
          status: file.error ? 'error' : 'success',
          message: file.error || `Uploaded successfully (${formatFileSize(file.size)})`
        }));
        
        setUploadResults(prev => [...prev, ...successResults]);
        
        // Notify parent component
        if (onUpload) {
          onUpload(files);
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorResults = files.map(file => ({
        name: file.name,
        status: 'error',
        message: error.message || 'Upload failed'
      }));
      setUploadResults(prev => [...prev, ...errorResults]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`upload-dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="upload-content">
          {uploading ? (
            <div className="upload-progress">
              <div className="spinner"></div>
              <h3>Uploading files...</h3>
              <p>Please wait while your files are being uploaded.</p>
            </div>
          ) : isDragActive ? (
            <div className="upload-active">
              <div className="upload-icon">📤</div>
              <h3>Drop files here</h3>
              <p>Release to upload to /{currentPath || 'root'}</p>
            </div>
          ) : (
            <div className="upload-idle">
              <div className="upload-icon">📁</div>
              <h3>Drag & drop files here</h3>
              <p>or <button className="upload-browse-btn">browse files</button></p>
              <div className="upload-info">
                <div className="upload-limit">
                  Maximum file size: 50MB
                </div>
                <div className="upload-types">
                  Supported: Images, Text files, Code files
                </div>
                {currentPath && (
                  <div className="upload-destination">
                    Upload to: /{currentPath}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="upload-results">
          <div className="upload-results-header">
            <h4>Upload Results</h4>
            <button 
              className="btn btn-small btn-secondary"
              onClick={clearResults}
            >
              Clear
            </button>
          </div>
          
          <div className="upload-results-list">
            {uploadResults.map((result, index) => (
              <div 
                key={index}
                className={`upload-result-item ${result.status}`}
              >
                <div className="upload-result-icon">
                  {result.status === 'success' ? '✅' : '❌'}
                </div>
                <div className="upload-result-details">
                  <div className="upload-result-name">
                    {result.name}
                  </div>
                  <div className="upload-result-message">
                    {result.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .file-upload {
          padding: 1rem;
        }

        .upload-dropzone {
          border: 2px dashed #4a5568;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #1a1a1a;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-dropzone:hover {
          border-color: #48bb78;
          background: rgba(72, 187, 120, 0.05);
        }

        .upload-dropzone.active {
          border-color: #48bb78;
          background: rgba(72, 187, 120, 0.1);
          transform: scale(1.02);
        }

        .upload-dropzone.uploading {
          border-color: #4299e1;
          background: rgba(66, 153, 225, 0.05);
          cursor: not-allowed;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-content h3 {
          margin: 0.5rem 0;
          color: #e2e8f0;
        }

        .upload-content p {
          margin: 0.5rem 0;
          color: #a0aec0;
        }

        .upload-browse-btn {
          background: none;
          border: none;
          color: #48bb78;
          cursor: pointer;
          text-decoration: underline;
          font-size: inherit;
        }

        .upload-browse-btn:hover {
          color: #38a169;
        }

        .upload-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #4a5568;
          font-size: 0.875rem;
        }

        .upload-info div {
          margin: 0.25rem 0;
          color: #a0aec0;
        }

        .upload-destination {
          color: #48bb78 !important;
          font-weight: 600;
        }

        .upload-results {
          margin-top: 1rem;
          border: 1px solid #4a5568;
          border-radius: 6px;
          background: #2d3748;
        }

        .upload-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #4a5568;
        }

        .upload-results-header h4 {
          margin: 0;
          color: #e2e8f0;
          font-size: 1rem;
        }

        .upload-results-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .upload-result-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #4a5568;
          gap: 0.75rem;
        }

        .upload-result-item:last-child {
          border-bottom: none;
        }

        .upload-result-item.success {
          background: rgba(72, 187, 120, 0.05);
        }

        .upload-result-item.error {
          background: rgba(245, 101, 101, 0.05);
        }

        .upload-result-details {
          flex: 1;
          min-width: 0;
        }

        .upload-result-name {
          font-weight: 600;
          color: #e2e8f0;
          font-size: 0.875rem;
          word-break: break-word;
        }

        .upload-result-message {
          font-size: 0.75rem;
          color: #a0aec0;
          margin-top: 0.25rem;
        }

        .upload-result-item.error .upload-result-message {
          color: #f56565;
        }

        .upload-result-item.success .upload-result-message {
          color: #48bb78;
        }
      `}</style>
    </div>
  );
};

export default FileUpload;