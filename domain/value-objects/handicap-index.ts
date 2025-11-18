/**
 * HandicapIndex Value Object
 * Represents a WHS (World Handicap System) compliant handicap index
 * Valid range: -10.0 to +54.0
 */

export class HandicapIndex {
  private constructor(private readonly value: number) {
    Object.freeze(this)
  }

  static create(value: number): HandicapIndex {
    if (!this.isValid(value)) {
      throw new Error(
        `Invalid handicap index: ${value}. Must be between -10.0 and 54.0`
      )
    }

    // Round to 1 decimal place
    const rounded = Math.round(value * 10) / 10
    return new HandicapIndex(rounded)
  }

  static isValid(value: number): boolean {
    return (
      typeof value === 'number' &&
      !isNaN(value) &&
      value >= -10.0 &&
      value <= 54.0
    )
  }

  getValue(): number {
    return this.value
  }

  /**
   * Calculate playing handicap for a specific course
   * Formula: (Handicap Index × Slope Rating / 113) + (Course Rating - Par)
   */
  calculatePlayingHandicap(
    slopeRating: number,
    courseRating: number,
    par: number
  ): number {
    const playingHandicap =
      (this.value * slopeRating) / 113 + (courseRating - par)
    return Math.round(playingHandicap)
  }

  equals(other: HandicapIndex): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toFixed(1)
  }
}
