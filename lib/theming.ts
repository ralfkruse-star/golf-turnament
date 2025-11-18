/**
 * Theming System
 * Dynamic theme generation based on club branding
 */

import { prisma } from './prisma'

export interface ClubTheme {
  primaryColor: string
  secondaryColor: string | null
  logo: string | null
  cssVariables: Record<string, string>
}

/**
 * Default theme colors (fallback)
 */
const DEFAULT_THEME: ClubTheme = {
  primaryColor: '#16a34a', // green-600
  secondaryColor: null,
  logo: null,
  cssVariables: {
    '--color-primary': '#16a34a',
    '--color-primary-dark': '#15803d',
    '--color-primary-light': '#22c55e',
    '--color-primary-foreground': '#ffffff',
  },
}

/**
 * Get club theme configuration
 */
export async function getClubTheme(clubId: string): Promise<ClubTheme> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      primaryColor: true,
      secondaryColor: true,
      logo: true,
    },
  })

  if (!club) {
    return DEFAULT_THEME
  }

  return {
    primaryColor: club.primaryColor || DEFAULT_THEME.primaryColor,
    secondaryColor: club.secondaryColor,
    logo: club.logo,
    cssVariables: generateCSSVariables(club.primaryColor, club.secondaryColor),
  }
}

/**
 * Get club theme by slug
 */
export async function getClubThemeBySlug(slug: string): Promise<ClubTheme> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: {
      primaryColor: true,
      secondaryColor: true,
      logo: true,
    },
  })

  if (!club) {
    return DEFAULT_THEME
  }

  return {
    primaryColor: club.primaryColor || DEFAULT_THEME.primaryColor,
    secondaryColor: club.secondaryColor,
    logo: club.logo,
    cssVariables: generateCSSVariables(club.primaryColor, club.secondaryColor),
  }
}

/**
 * Generate CSS variables from color values
 */
export function generateCSSVariables(
  primaryColor: string | null,
  secondaryColor: string | null = null
): Record<string, string> {
  const primary = primaryColor || DEFAULT_THEME.primaryColor

  // Convert hex to RGB for better CSS variable support
  const primaryRGB = hexToRGB(primary)
  const primaryDark = adjustBrightness(primary, -20)
  const primaryLight = adjustBrightness(primary, 20)

  const variables: Record<string, string> = {
    '--color-primary': primary,
    '--color-primary-rgb': primaryRGB,
    '--color-primary-dark': primaryDark,
    '--color-primary-light': primaryLight,
    '--color-primary-foreground': getContrastColor(primary),
  }

  if (secondaryColor) {
    const secondaryRGB = hexToRGB(secondaryColor)
    variables['--color-secondary'] = secondaryColor
    variables['--color-secondary-rgb'] = secondaryRGB
    variables['--color-secondary-foreground'] = getContrastColor(secondaryColor)
  }

  return variables
}

/**
 * Convert hex color to RGB
 */
function hexToRGB(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return '22, 163, 74' // default green
  }

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))

  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

/**
 * Get contrast color (white or black) for text on colored background
 */
function getContrastColor(hex: string): string {
  const rgb = hexToRGB(hex)
  const [r, g, b] = rgb.split(', ').map(Number)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Generate theme CSS string
 */
export function generateThemeCSS(theme: ClubTheme): string {
  const cssVars = Object.entries(theme.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ')

  return `
:root {
  ${cssVars}
}
  `.trim()
}

/**
 * Generate inline style object for React components
 */
export function generateInlineStyles(theme: ClubTheme): Record<string, string> {
  return theme.cssVariables
}

/**
 * Validate color format
 */
export function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Get theme meta tags for HTML head
 */
export function getThemeMetaTags(theme: ClubTheme) {
  return [
    { name: 'theme-color', content: theme.primaryColor },
    { name: 'msapplication-TileColor', content: theme.primaryColor },
  ]
}

/**
 * Generate manifest.json for PWA with dynamic theming
 */
export function generateManifest(clubName: string, theme: ClubTheme) {
  return {
    name: clubName,
    short_name: clubName,
    description: `Tournament management for ${clubName}`,
    theme_color: theme.primaryColor,
    background_color: '#ffffff',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: theme.logo
      ? [
          {
            src: theme.logo,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: theme.logo,
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      : [],
  }
}
