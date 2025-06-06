/**
 * Integration test to verify UI package imports work correctly
 * This ensures the monorepo package linking is functioning
 */

// Test importing from main entry
import { 
  colors, 
  breakpoints, 
  typography,
  spacing,
  animations 
} from '@minniewinnie/ui';

// Test importing from specific paths
import { colors as colorsDirectly } from '@minniewinnie/ui/tokens/colors';
import { breakpoints as breakpointsDirectly } from '@minniewinnie/ui/tokens/breakpoints';
import { lightTheme } from '@minniewinnie/ui/themes/light';
import { darkTheme } from '@minniewinnie/ui/themes/dark';
import { contrastTheme } from '@minniewinnie/ui/themes/contrast';
import { gentleTheme } from '@minniewinnie/ui/themes/gentle';
import { ThemeProvider } from '@minniewinnie/ui/providers/ThemeProvider';
import { useTheme } from '@minniewinnie/ui/hooks/useTheme';
import { useMediaQuery } from '@minniewinnie/ui/hooks/useMediaQuery';

describe('UI Package Imports', () => {
  test('Design tokens are importable', () => {
    expect(colors).toBeDefined();
    expect(colors.teal).toBeDefined();
    expect(breakpoints).toBeDefined();
    expect(typography).toBeDefined();
    expect(spacing).toBeDefined();
    expect(animations).toBeDefined();
  });

  test('Direct token imports work', () => {
    expect(colorsDirectly).toBeDefined();
    expect(colorsDirectly).toEqual(colors);
    expect(breakpointsDirectly).toBeDefined();
    expect(breakpointsDirectly).toEqual(breakpoints);
  });

  test('All themes are importable', () => {
    expect(lightTheme).toBeDefined();
    expect(darkTheme).toBeDefined();
    expect(contrastTheme).toBeDefined();
    expect(gentleTheme).toBeDefined();
    
    // Verify theme structure
    expect(lightTheme.name).toBe('light');
    expect(darkTheme.name).toBe('dark');
    expect(contrastTheme.name).toBe('contrast');
    expect(gentleTheme.name).toBe('gentle');
  });

  test('Providers are importable', () => {
    expect(ThemeProvider).toBeDefined();
    expect(typeof ThemeProvider).toBe('function');
  });

  test('Hooks are importable', () => {
    expect(useTheme).toBeDefined();
    expect(typeof useTheme).toBe('function');
    expect(useMediaQuery).toBeDefined();
    expect(typeof useMediaQuery).toBe('function');
  });
});