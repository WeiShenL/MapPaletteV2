<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999;">
        <div class="toast show" role="alert" :class="`bg-${type}`">
          <div class="toast-header">
            <i class="bi me-2" :class="iconClass"></i>
            <strong class="me-auto">{{ title }}</strong>
            <button type="button" class="btn-close" @click="close" aria-label="Close"></button>
          </div>
          <div class="toast-body text-white">
            {{ message }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'GlobalErrorHandler',
  setup() {
    const visible = ref(false)
    const message = ref('')
    const type = ref('danger') // danger, warning, success, info
    const title = ref('Error')
    let hideTimeout = null

    const iconClass = computed(() => {
      switch (type.value) {
        case 'success':
          return 'bi-check-circle-fill text-success'
        case 'warning':
          return 'bi-exclamation-triangle-fill text-warning'
        case 'info':
          return 'bi-info-circle-fill text-info'
        default:
          return 'bi-x-circle-fill text-danger'
      }
    })

    const show = (msg, msgType = 'danger', duration = 5000) => {
      message.value = msg
      type.value = msgType
      title.value = msgType === 'success' ? 'Success' : msgType === 'warning' ? 'Warning' : msgType === 'info' ? 'Info' : 'Error'
      visible.value = true

      // Clear existing timeout
      if (hideTimeout) clearTimeout(hideTimeout)

      // Auto-hide after duration
      if (duration > 0) {
        hideTimeout = setTimeout(() => {
          close()
        }, duration)
      }
    }

    const close = () => {
      visible.value = false
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }
    }

    onMounted(() => {
      // Listen for global error events
      window.addEventListener('network-error', (event) => {
        show(event.detail.message, 'danger')
      })

      window.addEventListener('api-error', (event) => {
        show(event.detail.message, 'danger')
      })

      window.addEventListener('show-toast', (event) => {
        show(event.detail.message, event.detail.type || 'info', event.detail.duration || 5000)
      })
    })

    // Expose show method globally
    window.showToast = (msg, msgType = 'info', duration = 5000) => {
      show(msg, msgType, duration)
    }

    return {
      visible,
      message,
      type,
      title,
      iconClass,
      close
    }
  }
}
</script>

<style scoped>
.toast {
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
