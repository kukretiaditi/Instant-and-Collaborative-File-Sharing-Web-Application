const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const Workspace = require('../../models/Workspace');
const User = require('../../models/User');
const { protect, checkWorkspacePermission } = require('../../middleware/auth');

// @route   POST api/workspaces
// @desc    Create a workspace
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, isPublic } = req.body;

      // Create workspace
      const workspace = new Workspace({
        name,
        description,
        isPublic: isPublic || false,
        owner: req.user.id,
        accessCode: uuidv4().substring(0, 8)
      });

      // Add owner to members
      workspace.members.push({
        user: req.user.id,
        role: 'owner'
      });

      await workspace.save();

      res.json(workspace);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/workspaces
// @desc    Get all workspaces for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find workspaces where user is a member
    const workspaces = await Workspace.find({
      'members.user': req.user.id
    }).populate('owner', ['name', 'email']);

    res.json(workspaces);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/workspaces/:id
// @desc    Get workspace by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', ['name', 'email'])
      .populate('members.user', ['name', 'email']);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user._id.toString() === req.user.id
    );

    if (!isMember && !workspace.isPublic) {
      return res.status(401).json({ msg: 'Not authorized to access this workspace' });
    }

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/workspaces/:id
// @desc    Update workspace
// @access  Private
router.put(
  '/:id',
  [
    protect,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const workspace = await Workspace.findById(req.params.id);

      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      // Check if user is the owner
      if (workspace.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized to update this workspace' });
      }

      const { name, description, isPublic } = req.body;

      workspace.name = name;
      workspace.description = description;
      if (isPublic !== undefined) workspace.isPublic = isPublic;

      await workspace.save();

      res.json(workspace);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Workspace not found' });
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/workspaces/:id
// @desc    Delete workspace
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is the owner
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this workspace' });
    }

    // Delete all files in the workspace first
    const File = require('../../models/File');
    await File.deleteMany({ workspace: workspace._id });

    // Delete the workspace
    await Workspace.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Workspace removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/workspaces/join/:code
// @desc    Join a workspace with access code
// @access  Private
router.post('/join/:code', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findOne({ accessCode: req.params.code });

    if (!workspace) {
      return res.status(404).json({ msg: 'Invalid access code' });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (isMember) {
      return res.status(400).json({ msg: 'Already a member of this workspace' });
    }

    // Add user to members with viewer role
    workspace.members.push({
      user: req.user.id,
      role: 'viewer'
    });

    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/workspaces/:id/members/:userId
// @desc    Update member role in workspace
// @access  Private (Owner only)
router.put('/:id/members/:userId', protect, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['viewer', 'editor', 'owner'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is the owner
    if (workspace.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update member roles' });
    }

    // Find the member
    const memberIndex = workspace.members.findIndex(
      member => member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ msg: 'Member not found' });
    }

    // Update role
    workspace.members[memberIndex].role = role;

    // If role is owner, update workspace owner
    if (role === 'owner') {
      workspace.owner = req.params.userId;
      
      // Find the current user and change their role to editor
      const currentUserIndex = workspace.members.findIndex(
        member => member.user.toString() === req.user.id
      );
      
      if (currentUserIndex !== -1) {
        workspace.members[currentUserIndex].role = 'editor';
      }
    }

    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace or member not found' });
    }
    res.status(500).send('Server Error');
  }
});



// @route   GET api/workspaces/:id/members
// @desc    Get all members of a workspace
// @access  Private
router.get('/:id/members', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember && !workspace.isPublic) {
      return res.status(401).json({ msg: 'Not authorized to view workspace members' });
    }

    // Get detailed member information
    const memberIds = workspace.members.map(member => member.user);
    const users = await User.find({ _id: { $in: memberIds } }).select('-password');

    // Combine user data with role information
    const members = users.map(user => {
      const memberData = workspace.members.find(
        member => member.user.toString() === user._id.toString()
      );
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: memberData.role,
        joinedAt: memberData.joinedAt
      };
    });

    res.json(members);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/workspaces/:id/invite
// @desc    Invite a user to workspace
// @access  Private
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is the owner of the workspace
    const isOwner = workspace.owner.toString() === req.user.id;
    
    // Check if user is an editor
    const isEditor = workspace.members.some(
      member => member.user.toString() === req.user.id && member.role === 'editor'
    );

    if (!isOwner && !isEditor) {
      return res.status(401).json({ msg: 'Not authorized to invite members' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      member => member.user.toString() === user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ msg: 'User is already a member of this workspace' });
    }

    // Add user to workspace members
    workspace.members.push({
      user: user._id,
      role: 'viewer',
      joinedAt: Date.now()
    });

    await workspace.save();

    res.json(workspace);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/workspaces/:id/members/:userId
// @desc    Remove a member from workspace
// @access  Private
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ msg: 'Workspace not found' });
    }

    // Check if user is the owner of the workspace
    const isOwner = workspace.owner.toString() === req.user.id;
    
    // Check if user is removing themselves
    const isSelfRemoval = req.params.userId === req.user.id;

    if (!isOwner && !isSelfRemoval) {
      return res.status(401).json({ msg: 'Not authorized to remove members' });
    }

    // Cannot remove the owner
    if (req.params.userId === workspace.owner.toString()) {
      return res.status(400).json({ msg: 'Cannot remove the workspace owner' });
    }

    // Find member index
    const memberIndex = workspace.members.findIndex(
      member => member.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ msg: 'Member not found' });
    }

    // Remove member
    workspace.members.splice(memberIndex, 1);
    await workspace.save();

    res.json({ msg: 'Member removed from workspace' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Workspace or member not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 