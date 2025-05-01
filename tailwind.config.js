// filepath: c:\Users\0xuser\Desktop\por\send-eth\send-eth\tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f3f4f6', // Fondo claro
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};