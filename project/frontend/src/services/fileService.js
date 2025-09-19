class FileService {
  constructor() {
    this.baseURL = '/api/files';
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File service request failed:', error);
      throw error;
    }
  }

  async listFiles(path = '', recursive = false) {
    const params = new URLSearchParams();
    if (path) params.append('path', path);
    if (recursive) params.append('recursive', 'true');
    
    const url = `${this.baseURL}?${params.toString()}`;
    return this.makeRequest(url);
  }

  async uploadFiles(files, path = '') {
    const formData = new FormData();
    
    // Add files to form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add path if specified
    if (path) {
      formData.append('path', path);
    }

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async getFileById(id) {
    return this.makeRequest(`${this.baseURL}/${id}`);
  }

  async deleteFile(id) {
    return this.makeRequest(`${this.baseURL}/${id}`, {
      method: 'DELETE'
    });
  }

  async moveFile(id, newPath) {
    // First get current file info
    const file = await this.getFileById(id);
    
    return this.makeRequest(`${this.baseURL}/move`, {
      method: 'PUT',
      body: JSON.stringify({
        from: file.path,
        to: newPath
      })
    });
  }

  async previewFile(id) {
    return this.makeRequest(`${this.baseURL}/${id}/preview`);
  }

  async downloadFile(id) {
    const url = `${this.baseURL}/${id}/download`;
    window.open(url, '_blank');
  }

  async searchFiles(query, limit = 50) {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());
    
    const url = `${this.baseURL}/search?${params.toString()}`;
    return this.makeRequest(url);
  }

  // File validation helpers
  validateFileType(file) {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/xml',
      'application/javascript', 'application/json', 'application/xml'
    ];
    
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.txt', '.md', '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx',
      '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config',
      '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
      '.go', '.rs', '.swift', '.kt', '.scala', '.clj', '.hs', '.ml',
      '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
      '.csv', '.tsv', '.sql', '.log', '.env'
    ];
    
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(extension);
  }

  validateFileSize(file, maxSize = 50 * 1024 * 1024) { // 50MB default
    return file.size <= maxSize;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file) {
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
  }

  // Batch operations
  async uploadMultipleFiles(fileGroups) {
    const results = [];
    
    for (const group of fileGroups) {
      try {
        const result = await this.uploadFiles(group.files, group.path);
        results.push({ ...result, group: group.name });
      } catch (error) {
        results.push({ 
          error: error.message, 
          group: group.name,
          files: group.files.map(f => f.name)
        });
      }
    }
    
    return results;
  }

  async deleteMultipleFiles(fileIds) {
    const results = [];
    
    for (const id of fileIds) {
      try {
        await this.deleteFile(id);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// Create singleton instance
export const fileService = new FileService();