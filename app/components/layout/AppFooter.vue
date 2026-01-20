<script setup lang="ts">
/**
 * Main application footer
 * Displays site contacts, social links, and navigation
 */
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, MessageCircle } from 'lucide-vue-next'

// Locale-aware navigation
const localePath = useLocalePath()
const systemStore = useSystemStore()

const currentYear = new Date().getFullYear()

// Fetch contacts on mount (client-side only)
onMounted(async () => {
  if (!systemStore.contacts) {
    await systemStore.fetchContacts()
  }
})

// Computed properties for contact data with fallbacks
const contacts = computed(() => systemStore.contacts?.contacts)
const socials = computed(() => systemStore.contacts?.socials ?? [])
const messengers = computed(() => systemStore.contacts?.messengers ?? [])

const email = computed(() => contacts.value?.email ?? 'support@nexora.shop')
const phones = computed(() => contacts.value?.phones ?? ['+1 (234) 567-890'])
const address = computed(() => contacts.value?.address ?? '123 Commerce Street, New York, NY 10001')
const addressLink = computed(() => contacts.value?.address_link ?? '#')

// Get icon component for social/messenger link
function getSocialIcon(title: string) {
  const iconMap: Record<string, typeof Facebook> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
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
            Your trusted e-commerce destination. Quality products, fast delivery, excellent service.
          </p>
          <div class="flex space-x-4">
            <!-- Dynamic social links from API -->
            <template v-if="socials.length > 0">
              <a
                v-for="social in socials"
                :key="social.url"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-white transition-colors"
                :title="social.title"
              >
                <component :is="getSocialIcon(social.title)" class="h-5 w-5" />
              </a>
            </template>
            <!-- Fallback static links -->
            <template v-else>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <Facebook class="h-5 w-5" />
              </a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <Twitter class="h-5 w-5" />
              </a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">
                <Instagram class="h-5 w-5" />
              </a>
            </template>
          </div>
          <!-- Messenger links -->
          <div v-if="messengers.length > 0" class="flex space-x-4 mt-3">
            <a
              v-for="messenger in messengers"
              :key="messenger.url"
              :href="messenger.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-400 hover:text-white transition-colors"
              :title="messenger.title"
            >
              <MessageCircle class="h-5 w-5" />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Shop
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink :to="localePath('/categories')" class="text-sm hover:text-white transition-colors">
                All Products
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sort=newest')" class="text-sm hover:text-white transition-colors">
                New Arrivals
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sort=price_desc')" class="text-sm hover:text-white transition-colors">
                Best Sellers
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/categories?sale=true')" class="text-sm hover:text-white transition-colors">
                Sale
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Customer Service -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Customer Service
          </h4>
          <ul class="space-y-3">
            <li>
              <NuxtLink :to="localePath('/contact')" class="text-sm hover:text-white transition-colors">
                Contact Us
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/profile/orders')" class="text-sm hover:text-white transition-colors">
                Track Order
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/shipping')" class="text-sm hover:text-white transition-colors">
                Shipping Info
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/returns')" class="text-sm hover:text-white transition-colors">
                Returns & Exchanges
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/faq')" class="text-sm hover:text-white transition-colors">
                FAQ
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Contact Us
          </h4>
          <ul class="space-y-3">
            <li class="flex items-center gap-3">
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
            <li class="flex items-start gap-3">
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
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-12 pt-8 border-t border-gray-800">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-400">
            © {{ currentYear }} Nexora. All rights reserved.
          </p>
          <div class="flex items-center gap-6">
            <NuxtLink :to="localePath('/privacy')" class="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </NuxtLink>
            <NuxtLink :to="localePath('/terms')" class="text-sm text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

