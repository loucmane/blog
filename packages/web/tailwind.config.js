/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                gray: {
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
            },
            typography: {
                DEFAULT: {
                    css: {
                        color: '#374151',
                        a: {
                            color: '#0ea5e9',
                            '&:hover': {
                                color: '#0284c7',
                            },
                        },
                        h1: {
                            color: '#111827',
                        },
                        h2: {
                            color: '#111827',
                        },
                        h3: {
                            color: '#111827',
                        },
                        h4: {
                            color: '#111827',
                        },
                        code: {
                            color: '#0ea5e9',
                        },
                        'code::before': {
                            content: '""',
                        },
                        'code::after': {
                            content: '""',
                        },
                        blockquote: {
                            color: '#4b5563',
                            borderLeftColor: '#e5e7eb',
                        },
                        hr: {
                            borderColor: '#e5e7eb',
                        },
                        ol: {
                            color: '#374151',
                        },
                        ul: {
                            color: '#374151',
                        },
                        li: {
                            color: '#374151',
                        },
                        strong: {
                            color: '#111827',
                        },
                        thead: {
                            color: '#111827',
                            borderBottomColor: '#e5e7eb',
                        },
                        'tbody tr': {
                            borderBottomColor: '#e5e7eb',
                        },
                    },
                },
                dark: {
                    css: {
                        color: '#d1d5db',
                        a: {
                            color: '#38bdf8',
                            '&:hover': {
                                color: '#7dd3fc',
                            },
                        },
                        h1: {
                            color: '#f9fafb',
                        },
                        h2: {
                            color: '#f9fafb',
                        },
                        h3: {
                            color: '#f9fafb',
                        },
                        h4: {
                            color: '#f9fafb',
                        },
                        code: {
                            color: '#38bdf8',
                        },
                        'code::before': {
                            content: '""',
                        },
                        'code::after': {
                            content: '""',
                        },
                        blockquote: {
                            color: '#9ca3af',
                            borderLeftColor: '#374151',
                        },
                        hr: {
                            borderColor: '#374151',
                        },
                        ol: {
                            color: '#d1d5db',
                        },
                        ul: {
                            color: '#d1d5db',
                        },
                        li: {
                            color: '#d1d5db',
                        },
                        strong: {
                            color: '#f9fafb',
                        },
                        thead: {
                            color: '#f9fafb',
                            borderBottomColor: '#374151',
                        },
                        'tbody tr': {
                            borderBottomColor: '#374151',
                        },
                    },
                },
            },
        },
    },
    plugins: [
        require( '@tailwindcss/typography' ),
    ],
}; 