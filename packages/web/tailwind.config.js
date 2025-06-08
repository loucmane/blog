import baseConfig from '@minniewinnie/ui/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
    ...baseConfig,
    darkMode: ['class'],
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        '../../packages/ui/src/**/*.{js,jsx,ts,tsx}'
    ],
    plugins: [
        ...baseConfig.plugins,
        require("tailwindcss-animate")
    ],
    theme: {
    	...baseConfig.theme,
    	extend: {
    		...baseConfig.theme?.extend,
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			// Override brand colors to use CSS variables
    			teal: {
    				50: 'hsl(var(--teal-50) / <alpha-value>)',
    				100: 'hsl(var(--teal-100) / <alpha-value>)',
    				200: 'hsl(var(--teal-200) / <alpha-value>)',
    				300: 'hsl(var(--teal-300) / <alpha-value>)',
    				400: 'hsl(var(--teal-400) / <alpha-value>)',
    				500: 'hsl(var(--teal-500) / <alpha-value>)',
    				600: 'hsl(var(--teal-600) / <alpha-value>)',
    				700: 'hsl(var(--teal-700) / <alpha-value>)',
    				800: 'hsl(var(--teal-800) / <alpha-value>)',
    				900: 'hsl(var(--teal-900) / <alpha-value>)',
    			},
    			orange: {
    				50: 'hsl(var(--orange-50) / <alpha-value>)',
    				100: 'hsl(var(--orange-100) / <alpha-value>)',
    				200: 'hsl(var(--orange-200) / <alpha-value>)',
    				300: 'hsl(var(--orange-300) / <alpha-value>)',
    				400: 'hsl(var(--orange-400) / <alpha-value>)',
    				500: 'hsl(var(--orange-500) / <alpha-value>)',
    				600: 'hsl(var(--orange-600) / <alpha-value>)',
    				700: 'hsl(var(--orange-700) / <alpha-value>)',
    				800: 'hsl(var(--orange-800) / <alpha-value>)',
    				900: 'hsl(var(--orange-900) / <alpha-value>)',
    			},
    			yellow: {
    				50: 'hsl(var(--yellow-50) / <alpha-value>)',
    				100: 'hsl(var(--yellow-100) / <alpha-value>)',
    				200: 'hsl(var(--yellow-200) / <alpha-value>)',
    				300: 'hsl(var(--yellow-300) / <alpha-value>)',
    				400: 'hsl(var(--yellow-400) / <alpha-value>)',
    				500: 'hsl(var(--yellow-500) / <alpha-value>)',
    				600: 'hsl(var(--yellow-600) / <alpha-value>)',
    				700: 'hsl(var(--yellow-700) / <alpha-value>)',
    				800: 'hsl(var(--yellow-800) / <alpha-value>)',
    				900: 'hsl(var(--yellow-900) / <alpha-value>)',
    			},
    			coral: {
    				50: 'hsl(var(--coral-50) / <alpha-value>)',
    				100: 'hsl(var(--coral-100) / <alpha-value>)',
    				200: 'hsl(var(--coral-200) / <alpha-value>)',
    				300: 'hsl(var(--coral-300) / <alpha-value>)',
    				400: 'hsl(var(--coral-400) / <alpha-value>)',
    				500: 'hsl(var(--coral-500) / <alpha-value>)',
    				600: 'hsl(var(--coral-600) / <alpha-value>)',
    				700: 'hsl(var(--coral-700) / <alpha-value>)',
    				800: 'hsl(var(--coral-800) / <alpha-value>)',
    				900: 'hsl(var(--coral-900) / <alpha-value>)',
    			},
    			// Semantic colors from UI package that adapt to themes
    			emergency: 'hsl(var(--coral-500) / <alpha-value>)',
    			'emergency-foreground': 'hsl(var(--emergency-foreground) / <alpha-value>)', // Theme-aware
    			donate: 'hsl(var(--orange-500) / <alpha-value>)',
    			'donate-foreground': 'hsl(var(--donate-foreground) / <alpha-value>)', // Theme-aware
    			success: 'hsl(var(--yellow-500) / <alpha-value>)',
    			'success-foreground': 'hsl(var(--success-foreground) / <alpha-value>)', // Theme-aware
    			'adoption-available': 'hsl(var(--yellow-500) / <alpha-value>)',
    			'adoption-pending': 'hsl(var(--orange-500) / <alpha-value>)',
    			'adoption-adopted': 'hsl(var(--teal-500) / <alpha-value>)',
    			'adoption-pending-foreground': 'hsl(var(--adoption-pending-foreground) / <alpha-value>)',
    			'adoption-adopted-foreground': 'hsl(var(--adoption-adopted-foreground) / <alpha-value>)',
    			// shadcn/ui semantic colors
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		}
    	}
    }
};