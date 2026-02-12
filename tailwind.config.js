import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: [
		'dark',
		// Section-specific navigation colors - backgrounds
		'bg-teal/10',
		'bg-blue/10',
		'bg-green/10',
		'bg-orange/10',
		'bg-purple/10',
		'bg-pink/10',
		// Section-specific navigation colors - borders
		'border-teal',
		'border-blue',
		'border-green',
		'border-orange',
		'border-purple',
		'border-pink',
		// Hover backgrounds
		'hover:bg-teal/5',
		'hover:bg-blue/5',
		'hover:bg-green/5',
		'hover:bg-orange/5',
		'hover:bg-purple/5',
		'hover:bg-pink/5'
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				teal: {
					light: 'var(--color-teal-light)',
					DEFAULT: 'var(--color-teal)',
					dark: 'var(--color-teal-dark)'
				},
				blue: {
					light: 'var(--color-blue-light)',
					DEFAULT: 'var(--color-blue)',
					dark: 'var(--color-blue-dark)'
				},
				green: {
					light: 'var(--color-green-light)',
					DEFAULT: 'var(--color-green)',
					dark: 'var(--color-green-dark)'
				},
				orange: {
					light: 'var(--color-orange-light)',
					DEFAULT: 'var(--color-orange)',
					dark: 'var(--color-orange-dark)'
				},
				purple: {
					light: 'var(--color-purple-light)',
					DEFAULT: 'var(--color-purple)',
					dark: 'var(--color-purple-dark)'
				},
				pink: {
					light: 'var(--color-pink-light)',
					DEFAULT: 'var(--color-pink)',
					dark: 'var(--color-pink-dark)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				display: ['Lexend', 'system-ui', 'sans-serif'],
				sans: ['Inter', 'system-ui', ...fontFamily.sans]
			}
		}
	}
};

export default config;
