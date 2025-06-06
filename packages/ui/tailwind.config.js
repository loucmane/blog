/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        // Include paths from consuming packages
        '../../packages/web/src/**/*.{js,jsx,ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        // This will be populated with our design tokens
        extend: {},
    },
    plugins: [],
};