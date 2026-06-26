import College from '../models/College.js';
import User from '../models/User.js';
async function getRegistrationCollege() {
  const college = await College.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!college) {
    const err = new Error('No college has been configured yet. Contact your administrator.');
    err.status = 503;
    throw err;
  }
  return college;
}

async function getRegistrationCollegeWithMeta() {
  const college = await getRegistrationCollege();
  const ownerExists = await User.exists({ collegeId: college._id, role: 'Owner' });
  return {
    _id: college._id,
    name: college.name,
    code: college.code,
    city: college.city,
    hasOwner: !!ownerExists,
  };
}

export {
  getRegistrationCollege,
  getRegistrationCollegeWithMeta,
};