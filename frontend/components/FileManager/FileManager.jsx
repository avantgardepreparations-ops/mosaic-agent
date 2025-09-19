import React, { useState, useEffect, useRef } from 'react';
import { Upload, Folder, File, Eye, Download, Search, Grid, List } from 'lucide-react';

const FileManager = ({ 
    onFileSelect, 
    onFileUpload, 
    allowedExtensions = [],
    maxFileSize = 10485760 // 10MB default
}) => {
    const [files, setFiles] = useState([]);
    const [currentPath, setCurrentPath] = useState('/');
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    
    // File type icons mapping
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop()?.toLowerCase();
        const iconMap = {
            'js': '🟨',
            'py': '🐍',
            'html': '🌐',
            'css': '🎨',
            'json': '📋',
            'md': '📝',
            'txt': '📄',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'pdf': '📕',
            'zip': '📦',
            'folder': '📁'
        };
        return iconMap[extension] || '📄';
    };
    
    // Load files from the current directory
    useEffect(() => {
        loadFiles(currentPath);
    }, [currentPath]);
    
    const loadFiles = async (path) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (response.ok) {
                setFiles(data.files || []);
            } else {
                console.error('Failed to load files:', data.error);
            }
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleFileUpload = async (uploadedFiles) => {
        const formData = new FormData();
        
        for (let file of uploadedFiles) {
            // Validate file size
            if (file.size > maxFileSize) {
                alert(`File ${file.name} is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
                continue;
            }
            
            // Validate file extension
            if (allowedExtensions.length > 0) {
                const extension = file.name.split('.').pop()?.toLowerCase();
                if (!allowedExtensions.includes(extension)) {
                    alert(`File type .${extension} is not allowed`);
                    continue;
                }
            }
            
            formData.append('files', file);
        }
        
        formData.append('path', currentPath);
        
        try {
            setUploadProgress(0);
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress);
                }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                await loadFiles(currentPath);
                if (onFileUpload) {
                    onFileUpload(result.uploadedFiles);
                }
                setUploadProgress(100);
                setTimeout(() => setUploadProgress(0), 2000);
            } else {
                console.error('Upload failed:', result.error);
                alert('Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload error: ' + error.message);
        }
    };
    
    const handleFileClick = async (file) => {
        setSelectedFile(file);
        
        if (file.type === 'directory') {
            const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
            setCurrentPath(newPath);
            return;
        }
        
        if (onFileSelect) {
            onFileSelect(file);
        }
        
        // Load preview if it's a supported file type
        await loadPreview(file);
    };
    
    const loadPreview = async (file) => {
        const previewableTypes = ['txt', 'md', 'js', 'py', 'html', 'css', 'json'];
        const imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        try {
            if (previewableTypes.includes(extension)) {
                const response = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
                const content = await response.text();
                setPreviewContent({
                    type: 'text',
                    content,
                    language: extension
                });
            } else if (imageTypes.includes(extension)) {
                setPreviewContent({
                    type: 'image',
                    src: `/api/files/content?path=${encodeURIComponent(file.path)}`
                });
            } else {
                setPreviewContent(null);
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            setPreviewContent(null);
        }
    };
    
    const navigateUp = () => {
        if (currentPath === '/') return;
        
        const pathParts = currentPath.split('/').filter(Boolean);
        pathParts.pop();
        const newPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
        setCurrentPath(newPath);
    };
    
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileUpload(droppedFiles);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    return (
        <div className=\"file-manager\" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className=\"file-manager-header\" style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={20} />
                        File Manager
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            style={{
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                        </button>
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Upload size={16} />
                            Upload
                        </button>
                    </div>
                </div>
                
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span>Path:</span>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {currentPath === '/' ? (
                            <span style={{ 
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#e9ecef',
                                borderRadius: '4px'
                            }}>
                                /
                            </span>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setCurrentPath('/')}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: 'transparent',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    /
                                </button>
                                {currentPath.split('/').filter(Boolean).map((part, index, arr) => (
                                    <React.Fragment key={index}>
                                        <span>/</span>
                                        <button
                                            onClick={() => {
                                                const pathParts = arr.slice(0, index + 1);
                                                setCurrentPath('/' + pathParts.join('/'));
                                            }}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: index === arr.length - 1 ? '#e9ecef' : 'transparent',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                cursor: index === arr.length - 1 ? 'default' : 'pointer'
                                            }}
                                        >
                                            {part}
                                        </button>
                                    </React.Fragment>
                                ))}
                            </>
                        )}
                        
                        {currentPath !== '/' && (
                            <button
                                onClick={navigateUp}
                                style={{
                                    marginLeft: '1rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ↑ Up
                            </button>
                        )}
                    </nav>
                </div>
                
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={16} style={{ color: '#6c757d' }} />
                    <input
                        type=\"text\"
                        placeholder=\"Search files...\"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>
            </div>
            
            {/* Content */}
            <div style={{ flex: 1, display: 'flex' }}>
                {/* File List */}
                <div 
                    style={{ 
                        flex: previewContent ? '1' : '2',
                        padding: '1rem',
                        overflowY: 'auto'
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                >
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            Loading files...
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '2rem',
                            color: '#6c757d'
                        }}>
                            {searchTerm ? 'No files match your search' : 'No files in this directory'}
                            <br />
                            <small>Drag and drop files here to upload</small>
                        </div>
                    ) : (
                        <div className={`files-${viewMode}`} style={{
                            display: viewMode === 'grid' ? 'grid' : 'flex',
                            gap: '1rem',
                            flexDirection: viewMode === 'list' ? 'column' : undefined,
                            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(120px, 1fr))' : undefined
                        }}>
                            {filteredFiles.map((file, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleFileClick(file)}
                                    style={{
                                        padding: '1rem',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedFile?.name === file.name ? '#e3f2fd' : 'white',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: viewMode === 'grid' ? 'column' : 'row',
                                        alignItems: viewMode === 'grid' ? 'center' : 'flex-start',
                                        gap: '0.5rem',
                                        textAlign: viewMode === 'grid' ? 'center' : 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedFile?.name !== file.name) {
                                            e.target.style.backgroundColor = '#f8f9fa';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedFile?.name !== file.name) {
                                            e.target.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    <div style={{ fontSize: viewMode === 'grid' ? '2rem' : '1.5rem' }}>
                                        {getFileIcon(file.name)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontWeight: '500',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: viewMode === 'grid' ? 'normal' : 'nowrap'
                                        }}>
                                            {file.name}
                                        </div>
                                        {viewMode === 'list' && (
                                            <div style={{ 
                                                fontSize: '0.875rem',
                                                color: '#6c757d',
                                                marginTop: '0.25rem'
                                            }}>
                                                {file.type === 'directory' ? 'Directory' : 
                                                 `${(file.size / 1024).toFixed(1)} KB • ${new Date(file.modified).toLocaleDateString()}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Preview Panel */}
                {previewContent && (
                    <div style={{
                        flex: 1,
                        borderLeft: '1px solid #e0e0e0',
                        padding: '1rem',
                        overflowY: 'auto'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '1px solid #e0e0e0'
                        }}>
                            <Eye size={16} />
                            <span style={{ fontWeight: '500' }}>Preview: {selectedFile?.name}</span>
                            <button
                                onClick={() => setPreviewContent(null)}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '0.25rem',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.25rem'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        {previewContent.type === 'text' ? (
                            <pre style={{
                                backgroundColor: '#f8f9fa',
                                padding: '1rem',
                                borderRadius: '4px',
                                overflow: 'auto',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                margin: 0
                            }}>
                                <code>{previewContent.content}</code>
                            </pre>
                        ) : previewContent.type === 'image' ? (
                            <img
                                src={previewContent.src}
                                alt={selectedFile?.name}
                                style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '4px'
                                }}
                            />
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '2rem',
                                color: '#6c757d'
                            }}>
                                Preview not available for this file type
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '200px'
                }}>
                    <div style={{ marginBottom: '0.5rem' }}>Uploading... {uploadProgress}%</div>
                    <div style={{
                        height: '4px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#007bff',
                            width: `${uploadProgress}%`,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}
            
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type=\"file\"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files?.length) {
                        handleFileUpload(Array.from(e.target.files));
                        e.target.value = '';
                    }
                }}
            />
        </div>
    );
};

export default FileManager;