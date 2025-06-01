<template>
  <section class="stepper-section">
    <div class="container fade-in bg-light">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <h2 class="text-center mt-5 mb-4">How MapPalette Works</h2>
          <div class="stepper-wrapper">
            <div class="stepper-item">
              <div class="step-counter">1</div>
              <div class="step-content">
                <div class="step-title">Create Your Account</div>
                <div class="step-description">
                  Sign up for MapPalette in just a few clicks. Join our community of creative runners!
                </div>
                <div class="step-details">
                  Simply provide your email and create a password. No credit card required. Start exploring our features immediately after verification.
                </div>
              </div>
            </div>

            <div class="stepper-item">
              <div class="step-counter">2</div>
              <div class="step-content">
                <div class="step-title">Explore Our Community-Made Routes</div>
                <div class="step-description">
                  Discover routes crafted by fellow runners and find inspiration for your next run.
                </div>
                <div class="step-details">
                  Browse through creative routes shared by the community and see what others have drawn.
                </div>
              </div>
            </div>
            
            <div class="stepper-item">
              <div class="step-counter">3</div>
              <div class="step-content">
                <div class="step-title">Make Your Own Routes!</div>
                <div class="step-description">
                  Use our intuitive tools to design your own running route in unique shapes and patterns.
                </div>
                <div class="step-details">
                  Click on the map to create points, and our smart algorithm will help you trace roads and paths easily.
                </div>
              </div>
            </div>
            
            <div class="stepper-item">
              <div class="step-counter">4</div>
              <div class="step-content">
                <div class="step-title">Connect with Like-Minded Runners</div>
                <div class="step-description">
                  Share your routes, discover new ones, and connect with runners who share your interests.
                </div>
                <div class="step-details">
                  Challenge each other on the leaderboard, share tips, and get inspired by the community's creative routes.
                </div>
              </div>
            </div>                            
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'HowItWorks'
}
</script>

<style scoped>
.stepper-section {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  background-color: #f8f9fa;
  padding-left: 3rem 0;
  padding-right: 3rem 0;
}

.stepper-wrapper {
  padding: 40px 0;
  max-width: 800px;
  margin: 0 auto;
}

.stepper-item {
  position: relative;
  display: flex;
  gap: 2rem;
  padding-bottom: 2rem;
  transition: background-color 0.3s ease;
  border-radius: 8px;
}

.step-content {
  margin-top: 3px;
  max-width: 600px;
}

.step-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
  display: inline-block;
  max-width: 100%;
}

.stepper-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 32px;
  height: calc(100% - 32px);
  width: 2px;
  background: #e0e0e0;
  z-index: -1;
}

.step-counter {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53, #FFD54F);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.step-description {
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.stepper-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.stepper-item:hover .step-counter {
  background: linear-gradient(135deg, #FFD54F, #FF8E53, #FF6B6B);
  transform: scale(1.2);
  transition: all 0.2s ease;
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
