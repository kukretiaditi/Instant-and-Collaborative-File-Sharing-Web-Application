const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const File = require('../../models/File');
const Workspace = require('../../models/Workspace');
const { protect, checkWorkspacePermission } = require('../../middleware/auth');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100000000 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// @route   POST api/files/anonymous
// @desc    Upload anonymous file
// @access  Public
router.post('/anonymous', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const file = new File({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      isAnonymous: true
    });

    await file.save();

    res.json({
      file: {
        id: file._id,
        name: file.name,
        shareId: file.shareId,
        shareLink: `${req.protocol}://${req.get('host')}/api/files/share/${file.shareId}`
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/files/workspace/:workspaceId
// @desc    Upload file to workspace
// @access  Private
router.post(
  '/workspace/:workspaceId',
  protect,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const workspace = await Workspace.findById(req.params.workspaceId);

      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      // Check if user is a member of the workspace
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id
      );

      if (!member) {
        return res.status(401).json({ msg: 'Not authorized to upload files to this workspace' });
      }

      // Allow all members (viewer, editor, owner) to upload files
      // Only restrict if explicitly set to viewer-only mode
      if (member.role === 'viewer' && req.body.restrictViewers === 'true') {
        return res.status(401).json({ msg: 'Viewers cannot upload files to this workspace' });
      }

      const folder = req.body.folder || '/';

      const file = new File({
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        workspace: workspace._id,
        folder,
        uploader: req.user.id
      });

      await file.save();

      res.json(file);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/files/workspace/:workspaceId
// @desc    Get all files in workspace
// @access  Private
router.get('/workspace/:workspaceId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember && !workspace.isPublic) {
      return res.status(401).json({ msg: 'Not authorized to access files in this workspace' });
    }

    const folder = req.query.folder || '/';
    
    const files = await File.find({
      workspace: workspace._id,
      folder,
      isDeleted: false
    }).populate('uploader', ['name', 'email']);

    res.json(files);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/share/:shareId
// @desc    Get shared file by shareId
// @access  Public
router.get('/share/:shareId', async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if file has expired (for anonymous files)
    if (file.isAnonymous && file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ msg: 'File has expired' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'File not found on server' });
    }

    // Set headers for download
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', file.size);

    // Send file
    res.sendFile(file.path);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/:id
// @desc    Get file by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // If it's a workspace file, check permissions
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);

      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      // Check if user is a member of the workspace
      const isMember = workspace.members.some(
        member => member.user.toString() === req.user.id
      );

      if (!isMember && !workspace.isPublic) {
        return res.status(401).json({ msg: 'Not authorized to access this file' });
      }
    } else if (!file.isAnonymous && file.uploader.toString() !== req.user.id) {
      // If it's a private file, check if user is the uploader
      return res.status(401).json({ msg: 'Not authorized to access this file' });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ msg: 'File not found on server' });
    }

    // Set headers for download
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', file.size);

    // Send file
    res.sendFile(file.path);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/files/:id
// @desc    Update file (rename or move)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if file is in a workspace
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);

      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      // Check if user has editor or owner permissions
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id
      );

      if (!member || (member.role !== 'editor' && member.role !== 'owner')) {
        return res.status(401).json({ msg: 'Not authorized to update this file' });
      }
    } else if (file.uploader.toString() !== req.user.id) {
      // If it's a personal file, check if user is the uploader
      return res.status(401).json({ msg: 'Not authorized to update this file' });
    }

    // Update file
    if (req.body.name) file.name = req.body.name;
    if (req.body.folder) file.folder = req.body.folder;

    await file.save();

    res.json(file);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/files/:id
// @desc    Move file to recycle bin
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if user has permission to delete this file
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }
      
      // Check if user is a member of the workspace
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id
      );
      
      if (!member) {
        return res.status(401).json({ msg: 'Not authorized to delete files in this workspace' });
      }

      // Allow all members (viewer, editor, owner) to delete files
      // This gives users control over their own uploads and collaboration
    } else if (file.uploader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this file' });
    }

    // Mark file as deleted (move to recycle bin)
    file.isDeleted = true;
    file.deletedAt = Date.now();
    await file.save();

    res.json({ msg: 'File moved to recycle bin' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/workspace/:workspaceId/deleted
// @desc    Get all deleted files in workspace (recycle bin)
// @access  Private
router.get('/workspace/:workspaceId/deleted', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember && !workspace.isPublic) {
      return res.status(401).json({ msg: 'Not authorized to access files in this workspace' });
    }
    
    const files = await File.find({
      workspace: workspace._id,
      isDeleted: true
    }).populate('uploader', ['name', 'email']);

    res.json(files);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/files/:id/restore
// @desc    Restore file from recycle bin
// @access  Private
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if user has permission to restore this file
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }
      
      // Check if user is a member of the workspace
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id
      );
      
      if (!member) {
        return res.status(401).json({ msg: 'Not authorized to restore files in this workspace' });
      }

      // Allow all members to restore files from recycle bin
    } else if (file.uploader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to restore this file' });
    }

    // Restore file
    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json(file);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/files/:id/permanent
// @desc    Permanently delete file
// @access  Private
router.delete('/:id/permanent', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if user has permission to delete this file
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }
      
      // Check if user is a member with appropriate permissions
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id
      );
      
      if (!member || member.role !== 'owner') {
        return res.status(401).json({ msg: 'Not authorized to permanently delete files in this workspace' });
      }
    } else if (file.uploader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this file' });
    }

    // Delete file from storage
    fs.unlink(file.path, async (err) => {
      if (err) {
        console.error('Error deleting file from storage:', err);
      }
      
      // Delete file from database
      await File.findByIdAndDelete(req.params.id);
      
      res.json({ msg: 'File permanently deleted' });
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/:id/share
// @desc    Generate or get share link for a file
// @access  Private
router.get('/:id/share', protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if user has permission to share this file
    if (file.workspace) {
      const workspace = await Workspace.findById(file.workspace);
      
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }
      
      // Check if user is a member
      const isMember = workspace.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember && !workspace.isPublic) {
        return res.status(401).json({ msg: 'Not authorized to share files from this workspace' });
      }
    } else if (file.uploader.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to share this file' });
    }

    // Return the share ID
    res.json({ shareId: file.shareId });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'File not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/share/:shareId/info
// @desc    Get shared file info by shareId
// @access  Public
router.get('/share/:shareId/info', async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId });

    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    // Check if file has expired (for anonymous files)
    if (file.isAnonymous && file.expiresAt && new Date() > file.expiresAt) {
      return res.status(410).json({ msg: 'File has expired' });
    }

    // Return file metadata
    res.json({
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 