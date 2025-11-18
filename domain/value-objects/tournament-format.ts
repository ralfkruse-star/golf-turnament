/**
 * TournamentFormat Value Object
 * Represents different golf tournament formats
 */

export type TournamentFormatType =
  | 'STROKE_PLAY'
  | 'STABLEFORD'
  | 'MATCH_PLAY'
  | 'SCRAMBLE'
  | 'BEST_BALL'
  | 'FOUR_BALL'
  | 'NASSAU'

export class TournamentFormat {
  private constructor(private readonly type: TournamentFormatType) {
    Object.freeze(this)
  }

  static STROKE_PLAY = new TournamentFormat('STROKE_PLAY')
  static STABLEFORD = new TournamentFormat('STABLEFORD')
  static MATCH_PLAY = new TournamentFormat('MATCH_PLAY')
  static SCRAMBLE = new TournamentFormat('SCRAMBLE')
  static BEST_BALL = new TournamentFormat('BEST_BALL')
  static FOUR_BALL = new TournamentFormat('FOUR_BALL')
  static NASSAU = new TournamentFormat('NASSAU')

  static fromString(value: string): TournamentFormat {
    const upperValue = value.toUpperCase() as TournamentFormatType

    switch (upperValue) {
      case 'STROKE_PLAY':
        return TournamentFormat.STROKE_PLAY
      case 'STABLEFORD':
        return TournamentFormat.STABLEFORD
      case 'MATCH_PLAY':
        return TournamentFormat.MATCH_PLAY
      case 'SCRAMBLE':
        return TournamentFormat.SCRAMBLE
      case 'BEST_BALL':
        return TournamentFormat.BEST_BALL
      case 'FOUR_BALL':
        return TournamentFormat.FOUR_BALL
      case 'NASSAU':
        return TournamentFormat.NASSAU
      default:
        throw new Error(`Invalid tournament format: ${value}`)
    }
  }

  getValue(): TournamentFormatType {
    return this.type
  }

  isStrokePlay(): boolean {
    return this.type === 'STROKE_PLAY'
  }

  isStableford(): boolean {
    return this.type === 'STABLEFORD'
  }

  isTeamFormat(): boolean {
    return ['SCRAMBLE', 'BEST_BALL', 'FOUR_BALL'].includes(this.type)
  }

  requiresStablefordScoring(): boolean {
    return this.type === 'STABLEFORD'
  }

  equals(other: TournamentFormat): boolean {
    return this.type === other.type
  }

  toString(): string {
    return this.type
  }

  toDisplayName(): string {
    const names: Record<TournamentFormatType, string> = {
      STROKE_PLAY: 'Stroke Play',
      STABLEFORD: 'Stableford',
      MATCH_PLAY: 'Match Play',
      SCRAMBLE: 'Scramble',
      BEST_BALL: 'Best Ball',
      FOUR_BALL: 'Four Ball',
      NASSAU: 'Nassau',
    }
    return names[this.type]
  }
}
