<template>
  <div id="app">
    <NavBar />
    <div id="app-container">
      <ScrollIndicator />
      <!-- Hero Section -->
      <HeroCarousel />

      <!-- Key Features -->
      <KeyFeatures />

      <!-- Reviews Section -->
      <ReviewsGallery />

      <!-- Stepper Section -->
      <HowItWorks />

      <!-- About Us Section -->
      <AboutUs />
    </div>

    <BackToTop />
    <SiteFooter />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/layout/NavBar.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
import ScrollIndicator from '@/components/home/ScrollIndicator.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import KeyFeatures from '@/components/home/KeyFeatures.vue'
import ReviewsGallery from '@/components/home/ReviewsGallery.vue'
import HowItWorks from '@/components/home/HowItWorks.vue'
import AboutUs from '@/components/home/AboutUs.vue'
import BackToTop from '@/components/common/BackToTop.vue'

export default {
  name: 'IndexView',
  components: {
    NavBar,
    SiteFooter,
    ScrollIndicator,
    HeroCarousel,
    KeyFeatures,
    ReviewsGallery,
    HowItWorks,
    AboutUs,
    BackToTop
  }
}
</script>

<style>
@import '@/assets/styles/index.css';
@import '@/assets/styles/index-responsive.css';


</style>