/**
 * ClubSlug Value Object
 * Represents a URL-safe unique identifier for a club
 * Used in URLs: slug.golf-tournament.com or /clubs/slug
 */

export class ClubSlug {
  private constructor(private readonly value: string) {
    Object.freeze(this)
  }

  /**
   * Create a ClubSlug from a validated slug string
   */
  static create(value: string): ClubSlug {
    if (!value || value.trim().length === 0) {
      throw new Error('Slug cannot be empty')
    }

    const trimmed = value.trim()

    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new Error('Slug must be between 3 and 50 characters')
    }

    if (!this.isValidFormat(trimmed)) {
      throw new Error(
        'Invalid slug format. Use only lowercase letters, numbers, and hyphens. ' +
        'Cannot start or end with hyphen, and cannot have consecutive hyphens.'
      )
    }

    return new ClubSlug(trimmed)
  }

  /**
   * Generate a slug from a human-readable string (e.g., club name)
   */
  static fromString(input: string): ClubSlug {
    if (!input || input.trim().length === 0) {
      throw new Error('Input string cannot be empty')
    }

    // Convert to lowercase and trim
    let slug = input.toLowerCase().trim()

    // Replace umlauts and special characters
    const umlautMap: Record<string, string> = {
      'ä': 'ae',
      'ö': 'oe',
      'ü': 'ue',
      'ß': 'ss',
      'é': 'e',
      'è': 'e',
      'ê': 'e',
      'à': 'a',
      'á': 'a',
      'â': 'a',
      'ô': 'o',
      'ó': 'o',
      'ò': 'o',
      'ú': 'u',
      'ù': 'u',
      'û': 'u',
      'ñ': 'n',
      'ç': 'c',
    }

    for (const [umlaut, replacement] of Object.entries(umlautMap)) {
      slug = slug.replace(new RegExp(umlaut, 'g'), replacement)
    }

    // Replace spaces and special characters with hyphens
    slug = slug.replace(/[^a-z0-9]+/g, '-')

    // Remove leading and trailing hyphens
    slug = slug.replace(/^-+|-+$/g, '')

    // Replace consecutive hyphens with single hyphen
    slug = slug.replace(/-+/g, '-')

    // Validate result
    if (slug.length === 0) {
      throw new Error('Cannot generate valid slug from input')
    }

    if (slug.length < 3) {
      throw new Error('Generated slug is too short (minimum 3 characters)')
    }

    if (slug.length > 50) {
      // Truncate to 50 characters, ensuring we don't end with a hyphen
      slug = slug.substring(0, 50).replace(/-+$/, '')
      if (slug.length < 3) {
        throw new Error('Generated slug is too long and cannot be truncated properly')
      }
    }

    return new ClubSlug(slug)
  }

  /**
   * Check if a string is a valid slug format
   */
  static isValid(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false
    }

    const trimmed = value.trim()

    if (trimmed.length < 3 || trimmed.length > 50) {
      return false
    }

    return this.isValidFormat(trimmed)
  }

  /**
   * Check if slug matches the required format
   */
  private static isValidFormat(value: string): boolean {
    // Only lowercase letters, numbers, and hyphens
    // Cannot start or end with hyphen
    // Cannot have consecutive hyphens
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    return slugRegex.test(value)
  }

  getValue(): string {
    return this.value
  }

  equals(other: ClubSlug): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
