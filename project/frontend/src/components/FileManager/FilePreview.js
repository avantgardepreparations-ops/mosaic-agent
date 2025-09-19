import React, { useState, useEffect } from 'react';

const FilePreview = ({ file, onClose, onDelete, onMove }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (file && file.id) {
      loadPreview();
    }
  }, [file]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files/${file.id}/preview`);
      const data = await response.json();
      
      if (response.ok) {
        setPreviewData(data);
      } else {
        setError(data.message || 'Failed to load preview');
      }
    } catch (err) {
      setError('Failed to load preview');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const handleDownload = () => {
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="preview-loading">
          <div className="spinner"></div>
          <p>Loading preview...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="preview-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary btn-small" onClick={loadPreview}>
            Retry
          </button>
        </div>
      );
    }

    if (!previewData) return null;

    // Image preview
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      return (
        <div className="preview-image">
          <img 
            src={`/api/files/${file.id}/preview`} 
            alt={file.name}
            onError={(e) => {
              e.target.style.display = 'none';
              setError('Failed to load image');
            }}
          />
        </div>
      );
    }

    // Text/code preview
    if (previewData.type === 'text') {
      return (
        <div className="preview-text">
          <div className="preview-text-info">
            <span>Lines: {previewData.lines}</span>
            <span>Language: {previewData.language}</span>
            <span>Size: {formatFileSize(previewData.size)}</span>
          </div>
          <pre className={`preview-code language-${previewData.language}`}>
            <code>{previewData.content}</code>
          </pre>
        </div>
      );
    }

    // Binary/other files
    if (previewData.type === 'binary') {
      return (
        <div className="preview-binary">
          <div className="binary-icon">📄</div>
          <h3>Binary File</h3>
          <p>{previewData.message}</p>
          <p>MIME Type: {previewData.mimetype}</p>
          <p>Size: {formatFileSize(previewData.size)}</p>
          <button className="btn btn-primary" onClick={handleDownload}>
            Download File
          </button>
        </div>
      );
    }

    return (
      <div className="preview-unsupported">
        <div className="unsupported-icon">❓</div>
        <h3>Preview Not Available</h3>
        <p>This file type cannot be previewed.</p>
        <button className="btn btn-primary" onClick={handleDownload}>
          Download File
        </button>
      </div>
    );
  };

  return (
    <div className="file-preview">
      <div className="preview-header">
        <div className="preview-title">
          <h3>{file.name}</h3>
          <button className="preview-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="preview-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Size:</span>
            <span className="metadata-value">{formatFileSize(file.size)}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Type:</span>
            <span className="metadata-value">{file.mimetype || 'Unknown'}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Modified:</span>
            <span className="metadata-value">{formatDate(file.modifiedAt)}</span>
          </div>
          {file.uploadedAt && (
            <div className="metadata-item">
              <span className="metadata-label">Uploaded:</span>
              <span className="metadata-value">{formatDate(file.uploadedAt)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="preview-content">
        {renderPreviewContent()}
      </div>

      <div className="preview-actions">
        <button 
          className="btn btn-primary btn-small"
          onClick={handleDownload}
        >
          📥 Download
        </button>
        <button 
          className="btn btn-secondary btn-small"
          onClick={() => {
            const newPath = prompt('Enter new path:', file.path);
            if (newPath && newPath !== file.path) {
              onMove(newPath);
            }
          }}
        >
          📝 Move
        </button>
        <button 
          className="btn btn-danger btn-small"
          onClick={() => {
            if (window.confirm(`Are you sure you want to delete ${file.name}?`)) {
              onDelete();
            }
          }}
        >
          🗑️ Delete
        </button>
      </div>

      <style jsx>{`
        .file-preview {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #2d3748;
        }

        .preview-header {
          padding: 1rem;
          border-bottom: 1px solid #4a5568;
        }

        .preview-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .preview-title h3 {
          margin: 0;
          color: #48bb78;
          font-size: 1.125rem;
          word-break: break-word;
        }

        .preview-close {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0.25rem;
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .preview-close:hover {
          background: #4a5568;
          color: #ffffff;
        }

        .preview-metadata {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .metadata-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .metadata-label {
          color: #a0aec0;
          font-weight: 600;
        }

        .metadata-value {
          color: #e2e8f0;
          word-break: break-word;
          text-align: right;
        }

        .preview-content {
          flex: 1;
          overflow: auto;
          padding: 1rem;
        }

        .preview-loading,
        .preview-error,
        .preview-binary,
        .preview-unsupported {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          color: #a0aec0;
        }

        .preview-loading .spinner {
          margin-bottom: 1rem;
        }

        .error-icon,
        .binary-icon,
        .unsupported-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .preview-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 6px;
        }

        .preview-text {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .preview-text-info {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #1a1a1a;
          border-radius: 6px;
          font-size: 0.75rem;
          color: #a0aec0;
        }

        .preview-code {
          flex: 1;
          background: #1a1a1a;
          border: 1px solid #4a5568;
          border-radius: 6px;
          padding: 1rem;
          overflow: auto;
          font-family: 'Courier New', Monaco, monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .preview-actions {
          padding: 1rem;
          border-top: 1px solid #4a5568;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .preview-metadata {
            font-size: 0.75rem;
          }
          
          .preview-actions {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .preview-text-info {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FilePreview;