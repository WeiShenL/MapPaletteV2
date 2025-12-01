<template>
  <Transition name="alert-fade">
    <div
      v-if="show"
      class="alert alert-dismissible fade show"
      :class="alertClass"
      role="alert"
    >
      <!-- Icon -->
      <svg
        v-if="type === 'error'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-exclamation-triangle-fill"
        viewBox="0 0 16 16"
      >
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
      </svg>

      <svg
        v-if="type === 'success'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-check-circle-fill"
        viewBox="0 0 16 16"
      >
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>

      <svg
        v-if="type === 'info'"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        class="bi bi-info-circle-fill"
        viewBox="0 0 16 16"
      >
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
      </svg>

      <!-- Message -->
      {{ message }}

      <!-- Close Button -->
      <button
        type="button"
        class="btn-close"
        @click="handleClose"
        aria-label="Close"
      ></button>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

export default {
  name: 'AlertNotification',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
    },
    message: {
      type: String,
      required: true
    },
    show: {
      type: Boolean,
      default: false
    },
    autoDismiss: {
      type: Boolean,
      default: true
    },
    dismissTimeout: {
      type: Number,
      default: 3000
    }
  },
  emits: ['close', 'update:show'],
  setup(props, { emit }) {
    const timeoutId = ref(null)

    const alertClass = computed(() => {
      const classes = {
        'success': 'alert-success',
        'error': 'alert-warning',
        'warning': 'alert-warning',
        'info': 'alert-info'
      }
      return classes[props.type] || 'alert-info'
    })

    const handleClose = () => {
      clearAutoDismiss()
      emit('update:show', false)
      emit('close')
    }

    const clearAutoDismiss = () => {
      if (timeoutId.value) {
        clearTimeout(timeoutId.value)
        timeoutId.value = null
      }
    }

    const setupAutoDismiss = () => {
      if (props.autoDismiss && props.show) {
        clearAutoDismiss()
        timeoutId.value = setTimeout(() => {
          handleClose()
        }, props.dismissTimeout)
      }
    }

    // Watch for changes to show prop
    watch(() => props.show, (newValue) => {
      if (newValue) {
        setupAutoDismiss()
      } else {
        clearAutoDismiss()
      }
    }, { immediate: true })

    // Cleanup on unmount
    onBeforeUnmount(() => {
      clearAutoDismiss()
    })

    return {
      alertClass,
      handleClose
    }
  }
}
</script>

<style scoped>
.alert {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.alert svg {
  margin-right: 8px;
  vertical-align: middle;
}

/* Transition animations */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.alert-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
