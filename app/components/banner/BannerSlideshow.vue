<script setup lang="ts">
/**
 * Banner slideshow component for homepage
 * Displays banners in a carousel format with auto-play, navigation, and responsive images
 */
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Banner } from '~/types'

interface Props {
  banners?: Banner[] | null
  autoPlayInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  banners: () => [],
  autoPlayInterval: 5000, // 5 seconds default
})

const localePath = useLocalePath()

// Current slide index
const currentIndex = ref(0)
const isPaused = ref(false)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

// Filter out banners without images and sort by position
const validBanners = computed(() => {
  if (!props.banners) return []
  return props.banners
    .filter(banner => banner.desktop_image || banner.mobile_image)
    .sort((a, b) => a.position - b.position)
})

const hasBanners = computed(() => validBanners.value.length > 0)
const isMultipleBanners = computed(() => validBanners.value.length > 1)

// Navigate to previous slide
function goToPrevious() {
  if (!isMultipleBanners.value) return
  currentIndex.value = currentIndex.value === 0 
    ? validBanners.value.length - 1 
    : currentIndex.value - 1
  resetAutoPlay()
}

// Navigate to next slide
function goToNext() {
  if (!isMultipleBanners.value) return
  currentIndex.value = (currentIndex.value + 1) % validBanners.value.length
  resetAutoPlay()
}

// Go to specific slide
function goToSlide(index: number) {
  if (!isMultipleBanners.value) return
  currentIndex.value = index
  resetAutoPlay()
}

// Start auto-play
function startAutoPlay() {
  if (!isMultipleBanners.value || isPaused.value) return
  
  autoPlayTimer = setInterval(() => {
    if (!isPaused.value) {
      goToNext()
    }
  }, props.autoPlayInterval)
}

// Stop auto-play
function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

// Reset auto-play timer
function resetAutoPlay() {
  stopAutoPlay()
  if (!isPaused.value) {
    startAutoPlay()
  }
}

// Check if URL is external
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

// Get the proper link URL (locale-aware for internal URLs)
function getBannerUrl(banner: Banner): string {
  if (!banner.url) return '#'
  if (isExternalUrl(banner.url)) {
    return banner.url
  }
  return localePath(banner.url)
}

// Responsive images are handled via picture/source elements (Nuxt 4 best practice)

// Pause on hover
function handleMouseEnter() {
  isPaused.value = true
  stopAutoPlay()
}

function handleMouseLeave() {
  isPaused.value = false
  startAutoPlay()
}

// Keyboard navigation
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    goToPrevious()
  } else if (event.key === 'ArrowRight') {
    goToNext()
  }
}

// Lifecycle
onMounted(() => {
  if (isMultipleBanners.value) {
    startAutoPlay()
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopAutoPlay()
  window.removeEventListener('keydown', handleKeydown)
})

// Watch for banner changes
watch(() => props.banners, () => {
  currentIndex.value = 0
  if (isMultipleBanners.value && !isPaused.value) {
    resetAutoPlay()
  } else {
    stopAutoPlay()
  }
}, { deep: true })
</script>

<template>
  <div 
    v-if="hasBanners"
    class="relative w-full overflow-hidden bg-gray-100"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Slides Container -->
    <div class="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]">
      <div 
        v-for="(banner, index) in validBanners"
        :key="banner.id"
        :class="[
          'absolute inset-0 transition-opacity duration-500 ease-in-out',
          index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
        ]"
      >
        <!-- Use picture element for true responsive images (Nuxt 4 best practice) -->
        <!-- Use NuxtLink for internal URLs, regular anchor for external URLs -->
        <NuxtLink
          v-if="banner.url && !isExternalUrl(banner.url)"
          :to="getBannerUrl(banner)"
          class="block w-full h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <picture class="block w-full h-full">
            <!-- Mobile image source -->
            <source
              v-if="banner.mobile_image"
              media="(max-width: 767px)"
              :srcset="banner.mobile_image"
            >
            <!-- Desktop image (fallback for picture element) -->
            <NuxtImg
              :src="banner.desktop_image"
              :alt="banner.title || 'Banner'"
              class="w-full h-full object-cover"
              loading="eager"
              format="webp"
              quality="90"
              sizes="100vw"
            />
          </picture>
        </NuxtLink>
        <a
          v-else-if="banner.url && isExternalUrl(banner.url)"
          :href="banner.url"
          target="_blank"
          rel="noopener noreferrer"
          class="block w-full h-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <picture class="block w-full h-full">
            <!-- Mobile image source -->
            <source
              v-if="banner.mobile_image"
              media="(max-width: 767px)"
              :srcset="banner.mobile_image"
            >
            <!-- Desktop image (fallback for picture element) -->
            <NuxtImg
              :src="banner.desktop_image"
              :alt="banner.title || 'Banner'"
              class="w-full h-full object-cover"
              loading="eager"
              format="webp"
              quality="90"
              sizes="100vw"
            />
          </picture>
        </a>
        <picture v-else class="block w-full h-full">
          <!-- Mobile image source -->
          <source
            v-if="banner.mobile_image"
            media="(max-width: 767px)"
            :srcset="banner.mobile_image"
          >
          <!-- Desktop image (fallback for picture element) -->
          <NuxtImg
            :src="banner.desktop_image"
            :alt="banner.title || 'Banner'"
            class="w-full h-full object-cover"
            loading="eager"
            format="webp"
            quality="90"
            sizes="100vw"
          />
        </picture>
      </div>
    </div>

    <!-- Navigation Arrows -->
    <template v-if="isMultipleBanners">
      <button
        type="button"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white p-2 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Previous banner"
        @click="goToPrevious"
      >
        <ChevronLeft class="h-6 w-6 text-gray-900" />
      </button>
      
      <button
        type="button"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 hover:bg-white p-2 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Next banner"
        @click="goToNext"
      >
        <ChevronRight class="h-6 w-6 text-gray-900" />
      </button>
    </template>

    <!-- Dot Indicators -->
    <div 
      v-if="isMultipleBanners"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2"
      role="tablist"
      aria-label="Banner navigation"
    >
      <button
        v-for="(banner, index) in validBanners"
        :key="banner.id"
        type="button"
        :class="[
          'h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
          index === currentIndex 
            ? 'w-8 bg-white' 
            : 'w-2 bg-white/60 hover:bg-white/80'
        ]"
        :aria-label="`Go to banner ${index + 1}`"
        :aria-selected="index === currentIndex"
        role="tab"
        @click="goToSlide(index)"
      />
    </div>
  </div>

  <!-- Empty State -->
  <div v-else class="relative w-full bg-gray-100 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] flex items-center justify-center">
    <UiEmptyState
      title="No banners available"
      description="Banners will appear here when available"
    />
  </div>
</template>
