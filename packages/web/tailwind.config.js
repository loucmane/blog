/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        // Custom responsive breakpoints optimized for animal foundation content
        screens: {
            'xs': '475px',    // Small phones, emergency appeal banners
            'sm': '640px',    // Default Tailwind - mobile landscape, donation forms
            'md': '768px',    // Default Tailwind - tablets, story cards grid
            'lg': '1024px',   // Default Tailwind - laptops, full layout
            'xl': '1280px',   // Default Tailwind - desktops, hero sections
            '2xl': '1536px',  // Default Tailwind - large desktops
            // Custom breakpoints for specific use cases
            'mobile': '480px',   // Mobile-first optimized
            'tablet': '768px',   // Tablet portrait
            'laptop': '1024px',  // Laptop screens
            'desktop': '1280px', // Desktop screens
            'wide': '1440px',    // Wide screens for immersive content
            'ultra': '1920px',   // Ultra-wide for photo galleries
        },
        extend: {
            colors: {
                // CSS custom properties for dynamic theming
                primary: {
                    50: 'rgb(var(--color-primary-50) / <alpha-value>)',
                    100: 'rgb(var(--color-primary-100) / <alpha-value>)',
                    200: 'rgb(var(--color-primary-200) / <alpha-value>)',
                    300: 'rgb(var(--color-primary-300) / <alpha-value>)',
                    400: 'rgb(var(--color-primary-400) / <alpha-value>)',
                    500: 'rgb(var(--color-primary-500) / <alpha-value>)',
                    600: 'rgb(var(--color-primary-600) / <alpha-value>)',
                    700: 'rgb(var(--color-primary-700) / <alpha-value>)',
                    800: 'rgb(var(--color-primary-800) / <alpha-value>)',
                    900: 'rgb(var(--color-primary-900) / <alpha-value>)',
                },
                // Animal Foundation brand colors using CSS custom properties
                sage: {
                    50: 'rgb(var(--color-sage-50) / <alpha-value>)',
                    100: 'rgb(var(--color-sage-100) / <alpha-value>)',
                    200: 'rgb(var(--color-sage-200) / <alpha-value>)',
                    300: 'rgb(var(--color-sage-300) / <alpha-value>)',
                    400: 'rgb(var(--color-sage-400) / <alpha-value>)',
                    500: 'rgb(var(--color-sage-500) / <alpha-value>)',
                    600: 'rgb(var(--color-sage-600) / <alpha-value>)',
                    700: 'rgb(var(--color-sage-700) / <alpha-value>)',
                    800: 'rgb(var(--color-sage-800) / <alpha-value>)',
                    900: 'rgb(var(--color-sage-900) / <alpha-value>)',
                },
                coral: {
                    50: 'rgb(var(--color-coral-50) / <alpha-value>)',
                    100: 'rgb(var(--color-coral-100) / <alpha-value>)',
                    200: 'rgb(var(--color-coral-200) / <alpha-value>)',
                    300: 'rgb(var(--color-coral-300) / <alpha-value>)',
                    400: 'rgb(var(--color-coral-400) / <alpha-value>)',
                    500: 'rgb(var(--color-coral-500) / <alpha-value>)',
                    600: 'rgb(var(--color-coral-600) / <alpha-value>)',
                    700: 'rgb(var(--color-coral-700) / <alpha-value>)',
                    800: 'rgb(var(--color-coral-800) / <alpha-value>)',
                    900: 'rgb(var(--color-coral-900) / <alpha-value>)',
                },
                // Semantic colors for trauma-informed design
                background: 'rgb(var(--color-background) / <alpha-value>)',
                foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
                muted: 'rgb(var(--color-muted) / <alpha-value>)',
                'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
                border: 'rgb(var(--color-border) / <alpha-value>)',
                input: 'rgb(var(--color-input) / <alpha-value>)',
                ring: 'rgb(var(--color-ring) / <alpha-value>)',
                // Emergency and donation-specific colors
                emergency: 'rgb(var(--color-emergency) / <alpha-value>)',
                'emergency-foreground': 'rgb(var(--color-emergency-foreground) / <alpha-value>)',
                donate: 'rgb(var(--color-donate) / <alpha-value>)',
                'donate-foreground': 'rgb(var(--color-donate-foreground) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                'success-foreground': 'rgb(var(--color-success-foreground) / <alpha-value>)',
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