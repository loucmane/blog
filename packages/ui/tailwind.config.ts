import type { Config } from 'tailwindcss'
import { colors } from './src/tokens/colors'
import { breakpoints } from './src/tokens/breakpoints'
import { animations } from './src/tokens/animations'

const config: Config = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        // Include paths from consuming packages
        '../../packages/web/src/**/*.{js,jsx,ts,tsx}',
    ],
    darkMode: 'class',
    theme: {
        screens: breakpoints,
        extend: {
            colors: {
                // Brand Color Scales
                teal: Object.entries(colors.teal).reduce((acc, [key, value]) => {
                    acc[key] = `rgb(${value} / <alpha-value>)`;
                    return acc;
                }, {} as Record<string, string>),
                yellow: Object.entries(colors.yellow).reduce((acc, [key, value]) => {
                    acc[key] = `rgb(${value} / <alpha-value>)`;
                    return acc;
                }, {} as Record<string, string>),
                orange: Object.entries(colors.orange).reduce((acc, [key, value]) => {
                    acc[key] = `rgb(${value} / <alpha-value>)`;
                    return acc;
                }, {} as Record<string, string>),
                coral: Object.entries(colors.coral).reduce((acc, [key, value]) => {
                    acc[key] = `rgb(${value} / <alpha-value>)`;
                    return acc;
                }, {} as Record<string, string>),
                
                // Semantic Colors (mapped to CSS custom properties)
                ...Object.entries(colors.semantic).reduce((acc, [key, _value]) => {
                    acc[key] = `rgb(var(--color-${key}) / <alpha-value>)`;
                    return acc;
                }, {} as Record<string, string>),
            },
            animation: animations.presets,
            keyframes: animations.keyframes,
        },
    },
    plugins: [
        function({ addVariant }: any) {
            addVariant('high-contrast', '.high-contrast &')
            addVariant('gentle', '.gentle &')
        }
    ],
}

export default config