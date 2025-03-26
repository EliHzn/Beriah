// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1) Let Tailwind scan these files for class names.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],

  // 2) Theme customizations
  theme: {
    // Extend the default theme with custom colors, shadows, fonts, screens, etc.
    extend: {
      colors: {
        // A few iOS-inspired colors:
        'ios-blue': '#007AFF',
        'ios-green': '#34C759',
        'ios-red': '#FF3B30',
        'ios-orange': '#FF9500',
        'ios-yellow': '#FFCC00',
        'ios-gray': '#8E8E93',
      },
      fontFamily: {
        // iOS system font stack
        ios: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        // A subtle shadow that can mimic message bubble depth
        'bubble-sm': '0 1px 2px rgba(0,0,0,0.08)',
        'bubble-md': '0 2px 4px rgba(0,0,0,0.12)',
      },
      spacing: {
        // For safe area insets, if you want iPhone notches:
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      screens: {
        // Target an iPhone SE or similar small device
        'iphone-se': '320px',
        // iPhone 12/13 mini ~375px wide
        'iphone-mini': '375px',
      }
    }
  },

  // 3) Optionally load any Tailwind plugins
  plugins: [
    // e.g. require('@tailwindcss/typography'),
    // e.g. require('@tailwindcss/forms'),
  ],
};
