import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaUsers, FaLink, FaLock, FaGlobe, FaEllipsisV, FaFolder, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });

  const { name, description, isPublic } = formData;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu && !event.target.closest('.workspace-menu')) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await axios.get('/api/workspaces');
        setWorkspaces(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.data && err.response.data.msg) {
          toast.error(err.response.data.msg);
        } else {
          toast.error('Error fetching workspaces');
        }
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  const onChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/workspaces', formData);
      setWorkspaces([...workspaces, res.data]);
      setFormData({
        name: '',
        description: '',
        isPublic: false
      });
      setShowCreateForm(false);
      toast.success('Workspace created successfully!');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error('Error creating workspace');
      }
    }
  };

  const joinWorkspace = async () => {
    const code = prompt('Enter workspace access code:');
    if (!code) return;

    try {
      const res = await axios.post(`/api/workspaces/join/${code}`);
      setWorkspaces([...workspaces, res.data]);
      toast.success('Joined workspace successfully!');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error('Invalid access code or error joining workspace');
      }
    }
  };

  const toggleMenu = (id) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const deleteWorkspace = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/api/workspaces/${id}`);
      setWorkspaces(workspaces.filter(workspace => workspace._id !== id));
      toast.success('Workspace deleted successfully');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.msg) {
        toast.error(err.response.data.msg);
      } else {
        toast.error('Error deleting workspace');
      }
    }
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Your Workspaces</h1>
          {user && <p>Welcome back, {user.name}</p>}
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <FaPlus className="icon" /> Create Workspace
          </button>
          <button className="btn btn-secondary" onClick={joinWorkspace}>
            <FaLink className="icon" /> Join Workspace
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="form-container workspace-form">
          <h2>Create New Workspace</h2>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Workspace Name</label>
              <input
                type="text"
                id="name"
                placeholder="Enter a name for your workspace"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
              <small className="form-text">Choose a unique name for your workspace</small>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Describe what this workspace is for"
                name="description"
                value={description}
                onChange={onChange}
                required
              ></textarea>
              <small className="form-text">Provide details about the purpose of this workspace</small>
            </div>
            <div className="form-group checkbox-group">
              <label htmlFor="isPublic">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={isPublic}
                  onChange={onChange}
                />
                Make workspace public
              </label>
              <small className="form-text">
                Public workspaces can be viewed by anyone with the link.
              </small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <FaPlus className="icon" /> Create Workspace
              </button>
              <button
                type="button"
                className="btn btn-white"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your workspaces...</p>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="no-workspaces">
          <div className="empty-state">
            <FaFolder size={60} className="empty-icon" />
            <h3>No Workspaces Yet</h3>
            <p>Create a new workspace or join an existing one using an access code.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              <FaPlus className="icon" /> Create Your First Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="workspace-list">
          {workspaces.map((workspace) => (
            <div key={workspace._id} className="workspace-card">
              <div className="workspace-card-header">
                <div className="workspace-visibility">
                  {workspace.isPublic ? (
                    <FaGlobe className="visibility-icon public" title="Public Workspace" />
                  ) : (
                    <FaLock className="visibility-icon private" title="Private Workspace" />
                  )}
                </div>
                <div className="workspace-menu">
                  <FaEllipsisV 
                    className="menu-icon" 
                    onClick={() => toggleMenu(workspace._id)} 
                  />
                  {activeMenu === workspace._id && (
                    <div className="workspace-dropdown">
                      <ul>
                        <li onClick={() => deleteWorkspace(workspace._id)}>
                          <FaTrash className="icon" /> Delete Workspace
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <h3>{workspace.name}</h3>
              <p className="workspace-description">{workspace.description}</p>
              <div className="workspace-meta">
                <div className="workspace-access">
                  <span className="access-code-label">Access Code:</span>
                  <span className="access-code">{workspace.accessCode}</span>
                </div>
                <div className="workspace-members">
                  <FaUsers className="members-icon" />
                  <span>{workspace.members ? workspace.members.length : 1}</span>
                </div>
              </div>
              <Link to={`/workspace/${workspace._id}`} className="btn btn-primary btn-block">
                Open Workspace
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 