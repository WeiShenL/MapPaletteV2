<template>
  <section class="about-us">
    <div class="container">
      <h2 class="text-center mb-2 fade-in">Meet The Team!</h2>
      <p class="text-center mt-3 mb-4 about-us-description h5 fade-in">MapPalette is developed by RunGoWhere Pte Ltd, a passionate team of IS students from SMU. <br> Meet the brilliant minds behind our application!</p>

      <div class="row justify-content-center">
        <div class="col-sm-5 fade-in">
          <div id="teamCarousel" class="team-carousel carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
            <div class="carousel-inner">
              <div class="team-carousel-item carousel-item active">
                <img :src="bentanImg" alt="Ben Tan Kiat" class="d-block w-100 person-image">
                <h3 class="person-name">Ben Tan Kiat</h3>
                <p class="person-description">Resident Landing Page/Leaderboard Artist</p>
              </div>
              <div class="team-carousel-item carousel-item">
                <img :src="bendanImg" alt="Benjamin Daniel Loh Wayne" class="d-block w-100 person-image">
                <h3 class="person-name">Benjamin Daniel Loh Wayne</h3>
                <p class="person-description"><b>The</b> Firebase/Backend Guy</p>
              </div>
              <div class="team-carousel-item carousel-item">
                <img :src="alvinImg" alt="Koh En Wei, Alvin" class="d-block w-100 person-image">
                <h3 class="person-name">Koh En Wei, Alvin</h3>
                <p class="person-description">Our Local Modal and Cards Specialist</p>
              </div>
              <div class="team-carousel-item carousel-item">
                <img :src="weishenImg" alt="Lo Wei Shen" class="d-block w-100 person-image">
                <h3 class="person-name">Lo Wei Shen</h3>
                <p class="person-description">Homepage and Accounts Manager (Account...ant?)</p>
              </div>
              <div class="team-carousel-item carousel-item">
                <img :src="zhongyanImg" alt="Tan Zhong Yan" class="d-block w-100 person-image">
                <h3 class="person-name">Tan Zhong Yan</h3>
                <p class="person-description">Ingenious Routes Drawer/Google Maps API Expert</p>
              </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#teamCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#teamCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon" aria-hidden="true"></span>
              <span class="visually-hidden">Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
const bentanImg = '/resources/images/index/about_us/bentan.jpg'
const bendanImg = '/resources/images/index/about_us/bendan.jpeg'
const alvinImg = '/resources/images/index/about_us/alvin.jpeg'
const weishenImg = '/resources/images/index/about_us/weishen.png'
const zhongyanImg = '/resources/images/index/about_us/zhongyan.png'

export default {
  name: 'AboutUs',
  setup() {
    return {
      bentanImg,
      bendanImg,
      alvinImg,
      weishenImg,
      zhongyanImg
    }
  }
}
</script>

<style scoped>
.about-us {
  padding: 3rem 0;
}

.about-us-description {
  font-style: italic;
  font-weight: lighter;
}

.about-us .carousel-item {
  min-width: 100%;
  text-align: center;
  opacity: 1;
  visibility: visible;
} 

.person-image {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.person-name {
  font-size: 1.5em;
  margin: 10px 0;
}

.person-description {
  font-size: 1em;
  color: #666;
  font-style: italic;
}

.about-us .carousel-control-prev, .about-us .carousel-control-next {
  top: 40%;
  transform: translateY(-50%);
  z-index: 2;
}

.about-us .prev, .about-us .next {
  cursor: pointer;
  position: absolute;
  font-size: 2em;
  color: #333;
  background-color: transparent;
  border: none;
  padding: 0 10px;
}

.about-us .prev {
  left: 10px;
}

.about-us .next {
  right: 10px;
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
