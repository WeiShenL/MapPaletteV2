<template>
  <router-view />
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>

/* General app styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Ensure navbar is properly positioned */
.navbar {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1030;
  height: 67px;
}
</style>