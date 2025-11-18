/**
 * Scorecard Aggregate Root
 * Manages player scoring for a tournament round
 */

export interface HoleScore {
  hole: number
  par: number
  gross: number
  putts?: number
  fairwayHit?: boolean
  greenInRegulation?: boolean
  penalty?: number
}

export type ScorecardStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'DISQUALIFIED'

export interface ScorecardProps {
  id: string
  tournamentId: string
  playerId: string
  playerHandicap: number
  scores: HoleScore[]
  totalGross?: number
  totalNet?: number
  totalPoints?: number
  status: ScorecardStatus
  startedAt?: Date
  submittedAt?: Date
  verifiedAt?: Date
  markerName?: string
  createdAt: Date
  updatedAt: Date
}

export class Scorecard {
  private constructor(private props: ScorecardProps) {}

  static create(
    tournamentId: string,
    playerId: string,
    playerHandicap: number
  ): Scorecard {
    if (playerHandicap < -10 || playerHandicap > 54) {
      throw new Error('Invalid handicap for scorecard')
    }

    const id = generateId()
    const now = new Date()

    return new Scorecard({
      id,
      tournamentId,
      playerId,
      playerHandicap,
      scores: [],
      status: 'NOT_STARTED',
      createdAt: now,
      updatedAt: now,
    })
  }

  // Getters
  getId(): string {
    return this.props.id
  }

  getStatus(): ScorecardStatus {
    return this.props.status
  }

  getScores(): HoleScore[] {
    return [...this.props.scores]
  }

  getTotalGross(): number | undefined {
    return this.props.totalGross
  }

  getTotalNet(): number | undefined {
    return this.props.totalNet
  }

  getTotalPoints(): number | undefined {
    return this.props.totalPoints
  }

  // Domain logic

  /**
   * Start the round
   */
  start(): void {
    if (this.props.status !== 'NOT_STARTED') {
      throw new Error('Scorecard has already been started')
    }

    this.props.status = 'IN_PROGRESS'
    this.props.startedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Record score for a hole
   */
  recordHoleScore(holeScore: HoleScore): void {
    if (!['NOT_STARTED', 'IN_PROGRESS'].includes(this.props.status)) {
      throw new Error('Cannot record scores on submitted or verified scorecard')
    }

    // Auto-start if not started
    if (this.props.status === 'NOT_STARTED') {
      this.start()
    }

    // Validate hole number
    if (holeScore.hole < 1 || holeScore.hole > 18) {
      throw new Error('Hole number must be between 1 and 18')
    }

    // Validate gross score
    if (holeScore.gross < 1 || holeScore.gross > 15) {
      throw new Error('Gross score must be between 1 and 15')
    }

    // Validate putts
    if (holeScore.putts !== undefined && (holeScore.putts < 0 || holeScore.putts > 10)) {
      throw new Error('Putts must be between 0 and 10')
    }

    // Find existing score for this hole
    const existingIndex = this.props.scores.findIndex((s) => s.hole === holeScore.hole)

    if (existingIndex >= 0) {
      // Update existing score
      this.props.scores[existingIndex] = { ...holeScore }
    } else {
      // Add new score
      this.props.scores.push({ ...holeScore })
    }

    // Sort scores by hole number
    this.props.scores.sort((a, b) => a.hole - b.hole)

    this.props.updatedAt = new Date()
  }

  /**
   * Calculate Stableford points for a hole
   */
  private calculateStablefordPoints(
    gross: number,
    par: number,
    holeHandicap: number,
    playingHandicap: number
  ): number {
    // Calculate strokes received on this hole
    let strokesReceived = 0
    if (playingHandicap >= holeHandicap) {
      strokesReceived = 1
    }
    if (playingHandicap >= 18 + holeHandicap) {
      strokesReceived = 2
    }

    const net = gross - strokesReceived
    const diff = par - net

    // Stableford points: 0 (double bogey+), 1 (bogey), 2 (par), 3 (birdie), 4 (eagle), 5 (albatross)
    if (diff >= 3) return 5 // Albatross or better
    if (diff === 2) return 4 // Eagle
    if (diff === 1) return 3 // Birdie
    if (diff === 0) return 2 // Par
    if (diff === -1) return 1 // Bogey
    return 0 // Double bogey or worse
  }

  /**
   * Calculate totals (gross, net, stableford points)
   */
  calculateTotals(courseInfo: { holes: { hole: number; par: number; handicap: number }[] }): void {
    if (this.props.scores.length === 0) {
      return
    }

    let totalGross = 0
    let totalNet = 0
    let totalPoints = 0

    for (const score of this.props.scores) {
      const holeInfo = courseInfo.holes.find((h) => h.hole === score.hole)
      if (!holeInfo) {
        throw new Error(`Hole ${score.hole} not found in course info`)
      }

      totalGross += score.gross

      // Calculate net score (gross - strokes received)
      let strokesReceived = 0
      if (this.props.playerHandicap >= holeInfo.handicap) {
        strokesReceived = 1
      }
      if (this.props.playerHandicap >= 18 + holeInfo.handicap) {
        strokesReceived = 2
      }

      const netScore = score.gross - strokesReceived
      totalNet += netScore

      // Calculate Stableford points
      const points = this.calculateStablefordPoints(
        score.gross,
        holeInfo.par,
        holeInfo.handicap,
        this.props.playerHandicap
      )
      totalPoints += points
    }

    this.props.totalGross = totalGross
    this.props.totalNet = totalNet
    this.props.totalPoints = totalPoints
    this.props.updatedAt = new Date()
  }

  /**
   * Submit scorecard for verification
   */
  submit(markerName: string, courseInfo: { holes: { hole: number; par: number; handicap: number }[] }): void {
    if (this.props.status !== 'IN_PROGRESS') {
      throw new Error('Can only submit scorecards that are in progress')
    }

    if (this.props.scores.length !== 18) {
      throw new Error('All 18 holes must be scored before submission')
    }

    if (!markerName || markerName.trim().length === 0) {
      throw new Error('Marker name is required')
    }

    // Calculate totals before submission
    this.calculateTotals(courseInfo)

    this.props.status = 'SUBMITTED'
    this.props.submittedAt = new Date()
    this.props.markerName = markerName.trim()
    this.props.updatedAt = new Date()
  }

  /**
   * Verify scorecard (by tournament official)
   */
  verify(): void {
    if (this.props.status !== 'SUBMITTED') {
      throw new Error('Can only verify submitted scorecards')
    }

    this.props.status = 'VERIFIED'
    this.props.verifiedAt = new Date()
    this.props.updatedAt = new Date()
  }

  /**
   * Disqualify scorecard
   */
  disqualify(): void {
    if (['NOT_STARTED', 'DISQUALIFIED'].includes(this.props.status)) {
      throw new Error('Cannot disqualify scorecard in current status')
    }

    this.props.status = 'DISQUALIFIED'
    this.props.updatedAt = new Date()
  }

  /**
   * Check if scorecard is complete (all 18 holes scored)
   */
  isComplete(): boolean {
    return this.props.scores.length === 18
  }

  /**
   * Get score for specific hole
   */
  getHoleScore(holeNumber: number): HoleScore | undefined {
    return this.props.scores.find((s) => s.hole === holeNumber)
  }

  // Serialization
  toJSON(): ScorecardProps {
    return { ...this.props, scores: [...this.props.scores] }
  }
}

function generateId(): string {
  return `scorecard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
