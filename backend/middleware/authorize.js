import User from '../models/User.js';
import { isAdminRole } from '../utils/userHelpers.js';
import { getRegistrationCollege } from '../utils/collegeHelpers.js';

function requireRoles(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      req.currentUser = user;

      if (!roles.includes(user.role)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}

const requireAdmin = requireRoles('SuperAdmin', 'Owner', 'Admin');
const requireSuperAdmin = requireRoles('SuperAdmin');

async function resolveCollegeId(req, res, next) {
  try {
    const user = req.currentUser || await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.currentUser = user;

    if (user.role === 'SuperAdmin') {
      let collegeId = req.query.collegeId || req.body.collegeId || req.params.collegeId
        || req.params.id || req.headers['x-college-id'];
      if (!collegeId && !req.allowNoCollege) {
        try {
          const college = await getRegistrationCollege();
          collegeId = college._id.toString();
        } catch {
          return res.status(400).json({ success: false, error: 'Set up the college in the admin panel first' });
        }
      }
      req.collegeId = collegeId || null;
    } else if (isAdminRole(user.role)) {
      req.collegeId = user.collegeId?.toString();
      if (!req.collegeId) {
        return res.status(400).json({ success: false, error: 'No college associated with this account' });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export {
  requireRoles,
  requireRoles as authorizeRoles,
  requireAdmin,
  requireSuperAdmin,
  resolveCollegeId,
  resolveCollegeId as scopeToCollege,
};
