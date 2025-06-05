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
                // Brand Color Scales (mapped to CSS custom properties)
                teal: {
                    50: 'rgb(var(--color-teal-50) / <alpha-value>)',
                    100: 'rgb(var(--color-teal-100) / <alpha-value>)',
                    200: 'rgb(var(--color-teal-200) / <alpha-value>)',
                    300: 'rgb(var(--color-teal-300) / <alpha-value>)',
                    400: 'rgb(var(--color-teal-400) / <alpha-value>)',
                    500: 'rgb(var(--color-teal-500) / <alpha-value>)',   // bright teal
                    600: 'rgb(var(--color-teal-600) / <alpha-value>)',   // deep teal (primary)
                    700: 'rgb(var(--color-teal-700) / <alpha-value>)',
                    800: 'rgb(var(--color-teal-800) / <alpha-value>)',
                    900: 'rgb(var(--color-teal-900) / <alpha-value>)',
                },
                yellow: {
                    50: 'rgb(var(--color-yellow-50) / <alpha-value>)',
                    100: 'rgb(var(--color-yellow-100) / <alpha-value>)',
                    200: 'rgb(var(--color-yellow-200) / <alpha-value>)',
                    300: 'rgb(var(--color-yellow-300) / <alpha-value>)',
                    400: 'rgb(var(--color-yellow-400) / <alpha-value>)',
                    500: 'rgb(var(--color-yellow-500) / <alpha-value>)',  // golden yellow
                    600: 'rgb(var(--color-yellow-600) / <alpha-value>)',
                    700: 'rgb(var(--color-yellow-700) / <alpha-value>)',
                    800: 'rgb(var(--color-yellow-800) / <alpha-value>)',
                    900: 'rgb(var(--color-yellow-900) / <alpha-value>)',
                },
                orange: {
                    50: 'rgb(var(--color-orange-50) / <alpha-value>)',
                    100: 'rgb(var(--color-orange-100) / <alpha-value>)',
                    200: 'rgb(var(--color-orange-200) / <alpha-value>)',
                    300: 'rgb(var(--color-orange-300) / <alpha-value>)',
                    400: 'rgb(var(--color-orange-400) / <alpha-value>)',
                    500: 'rgb(var(--color-orange-500) / <alpha-value>)',  // warm orange
                    600: 'rgb(var(--color-orange-600) / <alpha-value>)',
                    700: 'rgb(var(--color-orange-700) / <alpha-value>)',
                    800: 'rgb(var(--color-orange-800) / <alpha-value>)',
                    900: 'rgb(var(--color-orange-900) / <alpha-value>)',
                },
                coral: {
                    50: 'rgb(var(--color-coral-50) / <alpha-value>)',
                    100: 'rgb(var(--color-coral-100) / <alpha-value>)',
                    200: 'rgb(var(--color-coral-200) / <alpha-value>)',
                    300: 'rgb(var(--color-coral-300) / <alpha-value>)',
                    400: 'rgb(var(--color-coral-400) / <alpha-value>)',
                    500: 'rgb(var(--color-coral-500) / <alpha-value>)',   // coral
                    600: 'rgb(var(--color-coral-600) / <alpha-value>)',
                    700: 'rgb(var(--color-coral-700) / <alpha-value>)',
                    800: 'rgb(var(--color-coral-800) / <alpha-value>)',
                    900: 'rgb(var(--color-coral-900) / <alpha-value>)',
                },
                
                // Semantic Colors (mapped to CSS custom properties)
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                background: 'rgb(var(--color-background) / <alpha-value>)',
                foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
                muted: 'rgb(var(--color-muted) / <alpha-value>)',
                'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
                border: 'rgb(var(--color-border) / <alpha-value>)',
                input: 'rgb(var(--color-input) / <alpha-value>)',
                ring: 'rgb(var(--color-ring) / <alpha-value>)',
                
                // Action Colors
                donate: 'rgb(var(--color-donate) / <alpha-value>)',
                'donate-foreground': 'rgb(var(--color-donate-foreground) / <alpha-value>)',
                emergency: 'rgb(var(--color-emergency) / <alpha-value>)',
                'emergency-foreground': 'rgb(var(--color-emergency-foreground) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                'success-foreground': 'rgb(var(--color-success-foreground) / <alpha-value>)',
                
                // Navigation Colors
                'nav-bg': 'rgb(var(--color-nav-bg) / <alpha-value>)',
                'nav-text': 'rgb(var(--color-nav-text) / <alpha-value>)',
                'nav-hover': 'rgb(var(--color-nav-hover) / <alpha-value>)',
                
                // Animal Foundation Specific
                'adoption-available': 'rgb(var(--color-adoption-available) / <alpha-value>)',
                'adoption-pending': 'rgb(var(--color-adoption-pending) / <alpha-value>)',
                'adoption-adopted': 'rgb(var(--color-adoption-adopted) / <alpha-value>)',
                'urgent-care': 'rgb(var(--color-urgent-care) / <alpha-value>)',
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