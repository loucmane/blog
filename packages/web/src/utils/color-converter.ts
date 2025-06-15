// Convert RGB string to HSL values for CSS
export function rgbToHsl(rgb: string): string {
  // Parse RGB values from string like "240 253 250"
  const [r, g, b] = rgb.split(' ').map(Number);
  
  // Normalize RGB values
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;
  
  // Calculate lightness
  const l = (max + min) / 2;
  
  // Calculate saturation
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }
  
  // Calculate hue
  let h = 0;
  if (diff !== 0) {
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / diff + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / diff + 4) / 6;
        break;
    }
  }
  
  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

// Pre-converted values from our UI package colors
export const brandColorsHSL = {
  teal: {
    50: '150 40% 96%',    // #f0fdf4
    100: '166 84% 85%',   // #ccfbf1
    200: '172 76% 75%',   // #99f6e4
    300: '174 62% 62%',   // #5eead4
    400: '174 66% 50%',   // #2dd4bf
    500: '174 57% 38%',   // #2a9d8f
    600: '193 37% 23%',   // #264653
    700: '193 37% 18%',   // #1e3842
    800: '193 38% 15%',   // #182d35
    900: '194 38% 12%',   // #14252c
  },
  yellow: {
    50: '55 92% 95%',     // #fefce8
    100: '55 97% 88%',    // #fef9c3
    200: '48 97% 77%',    // #fef08a
    300: '48 96% 64%',    // #fde047
    400: '46 96% 53%',    // #facc15
    500: '43 64% 66%',    // #e9c46a
    600: '36 97% 40%',    // #ca8a04
    700: '35 91% 33%',    // #a16207
    800: '28 80% 29%',    // #854d0e
    900: '26 75% 25%',    // #713f12
  },
  orange: {
    50: '24 100% 96%',    // #fff7ed
    100: '24 100% 92%',   // #ffedd5
    200: '23 100% 83%',   // #fed7aa
    300: '20 97% 72%',    // #fdba74
    400: '20 94% 61%',    // #fb923c
    500: '27 57% 64%',    // #f4a261
    600: '18 92% 48%',    // #ea580c
    700: '15 86% 40%',    // #c2410c
    800: '13 75% 33%',    // #9a3412
    900: '12 69% 27%',    // #7c2d12
  },
  coral: {
    50: '0 86% 97%',      // #fef2f2
    100: '0 93% 94%',     // #fee2e2
    200: '0 96% 89%',     // #fecaca
    300: '0 93% 82%',     // #fca5a5
    400: '0 91% 71%',     // #f87171
    500: '11 65% 60%',    // #e76f51
    600: '0 82% 50%',     // #dc2626
    700: '0 74% 42%',     // #b91c1c
    800: '0 70% 35%',     // #991b1b
    900: '0 63% 31%',     // #7f1d1d
  }
};