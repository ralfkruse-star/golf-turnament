/**
 * Offline Fallback Page
 * Shown when the user is offline and no cached version is available
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline - Golf Tournament Management',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Offline Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Du bist offline
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Es sieht so aus, als hättest du keine Internetverbindung.
          Bitte überprüfe deine Verbindung und versuche es erneut.
        </p>

        {/* Features Available Offline */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Offline verfügbar:
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Scores eingeben (werden synchronisiert, sobald du online bist)
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Scorecards ansehen (zuletzt geladene Daten)
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-6 w-6 text-green-500 mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Turnier-Details ansehen (aus dem Cache)
              </span>
            </li>
          </ul>
        </div>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Erneut versuchen
        </button>

        {/* Back to Home */}
        <a
          href="/"
          className="block mt-4 text-green-600 hover:text-green-700 font-medium"
        >
          ← Zurück zur Startseite
        </a>

        {/* Connection Status */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tipp:</strong> Die App funktioniert auch offline!
            Deine Änderungen werden automatisch synchronisiert, sobald du wieder online bist.
          </p>
        </div>
      </div>
    </div>
  )
}
