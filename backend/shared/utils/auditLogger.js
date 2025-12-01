/**
 * Audit Logging System
 * Tracks all important changes to data for compliance and debugging
 */

const { db } = require('./db');

/**
 * Audit event types
 */
const AUDIT_EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PASSWORD_RESET: 'user.password_reset',

  // Post events
  POST_CREATED: 'post.created',
  POST_UPDATED: 'post.updated',
  POST_DELETED: 'post.deleted',
  POST_PUBLISHED: 'post.published',
  POST_UNPUBLISHED: 'post.unpublished',

  // Interaction events
  LIKE_CREATED: 'like.created',
  LIKE_DELETED: 'like.deleted',
  COMMENT_CREATED: 'comment.created',
  COMMENT_UPDATED: 'comment.updated',
  COMMENT_DELETED: 'comment.deleted',
  SHARE_CREATED: 'share.created',

  // Follow events
  FOLLOW_CREATED: 'follow.created',
  FOLLOW_DELETED: 'follow.deleted',

  // Admin events
  ADMIN_ACTION: 'admin.action',
  PERMISSION_CHANGED: 'permission.changed',
  SETTINGS_CHANGED: 'settings.changed',
};

/**
 * Log audit event to database
 * @param {Object} event - Audit event
 */
const logAuditEvent = async (event) => {
  const {
    eventType,
    userId,
    entityType,
    entityId,
    action,
    oldValues,
    newValues,
    metadata,
    ipAddress,
    userAgent,
    requestId,
  } = event;

  try {
    // In production, you would store this in a dedicated audit_logs table
    // For now, we'll log to Winston and optionally to database

    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      entityType,
      entityId,
      action,
      changes: {
        before: oldValues,
        after: newValues,
      },
      metadata,
      context: {
        ipAddress,
        userAgent,
        requestId,
      },
    };

    // Log to Winston
    if (global.logger) {
      global.logger.info('Audit event', auditEntry);
    }

    // TODO: Store in dedicated audit_logs table
    // await db.auditLog.create({
    //   data: {
    //     eventType,
    //     userId,
    //     entityType,
    //     entityId,
    //     action,
    //     oldValues: oldValues ? JSON.stringify(oldValues) : null,
    //     newValues: newValues ? JSON.stringify(newValues) : null,
    //     metadata: metadata ? JSON.stringify(metadata) : null,
    //     ipAddress,
    //     userAgent,
    //     requestId,
    //   },
    // });

    return auditEntry;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging should not break the application
  }
};

/**
 * Create audit middleware for tracking changes
 */
const createAuditMiddleware = (eventType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Capture response
    res.send = function (data) {
      // Log audit event after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logAuditEvent({
          eventType,
          userId: req.user?.id || req.userId,
          entityType: req.params.entityType,
          entityId: req.params.id || req.params.userId || req.params.postId,
          action: req.method,
          oldValues: req.auditOldValues,
          newValues: req.body,
          metadata: {
            path: req.path,
            method: req.method,
            query: req.query,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.id,
        });
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Track user creation
 */
const auditUserCreated = async (userId, userData, context = {}) => {
  return await logAuditEvent({
    eventType: AUDIT_EVENTS.USER_CREATED,
    userId,
    entityType: 'user',
    entityId: userId,
    action: 'CREATE',
    newValues: {
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
    },
    metadata: context.metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track user update
 */
const auditUserUpdated = async (userId, oldValues, newValues, context = {}) => {
  // Calculate actual changes
  const changes = {};
  for (const key in newValues) {
    if (newValues[key] !== oldValues[key]) {
      changes[key] = {
        from: oldValues[key],
        to: newValues[key],
      };
    }
  }

  return await logAuditEvent({
    eventType: AUDIT_EVENTS.USER_UPDATED,
    userId,
    entityType: 'user',
    entityId: userId,
    action: 'UPDATE',
    oldValues,
    newValues,
    metadata: { changes, ...context.metadata },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track user deletion
 */
const auditUserDeleted = async (userId, userData, context = {}) => {
  return await logAuditEvent({
    eventType: AUDIT_EVENTS.USER_DELETED,
    userId,
    entityType: 'user',
    entityId: userId,
    action: 'DELETE',
    oldValues: userData,
    metadata: context.metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track post creation
 */
const auditPostCreated = async (userId, postId, postData, context = {}) => {
  return await logAuditEvent({
    eventType: AUDIT_EVENTS.POST_CREATED,
    userId,
    entityType: 'post',
    entityId: postId,
    action: 'CREATE',
    newValues: {
      name: postData.name,
      description: postData.description,
      isPublic: postData.isPublic,
    },
    metadata: context.metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track post update
 */
const auditPostUpdated = async (userId, postId, oldValues, newValues, context = {}) => {
  const changes = {};
  for (const key in newValues) {
    if (newValues[key] !== oldValues[key]) {
      changes[key] = {
        from: oldValues[key],
        to: newValues[key],
      };
    }
  }

  return await logAuditEvent({
    eventType: AUDIT_EVENTS.POST_UPDATED,
    userId,
    entityType: 'post',
    entityId: postId,
    action: 'UPDATE',
    oldValues,
    newValues,
    metadata: { changes, ...context.metadata },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track post deletion
 */
const auditPostDeleted = async (userId, postId, postData, context = {}) => {
  return await logAuditEvent({
    eventType: AUDIT_EVENTS.POST_DELETED,
    userId,
    entityType: 'post',
    entityId: postId,
    action: 'DELETE',
    oldValues: postData,
    metadata: context.metadata,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Track admin actions
 */
const auditAdminAction = async (userId, action, targetId, context = {}) => {
  return await logAuditEvent({
    eventType: AUDIT_EVENTS.ADMIN_ACTION,
    userId,
    entityType: 'admin',
    entityId: targetId,
    action,
    metadata: {
      adminAction: action,
      ...context.metadata,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    requestId: context.requestId,
  });
};

/**
 * Query audit logs
 * @param {Object} filters - Query filters
 */
const queryAuditLogs = async (filters = {}) => {
  const { userId, entityType, entityId, eventType, startDate, endDate, limit = 100 } = filters;

  // TODO: Implement actual database query
  // This is a placeholder for the query logic

  const query = {};

  if (userId) query.userId = userId;
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  if (eventType) query.eventType = eventType;

  // In production, query from audit_logs table
  // const logs = await db.auditLog.findMany({
  //   where: query,
  //   orderBy: { createdAt: 'desc' },
  //   take: limit,
  // });

  if (global.logger) {
    global.logger.info('Querying audit logs', { filters });
  }

  return []; // Placeholder
};

/**
 * Get audit trail for an entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 */
const getEntityAuditTrail = async (entityType, entityId) => {
  return await queryAuditLogs({
    entityType,
    entityId,
    limit: 1000,
  });
};

/**
 * Get user activity log
 * @param {string} userId - User ID
 */
const getUserActivityLog = async (userId, limit = 100) => {
  return await queryAuditLogs({
    userId,
    limit,
  });
};

module.exports = {
  AUDIT_EVENTS,
  logAuditEvent,
  createAuditMiddleware,
  auditUserCreated,
  auditUserUpdated,
  auditUserDeleted,
  auditPostCreated,
  auditPostUpdated,
  auditPostDeleted,
  auditAdminAction,
  queryAuditLogs,
  getEntityAuditTrail,
  getUserActivityLog,
};
