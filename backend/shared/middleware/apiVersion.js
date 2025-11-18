/**
 * API Versioning Middleware
 * Supports multiple API versions with deprecation warnings
 */

/**
 * API Version configuration
 */
const API_VERSIONS = {
  v1: {
    released: '2025-01-01',
    deprecated: false,
    sunset: null,
  },
  v2: {
    released: null, // Not yet released
    deprecated: false,
    sunset: null,
  },
};

const CURRENT_VERSION = 'v1';
const SUPPORTED_VERSIONS = ['v1'];

/**
 * Extract API version from request
 * Supports multiple version detection methods:
 * 1. URL path: /api/v1/users
 * 2. Accept header: Accept: application/vnd.mappalette.v1+json
 * 3. Custom header: X-API-Version: v1
 * 4. Query parameter: ?api_version=v1
 *
 * @param {Object} req - Express request object
 * @returns {string} - API version (v1, v2, etc.)
 */
const extractVersion = (req) => {
  // 1. Check URL path
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  // 2. Check Accept header
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const acceptMatch = acceptHeader.match(/application\/vnd\.mappalette\.(v\d+)\+json/);
    if (acceptMatch) {
      return acceptMatch[1];
    }
  }

  // 3. Check custom header
  const versionHeader = req.get('X-API-Version');
  if (versionHeader) {
    return versionHeader;
  }

  // 4. Check query parameter
  const queryVersion = req.query.api_version;
  if (queryVersion) {
    return queryVersion;
  }

  // Default to current version
  return CURRENT_VERSION;
};

/**
 * Validate API version
 * @param {string} version - API version
 * @returns {Object} - Validation result
 */
const validateVersion = (version) => {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return {
      valid: false,
      error: `API version '${version}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(
        ', '
      )}`,
    };
  }

  const versionInfo = API_VERSIONS[version];

  if (versionInfo.deprecated) {
    return {
      valid: true,
      deprecated: true,
      sunset: versionInfo.sunset,
      warning: `API version '${version}' is deprecated${
        versionInfo.sunset ? ` and will be sunset on ${versionInfo.sunset}` : ''
      }. Please upgrade to the latest version.`,
    };
  }

  return {
    valid: true,
    deprecated: false,
  };
};

/**
 * API versioning middleware
 * Attaches version information to request object
 */
const apiVersion = () => {
  return (req, res, next) => {
    const version = extractVersion(req);
    const validation = validateVersion(version);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_API_VERSION',
          message: validation.error,
          supportedVersions: SUPPORTED_VERSIONS,
        },
      });
    }

    // Attach version to request
    req.apiVersion = version;

    // Set response headers
    res.set('X-API-Version', version);

    // Add deprecation warning header if applicable
    if (validation.deprecated) {
      res.set('Deprecation', 'true');
      res.set('Sunset', validation.sunset || '');
      res.set('Link', '<https://docs.mappalette.com/api/migration>; rel="deprecation"');

      // Log deprecation usage
      if (global.logger) {
        global.logger.warn('Deprecated API version used', {
          version,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
    }

    next();
  };
};

/**
 * Version-specific route handler
 * Allows different handlers for different API versions
 *
 * @example
 * router.get('/users',
 *   versionedHandler({
 *     v1: getUsersV1,
 *     v2: getUsersV2
 *   })
 * );
 */
const versionedHandler = (handlers) => {
  return (req, res, next) => {
    const version = req.apiVersion || CURRENT_VERSION;
    const handler = handlers[version] || handlers[CURRENT_VERSION];

    if (!handler) {
      return res.status(501).json({
        success: false,
        error: {
          code: 'VERSION_NOT_IMPLEMENTED',
          message: `This endpoint is not implemented for API version ${version}`,
        },
      });
    }

    handler(req, res, next);
  };
};

/**
 * Create version-specific router
 * @param {string} version - API version
 * @returns {Router} - Express router
 */
const createVersionedRouter = (version) => {
  const express = require('express');
  const router = express.Router();

  // Attach version to all routes in this router
  router.use((req, res, next) => {
    req.apiVersion = version;
    res.set('X-API-Version', version);
    next();
  });

  return router;
};

/**
 * Deprecate API version
 * @param {string} version - Version to deprecate
 * @param {string} sunsetDate - Sunset date (ISO format)
 */
const deprecateVersion = (version, sunsetDate) => {
  if (API_VERSIONS[version]) {
    API_VERSIONS[version].deprecated = true;
    API_VERSIONS[version].sunset = sunsetDate;

    if (global.logger) {
      global.logger.info(`API version ${version} deprecated`, {
        sunset: sunsetDate,
      });
    }
  }
};

/**
 * Get version info
 * @returns {Object} - Version information
 */
const getVersionInfo = () => {
  return {
    current: CURRENT_VERSION,
    supported: SUPPORTED_VERSIONS,
    versions: API_VERSIONS,
  };
};

module.exports = {
  apiVersion,
  versionedHandler,
  createVersionedRouter,
  extractVersion,
  validateVersion,
  deprecateVersion,
  getVersionInfo,
  API_VERSIONS,
  CURRENT_VERSION,
  SUPPORTED_VERSIONS,
};
