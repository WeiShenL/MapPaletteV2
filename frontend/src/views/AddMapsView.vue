<template>
  <div id="app">
    <!-- Navbar -->
    <nav-bar :user-profile="userProfile"></nav-bar>
    
    <!-- Full-screen loading overlay -->
    <div v-if="submitting" class="loading-overlay active">
      <div class="loading-spinner"></div>
    </div>

    <!-- Alert Bar -->
    <div class="alert alert-dismissible fade" 
      :class="{'alert-warning': alertType === 'error', 'alert-success': alertType === 'success', 'show': showAlert}"
      :hidden="hidden" 
      role="alert">

      <!-- Icons for Error or Success -->
      <svg v-if="alertType === 'error'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
      </svg>
      <svg v-if="alertType === 'success'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
      <!-- Alert Message -->
      {{ alertMessage }}
      <!-- Close Button -->
      <button type="button" class="btn-close" @click="dismissAlert()"></button>
    </div>

    <div id="app-container" class="container-fluid" style="padding-top: 67px;">
      <!-- Main Content -->
      <div class="row">
        <div class="col-md-12 my-2 d-flex justify-content-between align-items-center">
          <h1>Draw your map!</h1>
          <!-- Help Button -->
          <button class="btn btn-secondary d-flex align-items-center" @click="startTour">
            <!-- SVG Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle me-1" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
            </svg>
            Help
          </button>
        </div>
      </div>    

      <!-- Row 1: Map and Controls -->
      <div class="row">
        <!-- Map Container -->
        <div class="col-md-9 position-relative p-0">
          <!-- Search Bar -->
          <div id="map-search">
            <input id="pac-input" class="form-control" type="text" placeholder="Search for a place" />
          </div>
          <!-- Map -->
          <div id="map">
          </div>
        </div>
        
        <!-- Controls -->
        <div id="controls" class="col-md-3 d-flex flex-column">
          <!-- Fixed Section (Route Color, Distance, Buttons) -->
          <div id="fixed-controls" class="mb-3">
            <h4>Choose Route Color</h4>
            <div id="colorPalette">
              <button
                v-for="color in colors"
                :key="color"
                class="color-box-btn"
                :class="{ active: currentColor === color }"
                :style="{ backgroundColor: color }"
                @click="changeColor(color)"
              ></button>
            </div>
            
            <!-- Delete Confirmation Modal -->
            <div class="modal fade" id="deletePost" tabindex="-1" aria-labelledby="deletePostLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h1 class="modal-title fs-5" id="deletePostLabel">{{ deleteModalTitle }}</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="resetDeleteModal()"></button>
                  </div>
                  <div class="modal-body">
                    <span v-if="deleteCountdown === 0">Are you sure? Once your post is deleted, it is lost forever!</span>
                    <span v-else>Post deleted! Redirecting in {{ deleteCountdown }} seconds...</span>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="resetDeleteModal()" v-if="deleteCountdown === 0">Close</button>
                    <button v-if="deleteCountdown === 0" type="button" class="btn btn-danger" @click="deletePost()">Delete forever!</button>
                    <button v-else type="button" class="btn btn-secondary" @click="undoDelete">Undo</button>
                  </div>
                </div>
              </div>
            </div>

            <button class="btn btn-danger m-1" @click="clearMap">Clear Route</button>
            <button v-if="isEditing" class="btn btn-secondary m-1" @click="undoChanges()">Undo Changes</button>
            <button id="export-button" class="btn btn-success m-1" @click="exportToGoogleMaps()">Export to Google Maps</button>
            <div id="distance">Total Distance: {{ totalDistance }} km</div>
          </div>

          <!-- Scrollable Section (Plotted Points) -->
          <div id="scrollable-points" class="flex-grow-1">
            <h4>Plotted Points</h4>
            <transition-group name="list" tag="div" id="point-list" class="list-group mx-2">
              <a
                v-for="(point, index) in waypoints"
                :key="point.id"
                class="list-group-item list-group-item-action point-item rounded"
                @mouseover="startMarkerBounce(index)"
                @mouseleave="stopMarkerBounce(index)"
              >
                <div class="details ms-2 me-auto">
                  <h5>Marker {{ index + 1 }}</h5>
                  <h6 class="fw-bold mb-1">{{ point.address }}</h6>
                  Lat: {{ point.location.lat.toFixed(5) }}, Lng: {{ point.location.lng.toFixed(5) }} <br>
                </div>
                <span class="trash-container">
                  <button class="trash-btn" @click="removeWaypoint(index)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg>
                  </button>
                </span>
              </a>
            </transition-group>
          </div>
          
        </div>
      </div>
      
      <!-- Form Start -->
      <form @submit.prevent novalidate :class="{ 'was-validated': formValidated }">

        <!-- Row 2: Title Input -->
        <div class="row mt-3">
          <div class="col">
            <label for="title" class="form-label">Title</label>
            <input type="text" class="form-control" id="title" placeholder="Enter title here" v-model="postTitle" required>
            <div class="invalid-feedback">
              Please provide a title.
            </div>
          </div>
        </div>

        <!-- Row 3: Description Input -->
        <div class="row mt-3">
          <div class="col">
            <label for="description" class="form-label">Description</label>
            <textarea class="form-control" id="description" rows="4" placeholder="Enter description here" v-model="postDescription" required></textarea>
            <div class="text-end">
              <small>{{ descriptionLength }} / {{ maxDescriptionLength }} characters maximum</small>
            </div>
            <div class="invalid-feedback">
              Please provide a description.
            </div>
          </div>
        </div>

        <!-- Row 5: Buttons -->
        <div class="row mt-3 mb-5">
          <!-- If Editing is True, Show Three Buttons in a Row -->
          <template v-if="isEditing">
              <div class="col-4">
                  <button type="button" class="btn btn-danger w-100" data-bs-toggle="modal" data-bs-target="#deletePost">
                      Delete Post
                  </button>
              </div>
              <div class="col-4">
                  <button type="button" class="btn btn-secondary w-100" @click="retBack()">
                      Return Home
                  </button>
              </div>
              <div class="col-4">
                  <button type="button" class="btn btn-primary w-100" @click="editPost()" :disabled="isSubmitDisabled">
                      Update Post
                  </button>
              </div>
          </template>

          <!-- If Not Editing, Show Clear and Create Buttons -->
          <template v-else>
              <div class="col-6">
                  <button type="button" class="btn btn-danger w-100" @click="clearPost()">
                      Clear Post
                  </button>
              </div>
              <div class="col-6">
                  <button type="button" class="btn btn-primary w-100" @click="validateAndSubmit()" :disabled="isSubmitDisabled">
                      Create Post
                  </button>
              </div>
          </template>
        </div>
      </form>

      <!-- Modal -->
      <div class="modal fade" id="editPost" tabindex="-1" aria-labelledby="editPostLabel">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="editPostLabel">Post edited!</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              Your post has been successfully edited!
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Continue Editing</button>
              <button type="button" class="btn btn-primary" @click="retBack()">Return Home</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Post Creation Success Modal -->
      <div class="modal fade" id="createPostSuccess" tabindex="-1" aria-labelledby="createPostSuccessLabel">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h1 class="modal-title fs-5" id="createPostSuccessLabel">Post Created!</h1>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              Your post has been successfully created!
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Create Another</button>
              <button type="button" class="btn btn-primary" @click="retBack()">Return Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <site-footer></site-footer>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import { userProfile } from '@/services/authService'
import { auth } from '@/config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import axios from 'axios'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import html2canvas from 'html2canvas'
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage'
import * as bootstrap from 'bootstrap'

export default {
  name: 'AddMapsView',
  components: {
    NavBar,
    SiteFooter
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // Data - lifted from addMaps.js
    const map = ref(null)
    const directionsService = ref(null)
    const directionsRenderer = ref(null)
    const routePolyline = ref(null)
    const waypoints = ref([])
    const markers = ref([])
    const currentColor = ref('#e81416')
    const totalDistance = ref(0)
    const geocoder = ref(null)
    const colors = ref(['#e81416','#ffa500','#faeb36','#79c314','#487de7','#4b369d','#70369d'])
    const mapsApiKey = ref('')
    
    // Alert related
    const showAlert = ref(false)
    const alertTimeout = ref(null)
    const hidden = ref(true)
    const alertType = ref('')
    const alertMessage = ref('')
    
    // Post related
    const postTitle = ref('')
    const postDescription = ref('')
    const maxDescriptionLength = ref(400)
    const userID = ref('')
    const username = ref('')
    const submitting = ref(false)
    const formValidated = ref(false)
    const POST_SERVICE_URL = ref((import.meta.env.VITE_POST_SERVICE_URL || 'http://localhost:3002') + '/api')
    const deleteCountdown = ref(0)
    const deleteTimeout = ref(null)
    const deleteModalTitle = ref("Delete post?")
    const image = ref('')
    const region = ref('')
    const isDeleting = ref(false)
    const storage = ref(null)
    
    // Existing post related
    const postId = ref(null)
    const isEditing = ref(false)
    const postIdUserID = ref('')
    const originalWaypoints = ref([]) // Store original waypoints for undo
    
    // Computed properties
    const descriptionLength = computed(() => postDescription.value.length)
    const isSubmitDisabled = computed(() => descriptionLength.value >= maxDescriptionLength.value)
    
    // Load Google Maps API key from environment or external service
    const loadGoogleMapsScript = async () => {
      try {
        // Try to use environment variable first
        if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here') {
          mapsApiKey.value = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        } else {
          // Fallback to external service
          const response = await fetch('https://app-907670644284.us-central1.run.app/getGoogleMapsApiKey')
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          const data = await response.json()
          mapsApiKey.value = data.apiKey
        }
        
        // Dynamically load Google Maps script
        return new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey.value}&callback=initMap&libraries=places`
          script.async = true
          script.defer = true
          script.onload = resolve
          script.onerror = () => reject(new Error("Failed to load Google Maps API"))
          document.body.appendChild(script)
        })
      } catch (error) {
        console.error('Error fetching API key:', error)
      }
    }
    
    // Initialize Google Maps
    const initMap = () => {
      map.value = new google.maps.Map(document.getElementById("map"), {
        zoom: 18,
        center: { lat: 1.36241, lng: 103.82606 }, // Singapore's coordinates
        mapTypeId: "roadmap",
        streetViewControl: false,
        mapTypeControl: false,
        gestureHandling: 'greedy',
        styles: [
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "poi.business",
            "stylers": [{ "visibility": "off" }]
          },
          {
            "featureType": "transit.station.bus",
            "stylers": [{ "visibility": "off" }]
          }
        ],
      })
    
      directionsService.value = new google.maps.DirectionsService()
      directionsRenderer.value = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
      })
    
      routePolyline.value = new google.maps.Polyline({
        strokeColor: currentColor.value,
        strokeOpacity: 1.0,
        strokeWeight: 8,
        map: map.value
      })
    
      geocoder.value = new google.maps.Geocoder()

      // Initialize search box
      const input = document.getElementById("pac-input")
      const searchBox = new google.maps.places.SearchBox(input)

      map.value.addListener("bounds_changed", () => {
        searchBox.setBounds(map.value.getBounds())
      })

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces()
        
        if (places.length === 0) {
          return
        }
        
        const place = places[0]
        
        if (!place.geometry || !place.geometry.location) {
          console.log("Returned place contains no geometry")
          return
        }
        
        map.value.setCenter(place.geometry.location)
        map.value.setZoom(18)
      })
    
      // Listen for clicks on the map to add waypoints
      map.value.addListener("click", (event) => {
        addWaypoint(event.latLng)
      })
    
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          map.value.setCenter(pos)
        })
      }
    }
    
    // Add waypoint to map
    const addWaypoint = async (latLng, index = null) => {
      if (markers.value.length >= 27) {
        setAlert('error', 'You have exceeded the marker limit of 27.')
        return
      }

      return new Promise((resolve) => {
        const id = Date.now() + Math.random()
        
        geocoder.value.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK') {
            const address = results[0] ? results[0].formatted_address : 'Address not found'
            waypoints.value.push({
              id: id,
              location: { lat: latLng.lat(), lng: latLng.lng() },
              stopover: true,
              address: address,
              order: index !== null ? index : waypoints.value.length
            })

            addMarker(latLng)
            calculateAndDisplayRoute()
            resolve()
          } else {
            console.error('Geocode failed:', status)
            resolve()
          }
        })
      })
    }
    
    // Add marker to map
    const addMarker = (latLng) => {
      const markerIndex = waypoints.value.length

      const marker = new google.maps.Marker({
        map: map.value,
        position: latLng,
        animation: google.maps.Animation.DROP,
      })

      setTimeout(() => {
        marker.setLabel({
          text: `${markerIndex}`,
          color: "black",
          fontSize: "14px",
          fontWeight: "bold"
        })
      }, 300)

      markers.value.push(marker)
    }
    
    // Remove waypoint
    const removeWaypoint = (index) => {
      if (isDeleting.value) return
      
      isDeleting.value = true
      
      waypoints.value[index].isFilling = true
      waypoints.value.splice(index, 1)
      
      const marker = markers.value[index]
      if (marker) {
        marker.setMap(null)
        marker.setVisible(false)
      }
      
      markers.value.splice(index, 1)
      calculateAndDisplayRoute()
      updateMarkerLabels()
      
      isDeleting.value = false
    }
    
    // Update marker labels after removal
    const updateMarkerLabels = () => {
      markers.value.forEach((marker, index) => {
        marker.setLabel(`${index + 1}`)
      })
    }
    
    // Change route color
    const changeColor = (color) => {
      currentColor.value = color
      if (routePolyline.value) {
        routePolyline.value.setOptions({ strokeColor: currentColor.value })
      }
    }
    
    // Calculate and display route
    const calculateAndDisplayRoute = () => {
      const processedWaypoints = waypoints.value
        .sort((a, b) => a.order - b.order)
        .map(point => ({
          location: point.location,
          stopover: point.stopover
        }))

      if (processedWaypoints.length < 2) {
        clearRoute()
        return
      }

      directionsService.value.route({
        origin: processedWaypoints[0].location,
        destination: processedWaypoints[processedWaypoints.length - 1].location,
        waypoints: processedWaypoints.slice(1, -1),
        travelMode: 'WALKING',
        avoidHighways: true,
      }, (response, status) => {
        if (status === 'OK') {
          directionsRenderer.value.setDirections(response)
          updateDistance(response)
          routePolyline.value.setOptions({
            path: response.routes[0].overview_path,
            strokeColor: currentColor.value
          })
        } else {
          setAlert('error', 'Directions request failed due to ' + status)
        }
      })
    }
    
    // Update distance calculation
    const updateDistance = (response) => {
      totalDistance.value = 0
      const route = response.routes[0]
      for (let i = 0; i < route.legs.length; i++) {
        totalDistance.value += route.legs[i].distance.value
      }
      totalDistance.value = (totalDistance.value / 1000).toFixed(2)
    }
    
    // Clear route
    const clearRoute = () => {
      totalDistance.value = 0
      routePolyline.value.setPath([])
      directionsRenderer.value.set('directions', null)
    }
    
    // Clear map
    const clearMap = (showAlertMessage = true) => {
      for (let marker of markers.value) {
        marker.setVisible(false)
        marker.setMap(null)
        marker.setPosition(null)
      }
      markers.value = []
      
      waypoints.value = []
      clearRoute()
      const input = document.getElementById("pac-input")
      if (input) input.value = ''
      
      if (showAlertMessage) {
        setAlert('success', 'Route cleared successfully.')
      }
    }
    
    // Export to Google Maps
    const exportToGoogleMaps = () => {
      if (waypoints.value.length < 2) {
        setAlert('error','You need at least two points to export the route!')
        return
      }

      let googleMapsLink = 'https://www.google.com/maps/dir/'
      waypoints.value.forEach((waypoint) => {
        googleMapsLink += `${waypoint.location.lat},${waypoint.location.lng}/`
      })
      window.open(googleMapsLink, '_blank')
    }
    
    // Alert functions
    const dismissAlert = () => {
      showAlert.value = false
      
      setTimeout(() => {
        hidden.value = true
        alertMessage.value = ''
      }, 300)
      
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value)
        alertTimeout.value = null
      }
    }
    
    const setAlert = (type, message) => {
      if (alertTimeout.value) {
        clearTimeout(alertTimeout.value)
        alertTimeout.value = null
      }
      
      hidden.value = false
      alertType.value = type
      alertMessage.value = message
      
      setTimeout(() => {
        showAlert.value = true
      }, 10)
      
      alertTimeout.value = setTimeout(() => {
        dismissAlert()
        alertTimeout.value = null
      }, 3000)
    }
    
    // Form validation and submission
    const validateAndSubmit = () => {
      formValidated.value = true
      
      if (descriptionLength.value >= maxDescriptionLength.value) {
        setAlert('error', `Description must be less than ${maxDescriptionLength.value} characters.`)
        return
      }
      
      if (!postTitle.value || !postDescription.value || waypoints.value.length < 2) {
        setAlert('error', 'Please fill out all required fields and add at least two waypoints.')
        return
      }
      
      createPost()
    }
    
    // Create post
    const createPost = async () => {
      if (waypoints.value.length < 2) {
        setAlert('error', 'You need at least two points to submit the route!')
        return
      }

      try {
        submitting.value = true

        // Get town name for first waypoint
        const firstWaypoint = waypoints.value[0].location
        region.value = await getTownName(firstWaypoint.lat, firstWaypoint.lng)

        // Capture map as image and upload to Firebase Storage
        const postIdForImage = Date.now()
        await captureMapAsImage(postIdForImage)

        console.log('Creating post with URL:', `${POST_SERVICE_URL.value}/create/${userID.value}`);
        const response = await axios.post(`${POST_SERVICE_URL.value}/create/${userID.value}`, {
          title: postTitle.value,
          description: postDescription.value,
          waypoints: waypoints.value,
          userID: userID.value,
          username: username.value || userProfile.value?.username || 'Unknown User',
          color: currentColor.value,
          distance: totalDistance.value,
          region: region.value,
          image: image.value
        })

        if (response.data.id) {
          setAlert('success', 'Your post has been saved successfully.')
          
          // Show success modal
          const createModal = new window.bootstrap.Modal(document.getElementById('createPostSuccess'))
          createModal.show()

          clearMap(false)
          postTitle.value = ''
          postDescription.value = ''
          formValidated.value = false
        } else {
          setAlert('error', 'Failed to create the post. Please try again.')
        }
      } catch (error) {
        console.error('Error creating post:', error)
        setAlert('error', 'An error occurred while creating the post.')
      } finally {
        submitting.value = false
      }
    }
    
    // Clear post
    const clearPost = () => {
      postTitle.value = ''
      postDescription.value = ''
      clearMap()
      setAlert('success', 'Post cleared successfully.')
    }
    
    // Capture map as image and upload to Firebase Storage
    const captureMapAsImage = async (postId) => {
      let originalControls
      
      try {
        // Hide markers temporarily for a clean capture
        markers.value.forEach(marker => marker.setVisible(false))
        
        const mapContainer = document.getElementById("map")
        
        // Save original dimensions
        const originalHeight = mapContainer.style.height
        const originalWidth = mapContainer.style.width
        
        // Set dimensions to optimize for homepage display (300px height with object-fit: cover)
        // Use a fixed 600x300 size for consistent, crisp images on homepage
        const targetWidth = 686
        const targetHeight = 506
        
        // Set the map to fixed dimensions for consistent homepage display
        mapContainer.style.width = `${targetWidth}px`
        mapContainer.style.height = `${targetHeight}px`
        
        // Define bounds based on waypoints
        const bounds = new google.maps.LatLngBounds()
        waypoints.value.forEach(point => bounds.extend(new google.maps.LatLng(point.location.lat, point.location.lng)))
        
        // Apply bounds with extra padding
        map.value.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 })
        
        // Temporarily disable controls and store original settings
        originalControls = {
          zoomControl: map.value.get('zoomControl'),
          fullscreenControl: map.value.get('fullscreenControl'),
          streetViewControl: map.value.get('streetViewControl'),
          mapTypeControl: map.value.get('mapTypeControl')
        }
        map.value.setOptions({
          zoomControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false
        })
        
        // Allow the map to adjust before capture
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Adjust zoom level if necessary
        const currentZoom = map.value.getZoom()
        map.value.setZoom(currentZoom - 1)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Capture the map view as an image with html2canvas
        const canvas = await html2canvas(mapContainer, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff"
        })
        
        const imageData = canvas.toDataURL("image/png")
        
        // Upload the captured image to Firebase
        const imageRef = storageRef(storage.value, `maps_created/${postId}.png`)
        await uploadString(imageRef, imageData, 'data_url')
        image.value = await getDownloadURL(imageRef)
        
        // Reset the map container to its original dimensions
        mapContainer.style.height = originalHeight
        mapContainer.style.width = originalWidth
        
      } catch (error) {
        console.error("Error capturing map as image:", error)
      } finally {
        // Restore original controls
        if (originalControls) {
          map.value.setOptions(originalControls)
        }
        
        // Show markers again after capture
        markers.value.forEach(marker => marker.setVisible(true))
      }
    }
    
    // Fit map to bounds
    const fitMapToBounds = () => {
      const bounds = new google.maps.LatLngBounds()
      waypoints.value.forEach(point => {
        bounds.extend(new google.maps.LatLng(point.location.lat, point.location.lng))
      })
      
      // Apply padding and fit map to bounds
      map.value.fitBounds(bounds, 250)
      map.value.panToBounds(bounds)
    }
    
    // Get town name from coordinates
    const getTownName = async (lat, lng) => {
      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
          params: {
            latlng: `${lat},${lng}`,
            key: mapsApiKey.value,
          }
        })

        if (response.data.results && response.data.results.length > 0) {
          const addressComponents = response.data.results[0].address_components
          const town = addressComponents.find(component => 
            component.types.includes("locality") || component.types.includes("sublocality")
          )
          return town ? town.long_name : "Unknown Town"
        } else {
          console.warn('No results found for the given coordinates.')
          return "Unknown Town"
        }
      } catch (error) {
        console.error('Error fetching town name:', error)
        return "Error Fetching Town"
      }
    }
    
    // Navigation
    const retBack = () => {
      // Dismiss any open modals before navigation
      const modals = document.querySelectorAll('.modal.show')
      modals.forEach(modal => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal)
        if (bootstrapModal) {
          bootstrapModal.hide()
        }
      })
      
      // Remove modal backdrop if it exists
      const backdrop = document.querySelector('.modal-backdrop')
      if (backdrop) {
        backdrop.remove()
      }
      
      // Remove modal-open class from body
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('padding-right')
      
      // Navigate after a small delay to ensure modal cleanup
      setTimeout(() => {
        router.push('/homepage')
      }, 100)
    }
    
    // Marker bounce effects
    const startMarkerBounce = (index) => {
      if (submitting.value) return
      
      const marker = markers.value[index]
      if (marker && !marker.bounceInterval) {
        bounceMarker(marker)
      }
    }
    
    const stopMarkerBounce = (index) => {
      const marker = markers.value[index]
      if (marker && marker.bounceInterval) {
        clearInterval(marker.bounceInterval)
        marker.bounceInterval = null
        marker.setPosition(marker.originalPosition)
      }
    }
    
    const bounceMarker = (marker) => {
      const bounceHeight = 0.00015
      const bounceSpeed = 300
      let direction = 1

      marker.originalPosition = marker.getPosition()

      marker.bounceInterval = setInterval(() => {
        const position = marker.getPosition()
        const newLat = position.lat() + (bounceHeight * direction)
        direction *= -1

        marker.setPosition(new google.maps.LatLng(newLat, position.lng()))
      }, bounceSpeed)
    }
    
    // Fetch existing map data for editing
    const fetchMapData = async () => {
      if (!postId.value) return
      
      try {
        const response = await axios.get(`${POST_SERVICE_URL.value}/posts?id=${postId.value}`)
        
        if (!response.data || Object.keys(response.data).length === 0) {
          throw new Error("Post not found or already deleted.")
        }
        
        // Load map data into form fields
        postTitle.value = response.data.title
        postDescription.value = response.data.description
        postIdUserID.value = response.data.userID
        currentColor.value = response.data.color || '#e81416'
        
        // Check if the current user owns the map
        if (postIdUserID.value === userID.value) {
          // User is the owner, allow editing
          isEditing.value = true
        } else {
          // User is not the owner, set as new map
          const originalPostId = postId.value
          postId.value = null // Clears postId for new save
          isEditing.value = false // Switch to "create" mode
          setAlert('error', `You are viewing a copy of this map (ID: ${originalPostId}). Changes will save as a new post.`)
        }
        
        // Store original waypoints for undo functionality
        originalWaypoints.value = JSON.parse(JSON.stringify(response.data.waypoints || []))
        
        // Load waypoints as viewable/editable data
        if (response.data.waypoints && response.data.waypoints.length > 0) {
          for (const [index, waypoint] of response.data.waypoints.entries()) {
            const latLng = new google.maps.LatLng(waypoint.location.lat, waypoint.location.lng)
            await addWaypoint(latLng, index)
          }
          
          fitMapToBounds()
        }
      } catch (error) {
        console.error("Error fetching map data:", error)
        setAlert('error', 'This post has been deleted or does not exist.')
        isEditing.value = false
      }
    }
    
    // Modal functions
    const resetDeleteModal = () => {
      deleteCountdown.value = 0
      deleteModalTitle.value = "Delete post?"
      if (deleteTimeout.value) {
        clearTimeout(deleteTimeout.value)
        deleteTimeout.value = null
      }
    }
    
    const deletePost = async () => {
      if (!postId.value || postIdUserID.value !== userID.value) {
        setAlert('error', 'You are not authorized to delete this post.')
        return
      }
      
      try {
        const response = await axios.delete(`${POST_SERVICE_URL.value}/posts?id=${postId.value}`)
        
        if (response.status === 200) {
          deleteModalTitle.value = "Post deleted!"
          deleteCountdown.value = 3
          
          deleteTimeout.value = setInterval(() => {
            deleteCountdown.value--
            if (deleteCountdown.value === 0) {
              clearInterval(deleteTimeout.value)
              router.push('/homepage')
            }
          }, 1000)
        }
      } catch (error) {
        console.error('Error deleting post:', error)
        setAlert('error', 'Failed to delete the post. Please try again.')
        const modal = window.bootstrap.Modal.getInstance(document.getElementById('deletePost'))
        modal.hide()
      }
    }
    
    const undoDelete = () => {
      resetDeleteModal()
    }
    
    const undoChanges = async () => {
      if (!isEditing.value || originalWaypoints.value.length === 0) return
      
      // Clear current waypoints and markers
      clearMap(false)
      
      // Restore original waypoints
      for (const [index, waypoint] of originalWaypoints.value.entries()) {
        const latLng = new google.maps.LatLng(waypoint.location.lat, waypoint.location.lng)
        await addWaypoint(latLng, index)
      }
      
      fitMapToBounds()
      setAlert('success', 'Original route restored.')
    }
    
    const editPost = async () => {
      if (postIdUserID.value !== userID.value) {
        setAlert('error', 'You are not authorized to edit this post.')
        return
      }
      
      formValidated.value = true
      
      if (waypoints.value.length < 2) {
        setAlert('error', 'You need at least two points to submit the route!')
        return
      }
      
      if (!postTitle.value || !postDescription.value) {
        setAlert('error', 'Please fill out all required fields.')
        return
      }
      
      try {
        submitting.value = true
        
        // Get town name for first waypoint
        const firstWaypoint = waypoints.value[0].location
        region.value = await getTownName(firstWaypoint.lat, firstWaypoint.lng)
        
        // Capture map as image and upload to Firebase Storage
        await captureMapAsImage(postId.value)
        
        const response = await axios.put(`${POST_SERVICE_URL.value}/posts?id=${postId.value}`, {
          title: postTitle.value,
          description: postDescription.value,
          waypoints: waypoints.value,
          color: currentColor.value,
          distance: totalDistance.value,
          region: region.value,
          image: image.value
        })
        
        if (response.status === 200) {
          setAlert('success', 'Your post has been successfully updated.')
          
          const modal = new window.bootstrap.Modal(document.getElementById('editPost'))
          modal.show()
        }
      } catch (error) {
        console.error('Error updating post:', error)
        setAlert('error', 'Failed to update the post. Please try again.')
      } finally {
        submitting.value = false
      }
    }
    
    const startTour = () => {
      if (isEditing.value) {
        startEditTour()
      } else {
        startCreationTour()
      }
    }
    
    const startCreationTour = () => {
      const driverObj = driver({
        showProgress: true,
        steps: [
          {
            element: '#map',
            popover: {
              title: 'Map Interaction',
              description: 'Use scroll to zoom in and out of the map.',
              position: 'top',
            },
          },
          {
            element: '#pac-input',
            popover: {
              title: 'Search Location',
              description: 'Enter a location in the search bar, then press Enter or click a suggestion.',
              position: 'bottom',
            },
          },
          {
            element: '#map',
            popover: {
              title: 'Plot a Waypoint',
              description: 'Click on the map to plot a waypoint. Each click adds a new point.',
              position: 'top',
            },
            onNext: () => {
              if (map.value) {
                const mapCenter = map.value.getCenter()
                addWaypoint(mapCenter)
              }
            },
          },
          {
            element: '#colorPalette',
            popover: {
              title: 'Change Route Color',
              description: 'Click on a color to change the route color.',
              position: 'top',
            },
          },
          {
            element: '.btn.btn-danger.m-1',
            popover: {
              title: 'Clear Route',
              description: 'Click here to clear all waypoints instantly.',
              position: 'left',
            },
          },
          {
            element: '#export-button',
            popover: {
              title: 'Export Route',
              description: 'Click here to export your route to Google Maps.',
              position: 'left',
            },
          },
          {
            element: 'form',
            popover: {
              title: 'Add Post Details',
              description: 'Provide a title and description for your route. These fields are required.',
              position: 'top',
            },
          },
          {
            element: '.btn.btn-primary.w-100',
            popover: {
              title: 'Create Post',
              description: 'Click here to create a post for your route.',
              position: 'top',
            },
          },
        ],
      })
      driverObj.drive()
    }
    
    const startEditTour = () => {
      const driverObj = driver({
        showProgress: true,
        steps: [
          {
            element: '#map',
            popover: {
              title: 'Map Interaction',
              description: 'Use scroll to zoom in and out of the map.',
              position: 'top',
            },
          },
          {
            element: '#pac-input',
            popover: {
              title: 'Search Location',
              description: 'Enter a location in the search bar, then press Enter or click a suggestion.',
              position: 'bottom',
            },
          },
          {
            element: '#map',
            popover: {
              title: 'Plot a Waypoint',
              description: 'Click on the map to plot a waypoint. Each click adds a new point.',
              position: 'top',
            },
            onNext: () => {
              if (map.value) {
                const mapCenter = map.value.getCenter()
                addWaypoint(mapCenter)
              }
            },
          },
          {
            element: '#colorPalette',
            popover: {
              title: 'Change Route Color',
              description: 'Click on a color to change the route color.',
              position: 'top',
            },
          },
          {
            element: '.btn.btn-danger.m-1',
            popover: {
              title: 'Clear Route',
              description: 'Click here to clear all waypoints instantly.',
              position: 'left',
            },
          },
          {
            element: '.btn.btn-secondary.m-1',
            popover: {
              title: 'Undo Changes',
              description: 'Click here to restore original waypoints.',
              position: 'left',
            },
          },
          {
            element: '#export-button',
            popover: {
              title: 'Export Route',
              description: 'Click here to export your route to Google Maps.',
              position: 'left',
            },
          },
          {
            element: 'form',
            popover: {
              title: 'Add Post Details',
              description: 'Provide a title and description for your route. These fields are required.',
              position: 'top',
            },
          },
          {
            element: '.btn.btn-danger.w-100',
            popover: {
              title: 'Delete Post',
              description: 'Click here to delete this post if needed.',
              position: 'left',
            },
          },
          {
            element: '.btn.btn-secondary.w-100',
            popover: {
              title: 'Return Home',
              description: 'Click here to return home.',
              position: 'left',
            },
          },
          {
            element: '.btn.btn-primary.w-100',
            popover: {
              title: 'Update Post',
              description: 'Click here to update a post for your route.',
              position: 'top',
            },
          },
        ],
      })
      driverObj.drive()
    }
    
    // Make initMap globally available for Google Maps callback
    window.initMap = initMap
    
    onMounted(async () => {
      // Initialize Firebase Storage
      storage.value = getStorage()
      
      // Check authentication state
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          userID.value = user.uid
          username.value = user.email || ''
          
          // Update userProfile if available
          if (userProfile.value) {
            username.value = userProfile.value.username || user.email || ''
          }
          
          // Check if editing existing post
          postId.value = route.query.id || null
          isEditing.value = !!postId.value
          
          // Load Google Maps
          await loadGoogleMapsScript()
          
          // If editing, fetch the map data after maps is loaded
          if (isEditing.value && postId.value) {
            // Wait for initMap to be called by Google Maps callback
            setTimeout(async () => {
              await fetchMapData()
            }, 1000)
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/login')
        }
      })
    })
    
    return {
      // Data
      userProfile,
      waypoints,
      currentColor,
      totalDistance,
      colors,
      showAlert,
      hidden,
      alertType,
      alertMessage,
      postTitle,
      postDescription,
      maxDescriptionLength,
      submitting,
      formValidated,
      deleteCountdown,
      deleteModalTitle,
      isEditing,
      
      // Computed
      descriptionLength,
      isSubmitDisabled,
      
      // Methods
      changeColor,
      clearMap,
      clearPost,
      validateAndSubmit,
      exportToGoogleMaps,
      startTour,
      retBack,
      resetDeleteModal,
      deletePost,
      undoDelete,
      undoChanges,
      editPost,
      dismissAlert,
      removeWaypoint,
      startMarkerBounce,
      stopMarkerBounce,
      fetchMapData
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/add-maps.css';
</style>