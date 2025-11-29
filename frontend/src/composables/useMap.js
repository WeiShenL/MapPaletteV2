import { ref } from 'vue'

export function useMap() {
  const map = ref(null)
  const markers = ref([])
  const polylines = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Initialize Google Maps with Advanced Markers support
  const initializeMap = (container, options = {}) => {
    if (!window.google || !window.google.maps) {
      error.value = 'Google Maps API not loaded'
      return null
    }

    const defaultOptions = {
      mapId: 'DEMO_MAP_ID', // Required for Advanced Markers API
      center: { lat: 1.3521, lng: 103.8198 }, // Singapore
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      ...options
    }

    try {
      map.value = new window.google.maps.Map(container, defaultOptions)
      return map.value
    } catch (err) {
      error.value = err.message
      console.error('Error initializing map:', err)
      return null
    }
  }

  // Add marker to map using Advanced Markers API
  const addMarker = (position, options = {}) => {
    if (!map.value) {
      error.value = 'Map not initialized'
      return null
    }

    try {
      // Create pin element if custom content not provided
      const content = options.content || new window.google.maps.marker.PinElement({
        background: options.background || '#FF6B6B',
        borderColor: options.borderColor || '#FFFFFF',
        glyphColor: options.glyphColor || '#FFFFFF',
        scale: options.scale || 1.0
      }).element

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position,
        map: map.value,
        content,
        title: options.title,
        ...options
      })

      markers.value.push(marker)
      return marker
    } catch (err) {
      error.value = err.message
      console.error('Error adding marker:', err)
      return null
    }
  }

  // Add polyline to map
  const addPolyline = (path, options = {}) => {
    if (!map.value) {
      error.value = 'Map not initialized'
      return null
    }

    try {
      const defaultOptions = {
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        ...options
      }

      const polyline = new window.google.maps.Polyline({
        path,
        map: map.value,
        ...defaultOptions
      })

      polylines.value.push(polyline)
      return polyline
    } catch (err) {
      error.value = err.message
      console.error('Error adding polyline:', err)
      return null
    }
  }

  // Clear all markers (for Advanced Markers)
  const clearMarkers = () => {
    markers.value.forEach(marker => marker.map = null)
    markers.value = []
  }

  // Clear all polylines
  const clearPolylines = () => {
    polylines.value.forEach(polyline => polyline.setMap(null))
    polylines.value = []
  }

  // Clear all map elements
  const clearAll = () => {
    clearMarkers()
    clearPolylines()
  }

  // Fit bounds to show all markers (for Advanced Markers)
  const fitBounds = () => {
    if (!map.value || markers.value.length === 0) return

    const bounds = new window.google.maps.LatLngBounds()
    markers.value.forEach(marker => {
      // Advanced Markers use position property directly
      bounds.extend(marker.position)
    })

    map.value.fitBounds(bounds)
  }

  // Get center of map
  const getCenter = () => {
    if (!map.value) return null
    const center = map.value.getCenter()
    return {
      lat: center.lat(),
      lng: center.lng()
    }
  }

  // Set center of map
  const setCenter = (position) => {
    if (!map.value) return
    map.value.setCenter(position)
  }

  // Get zoom level
  const getZoom = () => {
    if (!map.value) return null
    return map.value.getZoom()
  }

  // Set zoom level
  const setZoom = (zoom) => {
    if (!map.value) return
    map.value.setZoom(zoom)
  }

  // Capture map as image
  const captureMapImage = async () => {
    if (!map.value) {
      error.value = 'Map not initialized'
      return null
    }

    loading.value = true

    try {
      // Wait for map to settle
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mapContainer = map.value.getDiv()
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      })

      const imageData = canvas.toDataURL('image/png')
      loading.value = false
      return imageData
    } catch (err) {
      error.value = err.message
      loading.value = false
      console.error('Error capturing map:', err)
      return null
    }
  }

  // Load Google Maps Script
  const loadGoogleMapsScript = (apiKey) => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`
      script.async = true
      script.defer = true

      window.initMap = () => {
        resolve()
      }

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'))
      }

      document.head.appendChild(script)
    })
  }

  // Geocode address to coordinates
  const geocodeAddress = async (address) => {
    if (!window.google || !window.google.maps) {
      error.value = 'Google Maps API not loaded'
      return null
    }

    loading.value = true

    try {
      const geocoder = new window.google.maps.Geocoder()
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve(results[0].geometry.location)
          } else {
            reject(new Error(`Geocoding failed: ${status}`))
          }
        })
      })

      loading.value = false
      return {
        lat: result.lat(),
        lng: result.lng()
      }
    } catch (err) {
      error.value = err.message
      loading.value = false
      console.error('Error geocoding address:', err)
      return null
    }
  }

  // Calculate distance between two points (in km)
  const calculateDistance = (point1, point2) => {
    if (!window.google || !window.google.maps) return null

    const lat1 = new window.google.maps.LatLng(point1.lat, point1.lng)
    const lat2 = new window.google.maps.LatLng(point2.lat, point2.lng)

    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(lat1, lat2)
    return (distance / 1000).toFixed(2) // Convert to km
  }

  return {
    map,
    markers,
    polylines,
    loading,
    error,
    initializeMap,
    addMarker,
    addPolyline,
    clearMarkers,
    clearPolylines,
    clearAll,
    fitBounds,
    getCenter,
    setCenter,
    getZoom,
    setZoom,
    captureMapImage,
    loadGoogleMapsScript,
    geocodeAddress,
    calculateDistance
  }
}
