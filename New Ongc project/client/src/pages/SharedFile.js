import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaDownload, FaFile, FaFileAlt, FaFileImage, FaFilePdf, FaFileArchive } from 'react-icons/fa';

const SharedFile = () => {
  const { shareId } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        // Just get the file metadata first
        const res = await axios.get(`/api/files/share/${shareId}/info`);
        setFile(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('File not found or has expired');
        setLoading(false);
      }
    };

    fetchFile();
  }, [shareId]);

  const downloadFile = () => {
    window.open(`/api/files/share/${shareId}`, '_blank');
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFile className="file-icon-large generic" />;
    
    if (fileType.includes('image')) {
      return <FaFileImage className="file-icon-large image" />;
    } else if (fileType.includes('pdf')) {
      return <FaFilePdf className="file-icon-large pdf" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FaFileArchive className="file-icon-large archive" />;
    } else if (fileType.includes('text') || fileType.includes('document')) {
      return <FaFileAlt className="file-icon-large document" />;
    } else {
      return <FaFile className="file-icon-large generic" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };

  if (loading) {
    return (
      <div className="shared-file loading">
        <div className="loading-spinner"></div>
        <h2>Loading file...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-file error">
        <div className="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="shared-file-container">
      <div className="shared-file-card">
        <div className="shared-file-header">
          <h2>Shared File</h2>
        </div>
        {file && (
          <div className="shared-file-content">
            <div className="shared-file-icon">
              {getFileIcon(file.type)}
            </div>
            <div className="shared-file-info">
              <h3 className="shared-file-name">{file.name}</h3>
              <div className="shared-file-details">
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{file.type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Size:</span>
                  <span className="detail-value">{formatFileSize(file.size)}</span>
                </div>
                {file.uploadedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Uploaded:</span>
                    <span className="detail-value">{new Date(file.uploadedAt).toLocaleString()}</span>
                  </div>
                )}
                {file.expiresAt && (
                  <div className="detail-item">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">{new Date(file.expiresAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="shared-file-actions">
                <button className="btn btn-primary btn-lg" onClick={downloadFile}>
                  <FaDownload className="icon" /> Download File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="shared-file-footer">
        <p>Shared via FileToffee - Secure File Sharing</p>
      </div>
    </div>
  );
};

export default SharedFile; 