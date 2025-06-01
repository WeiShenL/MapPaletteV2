const { auth } = require('../config/firebase');

// Verify Firebase ID token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Verify user is accessing their own resource
const verifyOwnership = (req, res, next) => {
  const { userID } = req.params;
  
  if (req.user.uid !== userID) {
    return res.status(403).json({ message: 'Unauthorized to access this resource' });
  }
  
  next();
};

// Verify admin role 
const verifyAdmin = async (req, res, next) => {
  try {
    // TODO: Implement admin verification logic
    
    const isAdmin = req.user.admin === true;
    
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error verifying admin:', error);
    return res.status(500).json({ message: 'Error verifying admin status' });
  }
};

module.exports = {
  verifyToken,
  verifyOwnership,
  verifyAdmin
};