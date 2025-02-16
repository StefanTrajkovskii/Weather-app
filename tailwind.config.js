/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a73e8',
        secondary: '#f8f9fa',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
