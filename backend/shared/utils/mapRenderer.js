/**
 * Map Renderer Service
 * Generates map screenshots using Puppeteer + Leaflet + OpenStreetMap
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

/**
 * Map rendering configuration
 */
const MAP_CONFIG = {
  width: 1200,
  height: 900,
  tileProvider: 'OpenStreetMap',
  defaultZoom: 13,
  format: 'png',
  quality: 90,
  timeout: 30000, // 30 seconds
};

/**
 * Tile provider URLs
 */
const TILE_PROVIDERS = {
  OpenStreetMap: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  OpenStreetMapHOT: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  CartoDB: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  CartoDBDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};

let browserInstance = null;

/**
 * Get or create browser instance (reuse for performance)
 */
const getBrowser = async () => {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  // Handle browser disconnection
  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
};

/**
 * Close browser instance
 */
const closeBrowser = async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
};

/**
 * Calculate bounds for waypoints
 * @param {Array} waypoints - Array of {lat, lng} objects
 * @returns {Object} - Bounds object
 */
const calculateBounds = (waypoints) => {
  if (!waypoints || waypoints.length === 0) {
    throw new Error('Waypoints array is required');
  }

  const lats = waypoints.map((wp) => wp.lat);
  const lngs = waypoints.map((wp) => wp.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
};

/**
 * Generate HTML for map
 * @param {Object} options - Map options
 * @returns {string} - HTML string
 */
const generateMapHTML = (options) => {
  const {
    waypoints,
    color = '#FF0000',
    width = MAP_CONFIG.width,
    height = MAP_CONFIG.height,
    tileProvider = MAP_CONFIG.tileProvider,
    showMarkers = true,
    showAttribution = true,
    watermark = 'MapPalette',
  } = options;

  const bounds = calculateBounds(waypoints);
  const tileUrl = TILE_PROVIDERS[tileProvider] || TILE_PROVIDERS.OpenStreetMap;

  // Convert waypoints to Leaflet LatLng format
  const waypointsJSON = JSON.stringify(waypoints.map((wp) => [wp.lat, wp.lng]));

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    #map {
      width: ${width}px;
      height: ${height}px;
    }
    .watermark {
      position: absolute;
      bottom: 25px;
      right: 10px;
      background: rgba(255, 255, 255, 0.8);
      padding: 5px 10px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: 600;
      color: #333;
      z-index: 1000;
      pointer-events: none;
    }
    .leaflet-control-attribution {
      font-size: 10px !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  ${watermark ? `<div class="watermark">${watermark}</div>` : ''}

  <script>
    // Initialize map
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: ${showAttribution}
    });

    // Add tile layer
    L.tileLayer('${tileUrl}', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Waypoints
    const waypoints = ${waypointsJSON};

    // Create polyline (route)
    const polyline = L.polyline(waypoints, {
      color: '${color}',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map);

    // Add markers if enabled
    if (${showMarkers}) {
      // Start marker (green)
      L.circleMarker(waypoints[0], {
        radius: 8,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);

      // End marker (red)
      L.circleMarker(waypoints[waypoints.length - 1], {
        radius: 8,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);

      // Waypoint markers (blue)
      if (waypoints.length > 2) {
        for (let i = 1; i < waypoints.length - 1; i++) {
          L.circleMarker(waypoints[i], {
            radius: 5,
            fillColor: '${color}',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).addTo(map);
        }
      }
    }

    // Fit map to bounds with padding
    map.fitBounds(polyline.getBounds(), {
      padding: [50, 50]
    });

    // Signal that map is ready
    window.mapReady = true;
  </script>
</body>
</html>
  `;
};

/**
 * Render map to image buffer
 * @param {Object} options - Rendering options
 * @returns {Buffer} - Image buffer
 */
const renderMap = async (options) => {
  const {
    waypoints,
    color,
    width,
    height,
    tileProvider,
    showMarkers,
    showAttribution,
    watermark,
    timeout = MAP_CONFIG.timeout,
  } = options;

  if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required');
  }

  // Validate waypoints
  waypoints.forEach((wp, index) => {
    if (typeof wp.lat !== 'number' || typeof wp.lng !== 'number') {
      throw new Error(`Invalid waypoint at index ${index}: lat and lng must be numbers`);
    }
    if (wp.lat < -90 || wp.lat > 90) {
      throw new Error(`Invalid latitude at index ${index}: ${wp.lat}`);
    }
    if (wp.lng < -180 || wp.lng > 180) {
      throw new Error(`Invalid longitude at index ${index}: ${wp.lng}`);
    }
  });

  const startTime = Date.now();
  let page = null;

  try {
    // Generate HTML
    const html = generateMapHTML({
      waypoints,
      color,
      width,
      height,
      tileProvider,
      showMarkers,
      showAttribution,
      watermark,
    });

    // Get browser instance
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport size
    await page.setViewport({
      width: width || MAP_CONFIG.width,
      height: height || MAP_CONFIG.height,
      deviceScaleFactor: 2, // Retina display
    });

    // Set content and wait for map to be ready
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout,
    });

    // Wait for map to be fully loaded
    await page.waitForFunction('window.mapReady === true', { timeout });

    // Wait a bit for tiles to load
    await page.waitForTimeout(2000);

    // Take screenshot
    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    const renderTime = Date.now() - startTime;

    if (global.logger) {
      global.logger.info('Map rendered successfully', {
        waypointCount: waypoints.length,
        renderTime: `${renderTime}ms`,
        imageSize: `${imageBuffer.length} bytes`,
      });
    }

    return imageBuffer;
  } catch (error) {
    const renderTime = Date.now() - startTime;

    if (global.logger) {
      global.logger.error('Map rendering failed', {
        error: error.message,
        renderTime: `${renderTime}ms`,
        waypointCount: waypoints?.length,
      });
    }

    throw new Error(`Failed to render map: ${error.message}`);
  } finally {
    if (page) {
      await page.close();
    }
  }
};

/**
 * Render map from post data
 * @param {Object} post - Post object with waypoints
 * @param {Object} options - Additional rendering options
 * @returns {Buffer} - Image buffer
 */
const renderMapFromPost = async (post, options = {}) => {
  if (!post) {
    throw new Error('Post object is required');
  }

  // Parse waypoints if string
  let waypoints = post.waypoints;
  if (typeof waypoints === 'string') {
    try {
      waypoints = JSON.parse(waypoints);
    } catch (error) {
      throw new Error('Invalid waypoints JSON');
    }
  }

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw new Error('Post must have at least 2 waypoints');
  }

  return await renderMap({
    waypoints,
    color: post.color || '#FF0000',
    watermark: 'MapPalette',
    showMarkers: true,
    showAttribution: true,
    ...options,
  });
};

/**
 * Health check for map renderer
 * @returns {Object} - Health status
 */
const healthCheck = async () => {
  try {
    const browser = await getBrowser();
    const isConnected = browser.isConnected();

    return {
      healthy: isConnected,
      browserConnected: isConnected,
      version: await browser.version(),
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
    };
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (global.logger) {
    global.logger.info('Closing map renderer browser');
  }
  await closeBrowser();
});

process.on('SIGINT', async () => {
  if (global.logger) {
    global.logger.info('Closing map renderer browser');
  }
  await closeBrowser();
});

module.exports = {
  renderMap,
  renderMapFromPost,
  generateMapHTML,
  calculateBounds,
  healthCheck,
  closeBrowser,
  MAP_CONFIG,
  TILE_PROVIDERS,
};
