<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" @click.self="$emit('close')">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Privacy Policy</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
          <h2>Privacy Policy</h2>
          <p><strong>Last updated: 1 June 2025</strong><br><br>
          MapPalette is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and share your information when you use our app.<br><br>

          <strong>1. Information We Collect</strong><br>
          <strong>Personal Information:</strong> When creating an account, we may collect information such as your name, email address, and profile information.<br>
          <strong>Usage Information:</strong> We collect data on how you interact with the app, including location data for map creation, device information, and analytics.<br><br>

          <strong>2. How We Use Your Information</strong><br>
          <strong>To Provide Services:</strong> We use your information to provide features like map creation, sharing, and viewing.<br>
          <strong>To Improve Our Services:</strong> We analyze usage data to improve and personalize the app experience.<br>
          <strong>To Communicate:</strong> We may use your email to send notifications, updates, or promotional information (which you can opt out of).<br><br>

          <strong>3. How We Share Your Information</strong><br>
          <strong>With Third-Party Service Providers:</strong> We may share information with vendors that assist with app operation, analytics, and other services.<br>
          <strong>For Legal Reasons:</strong> We may disclose information to comply with legal obligations or to protect the rights and safety of our users.<br><br>

          <strong>4. Data Security</strong><br>
          We implement appropriate security measures to protect your information. However, no system is completely secure, and we cannot guarantee absolute security.<br><br>

          <strong>5. Your Rights</strong><br>
          <strong>Access:</strong> You can request a copy of your data.<br>
          <strong>Correction:</strong> You can update or correct your personal information.<br>
          <strong>Deletion:</strong> You can request to delete your account and personal data.<br><br>

          <strong>6. Children's Privacy</strong><br>
          MapPalette is not intended for users under the age of 13. We do not knowingly collect information from children under 13. If we learn that we have collected such information, we will take steps to delete it.<br><br>

          <strong>7. Changes to This Policy</strong><br>
          We may update this Privacy Policy periodically. We encourage you to review it regularly to stay informed about our practices.<br><br>
          </p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PrivacyModal',
  emits: ['close']
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
</style>
