import { ref } from 'vue'

/**
 * Composable for managing alert notifications
 * Provides a simple API for showing/hiding alerts
 *
 * @returns {Object} Alert state and methods
 */
export function useAlert() {
  const showAlert = ref(false)
  const alertType = ref('info')
  const alertMessage = ref('')

  /**
   * Show an alert notification
   * @param {string} type - Alert type: 'success', 'error', 'warning', 'info'
   * @param {string} message - Alert message to display
   */
  const setAlert = (type, message) => {
    alertType.value = type
    alertMessage.value = message
    showAlert.value = true
  }

  /**
   * Hide the alert notification
   */
  const dismissAlert = () => {
    showAlert.value = false
  }

  /**
   * Show success alert
   * @param {string} message - Success message
   */
  const showSuccess = (message) => {
    setAlert('success', message)
  }

  /**
   * Show error alert
   * @param {string} message - Error message
   */
  const showError = (message) => {
    setAlert('error', message)
  }

  /**
   * Show info alert
   * @param {string} message - Info message
   */
  const showInfo = (message) => {
    setAlert('info', message)
  }

  /**
   * Show warning alert
   * @param {string} message - Warning message
   */
  const showWarning = (message) => {
    setAlert('warning', message)
  }

  return {
    showAlert,
    alertType,
    alertMessage,
    setAlert,
    dismissAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning
  }
}
