<template>
  <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" @click.self="$emit('close')">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Terms of Service</h5>
          <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
          <h2>Terms of Service</h2>
          <p><strong>Last updated: 1 June 2025</strong><br><br>
          Welcome to MapPalette! By using MapPalette, you agree to these Terms of Service. Please read them carefully before using the app.<br><br>

          <strong>1. Acceptance of Terms</strong><br>
          By accessing or using MapPalette, you confirm that you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use MapPalette.<br><br>

          <strong>2. Eligibility</strong><br>
          MapPalette is intended for users aged 13 and older. If you are under 18, please get permission from a parent or guardian.<br><br>

          <strong>3. User Accounts</strong><br>
          To use certain features, you may need to create an account. You are responsible for keeping your account information secure and for any activity that occurs under your account.<br><br>

          <strong>4. Content and Conduct</strong><br>
          <strong>User Content:</strong> MapPalette allows you to create and share map drawings. You retain ownership of any content you create. However, by uploading, you grant MapPalette a license to use, display, and share your content within the app.<br>
          <strong>Prohibited Conduct:</strong> Do not upload or share any offensive, harmful, or inappropriate content. Users are expected to interact respectfully and responsibly within the app.<br><br>

          <strong>5. Privacy</strong><br>
          By using MapPalette, you consent to our collection, use, and sharing of your information as described in our Privacy Policy.<br><br>

          <strong>6. Intellectual Property</strong><br>
          All MapPalette content, including but not limited to graphics, logos, and trademarks, is the property of MapPalette or its licensors. You may not use any part of MapPalette's content without permission.<br><br>

          <strong>7. Limitation of Liability</strong><br>
          MapPalette is provided "as is" and without any warranties. We do not guarantee that the app will be uninterrupted or error-free. MapPalette is not liable for any damages or losses resulting from your use of the app.<br><br>

          <strong>8. Changes to Terms</strong><br>
          We reserve the right to update these Terms at any time. We will notify users of significant changes. Continued use of MapPalette constitutes acceptance of the updated Terms.<br><br>

          <strong>9. Termination</strong><br>
          We reserve the right to suspend or terminate your account if you violate these Terms or engage in prohibited conduct.<br><br>

          <strong>10. Contact Us</strong><br>
          For questions about these Terms, please contact us at support@mappalette.com.<br><br>
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
  name: 'TermsModal',
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
