'use client'

/**
 * Test component to verify UI package imports work correctly in a React component
 * This component tests actual runtime usage, not just module resolution
 */

import { colors, breakpoints, typography } from '@minniewinnie/ui'
import { lightTheme, darkTheme, contrastTheme, gentleTheme } from '@minniewinnie/ui/themes'
import { ThemeProvider } from '@minniewinnie/ui/providers'
import { useTheme } from '@minniewinnie/ui/hooks'

// Component that uses the theme hook
function ThemeInfo() {
  const { theme } = useTheme()
  return <li>Current Theme: {theme || 'none'}</li>
}

export function TestUIImports() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">✅ UI Package Import Test</h1>
      <p className="mb-6 text-green-600 font-semibold">
        Success! All imports from @minniewinnie/ui are working correctly!
      </p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Design Tokens:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Primary Color: <span className="font-mono">{colors.teal[500]}</span>
          </li>
          <li>
            Secondary Color: <span className="font-mono">{colors.yellow[500]}</span>
          </li>
          <li>
            Mobile Breakpoint: <span className="font-mono">{breakpoints.sm}</span>
          </li>
          <li>
            Base Font Size: <span className="font-mono">{typography.sizes.base.size}</span>
          </li>
          <li>
            Sans Font: <span className="font-mono">{typography.fonts.sans[0]}</span>
          </li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">All 4 Themes Imported:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Light Theme: <span className="font-mono">{lightTheme.name}</span>
          </li>
          <li>
            Dark Theme: <span className="font-mono">{darkTheme.name}</span>
          </li>
          <li>
            Contrast Theme: <span className="font-mono">{contrastTheme.name}</span>
          </li>
          <li>
            Gentle Theme: <span className="font-mono">{gentleTheme.name}</span>
          </li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Theme Provider Test:</h2>
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          <div className="p-4 border rounded">
            <p>ThemeProvider is working!</p>
            <ul className="list-disc list-inside">
              <ThemeInfo />
            </ul>
          </div>
        </ThemeProvider>
      </div>

      <div className="mt-8 p-4 bg-green-100 rounded">
        <p className="font-semibold">🎉 Phase 3 Complete!</p>
        <p>All UI package exports are configured correctly and working.</p>
      </div>
    </div>
  )
}
