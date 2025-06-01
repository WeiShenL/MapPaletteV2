<template>
  <section class="key-features-section">
    <div class="key-features-content">
      <div class="mb-5 fade-in" style="text-align:center">
        <h2>Why Choose MapPalette?</h2>
      </div>
      <div class="row mt-4">
        <div class="col-sm-4">
          <img class="features-image" :src="mapsIcon" alt="">
          <h4>Creative Route Drawing</h4>
          <p>Design and follow fun, custom running routes on the map.</p>
        </div>
        <div class="col-sm-4">
          <img class="features-image" :src="shareIcon" alt="">
          <h4>Share Your Routes</h4>
          <p>Easily share your routes with friends or on social media.</p>
        </div>
        <div class="col-sm-4">
          <img class="features-image" :src="integrationIcon" alt="">
          <h4>Seamless Integration</h4>
          <p>Connect with Google Maps to track your runs real-time.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted } from 'vue'
const mapsIcon = '/resources/images/index/features/maps.png'
const shareIcon = '/resources/images/index/features/share.png'
const integrationIcon = '/resources/images/index/features/integration.png'

export default {
  name: 'KeyFeatures',
  setup() {
    onMounted(() => {
      // Fade-in scroll effect
      document.addEventListener('scroll', function () {
        const elements = document.querySelectorAll('.fade-in')
        const windowHeight = window.innerHeight

        elements.forEach(el => {
          if (el) {
            const position = el.getBoundingClientRect().top
            if (position < windowHeight - 220) {
              el.classList.add('show')
            }
          }
        })
      })

      // Sequential rendering for features
      document.addEventListener('scroll', function () {
        const features = document.querySelectorAll('.col-sm-4')
        const windowHeight = window.innerHeight

        features.forEach((feature, index) => {
          if (feature) {
            const position = feature.getBoundingClientRect().top

            if (position < windowHeight - 270) {
              setTimeout(() => {
                feature.style.opacity = 1
                feature.style.transform = 'translateY(0)'
              }, index * 400)
            }
          }
        })
      })
    })

    return {
      mapsIcon,
      shareIcon,
      integrationIcon
    }
  }
}
</script>

<style scoped>
.key-features-section {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  background-color: #f8f9fa;
  padding: 3rem 0;
}

.key-features-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.col-sm-4 {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 1s ease-out, transform 0.4s ease-out;
} 

.col-sm-4:hover {
  background-color: #f1f1f1;
  transform: scale(1.05);
}

.key-features-content .col-sm-4 {
  text-align: center;
}

.features-image {
  width: 50px;
  height: 50px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.fade-in {
  opacity: 0;
  transform: translateY(90px);
  transition: opacity 0.8s ease-out, transform 0.5s ease-out;
}

.fade-in.show {
  opacity: 1;
  transform: translateY(0);
}
</style>
