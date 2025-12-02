<template>
  <div id="heroMainCarousel" class="carousel slide hero-main-carousel" data-bs-ride="carousel" data-bs-interval="4000" data-bs-pause="false">
    <div class="hero-carousel-inner carousel-inner">
      <!-- Slide 0 - Spiral Unfold Design -->
      <div class="carousel-item hero-carousel-item slide-0 active" :style="{ backgroundImage: `url(${slide0})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Explore the World with MapPalette</h1>
          <p class="hero-subtitle">Creative routes for every adventure</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 1 - Diagonal Design -->
      <div class="carousel-item hero-carousel-item slide-1" :style="{ backgroundImage: `url(${slide1})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Create imaginative designs with our route mapping tool!</h1>
          <p class="hero-subtitle">Turn your running routes into works of art</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 2 - Bottom-Up Design -->
      <div class="carousel-item hero-carousel-item slide-2" :style="{ backgroundImage: `url(${slide2})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Why Choose Us?</h1>
          <p class="hero-subtitle">Experience running like never before — track, create, and share your unique routes</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 3 - Corner Design -->
      <div class="carousel-item hero-carousel-item slide-3" :style="{ backgroundImage: `url(${slide3})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Share your routes with friends!</h1>
          <p class="hero-subtitle">Connect with fellow runners and share your creative routes</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 4 - Cascade Design -->
      <div class="carousel-item hero-carousel-item slide-4" :style="{ backgroundImage: `url(${slide4})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Mission and Vision</h1>
          <p class="hero-subtitle">Making fitness fun and creative for everyone</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 5 - Zoom Design -->
      <div class="carousel-item hero-carousel-item slide-5" :style="{ backgroundImage: `url(${slide5})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">View the top weekly routes!</h1>
          <p class="hero-subtitle">Get inspired by the most popular routes of the week</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 6 - Spiral Design -->
      <div class="carousel-item hero-carousel-item slide-6" :style="{ backgroundImage: `url(${slide6})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Join Our Growing Community!</h1>
          <p class="hero-subtitle">Be part of a creative fitness revolution</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>

      <!-- Slide 7 - Split Design -->
      <div class="carousel-item hero-carousel-item slide-7" :style="{ backgroundImage: `url(${slide7})` }">
        <div class="hero-slide-content">
          <h1 class="hero-title">Compete with fellow runners!</h1>
          <p class="hero-subtitle">Rack up points and top the leaderboard</p>
          <div class="hero-btn-group">
            <router-link to="/signup" class="btn btn-primary mx-2">Get Started</router-link>
            <router-link to="/login" class="btn btn-outline-light mx-2">Login</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Carousel Controls -->
    <button class="hero-carousel-control-prev carousel-control-prev" type="button" data-bs-target="#heroMainCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="hero-carousel-control-next carousel-control-next" type="button" data-bs-target="#heroMainCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>

    <!-- Carousel Indicators -->
    <div class="hero-carousel-indicators carousel-indicators">
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 2"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="1" aria-label="Slide 7"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="2" aria-label="Slide 2"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="3" aria-label="Slide 1"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="4" aria-label="Slide 4"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="5" aria-label="Slide 3"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="6" aria-label="Slide 6"></button>
      <button type="button" data-bs-target="#heroMainCarousel" data-bs-slide-to="7" aria-label="Slide 5"></button>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue'

// carousel background images
const slide0 = '/resources/images/index/run-background0.jpeg'
const slide1 = '/resources/images/index/run-background1.jpeg'
const slide2 = '/resources/images/index/run-background2.jpg'
const slide3 = '/resources/images/index/run-background3.jpeg'
const slide4 = '/resources/images/index/run-background4.jpeg'
const slide5 = '/resources/images/index/run-background5.jpeg'
const slide6 = '/resources/images/index/run-background6.jpg'
const slide7 = '/resources/images/index/run-background7.jpeg'

export default {
  name: 'HeroCarousel',
  setup() {
    onMounted(() => {
      // Initialize Bootstrap carousel animations
      const firstSlide = document.querySelector('.slide-0')
      const carouselElement = document.getElementById('heroMainCarousel')
      
      const title = firstSlide.querySelector('.hero-title')
      const subtitle = firstSlide.querySelector('.hero-subtitle')
      const btnGroup = firstSlide.querySelector('.hero-btn-group')
      
      // Force a browser reflow
      firstSlide.offsetHeight
      
      // Add active class to first slide
      firstSlide.classList.add('active')
      
      // Add event listener for when slide animation ends
      carouselElement.addEventListener('slid.bs.carousel', function() {
        // Reset the carousel cycle if it stopped
        const bsCarousel = window.bootstrap.Carousel.getInstance(carouselElement)
        if (bsCarousel) {
          bsCarousel.cycle()
        }
      })

      // Small delay to ensure elements are hidden before animation starts
      setTimeout(() => {
        if (title) title.classList.add('animate')
        if (subtitle) subtitle.classList.add('animate')
        if (btnGroup) btnGroup.classList.add('animate')
      }, 100)

      // Add pause and resume on hover if desired
      carouselElement.addEventListener('mouseenter', function() {
        const bsCarousel = window.bootstrap.Carousel.getInstance(carouselElement)
        if (bsCarousel) {
          bsCarousel.pause()
        }
      })

      carouselElement.addEventListener('mouseleave', function() {
        const bsCarousel = window.bootstrap.Carousel.getInstance(carouselElement)
        if (bsCarousel) {
          bsCarousel.cycle()
        }
      })
    })

    return {
      slide0,
      slide1,
      slide2,
      slide3,
      slide4,
      slide5,
      slide6,
      slide7
    }
  }
}
</script>

<style scoped>
</style>
