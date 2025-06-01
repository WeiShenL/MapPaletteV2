<template>
  <div class="scroll-indicator" :class="{ 'hidden': isHidden }">
    <div class="scroll-arrow">
      <i class="fas fa-chevron-down"></i>
    </div>
    <span class="scroll-text">Scroll</span>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ScrollIndicator',
  setup() {
    const isHidden = ref(false)
    let isScrolling = null

    const handleScroll = () => {
      // Show/hide based on scroll position
      if (window.scrollY > 100) {
        isHidden.value = true
      } else {
        isHidden.value = false
      }
      
      // Clear the timeout throughout the scroll
      window.clearTimeout(isScrolling)
      
      // Set a timeout to run after scrolling ends
      isScrolling = setTimeout(() => {
        // If we're at the top, show the indicator again
        if (window.scrollY <= 100) {
          isHidden.value = false
        }
      }, 66)
    }

    onMounted(() => {
      window.addEventListener('scroll', handleScroll, false)
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      isHidden
    }
  }
}
</script>

<style scoped>
.scroll-indicator {
  position: fixed;
  bottom: 5vh;
  left: 10vh;
  z-index: 100;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.3s ease, visibility 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.scroll-indicator.hidden {
  opacity: 0;
  visibility: hidden;
}

.scroll-arrow {
  width: 30px;
  height: 30px;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  animation: fadeInOut 2s ease-in-out infinite;
}

.scroll-arrow i {
  color: white;
  font-size: 16px;
  animation: bounce 2s infinite;
}

.scroll-text {
  color: white;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(5px);
  }
  60% {
    transform: translateY(3px);
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}
</style>
