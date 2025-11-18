export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Golf Tournament Manager
        </h1>
        <p className="text-center text-lg text-muted-foreground">
          Golfplatz Siek - Digital Tournament Management
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Tournaments</h2>
            <p className="text-muted-foreground">
              Create and manage tournaments with ease
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Live Scoring</h2>
            <p className="text-muted-foreground">
              Real-time score tracking and leaderboards
            </p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Player Management</h2>
            <p className="text-muted-foreground">
              Manage players, handicaps, and registrations
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
