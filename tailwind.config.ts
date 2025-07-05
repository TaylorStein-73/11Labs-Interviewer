import type { Config } from 'tailwindcss'

export default {
  content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // EngagedMD Brand Colors - Official Guidelines
        primary: {
          // Dark Green - Primary brand color
          50: '#f0f9fa',
          100: '#d9f2f4',
          200: '#b3e4ea',
          300: '#7dd1db',
          400: '#40b5c4',
          500: '#2499aa',
          600: '#1e7d8f',
          700: '#1c6574',
          800: '#1c5460',
          900: '#005459', // Brand Dark Green
          950: '#003438',
        },
        // Cream - Secondary brand color
        cream: {
          50: '#ffffff',
          100: '#FFF2E3', // Brand Cream
          200: '#feecd4',
          300: '#fde0b8',
          400: '#fbcf90',
          500: '#f8b968',
          600: '#f5a142',
          700: '#e8882b',
          800: '#c06d26',
          900: '#9d5924',
        },
        // Pink - Accent color
        pink: {
          50: '#fef7f3',
          100: '#fdeee6',
          200: '#fbdacc',
          300: '#f8bfa8',
          400: '#f49973',
          500: '#F54FB0', // Brand Pink
          600: '#e8397a',
          700: '#d8285d',
          800: '#b7204e',
          900: '#981d44',
        },
        // Teal - Accent color
        teal: {
          50: '#f0fdfc',
          100: '#ccfbf7',
          200: '#99f6f0',
          300: '#5eebe5',
          400: '#2dd8d4',
          500: '#05C9BF', // Brand Teal
          600: '#0891a3',
          700: '#0e7283',
          800: '#155b69',
          900: '#164c57',
        },
        // Orange - Accent color
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#FF9663', // Brand Orange
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Gray for body text
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#343C44', // Brand Gray for body text
          900: '#111827',
        },
        // Medical interface colors (keeping existing for compatibility)
        medical: {
          primary: '#005459', // Dark Green
          secondary: '#FFF2E3', // Cream
          accent: '#05C9BF', // Teal
          text: '#343C44', // Gray
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        medical: ['Source Sans Pro', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'medical': '0.5rem',
      },
      boxShadow: {
        'medical': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medical-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
} satisfies Config
