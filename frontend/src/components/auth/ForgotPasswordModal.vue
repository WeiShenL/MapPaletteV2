<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" @click.self="$emit('close')">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Reset Password</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        
        <div class="modal-body">
          <!-- Password Reset Alert Container -->
          <div class="alert-container">
            <div class="alert alert-success" v-if="showSuccessAlert">
              Password reset email sent! Please check your inbox.
            </div>
            <div class="alert alert-danger" v-if="showErrorAlert">
              Failed to send password reset email. Please try again.
            </div>
          </div>
        
          <form @submit.prevent="handleReset">
            <div class="mb-3">
              <label for="reset-email" class="form-label">Enter your email to reset password:</label>
              <input type="email" class="form-control" v-model="resetEmail" placeholder="Enter your email" required>
            </div>
            <button type="submit" class="btn btn-primary" :disabled="isResetting">
              <span v-if="!isResetting">Send Reset Link</span>
              <span v-else class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

export default {
  name: 'ForgotPasswordModal',
  emits: ['close'],
  setup(props, { emit }) {
    const { resetPassword } = useAuth()
    const resetEmail = ref('')
    const showSuccessAlert = ref(false)
    const showErrorAlert = ref(false)
    const isResetting = ref(false)

    const handleReset = async () => {
      showSuccessAlert.value = false
      showErrorAlert.value = false
      isResetting.value = true

      const { success, error } = await resetPassword(resetEmail.value)

      isResetting.value = false

      if (success) {
        showSuccessAlert.value = true
        setTimeout(() => {
          emit('close')
        }, 3000)
      } else {
        showErrorAlert.value = true
        console.error('Password reset error:', error)
      }
    }

    return {
      resetEmail,
      showSuccessAlert,
      showErrorAlert,
      isResetting,
      handleReset
    }
  }
}
</script>

<style scoped>
.modal.show {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B6B, #FF8E53, #FFD54F);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #FFD54F, #FF8E53, #FF6B6B);
}
</style>
