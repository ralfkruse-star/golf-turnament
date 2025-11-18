# 📱 Progressive Web App (PWA) Setup Guide

## Übersicht

Das Golf Tournament Management System ist als **Progressive Web App (PWA)** implementiert, die auf jedem Gerät wie eine native App funktioniert.

---

## ✅ Implementierte PWA-Features

### 1. **App Manifest** (`/public/manifest.json`)

Das Web App Manifest definiert, wie die App auf dem Gerät erscheint:

```json
{
  "name": "Golf Tournament Management - Golfplatz Siek",
  "short_name": "Golf Siek",
  "display": "standalone",
  "theme_color": "#16a34a",
  "background_color": "#ffffff"
}
```

**Features:**
- ✅ Standalone-Display-Modus (keine Browser-UI)
- ✅ App-Icons für alle Geräte (72px bis 512px)
- ✅ App-Shortcuts (Scoring, Leaderboard, Profile)
- ✅ Screenshots für App Stores
- ✅ Kategorien: sports, golf, tournaments

### 2. **Service Worker** (`/public/sw.js`)

Der Service Worker ermöglicht Offline-Funktionalität und Caching:

**Caching-Strategien:**
- **Static Assets**: Vorgecacht beim Install
- **API Requests**: Network-first mit Cache-Fallback
- **Scoring Pages**: Besonders priorisiert für Offline-Zugriff
- **Navigation**: Cache-first für schnelle Ladezeiten

**Features:**
- ✅ Offline-Modus für kritische Features
- ✅ Automatische Cache-Aktualisierung
- ✅ Background Sync für Scorecard-Submissions
- ✅ Push Notification Support
- ✅ Intelligente Update-Strategie

### 3. **Offline Scoring** (`/hooks/use-offline-scores.ts`)

Spieler können Scores eingeben, auch ohne Internetverbindung:

**Workflow:**
1. Player gibt Score ein → wird lokal gespeichert
2. Wenn offline → Score wird in Queue gespeichert
3. Wenn online → automatische Synchronisation
4. Retry-Logik bei Fehlern (bis zu 3 Versuche)

**Features:**
- ✅ LocalStorage-basiertes Queueing
- ✅ Automatische Sync bei Reconnect
- ✅ Konflikterkennung (letzte Änderung gewinnt)
- ✅ Status-Feedback für User

### 4. **Online/Offline Status** (`/components/pwa/online-status.tsx`)

User wird über Verbindungsstatus informiert:

```tsx
<OnlineStatus showBanner={true} />
```

**Zeigt:**
- 🟡 Gelbes Banner wenn offline
- 🟢 Grünes Banner wenn Sync läuft
- 📊 Anzahl ausstehender Sync-Items

### 5. **Install Prompt** (`/components/pwa/install-prompt.tsx`)

Fordert User auf, die App zu installieren:

```tsx
<InstallPrompt />
```

**Features:**
- ✅ Automatisches Anzeigen nach 3 Sekunden
- ✅ Dismissable (nicht öfter als alle 7 Tage)
- ✅ Zeigt PWA-Vorteile (Offline, Push, etc.)
- ✅ Native Install-Dialog

---

## 🚀 Installation & Deployment

### Prerequisites

Keine zusätzlichen Packages nötig! Die PWA nutzt nur Web-Standards.

### 1. Icon-Generierung

Erstelle App-Icons für alle Größen:

**Empfohlenes Tool:** [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

```bash
npx pwa-asset-generator logo.png public/icons \
  --background "#ffffff" \
  --padding "10%" \
  --quality 100
```

**Benötigte Größen:**
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

### 2. Screenshots erstellen

Für bessere App-Store-Präsentation:

```bash
# Narrow (Mobile)
public/screenshots/scoring.png (540x720)

# Wide (Desktop)
public/screenshots/leaderboard.png (1280x720)
```

### 3. HTTPS erforderlich

PWAs funktionieren nur über HTTPS (außer localhost):

```nginx
# nginx SSL-Konfiguration
server {
  listen 443 ssl http2;
  server_name golf-siek.de;

  ssl_certificate /etc/letsencrypt/live/golf-siek.de/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/golf-siek.de/privkey.pem;

  location / {
    proxy_pass http://localhost:3000;
  }
}
```

### 4. Service Worker Caching-Strategie anpassen

Falls du Custom Caching brauchst, editiere `/public/sw.js`:

```javascript
const CACHE_VERSION = 'v1.0.1' // Increment bei Änderungen
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  '/custom-page', // Füge hier weitere Seiten hinzu
]
```

---

## 📱 User Experience: App Installation

### Android (Chrome)

1. Öffne die Website in Chrome
2. Klicke "Zur Startseite hinzufügen"
3. Bestätige Installation
4. App erscheint im App-Drawer

### iOS (Safari)

1. Öffne die Website in Safari
2. Tippe auf "Teilen"-Button
3. Scrolle zu "Zum Home-Bildschirm"
4. Benenne die App und bestätige

### Desktop (Chrome, Edge)

1. Öffne die Website
2. Klicke auf Install-Icon in der Adressleiste
3. Bestätige Installation
4. App öffnet sich in eigenem Fenster

---

## 🧪 PWA Testing

### Lighthouse Audit

```bash
# Chrome DevTools > Lighthouse > Progressive Web App
npm run build
npm start

# Oder CLI:
npx lighthouse https://golf-siek.de \
  --only-categories=pwa \
  --output=html \
  --output-path=./pwa-audit.html
```

**Erwartete Scores:**
- ✅ Installable: 100
- ✅ PWA Optimized: 100
- ✅ Fast and reliable: 100

### Service Worker Testing

```bash
# Chrome DevTools > Application > Service Workers
# Teste:
- ✅ Offline-Modus (Network throttling)
- ✅ Cache-Verhalten
- ✅ Update-Flow
- ✅ Background Sync
```

### Offline Testing

```bash
# Chrome DevTools > Network > Offline
1. Gehe zu /scoring
2. Aktiviere Offline-Modus
3. Gib Score ein
4. Überprüfe: Score wird in Queue gespeichert
5. Deaktiviere Offline-Modus
6. Überprüfe: Score wird synchronisiert
```

---

## 🔧 PWA Konfiguration

### Environment Variables

Keine speziellen ENV-Variablen nötig. Die PWA nutzt:
- `NEXTAUTH_URL` für success/cancel URLs
- Standard Next.js Public-Ordner

### Next.js Config

Füge PWA-Headers zu `next.config.js` hinzu (optional):

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}
```

---

## 📊 PWA Analytics

### Tracking PWA Installs

```typescript
// In layout.tsx oder analytics.ts
window.addEventListener('appinstalled', () => {
  // Analytics-Event senden
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA Installed',
    })
  }
})
```

### Tracking Offline Usage

```typescript
// In Service Worker
self.addEventListener('fetch', (event) => {
  if (!navigator.onLine) {
    // Log offline API calls
    fetch('/api/analytics/offline-usage', {
      method: 'POST',
      body: JSON.stringify({ url: event.request.url }),
    })
  }
})
```

---

## 🔐 Security Best Practices

### 1. Content Security Policy (CSP)

```typescript
// In next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline';",
  },
]
```

### 2. Service Worker Scope

Der Service Worker hat Zugriff auf den gesamten Origin. Limitiere wenn nötig:

```javascript
navigator.serviceWorker.register('/sw.js', {
  scope: '/app/', // Nur /app/* wird kontrolliert
})
```

### 3. Cache-Poisoning vermeiden

```javascript
// In sw.js - Validiere Responses vor dem Caching
if (response.ok && response.status === 200) {
  cache.put(request, response.clone())
}
```

---

## 🚧 Troubleshooting

### Problem: Service Worker wird nicht registriert

**Lösung:**
1. Überprüfe HTTPS (außer localhost)
2. Überprüfe `/public/sw.js` existiert
3. Überprüfe Console für Fehler
4. Leere Browser-Cache

### Problem: Offline-Modus funktioniert nicht

**Lösung:**
1. Überprüfe Service Worker ist aktiv (DevTools > Application)
2. Überprüfe Cache enthält benötigte Ressourcen
3. Überprüfe Network-Requests verwenden Fetch-API

### Problem: App wird nicht als installierbar erkannt

**Lösung:**
1. Validiere `manifest.json` ([Web App Manifest Validator](https://manifest-validator.appspot.com/))
2. Überprüfe Icons existieren
3. Überprüfe HTTPS
4. Überprüfe Service Worker ist registriert

### Problem: Updates werden nicht angezeigt

**Lösung:**
1. Inkrementiere `CACHE_VERSION` in sw.js
2. Force-Reload (Ctrl+Shift+R)
3. Unregister alten Service Worker
4. Clear Site Data (DevTools > Application > Storage)

---

## 📈 Performance Optimierung

### 1. Cache-Größe limitieren

```javascript
// In sw.js
const MAX_CACHE_SIZE = 50 // MB

async function trimCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxSize) {
    await cache.delete(keys[0])
    await trimCache(cacheName, maxSize)
  }
}
```

### 2. Precaching optimieren

Nur wirklich notwendige Assets precachen:

```javascript
const STATIC_ASSETS = [
  '/',           // Landing page
  '/offline',    // Offline fallback
  '/scoring',    // Kritische Scoring-Page
]
```

### 3. Network Timeout

```javascript
async function fetchWithTimeout(request, timeout = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  const response = await fetch(request, { signal: controller.signal })
  clearTimeout(id)

  return response
}
```

---

## 🎯 Use Cases

### Use Case 1: Offline Scoring on the Course

**Scenario:** Player ist auf Loch 12, hat kein Mobilfunknetz

1. Player öffnet App (bereits installiert)
2. Scorecard lädt aus Cache
3. Player gibt Score für Loch 12 ein
4. Score wird in LocalStorage gespeichert
5. Auf Loch 18 hat er wieder Netz
6. Scores werden automatisch synchronisiert
7. Leaderboard aktualisiert sich

### Use Case 2: Push Notifications für Tournament Updates

**Scenario:** Admin startet Turnier, alle Spieler sollen benachrichtigt werden

1. Admin klickt "Turnier starten"
2. Server sendet Push-Notification an alle Subscribers
3. Player erhalten Notification auf ihrem Gerät
4. Click auf Notification öffnet App mit Live-Leaderboard

### Use Case 3: Schneller App-Start vom Homescreen

**Scenario:** Player will schnell seinen Score checken

1. Player klickt App-Icon auf Homescreen
2. App startet in <2 Sekunden (aus Cache)
3. Sofortiger Zugriff auf Scorecard
4. Keine Browser-UI, native App-Feeling

---

## 📚 Weitere Ressourcen

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)

---

**Letzte Aktualisierung:** 2025-11-18
**Version:** 1.0.0
