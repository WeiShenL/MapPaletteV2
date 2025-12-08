<template>
  <Teleport to="body">
    <div class="modal fade confirm-modal" tabindex="-1" ref="modalRef" data-bs-backdrop="static">
      <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close"
            @click="handleCancel"
          ></button>
        </div>
        <div class="modal-body">
          <p class="mb-0">{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            :class="confirmButtonClass"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps({
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  variant: {
    type: String,
    default: 'danger',
    validator: (value) => ['primary', 'secondary', 'danger', 'warning', 'success'].includes(value)
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const modalRef = ref(null)
const modal = ref(null)
const isDisposed = ref(false)

const confirmButtonClass = computed(() => `btn-${props.variant}`)

const safeHideModal = () => {
  if (isDisposed.value || !modal.value) return

  try {
    // Remove backdrop manually if it exists to prevent orphaned elements
    const backdrop = document.querySelector('.modal-backdrop')
    if (backdrop) {
      backdrop.remove()
    }

    // Reset body styles that Bootstrap modal adds
    document.body.classList.remove('modal-open')
    document.body.style.removeProperty('overflow')
    document.body.style.removeProperty('padding-right')

    modal.value.hide()
  } catch (e) {
    console.warn('[ConfirmModal] Error hiding modal:', e.message)
  }
}

const safeDisposeModal = () => {
  if (isDisposed.value) return
  isDisposed.value = true

  try {
    if (modalRef.value) {
      modalRef.value.removeEventListener('hidden.bs.modal', handleClose)
    }
    if (modal.value) {
      modal.value.dispose()
      modal.value = null
    }
  } catch (e) {
    console.warn('[ConfirmModal] Error disposing modal:', e.message)
  }
}

const handleConfirm = () => {
  console.log('[ConfirmModal] handleConfirm called')

  // Remove the close listener so we don't trigger 'close' event
  if (modalRef.value) {
    console.log('[ConfirmModal] Removing hidden.bs.modal listener')
    modalRef.value.removeEventListener('hidden.bs.modal', handleClose)
  }

  // Add a one-time listener that will emit 'confirm' after the modal is fully hidden
  const onHidden = () => {
    console.log('[ConfirmModal] Modal fully hidden, emitting confirm')
    modalRef.value?.removeEventListener('hidden.bs.modal', onHidden)
    emit('confirm')
  }

  if (modalRef.value) {
    modalRef.value.addEventListener('hidden.bs.modal', onHidden)
  }

  console.log('[ConfirmModal] Hiding modal')
  // Use Bootstrap's hide method - it will trigger 'hidden.bs.modal' when animation completes
  if (modal.value) {
    try {
      modal.value.hide()
    } catch (e) {
      console.warn('[ConfirmModal] Error hiding modal:', e.message)
      // If hide fails, emit confirm anyway
      emit('confirm')
    }
  } else {
    // No modal instance, emit confirm directly
    emit('confirm')
  }
}

const handleCancel = () => {
  console.log('[ConfirmModal] handleCancel called')
  safeHideModal()
  setTimeout(() => {
    emit('cancel')
  }, 150)
}

const handleClose = () => {
  console.log('[ConfirmModal] handleClose called (hidden.bs.modal event)')
  emit('close')
}

onMounted(() => {
  console.log('[ConfirmModal] Mounted')
  modal.value = new Modal(modalRef.value)
  modal.value.show()

  modalRef.value.addEventListener('hidden.bs.modal', handleClose)
})

onUnmounted(() => {
  safeDisposeModal()
})
</script>

<style scoped>
.confirm-modal {
  z-index: 1060;
}

.modal-body p {
  font-size: 1rem;
  color: #495057;
}
</style>

<style>
/* Global style for confirm modal backdrop - needs to be higher than other modals */
.confirm-modal ~ .modal-backdrop {
  z-index: 1055;
}
</style>
