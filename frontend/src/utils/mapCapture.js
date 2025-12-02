/**
 * Map Capture Utilities
 * Provides multiple methods for capturing map images with markers visible
 */

import { uploadFile, uploadBase64Image, BUCKETS } from '@/lib/storage'
import html2canvas from 'html2canvas'

/**
 * METHOD 1: Google Static Maps API (RECOMMENDED)
 * Best quality, automatic marker rendering, fastest
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

    // Build markers parameter - each marker needs its own markers= parameter for different labels
    // Format: markers=color:red|label:A|lat,lng
    const markerParams = waypoints.map((wp, index) => {
      const label = String.fromCharCode(65 + index) // A, B, C, D...
      return `markers=color:red|label:${label}|${wp.location.lat},${wp.location.lng}`
    }).join('&')

    // Build path parameter (draw polyline)
    // Format: path=color:0xFF0000|weight:5|lat1,lng1|lat2,lng2|...
    const pathCoords = waypoints.map(wp => `${wp.location.lat},${wp.location.lng}`).join('|')
    const pathColor = color.replace('#', '0x') + 'FF' // Add alpha for full opacity
    const pathParam = `path=color:${pathColor}|weight:5|${pathCoords}`

    // Construct Static Maps URL with scale=2 for higher resolution
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&scale=2&${markerParams}&${pathParam}&key=${apiKey}`

    console.log('Fetching static map from Google...')

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
 * Auto-selecting capture method (tries Static API first, falls back to canvas)
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
    markers
  } = params

  try {
    // Try Static API first (recommended)
    return await captureWithStaticAPI(waypoints, color, apiKey, userId, postId)
  } catch (staticError) {
    console.warn('Static API failed, falling back to canvas:', staticError)

    // Fallback to canvas method
    return await captureWithCanvas(map, waypoints, markers, userId, postId)
  }
}

export default {
  captureWithStaticAPI,
  captureWithCanvas,
  captureMap
}
