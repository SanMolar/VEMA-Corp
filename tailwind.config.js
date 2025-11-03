/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  theme: {
  extend: {
    colors: {
      vema: {
        blue: '#0B3C5D',
        green: '#00A676',
        aqua: '#36B3E0',
        light: '#E5ECF4',
        dark: '#1E293B',
      },
    },
  },
}

}

