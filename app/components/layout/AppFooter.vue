<script setup lang="ts">
/**
 * Main application footer
 * Displays site contacts, social links, and navigation
 */
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, MessageCircle, Youtube, Send } from 'lucide-vue-next'
import type { SiteContactsResponse } from '~/types'

// Locale-aware navigation
const localePath = useLocalePath()
const { t } = useI18n()

const currentYear = new Date().getFullYear()

// Fetch contacts with SSR support
// Access store and API inside callback to preserve SSR context
const { data: contactsData, pending, error: contactsError } = await useAsyncData(
  'site-contacts',
  async () => {
    const api = useApi()
    try {
      const response = await api.get<SiteContactsResponse>('/site/contacts')
      // Response is wrapped in 'data' property
      return response.data
    } catch (err) {
      console.error('Failed to fetch site contacts:', err)
      return null
    }
  },
  {
    server: true,
    default: () => null,
  }
)

// Computed properties for contact data - use fetched data directly
const contacts = computed(() => contactsData.value?.contacts)
const socials = computed(() => contactsData.value?.socials ?? [])
const messengers = computed(() => contactsData.value?.messengers ?? [])

// Remove static fallbacks - only show data when available from API
const email = computed(() => contacts.value?.email ?? '')
const phones = computed(() => contacts.value?.phones ?? [])
const address = computed(() => contacts.value?.address ?? '')
const addressLink = computed(() => contacts.value?.address_link ?? '#')
const scheduleHtml = computed(() => contacts.value?.schedule_html ?? '')
const mapIframe = computed(() => contacts.value?.map_iframe ?? '')

// Check if we have any contact data to display
const hasContactData = computed(() => {
  return !!(email.value || phones.value.length > 0 || address.value || scheduleHtml.value || mapIframe.value)
})

// Get icon component for social link
function getSocialIcon(title: string) {
  const iconMap: Record<string, typeof Facebook> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube,
  }
  return iconMap[title.toLowerCase()] ?? MessageCircle
}

// Get icon component for messenger link
function getMessengerIcon(title: string) {
  const iconMap: Record<string, typeof MessageCircle> = {
    telegram: Send,
    viber: MessageCircle,
    whatsapp: MessageCircle,
  }
  return iconMap[title.toLowerCase()] ?? MessageCircle
}
</script>

<template>
  <footer class="bg-gray-900 text-gray-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Brand -->
        <div>
          <h3 class="text-2xl font-bold text-white mb-4">Nexora</h3>
          <p class="text-sm text-gray-400 mb-6">
            {{ t('footer.brand.description') }}
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            {{ t('footer.shop.title') }}
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink :to="localePath('/categories')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.shop.allProducts') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sort=newest')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.shop.newArrivals') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sort=price_desc')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.shop.bestSellers') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sale=true')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.shop.sale') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Customer Service -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            {{ t('footer.customerService.title') }}
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink :to="localePath('/contact')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.customerService.contactUs') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/profile/orders')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.customerService.trackOrder') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/shipping')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.customerService.shippingInfo') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/returns')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.customerService.returnsExchanges') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/faq')" class="text-sm hover:text-white transition-colors">
                {{ t('footer.customerService.faq') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            {{ t('footer.contact.title') }}
          </h4>
          <!-- Loading state -->
          <template v-if="pending">
            <ul class="space-y-3">
              <li class="flex items-center gap-3">
                <div class="h-5 w-5 bg-gray-700 rounded animate-pulse" />
                <div class="h-4 w-32 bg-gray-700 rounded animate-pulse" />
              </li>
              <li class="flex items-center gap-3">
                <div class="h-5 w-5 bg-gray-700 rounded animate-pulse" />
                <div class="h-4 w-28 bg-gray-700 rounded animate-pulse" />
              </li>
            </ul>
          </template>
          <!-- Error state -->
          <template v-else-if="contactsError">
            <p class="text-sm text-gray-500">{{ t('footer.contact.unableToLoad') }}</p>
          </template>
          <!-- Contact data -->
          <template v-else-if="hasContactData">
            <ul class="space-y-3">
              <li v-if="email" class="flex items-center gap-3">
                <Mail class="h-5 w-5 text-gray-400" />
                <a :href="`mailto:${email}`" class="text-sm hover:text-white transition-colors">
                  {{ email }}
                </a>
              </li>
              <li v-for="phone in phones" :key="phone" class="flex items-center gap-3">
                <Phone class="h-5 w-5 text-gray-400" />
                <a :href="`tel:${phone.replace(/\s/g, '')}`" class="text-sm hover:text-white transition-colors">
                  {{ phone }}
                </a>
              </li>
              <li v-if="address" class="flex items-start gap-3">
                <MapPin class="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <a
                  v-if="addressLink && addressLink !== '#'"
                  :href="addressLink"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm hover:text-white transition-colors"
                >
                  {{ address }}
                </a>
                <span v-else class="text-sm">
                  {{ address }}
                </span>
              </li>
              <!-- eslint-disable vue/no-v-html -->
              <li v-if="scheduleHtml" class="text-sm text-gray-400" v-html="scheduleHtml" />
              <!-- eslint-enable vue/no-v-html -->
            </ul>
            <!-- Map iframe -->
            <div v-if="mapIframe" class="mt-4 w-full">
              <!-- eslint-disable vue/no-v-html -->
              <div class="w-full h-48 rounded overflow-hidden" v-html="mapIframe" />
              <!-- eslint-enable vue/no-v-html -->
            </div>
          </template>
        </div>

        <!-- Socials & Messengers -->
        <div v-if="socials.length > 0 || messengers.length > 0">
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            {{ t('footer.followUs.title') }}
          </h4>
          <!-- Social links -->
          <div v-if="socials.length > 0" class="mb-4">
            <div class="flex flex-wrap gap-3">
              <a
                v-for="social in socials"
                :key="social.url"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                :title="social.title"
              >
                <component :is="getSocialIcon(social.title)" class="h-5 w-5" />
                <span class="text-sm">{{ social.title }}</span>
              </a>
            </div>
          </div>
          <!-- Messenger links -->
          <div v-if="messengers.length > 0">
            <h5 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {{ t('footer.followUs.messengers') }}
            </h5>
            <div class="flex flex-wrap gap-3">
              <a
                v-for="messenger in messengers"
                :key="messenger.url"
                :href="messenger.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                :title="messenger.title"
              >
                <component :is="getMessengerIcon(messenger.title)" class="h-5 w-5" />
                <span class="text-sm">{{ messenger.title }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-12 pt-8 border-t border-gray-800">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-400">
            © {{ currentYear }} Nexora. {{ t('footer.bottomBar.allRightsReserved') }}
          </p>
          <div class="flex items-center gap-6">
            <NuxtLink :to="localePath('/privacy')" class="text-sm text-gray-400 hover:text-white transition-colors">
              {{ t('footer.bottomBar.privacyPolicy') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/terms')" class="text-sm text-gray-400 hover:text-white transition-colors">
              {{ t('footer.bottomBar.termsOfService') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
