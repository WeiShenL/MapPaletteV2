/**
 * Map Capture Utilities
 * Provides multiple methods for capturing map images with markers visible
 */

import { uploadFile, uploadBase64Image, BUCKETS } from '@/lib/storage'
import html2canvas from 'html2canvas'

/**
 * METHOD 1: Google Static Maps API with Encoded Polyline (RECOMMENDED)
 * - Uses encoded polyline from Directions API for road-following routes
 * - Auto-centers and auto-zooms to fit the route
 * - No pins/markers for a clean look
 *
 * @param {string} encodedPolyline - Encoded polyline string from Directions API
 * @param {string} color - Route color (hex format like "#FF0000")
 * @param {string} apiKey - Google Maps API key
 * @param {string} userId - User ID for storage path
 * @param {string} postId - Post ID for filename
 * @returns {Promise<string>} - Uploaded image URL
 */
export const captureWithEncodedPolyline = async (encodedPolyline, color, apiKey, userId, postId) => {
  try {
    const width = 600  // Max 640 without scale
    const height = 400

    // Convert hex color to format required by Static Maps API (0xRRGGBBFF for fully opaque)
    const pathColor = color.replace('#', '0x') + 'FF'

    // Construct Static Map URL:
    // - Use enc: prefix for encoded polyline (follows roads exactly)
    // - NO center/zoom params = auto-fit to route bounds
    // - NO markers param = clean map without pins
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `size=${width}x${height}` +
      `&scale=2` + // High resolution
      `&path=color:${pathColor}|weight:5|enc:${encodeURIComponent(encodedPolyline)}` +
      `&key=${apiKey}`

    console.log('Fetching static map with encoded polyline (road-following route)...')

    // Fetch the image
    const response = await fetch(staticMapUrl)

    if (!response.ok) {
      throw new Error(`Static Maps API error: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Upload directly to Supabase Storage
    const path = `${userId}/route/route_${postId}_${Date.now()}.jpg`
    const uploadResult = await uploadFile(blob, BUCKETS.ROUTE_IMAGES, path)

    if (!uploadResult.success) {
      throw new Error(uploadResult.error)
    }

    console.log('✅ Static API capture with encoded polyline successful:', uploadResult.url)
    return uploadResult.url

  } catch (error) {
    console.error('Encoded polyline capture failed:', error)
    throw error
  }
}

/**
 * METHOD 2: Google Static Maps API with waypoints (FALLBACK)
 * - Uses individual waypoint coordinates (straight lines between points)
 * - Only used if encoded polyline is not available
 *
 * @param {Array} waypoints - Array of waypoint objects with location {lat, lng}
 * @param {string} color - Route color (hex format like "#FF0000")
 * @param {string} apiKey - Google Maps API key
 * @param {string} userId - User ID for storage path
 * @param {string} postId - Post ID for filename
 * @returns {Promise<string>} - Uploaded image URL
 */
export const captureWithStaticAPI = async (waypoints, color, apiKey, userId, postId) => {
  try {
    const width = 600  // Max 640 without scale
    const height = 400

    // Build path parameter (draw polyline) - straight lines between waypoints
    // Format: path=color:0xFF0000FF|weight:5|lat1,lng1|lat2,lng2|...
    const pathCoords = waypoints.map(wp => `${wp.location.lat},${wp.location.lng}`).join('|')
    const pathColor = color.replace('#', '0x') + 'FF'  // FF = fully opaque
    
    // NO center/zoom = auto-fit, NO markers = clean look
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
      `size=${width}x${height}` +
      `&scale=2` +
      `&path=color:${pathColor}|weight:5|${pathCoords}` +
      `&key=${apiKey}`

    console.log('Fetching static map with waypoints (fallback - straight lines)...')

    // Fetch the image
    const response = await fetch(staticMapUrl)

    if (!response.ok) {
      throw new Error(`Static Maps API error: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Upload directly to Supabase Storage
    const path = `${userId}/route/route_${postId}_${Date.now()}.jpg`
    const uploadResult = await uploadFile(blob, BUCKETS.ROUTE_IMAGES, path)

    if (!uploadResult.success) {
      throw new Error(uploadResult.error)
    }

    console.log('✅ Static API capture successful:', uploadResult.url)
    return uploadResult.url

  } catch (error) {
    console.error('Static API capture failed:', error)
    throw error
  }
}

/**
 * METHOD 2: Improved html2canvas (FALLBACK)
 * Keeps markers visible, auto-fits bounds, better quality
 * Updated for Advanced Markers API (google.maps.marker.AdvancedMarkerElement)
 *
 * @param {Object} map - Google Maps instance
 * @param {Array} waypoints - Waypoints array
 * @param {Array} markers - Marker instances (AdvancedMarkerElement)
 * @param {string} userId - User ID
 * @param {string} postId - Post ID
 * @returns {Promise<string>} - Uploaded image URL
 */
export const captureWithCanvas = async (map, waypoints, markers, userId, postId) => {
  let originalState = {}

  try {
    const mapContainer = document.getElementById('map')

    // Store original state
    originalState = {
      height: mapContainer.style.height,
      width: mapContainer.style.width,
      controls: {
        zoomControl: map.get('zoomControl'),
        streetViewControl: map.get('streetViewControl'),
        mapTypeControl: map.get('mapTypeControl'),
        fullscreenControl: map.get('fullscreenControl')
      }
    }

    // Set high-quality capture dimensions
    mapContainer.style.width = '1600px'
    mapContainer.style.height = '1200px'

    // Calculate bounds to show entire route
    const bounds = new window.google.maps.LatLngBounds()
    waypoints.forEach(wp => {
      bounds.extend(new window.google.maps.LatLng(wp.location.lat, wp.location.lng))
    })

    // Fit bounds with padding
    map.fitBounds(bounds, 80)

    // KEEP MARKERS VISIBLE - Advanced Markers use property assignment, not methods
    markers.forEach((marker, index) => {
      // For Advanced Markers, ensure they're on the map
      marker.map = map
      
      // Update pin content with label using glyphText (glyph is deprecated)
      const pinElement = new window.google.maps.marker.PinElement({
        background: '#FF6B6B',
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        glyphText: String.fromCharCode(65 + index), // A, B, C, D...
        scale: 1.2
      })
      // Clear existing content and append new pin
      while (marker.firstChild) {
        marker.removeChild(marker.firstChild)
      }
      marker.append(pinElement)
      marker.zIndex = 1000 + index
    })

    // Disable controls for cleaner capture
    map.setOptions({
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    })

    // Wait for map to render completely
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Capturing with html2canvas (markers visible)...')

    // Capture with high quality settings
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      scale: 2, // 2x resolution for retina displays
      logging: false,
      imageTimeout: 0
    })

    // Convert to JPEG (95% quality)
    const imageData = canvas.toDataURL('image/jpeg', 0.95)

    // Upload to Supabase Storage
    const uploadResult = await uploadBase64Image(
      imageData,
      userId,
      BUCKETS.ROUTE_IMAGES,
      `route_${postId}.jpg`
    )

    if (!uploadResult.success) {
      throw new Error(uploadResult.error)
    }

    console.log('✅ Canvas capture successful:', uploadResult.url)
    return uploadResult.url

  } catch (error) {
    console.error('Canvas capture failed:', error)
    throw error
  } finally {
    // Restore original state - ALWAYS run this even if there's an error
    try {
      const mapContainer = document.getElementById('map')
      if (originalState.height !== undefined) {
        mapContainer.style.height = originalState.height || ''
        mapContainer.style.width = originalState.width || ''
        
        // Trigger resize event
        window.google.maps.event.trigger(map, 'resize')

        // Restore controls
        if (originalState.controls) {
          map.setOptions(originalState.controls)
        }

        // Restore bounds
        const bounds = new window.google.maps.LatLngBounds()
        waypoints.forEach(wp => {
          bounds.extend(new window.google.maps.LatLng(wp.location.lat, wp.location.lng))
        })
        map.fitBounds(bounds, 50)
      }
    } catch (restoreError) {
      console.error('Error restoring map state:', restoreError)
    }
  }
}

/**
 * Auto-selecting capture method
 * Priority:
 * 1. Encoded polyline (road-following, auto-centered, no pins) - BEST
 * 2. Static API with waypoints (straight lines, fallback)
 * 3. html2canvas (last resort)
 *
 * @param {Object} params - Capture parameters
 * @returns {Promise<string>} - Uploaded image URL
 */
export const captureMap = async (params) => {
  const {
    waypoints,
    color,
    apiKey,
    userId,
    postId,
    map,
    markers,
    encodedPolyline // New: encoded polyline from Directions API
  } = params

  try {
    // Method 1: Use encoded polyline if available (BEST - follows roads exactly)
    if (encodedPolyline) {
      console.log('Using encoded polyline for road-following route capture...')
      return await captureWithEncodedPolyline(encodedPolyline, color, apiKey, userId, postId)
    }
    
    // Method 2: Fall back to waypoints (straight lines between points)
    console.log('No encoded polyline available, using waypoints (straight lines)...')
    return await captureWithStaticAPI(waypoints, color, apiKey, userId, postId)
  } catch (staticError) {
    console.warn('Static API failed, falling back to canvas:', staticError)

    // Method 3: Last resort - canvas capture
    return await captureWithCanvas(map, waypoints, markers, userId, postId)
  }
}

export default {
  captureWithEncodedPolyline,
  captureWithStaticAPI,
  captureWithCanvas,
  captureMap
}
