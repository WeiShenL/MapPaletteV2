/**
 * Soft Delete Middleware for Prisma
 * Implements soft delete pattern - marks records as deleted instead of removing them
 */

/**
 * Prisma middleware for soft delete
 * Automatically filters out soft-deleted records and converts delete operations to updates
 */
const softDeleteMiddleware = () => {
  return async (params, next) => {
    // Models that support soft delete
    const SOFT_DELETE_MODELS = ['User', 'Post', 'Comment'];

    if (!SOFT_DELETE_MODELS.includes(params.model)) {
      return next(params);
    }

    // Convert delete operations to update (set deletedAt)
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = {
        deletedAt: new Date(),
        isDeleted: true,
      };
    }

    // Convert deleteMany to updateMany
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date();
        params.args.data.isDeleted = true;
      } else {
        params.args.data = {
          deletedAt: new Date(),
          isDeleted: true,
        };
      }
    }

    // Add filter to exclude soft-deleted records for read operations
    const READ_ACTIONS = [
      'findUnique',
      'findFirst',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
    ];

    if (READ_ACTIONS.includes(params.action)) {
      if (params.args.where !== undefined) {
        // Don't filter if explicitly querying deleted records
        if (params.args.where.deletedAt === undefined && params.args.where.isDeleted === undefined) {
          params.args.where.isDeleted = false;
        }
      } else {
        params.args.where = { isDeleted: false };
      }
    }

    // Add filter for update operations to prevent updating deleted records
    if (params.action === 'update' || params.action === 'updateMany') {
      if (params.args.where !== undefined) {
        // Don't add filter if explicitly updating deleted records
        if (params.args.where.deletedAt === undefined && params.args.where.isDeleted === undefined) {
          params.args.where.isDeleted = false;
        }
      }
    }

    return next(params);
  };
};

/**
 * Query builder helpers for soft delete
 */
const softDelete = {
  /**
   * Include deleted records in query
   * @example
   * db.user.findMany(softDelete.withDeleted())
   */
  withDeleted: () => {
    return {
      where: {},
    };
  },

  /**
   * Query only deleted records
   * @example
   * db.user.findMany(softDelete.onlyDeleted())
   */
  onlyDeleted: () => {
    return {
      where: {
        isDeleted: true,
      },
    };
  },

  /**
   * Restore soft-deleted record
   * @param {Object} db - Prisma client
   * @param {string} model - Model name
   * @param {string|Object} where - Record identifier
   */
  restore: async (db, model, where) => {
    const whereClause = typeof where === 'string' ? { id: where } : where;

    return await db[model].updateMany({
      where: {
        ...whereClause,
        isDeleted: true,
      },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  },

  /**
   * Permanently delete (hard delete) record
   * @param {Object} db - Prisma client
   * @param {string} model - Model name
   * @param {string|Object} where - Record identifier
   */
  forceDelete: async (db, model, where) => {
    const whereClause = typeof where === 'string' ? { id: where } : where;

    // Use raw Prisma delete to bypass middleware
    return await db[model].delete({
      where: whereClause,
    });
  },

  /**
   * Restore multiple records
   * @param {Object} db - Prisma client
   * @param {string} model - Model name
   * @param {Object} where - Query filter
   */
  restoreMany: async (db, model, where = {}) => {
    return await db[model].updateMany({
      where: {
        ...where,
        isDeleted: true,
      },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  },

  /**
   * Permanently delete multiple records
   * @param {Object} db - Prisma client
   * @param {string} model - Model name
   * @param {Object} where - Query filter
   */
  forceDeleteMany: async (db, model, where = {}) => {
    return await db[model].deleteMany({
      where,
    });
  },

  /**
   * Clean up old soft-deleted records (maintenance operation)
   * @param {Object} db - Prisma client
   * @param {string} model - Model name
   * @param {number} daysOld - Delete records older than this many days
   */
  cleanup: async (db, model, daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db[model].deleteMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lt: cutoffDate,
        },
      },
    });

    if (global.logger) {
      global.logger.info(`Cleaned up ${result.count} old ${model} records`, {
        model,
        daysOld,
        cutoffDate,
      });
    }

    return result;
  },
};

/**
 * Express middleware to handle soft delete in routes
 */
const handleSoftDelete = (model) => {
  return async (req, res, next) => {
    const { db } = require('../utils/db');
    const id = req.params.id || req.params.userId || req.params.postId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Record ID is required',
        },
      });
    }

    try {
      // Soft delete the record
      const result = await db[model].update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // Log audit event
      if (global.logger) {
        global.logger.info(`${model} soft deleted`, {
          id,
          userId: req.user?.id,
          requestId: req.id,
        });
      }

      res.status(200).json({
        success: true,
        message: `${model} deleted successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Express middleware to restore soft-deleted record
 */
const handleRestore = (model) => {
  return async (req, res, next) => {
    const { db } = require('../utils/db');
    const id = req.params.id || req.params.userId || req.params.postId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'Record ID is required',
        },
      });
    }

    try {
      // Restore the record
      const result = await softDelete.restore(db, model, id);

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `${model} not found or not deleted`,
          },
        });
      }

      // Log audit event
      if (global.logger) {
        global.logger.info(`${model} restored`, {
          id,
          userId: req.user?.id,
          requestId: req.id,
        });
      }

      res.status(200).json({
        success: true,
        message: `${model} restored successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  softDeleteMiddleware,
  softDelete,
  handleSoftDelete,
  handleRestore,
};
