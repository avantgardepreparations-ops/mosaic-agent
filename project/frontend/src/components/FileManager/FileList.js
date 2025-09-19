import React, { useState } from 'react';

const FileList = ({
  files,
  loading,
  selectedFiles,
  onFileSelect,
  onFilePreview,
  onFileDelete,
  onNavigate,
  currentPath
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'size', 'date', 'type'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const getFileIcon = (file) => {
    if (file.type === 'directory') {
      return '📁';
    }
    
    if (file.mimetype) {
      if (file.mimetype.startsWith('image/')) return '🖼️';
      if (file.mimetype.startsWith('video/')) return '🎥';
      if (file.mimetype.startsWith('audio/')) return '🎵';
      if (file.mimetype === 'application/pdf') return '📄';
      if (file.mimetype === 'application/json') return '📋';
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': case 'jsx': case 'ts': case 'tsx': return '🟨';
      case 'html': case 'htm': return '🌐';
      case 'css': case 'scss': case 'sass': return '🎨';
      case 'py': return '🐍';
      case 'java': return '☕';
      case 'cpp': case 'c': case 'h': return '⚙️';
      case 'md': case 'markdown': return '📝';
      case 'txt': return '📄';
      case 'zip': case 'rar': case '7z': return '📦';
      default: return '📄';
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
    return new Date(dateString).toLocaleDateString();
  };

  const sortFiles = (files) => {
    return [...files].sort((a, b) => {
      // Always put directories first
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (b.type === 'directory' && a.type !== 'directory') return 1;
      
      let aValue, bValue;
      
      switch (sortBy) {
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'date':
          aValue = new Date(a.modifiedAt || 0);
          bValue = new Date(b.modifiedAt || 0);
          break;
        case 'type':
          aValue = a.mimetype || '';
          bValue = b.mimetype || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        [aValue, bValue] = [bValue, aValue];
      }
      
      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleFileClick = (file, event) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      onFileSelect(file);
    } else if (file.type === 'directory') {
      // Navigate to directory
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      onNavigate(newPath);
    } else {
      // Preview file
      onFilePreview(file);
    }
  };

  const handleFileDoubleClick = (file) => {
    if (file.type === 'directory') {
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      onNavigate(newPath);
    } else {
      // Download file
      window.open(`/api/files/${file.id}/download`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <span>Loading files...</span>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📁</div>
        <h3>No files found</h3>
        <p>This directory is empty. Upload some files or create a new folder.</p>
      </div>
    );
  }

  const sortedFiles = sortFiles(files);

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3 className="file-list-title">
          Files ({files.length})
        </h3>
        <div className="file-list-controls">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="file-grid">
          {sortedFiles.map((file) => (
            <div
              key={file.id || file.name}
              className={`file-item ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
              onClick={(e) => handleFileClick(file, e)}
              onDoubleClick={() => handleFileDoubleClick(file)}
            >
              <div className="file-item-icon">
                {getFileIcon(file)}
              </div>
              <div className="file-item-name" title={file.name}>
                {file.name}
              </div>
              <div className="file-item-info">
                <span className="file-item-size">
                  {file.type === 'directory' ? 'Folder' : formatFileSize(file.size)}
                </span>
                <span className="file-item-date">
                  {formatDate(file.modifiedAt)}
                </span>
              </div>
              <div className="file-item-actions">
                <button
                  className="file-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilePreview(file);
                  }}
                  title="Preview"
                >
                  👁️
                </button>
                {file.type !== 'directory' && (
                  <button
                    className="file-action-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileDelete(file.id);
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="file-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allFileIds = files.filter(f => f.id).map(f => f.id);
                      allFileIds.forEach(id => {
                        if (!selectedFiles.includes(id)) {
                          onFileSelect({ id });
                        }
                      });
                    } else {
                      selectedFiles.forEach(id => onFileSelect({ id }));
                    }
                  }}
                />
              </th>
              <th
                onClick={() => handleSort('name')}
                style={{ cursor: 'pointer' }}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('size')}
                style={{ cursor: 'pointer' }}
              >
                Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('type')}
                style={{ cursor: 'pointer' }}
              >
                Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('date')}
                style={{ cursor: 'pointer' }}
              >
                Modified {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file) => (
              <tr
                key={file.id || file.name}
                className={selectedFiles.includes(file.id) ? 'selected' : ''}
                onClick={(e) => handleFileClick(file, e)}
                onDoubleClick={() => handleFileDoubleClick(file)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  {file.id && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => onFileSelect(file)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </td>
                <td>
                  <span style={{ marginRight: '0.5rem' }}>
                    {getFileIcon(file)}
                  </span>
                  {file.name}
                </td>
                <td>
                  {file.type === 'directory' ? 'Folder' : formatFileSize(file.size)}
                </td>
                <td>
                  {file.type === 'directory' ? 'Directory' : file.mimetype || 'Unknown'}
                </td>
                <td>{formatDate(file.modifiedAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="file-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilePreview(file);
                      }}
                      title="Preview"
                    >
                      👁️
                    </button>
                    {file.type !== 'directory' && (
                      <button
                        className="file-action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileDelete(file.id);
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FileList;