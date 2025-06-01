<template>
  <div class="loading-quotes-container" v-if="visible">
    <div class="loading-quotes-content">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
      </div>
      <div class="quote-wrapper">
        <transition name="fade" mode="out-in">
          <p class="quote-text" :key="currentQuoteIndex">
            {{ currentQuote }}
          </p>
        </transition>
      </div>
      <div class="loading-text">Loading...</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingQuotes',
  props: {
    visible: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      quotes: [
        "Every mile begins with a single step.",
        "Run the mile you're in.",
        "The miracle isn't that I finished. The miracle is that I had the courage to start.",
        "Running is the greatest metaphor for life, because you get out of it what you put into it.",
        "Ask yourself: 'Can I give more?' The answer is usually: 'Yes.'",
        "The obsession with running is really an obsession with the potential for more and more life.",
        "We run, not because we think it is doing us good, but because we enjoy it and cannot help ourselves.",
        "Running is about finding your inner peace, and so is a life well lived.",
        "The body achieves what the mind believes.",
        "Run when you can, walk if you have to, crawl if you must; just never give up.",
        "Running allows me to set my mind free. Nothing else does that for me.",
        "There is something magical about running; after a certain distance, it transcends the body.",
        "Running is a road to self-awareness and reliance—you can push yourself to extremes.",
        "The reason we race isn't so much to beat each other, but to be with each other.",
        "Running is the answer. Who cares what the question is.",
        "Life is complicated. Running is simple.",
        "The best runs sometimes come on days when you didn't feel like running.",
        "Your body will argue that there is no justifiable reason to continue. Your only recourse is to call on your spirit.",
        "Running is nothing more than a series of arguments between the part of your brain that wants to stop and the part that wants to keep going.",
        "Pain is inevitable. Suffering is optional."
      ],
      currentQuoteIndex: 0,
      quoteInterval: null
    };
  },
  computed: {
    currentQuote() {
      return this.quotes[this.currentQuoteIndex];
    }
  },
  mounted() {
    this.startQuoteRotation();
  },
  beforeUnmount() {
    this.stopQuoteRotation();
  },
  methods: {
    startQuoteRotation() {
      // Show first quote immediately
      this.currentQuoteIndex = Math.floor(Math.random() * this.quotes.length);
      
      // Rotate quotes every 3 seconds
      this.quoteInterval = setInterval(() => {
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
      }, 3000);
    },
    stopQuoteRotation() {
      if (this.quoteInterval) {
        clearInterval(this.quoteInterval);
        this.quoteInterval = null;
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.startQuoteRotation();
      } else {
        this.stopQuoteRotation();
      }
    }
  }
};
</script>

<style scoped>
.loading-quotes-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.loading-quotes-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
}

.loading-spinner {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.spinner-circle {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #FF6B6B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.quote-wrapper {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.quote-text {
  font-size: 1.25rem;
  line-height: 1.6;
  color: #333;
  font-style: italic;
  margin: 0;
  padding: 0 1rem;
}

.loading-text {
  font-size: 1.1rem;
  color: #666;
  letter-spacing: 1px;
}

/* Quote transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .loading-quotes-content {
    padding: 1.5rem;
  }
  
  .quote-text {
    font-size: 1.1rem;
  }
  
  .spinner-circle {
    width: 50px;
    height: 50px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-quotes-container {
    background-color: rgba(0, 0, 0, 0.95);
  }
  
  .quote-text {
    color: #e0e0e0;
  }
  
  .loading-text {
    color: #999;
  }
  
  .spinner-circle {
    border-color: #333;
    border-top-color: #FF8E53;
  }
}

/* Animation for the container appearance */
.loading-quotes-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* subtle pulsing effect to the loading text */
.loading-text {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>