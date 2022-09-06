/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.hbs"],
  theme: {
    extend: {
      screens: {
        'lg': '1440px',
        'md': '1090px'
        // => @media (min-width: 1048px) { ... }
      },
    },
  },
  plugins: [],
}
