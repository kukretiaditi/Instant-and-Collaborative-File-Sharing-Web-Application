const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the right format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Get user from the token
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check workspace permissions
exports.checkWorkspacePermission = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const workspace = await Workspace.findById(req.params.workspaceId);
      
      if (!workspace) {
        return res.status(404).json({
          success: false,
          error: 'Workspace not found'
        });
      }

      // Check if user is owner
      if (workspace.owner.toString() === req.user.id.toString()) {
        return next();
      }

      // Check if user is a member with sufficient permissions
      const member = workspace.members.find(
        member => member.user.toString() === req.user.id.toString()
      );

      if (!member) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this workspace'
        });
      }

      const roles = {
        viewer: 0,
        editor: 1,
        owner: 2
      };

      if (roles[member.role] < roles[requiredRole]) {
        return res.status(403).json({
          success: false,
          error: `Role ${member.role} is not authorized for this action`
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
}; 