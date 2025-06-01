<template>
  <div class="gallery-section fade-in">
    <div class="gallery-header">
      <h1 class="h2 fw-heavy">Hear from our Users</h1>
      <h2 class="h5 fw-light fst-italic">Click on the images to find out more!</h2>
    </div>
    
    <div class="gallery-outer-container">
      <div id="galleryContainer" class="gallery-container scrollbar-hide"
           @mousedown="handleMouseDown"
           @mouseup="handleMouseUp"
           @mousemove="handleMouseMove"
           @mouseleave="handleMouseUp">
        <div v-for="(image, index) in images" :key="index"
             class="gallery-item-wrapper"
             :class="{ 'expanded': activeIndex === index }"
             @mouseenter="handleMouseEnter(index)"
             @mouseleave="handleMouseLeave">
          <div class="gallery-item-container"
               :class="{ 'expanded': activeIndex === index }"
               @click.stop="handleItemClick(index)">
            <img :src="image" :alt="`Gallery image ${index + 1}`" class="gallery-image">
            <div class="review-content">
              <h4>{{ reviewsData[getReviewerId(image)].name }}</h4>
              <p>{{ reviewsData[getReviewerId(image)].review }}</p>
            </div>
          </div>
        </div>
      </div>
      <div id="indicatorContainer" class="indicator-container">
        <div v-for="(_, index) in images" :key="index"
             class="indicator-dot"
             :class="(index === activeIndex || index === hoverIndex) ? 'active' : 'inactive'">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'

// Define review images
const ananyaImg = '/resources/images/index/reviews/ananya.jpg'
const bingbingImg = '/resources/images/index/reviews/bingbing.jpg'
const brandonImg = '/resources/images/index/reviews/brandon.jpg'
const cheinImg = '/resources/images/index/reviews/chein.jpg'
const supremeImg = '/resources/images/index/reviews/supreme.jpg'
const darrylImg = '/resources/images/index/reviews/darryl.jpg'
const emilyImg = '/resources/images/index/reviews/emily.jpg'
const justinImg = '/resources/images/index/reviews/justin.jpg'
const nickImg = '/resources/images/index/reviews/nick.jpg'
const ryanImg = '/resources/images/index/reviews/ryan.jpg'
const suzyImg = '/resources/images/index/reviews/suzy.jpg'
const zacImg = '/resources/images/index/reviews/zac.jpg'

export default {
  name: 'ReviewsGallery',
  setup() {
    const images = [
      ananyaImg,
      bingbingImg,
      brandonImg,
      cheinImg,
      supremeImg,
      darrylImg,
      emilyImg,
      justinImg,
      nickImg,
      ryanImg,
      suzyImg,
      zacImg
    ]

    const reviewsData = {
      'ananya': {
        name: 'Ananya',
        review: 'The creative routes make every run an adventure!'
      },
      'bingbing': {
        name: 'Bing Bing',
        review: 'Love how easy it is to share routes with my running group!'
      },
      'brandon': {
        name: 'Brandon',
        review: 'MapPalette has changed how I think about training!'
      },
      'chein': {
        name: 'Chein',
        review: 'The app helps me discover new paths and keeps my runs exciting!'
      },
      'supreme': {
        name: 'Supreme',
        review: 'I appreciate the customization options for planning my routes.'
      },
      'darryl': {
        name: 'Darryl',
        review: 'Makes it easy to track progress and stay motivated!'
      },
      'emily': {
        name: 'Emily',
        review: 'The social features make running with friends more fun!'
      },
      'justin': {
        name: 'Justin',
        review: 'The variety of routes keeps me excited to run!'
      },
      'nick': {
        name: 'Nick',
        review: 'Perfect for both new and experienced runners!'
      },
      'ryan': {
        name: 'Ryan',
        review: 'An essential tool for my daily training routine!'
      },
      'suzy': {
        name: 'Suzy',
        review: 'Exploring new areas feels like a fun treasure hunt!'
      },
      'zac': {
        name: 'Zac',
        review: 'Great features for connecting with other runners!'
      }
    }

    const activeIndex = ref(null)
    const hoverIndex = ref(null)
    const isDragging = ref(false)
    const startX = ref(0)
    const scrollLeft = ref(0)

    const getReviewerId = (imagePath) => {
      const parts = imagePath.split('/')
      const filename = parts[parts.length - 1]
      return filename.split('.')[0]
    }

    const handleMouseEnter = (index) => {
      if (!isDragging.value && activeIndex.value === null) {
        hoverIndex.value = index
        updateGalleryItems()
      }
    }

    const handleMouseLeave = () => {
      if (!isDragging.value && activeIndex.value === null) {
        hoverIndex.value = null
        updateGalleryItems()
      }
    }

    const handleItemClick = (index) => {
      if (!isDragging.value) {
        const galleryContainer = document.getElementById('galleryContainer')
        if (activeIndex.value === index) {
          activeIndex.value = null
          hoverIndex.value = null
          galleryContainer.classList.remove('item-active')
        } else {
          activeIndex.value = index
          hoverIndex.value = null
          galleryContainer.classList.add('item-active')
        }
        updateGalleryItems()
      }
    }

    const handleMouseDown = (e) => {
      // Don't allow dragging when an item is active
      if (activeIndex.value !== null) return
      
      const galleryContainer = document.getElementById('galleryContainer')
      isDragging.value = false
      startX.value = e.pageX - galleryContainer.offsetLeft
      scrollLeft.value = galleryContainer.scrollLeft
    }

    const handleMouseUp = () => {
      isDragging.value = false
      const galleryContainer = document.getElementById('galleryContainer')
      galleryContainer.classList.remove('dragging')
    }

    const handleMouseMove = (e) => {
      // Don't allow dragging when an item is active
      if (activeIndex.value !== null) return
      
      const galleryContainer = document.getElementById('galleryContainer')
      if (Math.abs(e.pageX - (startX.value + galleryContainer.offsetLeft)) > 5) {
        isDragging.value = true
        galleryContainer.classList.add('dragging')
      }
      if (!isDragging.value) return
      e.preventDefault()
      const x = e.pageX - galleryContainer.offsetLeft
      const walk = (x - startX.value) * 2
      galleryContainer.scrollLeft = scrollLeft.value - walk
    }

    const getItemScale = (index) => {
      if (activeIndex.value !== null) {
        const distance = Math.abs(index - activeIndex.value)
        switch (distance) {
          case 0: return 1
          case 1: return 0.9
          case 2: return 0.8
          case 3: return 0.7
          default: return 0.6
        }
      }
      if (hoverIndex.value !== null) {
        const distance = Math.abs(index - hoverIndex.value)
        switch (distance) {
          case 0: return 1
          case 1: return 0.9
          case 2: return 0.8
          case 3: return 0.7
          default: return 0.6
        }
      }
      return 0.6
    }

    const getVerticalOffset = (index) => {
      const scale = getItemScale(index)
      return (1 - scale) * 15
    }

    const calculateOverflow = (index) => {
      const galleryContainer = document.getElementById('galleryContainer')
      const containerWidth = galleryContainer.offsetWidth
      const itemWidth = 125
      const expandedWidth = 300
      const totalItems = images.length
      const itemPosition = index * itemWidth
      
      const currentScroll = galleryContainer.scrollLeft
      const visibleStart = currentScroll
      const visibleEnd = currentScroll + containerWidth
      
      const expandedItemStart = itemPosition
      const expandedItemEnd = itemPosition + expandedWidth
      
      let scrollAdjustment = 0
      
      if (expandedItemEnd > visibleEnd) {
        scrollAdjustment = expandedItemEnd - visibleEnd + 20
      }
      else if (expandedItemStart < visibleStart) {
        scrollAdjustment = expandedItemStart - visibleStart - 20
      }
      
      const maxScroll = (totalItems * itemWidth) - containerWidth + 
                       (expandedWidth - itemWidth)
      
      if (currentScroll + scrollAdjustment > maxScroll) {
        scrollAdjustment = maxScroll - currentScroll
      }
      
      return scrollAdjustment
    }

    const updateGalleryItems = () => {
      nextTick(() => {
        const items = document.querySelectorAll('.gallery-item-wrapper')
        const containers = document.querySelectorAll('.gallery-item-container')
        
        items.forEach((item, index) => {
          const container = containers[index]
          const scale = getItemScale(index)
          
          if (index === activeIndex.value) {
            item.style.opacity = 1
            
            const scrollAdjustment = calculateOverflow(index)
            if (scrollAdjustment !== 0) {
              const galleryContainer = document.getElementById('galleryContainer')
              if (galleryContainer) {
                galleryContainer.scrollBy({
                  left: scrollAdjustment,
                  behavior: 'smooth'
                })
              }
            }
          } else if (hoverIndex.value === index && activeIndex.value === null) {
            item.style.opacity = 1
          } else if (activeIndex.value !== null) {
            item.style.opacity = scale * 0.8 + 0.2
          } else {
            item.style.opacity = 0.3
          }
          
          container.style.height = `${scale * 70}%`
          container.style.transform = `translateY(${getVerticalOffset(index)}%)`
        })
      })
    }

    onMounted(() => {
      updateGalleryItems()
      
      // Handle click outside to close expanded items
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.gallery-item-container')) {
          activeIndex.value = null
          const galleryContainer = document.getElementById('galleryContainer')
          galleryContainer.classList.remove('item-active')
          updateGalleryItems()
        }
      })
    })

    return {
      images,
      reviewsData,
      activeIndex,
      hoverIndex,
      isDragging,
      getReviewerId,
      handleMouseEnter,
      handleMouseLeave,
      handleItemClick,
      handleMouseDown,
      handleMouseUp,
      handleMouseMove
    }
  }
}
</script>

<style scoped>
/* Gallery styles are in index.css */

/* Prevent scrolling when item is active */
.gallery-container.item-active {
  overflow-x: hidden !important;
  pointer-events: none;
}

.gallery-container.item-active .gallery-item-container {
  pointer-events: auto;
}
</style>
