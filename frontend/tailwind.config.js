/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc7fb',
                    400: '#36a9f6',
                    500: '#0c8de6',
                    600: '#006fbf',
                    700: '#01599a',
                    800: '#064c7f',
                    900: '#0a406a',
                    950: '#072947',
                },
            },
        },
    },
    plugins: [],
}
