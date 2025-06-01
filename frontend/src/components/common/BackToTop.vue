<template>
  <button @click="scrollToTop" class="btn back-to-top">
    <i class="fas fa-chevron-up"></i>
  </button>
</template>

<script>
export default {
  name: 'BackToTop',
  methods: {
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
}
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 5vh !important;
  right: 10vh !important;
  z-index: 1000;
  
  width: 50px;
  height: 50px;
  border-radius: 50% !important;
  
  padding: 0 !important;
  margin: 0 !important;
  
  display: flex;
  justify-content: center;
  align-items: center;
  
  background: linear-gradient(135deg, #FF6B6B, #FF8E53, #FFD54F);
  color: #fff;
  border: none;
  
  text-decoration: none;
  outline: none;
}

.back-to-top:hover {
  background: linear-gradient(135deg, #FFD54F, #FF8E53, #FF6B6B);
  color: #fff;
  transform: translateY(-2px);
}

.back-to-top i {
  font-size: 20px;
}

@media (max-width: 576px) {
  .back-to-top {
    width: 50px;
    height: 50px;
    bottom: 20vh;
    right: 5vh;
  }
}
</style>
