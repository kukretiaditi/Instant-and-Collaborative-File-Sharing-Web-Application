import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaCloudUploadAlt, FaUsers, FaLock, FaMobileAlt, FaCopy, FaFileUpload } from 'react-icons/fa';

const Home = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      toast.error('No file selected');
      return;
    }

    const file = acceptedFiles[0];
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('File size exceeds 100MB limit');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/files/anonymous', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedFile(res.data.file);
      toast.success('File uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error uploading file');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadedFile.shareLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Share Files Like Digital Toffees</h1>
        <p>
          Quick, easy, and accessible file sharing for everyone. No login required for instant sharing!
        </p>
      </div>

      {!uploadedFile ? (
        <div className="dropzone-container">
          <div {...getRootProps({ className: 'dropzone' })}>
            <input {...getInputProps()} />
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Uploading your file...</p>
              </div>
            ) : isDragActive ? (
              <div className="dropzone-content active">
                <FaCloudUploadAlt size={60} />
                <p>Drop the file here...</p>
              </div>
            ) : (
              <div className="dropzone-content">
                <FaCloudUploadAlt size={60} />
                <h3>Drag & drop a file here</h3>
                <p>or click to select a file</p>
                <p className="small-text">Files up to 100MB - Expires in 24 hours</p>
                <button className="btn btn-primary btn-lg">
                  <FaFileUpload /> Select File
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="file-share-result">
          <div className="success-icon">
            <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
              </div>
            </div>
          </div>
          <h3>File Uploaded Successfully!</h3>
          <p>
            <strong>File Name:</strong> {uploadedFile.name}
          </p>
          <div className="share-link-container">
            <p><strong>Share Link:</strong></p>
            <div className="copy-link-box">
              <input
                type="text"
                value={uploadedFile.shareLink}
                readOnly
                onClick={copyToClipboard}
              />
              <button className="copy-btn" onClick={copyToClipboard}>
                <FaCopy />
              </button>
            </div>
          </div>
          <p className="small-text">This link will expire in 24 hours</p>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={() => window.open(uploadedFile.shareLink, '_blank')}
            >
              Open File
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setUploadedFile(null)}
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}

      <div className="section-divider">
        <h2>Why Choose FileToffee?</h2>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <FaCloudUploadAlt size={40} />
          <h3>Instant Sharing</h3>
          <p>Upload and share files in seconds without registration. Get a shareable link immediately.</p>
        </div>
        <div className="feature-card">
          <FaUsers size={40} />
          <h3>Collaboration</h3>
          <p>Create workspaces and collaborate with team members with role-based permissions.</p>
        </div>
        <div className="feature-card">
          <FaLock size={40} />
          <h3>Secure Access</h3>
          <p>Role-based permissions and secure file management with version control.</p>
        </div>
        <div className="feature-card">
          <FaMobileAlt size={40} />
          <h3>Responsive Design</h3>
          <p>Access your files from any device, anywhere with our mobile-friendly interface.</p>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to collaborate with your team?</h2>
        <p>Create an account to access all features including workspaces, version control, and more.</p>
        <a href="/register" className="btn btn-primary btn-lg">Get Started</a>
      </div>
    </div>
  );
};

export default Home; 