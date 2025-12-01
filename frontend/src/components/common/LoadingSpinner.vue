<template>
  <div class="loading-spinner-container" :class="containerClass">
    <div class="spinner-border" :class="`text-${color}`" :style="spinnerStyle" role="status">
      <span class="visually-hidden">{{ text }}</span>
    </div>
    <p v-if="showText" class="loading-text mt-2" :class="`text-${color}`">{{ text }}</p>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'LoadingSpinner',
  props: {
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    color: {
      type: String,
      default: 'primary'
    },
    text: {
      type: String,
      default: 'Loading...'
    },
    showText: {
      type: Boolean,
      default: false
    },
    fullScreen: {
      type: Boolean,
      default: false
    },
    containerClass: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const spinnerStyle = computed(() => {
      const sizes = {
        sm: '1rem',
        md: '2rem',
        lg: '3rem'
      }
      return {
        width: sizes[props.size],
        height: sizes[props.size]
      }
    })

    return {
      spinnerStyle
    }
  }
}
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.loading-spinner-container.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9998;
}

.loading-text {
  font-size: 0.9rem;
  margin: 0;
}
</style>
