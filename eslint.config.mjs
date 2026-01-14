// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    files: ['app/components/**/*.{js,jsx,ts,tsx,vue}', 'app/pages/**/*.{js,jsx,ts,tsx,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/types/api/dto/*', '~/types/api/dto/**'],
              message: 'DTO types are restricted to stores, composables, and mappers. Use UI models from ~/types.',
            },
          ],
        },
      ],
    },
  }
)
