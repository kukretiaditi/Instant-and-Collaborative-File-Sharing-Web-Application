import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import { FaFile, FaFileAlt, FaFileImage, FaFilePdf, FaFileArchive, FaTrash, FaEdit, FaDownload, FaShare, FaUsers, FaUserPlus, FaCog, FaUndo, FaFolderOpen, FaLink, FaCopy, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('/');
  const [activeTab, setActiveTab] = useState('files');
  const [showSettings, setShowSettings] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareFileName, setShareFileName] = useState('');

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await axios.get(`/api/workspaces/${id}`);
        setWorkspace(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Error fetching workspace');
        setLoading(false);
      }
    };

    const fetchFiles = async () => {
      try {
        const res = await axios.get(`/api/files/workspace/${id}?folder=${currentFolder}`);
        setFiles(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Error fetching files');
      }
    };

    const fetchDeletedFiles = async () => {
      try {
        const res = await axios.get(`/api/files/workspace/${id}/deleted`);
        setDeletedFiles(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchMembers = async () => {
      try {
        const res = await axios.get(`/api/workspaces/${id}/members`);
        setMembers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkspace();
    
    if (activeTab === 'files') {
      fetchFiles();
    } else if (activeTab === 'recyclebin') {
      fetchDeletedFiles();
    } else if (activeTab === 'members') {
      fetchMembers();
    }
  }, [id, currentFolder, activeTab]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error('No file selected');
        return;
      }

      const file = acceptedFiles[0];
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('File size exceeds 100MB limit');
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', currentFolder);

        const res = await axios.post(`/api/files/workspace/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setFiles([...files, res.data]);
        toast.success('File uploaded successfully!');
      } catch (err) {
        console.error(err);
        toast.error('Error uploading file');
      } finally {
        setUploading(false);
      }
    },
    [id, currentFolder, files]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await axios.delete(`/api/files/${fileId}`);
      setFiles(files.filter(file => file._id !== fileId));
      toast.success('File moved to recycle bin');
    } catch (err) {
      console.error(err);
      toast.error('Error deleting file');
    }
  };

  const restoreFile = async (fileId) => {
    try {
      await axios.put(`/api/files/${fileId}/restore`);
      setDeletedFiles(deletedFiles.filter(file => file._id !== fileId));
      toast.success('File restored successfully');
    } catch (err) {
      console.error(err);
      toast.error('Error restoring file');
    }
  };

  const permanentlyDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/files/${fileId}/permanent`);
      setDeletedFiles(deletedFiles.filter(file => file._id !== fileId));
      toast.success('File permanently deleted');
    } catch (err) {
      console.error(err);
      toast.error('Error deleting file');
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = `/api/files/${fileId}`;
      link.download = fileName;
      link.target = '_blank';
      
      // Add authorization header if user is logged in
      if (localStorage.getItem('token')) {
        // For authenticated downloads, we need to handle it differently
        const response = await axios.get(`/api/files/${fileId}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Create blob URL and download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // For anonymous downloads
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Download started!');
    } catch (err) {
      console.error(err);
      toast.error('Error downloading file');
    }
  };

  const shareFile = async (fileId, fileName) => {
    try {
      const res = await axios.get(`/api/files/${fileId}/share`);
      const link = `${window.location.origin}/share/${res.data.shareId}`;
      setShareLink(link);
      setShareFileName(fileName);
      setShareModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Error generating share link');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard!');
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await axios.post(`/api/workspaces/${id}/invite`, { email: inviteEmail });
      setInviteEmail('');
      toast.success('Invitation sent successfully');
      
      // Refresh members list
      const res = await axios.get(`/api/workspaces/${id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error('Error sending invitation');
      }
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await axios.delete(`/api/workspaces/${id}/members/${userId}`);
      setMembers(members.filter(member => member._id !== userId));
      toast.success('Member removed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Error removing member');
    }
  };

  const leaveWorkspace = async () => {
    console.log('Leave workspace clicked');
    console.log('User ID:', user?.id);
    console.log('Workspace ID:', id);
    
    if (!window.confirm('Are you sure you want to leave this workspace? You will lose access to all files and will need to be re-invited to join again.')) {
      return;
    }

    try {
      console.log('Making API call to leave workspace...');
      
      // Ensure we have the correct user ID format
      const userId = user?.id || user?._id;
      console.log('Using user ID:', userId);
      
      const response = await axios.delete(`/api/workspaces/${id}/members/${userId}`);
      console.log('API response:', response);
      
      if (response.data && response.data.msg) {
        toast.success(response.data.msg);
      } else {
        toast.success('You have left the workspace successfully');
      }
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error leaving workspace:', err);
      console.error('Error response:', err.response);
      if (err.response && err.response.data && err.response.data.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error('Error leaving workspace');
      }
    }
  };

  const updateWorkspaceSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/workspaces/${id}`, {
        name: workspace.name,
        description: workspace.description,
        isPublic: workspace.isPublic
      });
      setWorkspace(res.data);
      setShowSettings(false);
      toast.success('Workspace settings updated');
    } catch (err) {
      console.error(err);
      toast.error('Error updating workspace settings');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) {
      return <FaFileImage className="file-type-icon image" />;
    } else if (fileType.includes('pdf')) {
      return <FaFilePdf className="file-type-icon pdf" />;
    } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
      return <FaFileArchive className="file-type-icon archive" />;
    } else if (fileType.includes('text') || fileType.includes('document')) {
      return <FaFileAlt className="file-type-icon document" />;
    } else {
      return <FaFile className="file-type-icon generic" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="workspace-container loading">
        <div className="loading-spinner"></div>
        <h2>Loading workspace...</h2>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <div className="workspace-header">
        <div className="workspace-title">
          <h1>{workspace.name}</h1>
          <p className="workspace-description">{workspace.description}</p>
        </div>
        <div className="workspace-actions">
          <button className="btn btn-secondary" onClick={() => setActiveTab('members')}>
            <FaUserPlus /> Invite Members
          </button>
          <button className="btn btn-primary" onClick={() => setShowSettings(!showSettings)}>
            <FaCog /> Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>Workspace Settings</h3>
          <form onSubmit={updateWorkspaceSettings}>
            <div className="form-group">
              <label htmlFor="name">Workspace Name</label>
              <input
                type="text"
                id="name"
                value={workspace.name}
                onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={workspace.description}
                onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
                required
              ></textarea>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={workspace.isPublic}
                  onChange={(e) => setWorkspace({ ...workspace, isPublic: e.target.checked })}
                />
                Make workspace public
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" className="btn btn-white" onClick={() => setShowSettings(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="workspace-nav">
        <div 
          className={`workspace-nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FaFolderOpen className="nav-icon" /> Files
        </div>
        <div 
          className={`workspace-nav-item ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <FaUsers className="nav-icon" /> Members
        </div>
        <div 
          className={`workspace-nav-item ${activeTab === 'recyclebin' ? 'active' : ''}`}
          onClick={() => setActiveTab('recyclebin')}
        >
          <FaTrash className="nav-icon" /> Recycle Bin
        </div>
      </div>

      {activeTab === 'files' && (
        <div className="files-container">
          <div className="current-folder">
            <h3><FaFolderOpen /> Current Folder: {currentFolder}</h3>
          </div>

          <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
            <input {...getInputProps()} />
            {uploading ? (
              <div className="uploading">
                <div className="loading-spinner small"></div>
                <p>Uploading...</p>
              </div>
            ) : isDragActive ? (
              <div className="drag-active">
                <p>Drop the file here...</p>
              </div>
            ) : (
              <div>
                <p><strong>Drag & drop a file here, or click to select a file</strong></p>
                <p className="small-text">Files up to 100MB</p>
              </div>
            )}
          </div>

          <div className="file-list">
            <h3>Files</h3>
            {files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaFile />
                </div>
                <p>No files in this folder</p>
                <p className="small-text">Upload files by dragging and dropping them above</p>
              </div>
            ) : (
              <div className="file-table">
                <div className="file-table-header">
                  <div className="file-column file-name-column">Name</div>
                  <div className="file-column file-size-column">Size</div>
                  <div className="file-column file-date-column">Uploaded</div>
                  <div className="file-column file-actions-column">Actions</div>
                </div>
                {files.map((file) => (
                  <div key={file._id} className="file-item">
                    <div className="file-column file-name-column">
                      <div className="file-icon">{getFileIcon(file.type)}</div>
                      <div className="file-name">{file.name}</div>
                    </div>
                    <div className="file-column file-size-column">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="file-column file-date-column">
                      {formatDate(file.uploadedAt)}
                    </div>
                    <div className="file-column file-actions-column">
                      <button 
                        className="action-btn download-btn" 
                        onClick={() => downloadFile(file._id, file.name)} 
                        title="Download"
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="action-btn share-btn" 
                        onClick={() => shareFile(file._id, file.name)} 
                        title="Share"
                      >
                        <FaShare />
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={() => deleteFile(file._id)} 
                        title="Move to Recycle Bin"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="members-panel">
          <h3><FaUsers /> Workspace Members</h3>
          
          <div className="invite-form">
            <form onSubmit={inviteMember}>
              <div className="form-group">
                <label htmlFor="inviteEmail">Invite New Member</label>
                <div className="input-with-button">
                  <input
                    type="email"
                    id="inviteEmail"
                    placeholder="Enter email address to invite"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    <FaUserPlus className="icon" /> Send Invite
                  </button>
                </div>
                <small className="form-text">
                  Enter the email address of a registered user to invite them to this workspace
                </small>
              </div>
            </form>
          </div>
          
          <div className="members-list">
            {members.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaUsers />
                </div>
                <p>No members in this workspace yet</p>
                <p className="small-text">Invite members using the form above</p>
              </div>
            ) : (
              members.map((member) => (
                <div key={member._id} className="member-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-details">
                      <h4>{member.name}</h4>
                      <p>{member.email}</p>
                      <span className={`role-badge ${member.role === 'owner' ? 'owner' : ''}`}>
                        {member.role || 'Member'}
                      </span>
                    </div>
                  </div>
                  {String(workspace.owner) === String(member._id) ? (
                    <span className="owner-badge">Owner</span>
                  ) : (
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => removeMember(member._id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
            
            {/* Leave Workspace Button - Only show for non-owners */}
            {/* Debug info: user.id = ${user?.id}, workspace.owner = ${workspace?.owner} */}
            {user && workspace && String(workspace.owner) !== String(user.id) && (
              <div className="leave-workspace-section">
                <div className="leave-workspace-info">
                  <h4>Leave Workspace</h4>
                  <p className="small-text">You can leave this workspace at any time. You'll need to be re-invited to join again.</p>
                </div>
                <button 
                  className="btn btn-danger" 
                  onClick={leaveWorkspace}
                >
                  <FaSignOutAlt className="icon" /> Leave Workspace
                </button>
              </div>
            )}
            
            {/* Debug Section - Remove this after testing */}
            <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px'}}>
              <h4>Debug Info:</h4>
              <p>User ID: {user?.id ? String(user.id) : 'Not available'}</p>
              <p>Workspace Owner: {workspace?.owner ? String(workspace.owner) : 'Not available'}</p>
              <p>User exists: {user ? 'Yes' : 'No'}</p>
              <p>Workspace exists: {workspace ? 'Yes' : 'No'}</p>
              <p>Is Owner: {user && workspace && String(workspace.owner) === String(user.id) ? 'Yes' : 'No'}</p>
              <p>Should show leave button: {user && workspace && String(workspace.owner) !== String(user.id) ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recyclebin' && (
        <div className="recyclebin-panel">
          <h3><FaTrash /> Recycle Bin</h3>
          <p className="recycle-info">Files in the recycle bin will be automatically deleted after 30 days.</p>
          
          <div className="deleted-file-list">
            {deletedFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaTrash />
                </div>
                <p>Recycle bin is empty</p>
              </div>
            ) : (
              <div className="file-table">
                <div className="file-table-header">
                  <div className="file-column file-name-column">Name</div>
                  <div className="file-column file-size-column">Size</div>
                  <div className="file-column file-date-column">Deleted</div>
                  <div className="file-column file-actions-column">Actions</div>
                </div>
                {deletedFiles.map((file) => (
                  <div key={file._id} className="file-item deleted-file">
                    <div className="file-column file-name-column">
                      <div className="file-icon">{getFileIcon(file.type)}</div>
                      <div className="file-name">{file.name}</div>
                    </div>
                    <div className="file-column file-size-column">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="file-column file-date-column">
                      {formatDate(file.deletedAt)}
                    </div>
                    <div className="file-column file-actions-column">
                      <button 
                        className="action-btn restore-btn" 
                        onClick={() => restoreFile(file._id)} 
                        title="Restore File"
                      >
                        <FaUndo />
                      </button>
                      <button 
                        className="action-btn delete-permanent-btn" 
                        onClick={() => permanentlyDeleteFile(file._id)} 
                        title="Delete Permanently"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {shareModalOpen && (
        <div className="modal-overlay">
          <div className="share-modal">
            <h3>Share File</h3>
            <p>Share link for <strong>{shareFileName}</strong></p>
            
            <div className="share-link-container">
              <input 
                type="text" 
                value={shareLink} 
                readOnly 
                onClick={(e) => e.target.select()} 
              />
              <button className="btn btn-primary" onClick={copyShareLink}>
                <FaCopy /> Copy Link
              </button>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-white" onClick={() => setShareModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace; 