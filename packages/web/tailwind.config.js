import baseConfig from '@minniewinnie/ui/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
    ...baseConfig,
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'
    ],
};