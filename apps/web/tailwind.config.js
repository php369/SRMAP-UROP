/** @type {import('tailwindcss').Config} */
export default {
  ...require('@srm-portal/config/tailwind/base'),
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ]
};