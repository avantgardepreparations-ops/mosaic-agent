const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class FileService {
  constructor() {
    this.dbPath = path.join(__dirname, '../data/files.db');
    this.uploadsPath = path.join(__dirname, '../uploads');
    this.initDatabase();
  }

  /**
   * Initialize the SQLite database
   */
  initDatabase() {
    // Ensure data directory exists
    fs.ensureDirSync(path.dirname(this.dbPath));
    fs.ensureDirSync(this.uploadsPath);

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('📁 File database connected');
        this.createTables();
      }
    });
  }

  /**
   * Create necessary database tables
   */
  createTables() {
    const createFilesTable = `
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        originalName TEXT NOT NULL,
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        mimetype TEXT,
        size INTEGER NOT NULL,
        uploadedAt TEXT NOT NULL,
        updatedAt TEXT,
        tags TEXT,
        description TEXT
      )
    `;

    this.db.run(createFilesTable, (err) => {
      if (err) {
        console.error('Error creating files table:', err);
      } else {
        console.log('✅ Files table ready');
      }
    });
  }

  /**
   * Save file metadata to database
   */
  saveFileMetadata(fileData) {
    return new Promise((resolve, reject) => {
      const {
        originalName,
        filename,
        path,
        mimetype,
        size,
        uploadedAt,
        tags = '',
        description = ''
      } = fileData;

      const sql = `
        INSERT INTO files (originalName, filename, path, mimetype, size, uploadedAt, tags, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [originalName, filename, path, mimetype, size, uploadedAt, tags, description], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            originalName,
            filename,
            path,
            mimetype,
            size,
            uploadedAt,
            tags,
            description
          });
        }
      });
    });
  }

  /**
   * Get file metadata by ID
   */
  getFileById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM files WHERE id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * List files and directories
   */
  async listFiles(requestPath = '', recursive = false) {
    try {
      const fullPath = path.join(this.uploadsPath, requestPath);
      
      // Ensure path exists and is within uploads directory
      if (!await fs.pathExists(fullPath) || !fullPath.startsWith(this.uploadsPath)) {
        throw new Error('Invalid path');
      }

      const files = [];
      const items = await fs.readdir(fullPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(fullPath, item.name);
        const relativePath = path.relative(this.uploadsPath, itemPath);
        
        if (item.isDirectory()) {
          const dirInfo = {
            name: item.name,
            type: 'directory',
            path: relativePath,
            size: 0,
            modifiedAt: (await fs.stat(itemPath)).mtime.toISOString()
          };

          files.push(dirInfo);

          // If recursive, get subdirectory contents
          if (recursive) {
            try {
              const subFiles = await this.listFiles(relativePath, true);
              files.push(...subFiles.map(f => ({
                ...f,
                path: path.join(relativePath, f.path)
              })));
            } catch (error) {
              console.warn(`Error reading subdirectory ${relativePath}:`, error);
            }
          }
        } else {
          // Get file metadata from database
          const fileRecord = await this.getFileByPath(relativePath);
          const stats = await fs.stat(itemPath);

          const fileInfo = {
            id: fileRecord ? fileRecord.id : null,
            name: item.name,
            type: 'file',
            path: relativePath,
            originalName: fileRecord ? fileRecord.originalName : item.name,
            mimetype: fileRecord ? fileRecord.mimetype : null,
            size: stats.size,
            modifiedAt: stats.mtime.toISOString(),
            uploadedAt: fileRecord ? fileRecord.uploadedAt : null,
            tags: fileRecord ? fileRecord.tags : '',
            description: fileRecord ? fileRecord.description : ''
          };

          files.push(fileInfo);
        }
      }

      return files.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        // Then alphabetically
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get file by path
   */
  getFileByPath(filePath) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM files WHERE path = ?';
      
      this.db.get(sql, [filePath], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Move/rename file
   */
  async moveFile(fromPath, toPath) {
    try {
      const fullFromPath = path.join(this.uploadsPath, fromPath);
      const fullToPath = path.join(this.uploadsPath, toPath);

      // Validate paths
      if (!fullFromPath.startsWith(this.uploadsPath) || !fullToPath.startsWith(this.uploadsPath)) {
        throw new Error('Invalid file paths');
      }

      if (!await fs.pathExists(fullFromPath)) {
        throw new Error('Source file does not exist');
      }

      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(fullToPath));

      // Move the file
      await fs.move(fullFromPath, fullToPath);

      // Update database record
      const fileRecord = await this.getFileByPath(fromPath);
      if (fileRecord) {
        await this.updateFilePath(fileRecord.id, toPath, path.basename(toPath));
      }

      return {
        from: fromPath,
        to: toPath,
        moved: true
      };
    } catch (error) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  /**
   * Update file path in database
   */
  updateFilePath(id, newPath, newFilename) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE files 
        SET path = ?, filename = ?, updatedAt = ?
        WHERE id = ?
      `;

      this.db.run(sql, [newPath, newFilename, new Date().toISOString(), id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Delete file
   */
  async deleteFile(id) {
    try {
      const fileRecord = await this.getFileById(id);
      
      if (!fileRecord) {
        return false;
      }

      const fullPath = path.join(this.uploadsPath, fileRecord.path);

      // Delete physical file if it exists
      if (await fs.pathExists(fullPath)) {
        await fs.unlink(fullPath);
      }

      // Delete from database
      return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM files WHERE id = ?';
        
        this.db.run(sql, [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Search files by name or content
   */
  searchFiles(query, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM files 
        WHERE originalName LIKE ? OR description LIKE ? OR tags LIKE ?
        ORDER BY uploadedAt DESC
        LIMIT ?
      `;
      
      const searchTerm = `%${query}%`;
      
      this.db.all(sql, [searchTerm, searchTerm, searchTerm, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get file statistics
   */
  getFileStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as totalFiles,
          SUM(size) as totalSize,
          AVG(size) as averageSize,
          MIN(uploadedAt) as firstUpload,
          MAX(uploadedAt) as lastUpload
        FROM files
      `;
      
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('📁 File database connection closed');
        }
      });
    }
  }
}

// Create singleton instance
const fileService = new FileService();

module.exports = fileService;