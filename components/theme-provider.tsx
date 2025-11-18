'use client'

/**
 * Theme Provider Component
 * Injects dynamic CSS variables based on club branding
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ClubTheme, generateCSSVariables } from '@/lib/theming'

interface ThemeContextType {
  theme: ClubTheme | null
  updateTheme: (theme: ClubTheme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ClubTheme
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ClubTheme | null>(initialTheme || null)

  const updateTheme = (newTheme: ClubTheme) => {
    setTheme(newTheme)
  }

  // Apply CSS variables when theme changes
  useEffect(() => {
    if (!theme) return

    const root = document.documentElement

    // Apply each CSS variable to :root
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.primaryColor)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = theme.primaryColor
      document.head.appendChild(meta)
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, updateTheme }}>{children}</ThemeContext.Provider>
}

/**
 * Server-side theme injection
 * Use this in layout.tsx to inject theme on server
 */
export function ThemeScript({ theme }: { theme: ClubTheme }) {
  const cssVars = Object.entries(theme.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const root = document.documentElement;
            const vars = ${JSON.stringify(theme.cssVariables)};
            Object.entries(vars).forEach(([key, value]) => {
              root.style.setProperty(key, value);
            });
          })();
        `,
      }}
    />
  )
}

/**
 * Theme style tag for SSR
 */
export function ThemeStyles({ theme }: { theme: ClubTheme }) {
  const cssVars = Object.entries(theme.cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
:root {
${cssVars}
}
        `,
      }}
    />
  )
}
