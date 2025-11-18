/**
 * Live Scoring Page (Mobile-First)
 * Allows players to enter scores hole-by-hole
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data - in production this would come from API
const mockCourse = {
  name: 'Golfplatz Siek',
  holes: Array.from({ length: 18 }, (_, i) => ({
    hole: i + 1,
    par: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4][i],
    handicap: [10, 4, 16, 2, 8, 12, 18, 6, 14, 11, 17, 7, 1, 9, 15, 13, 3, 5][i],
    yardage: [420, 380, 180, 520, 400, 390, 160, 540, 410, 420, 170, 390, 530, 400, 165, 410, 525, 415][i],
  })),
}

export default function ScoringPage({
  params,
}: {
  params: Promise<{ scorecardId: string }>
}) {
  const [currentHole, setCurrentHole] = useState(1)
  const [scores, setScores] = useState<Record<number, number>>({})

  const hole = mockCourse.holes[currentHole - 1]
  const isLastHole = currentHole === 18
  const isFirstHole = currentHole === 1

  const handleScoreInput = (score: number) => {
    setScores({ ...scores, [currentHole]: score })
  }

  const handleNext = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1)
    }
  }

  const handlePrevious = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1)
    }
  }

  const handleSubmit = async () => {
    // In production: POST to API
    alert('Scorecard submitted!')
  }

  // Calculate total
  const totalGross = Object.values(scores).reduce((sum, score) => sum + score, 0)
  const totalPar = mockCourse.holes
    .slice(0, currentHole)
    .reduce((sum, h) => sum + h.par, 0)
  const scoreToPar = totalGross - totalPar

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Fixed */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Live Scoring</h1>
              <p className="text-sm text-muted-foreground">
                {mockCourse.name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {scoreToPar > 0 && '+'}
                {scoreToPar}
              </div>
              <div className="text-sm text-muted-foreground">
                {Object.keys(scores).length}/18 Löcher
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Current Hole Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-4xl">Loch {hole.hole}</CardTitle>
                <CardDescription className="text-base mt-1">
                  Par {hole.par} • {hole.yardage}m • HCP {hole.handicap}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentHole}/18
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Score Entry - Large Touch Targets */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Dein Score für Loch {hole.hole}
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                    const diff = score - hole.par
                    const isSelected = scores[currentHole] === score

                    return (
                      <button
                        key={score}
                        onClick={() => handleScoreInput(score)}
                        className={`
                          aspect-square rounded-lg border-2 text-lg font-bold
                          transition-all active:scale-95
                          ${isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background hover:border-primary/50'
                          }
                          ${diff < 0 ? 'text-green-600' : ''}
                          ${diff > 0 ? 'text-red-600' : ''}
                        `}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>
                {scores[currentHole] && (
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    {getScoreName(scores[currentHole], hole.par)}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold">{scores[currentHole] || '-'}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{hole.par}</div>
                  <div className="text-xs text-muted-foreground">Par</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {scores[currentHole]
                      ? (scores[currentHole] - hole.par > 0 ? '+' : '') + (scores[currentHole] - hole.par)
                      : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">Zu Par</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scorecard Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scorecard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-9 gap-1 text-xs">
              {mockCourse.holes.slice(0, 9).map((h) => (
                <div
                  key={h.hole}
                  className={`
                    text-center p-2 rounded
                    ${h.hole === currentHole ? 'bg-primary text-primary-foreground' : ''}
                    ${scores[h.hole] ? 'font-bold' : 'text-muted-foreground'}
                  `}
                >
                  <div>{h.hole}</div>
                  <div className="text-[10px] opacity-70">Par {h.par}</div>
                  <div className="text-sm font-bold">{scores[h.hole] || '-'}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-9 gap-1 text-xs mt-1">
              {mockCourse.holes.slice(9, 18).map((h) => (
                <div
                  key={h.hole}
                  className={`
                    text-center p-2 rounded
                    ${h.hole === currentHole ? 'bg-primary text-primary-foreground' : ''}
                    ${scores[h.hole] ? 'font-bold' : 'text-muted-foreground'}
                  `}
                >
                  <div>{h.hole}</div>
                  <div className="text-[10px] opacity-70">Par {h.par}</div>
                  <div className="text-sm font-bold">{scores[h.hole] || '-'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevious}
              disabled={isFirstHole}
              className="flex-1"
            >
              ← Vorheriges
            </Button>

            {isLastHole && Object.keys(scores).length === 18 ? (
              <Button
                size="lg"
                onClick={handleSubmit}
                className="flex-1"
              >
                Abgeben ✓
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={handleNext}
                disabled={isLastHole}
                className="flex-1"
              >
                Nächstes →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getScoreName(score: number, par: number): string {
  const diff = score - par

  if (diff <= -3) return '🦅 Albatross oder besser!'
  if (diff === -2) return '🦅 Eagle!'
  if (diff === -1) return '🐦 Birdie!'
  if (diff === 0) return '✓ Par'
  if (diff === 1) return '⚠️ Bogey'
  if (diff === 2) return '❌ Double Bogey'
  return `❌ +${diff}`
}
