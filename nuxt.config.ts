import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-12-22',
  
  runtimeConfig: {
    apiBackendUrl: process.env.NUXT_API_BACKEND_URL || 'http://localhost:8000',
    apiSecret: process.env.NUXT_API_SECRET,
    public: {
      apiBackendUrl:
        process.env.NUXT_PUBLIC_API_BACKEND_URL ||
        process.env.NUXT_API_BACKEND_URL ||
        'http://localhost:8000',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  modules: [
    '@nuxt/image',
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  css: ['./app/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ru', // Default locale - set only in config, not from API
    locales: [
      { code: 'ru', name: 'Русский' },
      { code: 'en', name: 'English' },
      { code: 'uk', name: 'Українська' },
      { code: 'awa', name: 'Авадхи' },
    ], // Base set - will be filtered/validated by API response
    detectBrowserLanguage: false,
    vueI18n: './app/i18n.config.ts',
  },

  // routeRules: {
  //   // Категории - кэшировать на 1 час (SWR: показываем кэш, обновляем в фоне)
  //   '/categories': { swr: 3600 },
  //   '/categories/**': { swr: 3600 },
    
  //   // Страницы товаров - кэшировать на 1 час (товары меняются реже)
  //   '/product/**': { swr: 3600 },
    
  //   // Блог - кэшировать на 1 час (контент меняется редко)
  //   '/blog': { swr: 3600 },
  //   '/blog/**': { swr: 3600 },
    
  //   // Главная страница - кэшировать на 30 минут
  //   '/': { swr: 1800 },
    
  //   // Статические страницы - кэшировать на 1 час
  //   '/faq': { swr: 3600 },
  //   '/shipping': { swr: 3600 },
  //   '/returns': { swr: 3600 },
  //   '/privacy': { swr: 3600 },
  //   '/terms': { swr: 3600 },
    
  //   // CSR-only страницы (не кэшируем на сервере, они клиентские)
  //   '/cart': { ssr: false },
  //   '/checkout': { ssr: false },
  //   '/favorites': { ssr: false },
  //   '/comparison': { ssr: false },
  //   '/profile/**': { ssr: false },
  //   '/auth/**': { ssr: false },
    
  //   // Language-prefixed routes - apply same rules with language prefix
  //   // These will be handled by i18n routing, but we need to ensure CSR pages remain CSR
  //   '/uk/cart': { ssr: false },
  //   '/uk/checkout': { ssr: false },
  //   '/uk/favorites': { ssr: false },
  //   '/uk/comparison': { ssr: false },
  //   '/uk/profile/**': { ssr: false },
  //   '/uk/auth/**': { ssr: false },
  //   '/en/cart': { ssr: false },
  //   '/en/checkout': { ssr: false },
  //   '/en/favorites': { ssr: false },
  //   '/en/comparison': { ssr: false },
  //   '/en/profile/**': { ssr: false },
  //   '/en/auth/**': { ssr: false },
  // },
})