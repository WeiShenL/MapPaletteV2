const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_PUBLIC_URL || 'http://supabase-kong:8000',
  process.env.SUPABASE_ANON_KEY
);

const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    };

    next();
  } catch (error) {
    console.error('[AUTH] Verification error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed'
    });
  }
};

const verifyOwnership = (userIdParam = 'userID') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam] || req.body.userId;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    req.user = (!error && user) ? {
      id: user.id,
      email: user.email,
      ...user.user_metadata
    } : null;

    next();
  } catch (error) {
    console.error('[AUTH] Optional auth error:', error);
    req.user = null;
    next();
  }
};

module.exports = { verifyAuth, verifyOwnership, optionalAuth };
