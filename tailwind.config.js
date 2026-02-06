// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        midnight: '#0B0B19',
        gold: '#F4E0B9',
        'gold-dim': '#C4B089',
        'gold-bright': '#FFE7B9',
        surface: '#121220',
        'soft-white': '#F8F8F8',
        'soft-gray': '#E5E7EB',
        'deep-gray': '#374151'
      },
      fontSize: {
        'mini': '11px',
        'tiny': '12px'
      }
    },
  },
  plugins: [],
}
