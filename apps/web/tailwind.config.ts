import type { Config } from 'tailwindcss';
import preset from '@repo/ui/tailwind-preset';

export default {
  presets: [preset],
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
