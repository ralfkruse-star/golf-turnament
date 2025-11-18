# 📧 Brevo (Sendinblue) Email Integration

## Übersicht

Brevo (ehemals Sendinblue) ist vollständig integriert für:

- **Transactional Emails**: Turnierbestätigungen, Erinnerungen, Ergebnisse
- **Marketing Automation**: Newsletter, Turnier-Ankündigungen
- **Contact Management**: Automatische Synchronisation von Spielern
- **Analytics**: Öffnungsraten, Klicks, Bounces

---

## 🚀 Setup-Anleitung

### 1. Brevo Account erstellen

1. Registrieren Sie sich bei [Brevo](https://www.brevo.com/de/)
2. Verifizieren Sie Ihre Sender-Email-Adresse (`noreply@golfplatz-siek.de`)
3. Holen Sie sich Ihren API-Key:
   - Gehen Sie zu: **Einstellungen** → **SMTP & API** → **API Keys**
   - Erstellen Sie einen neuen API Key
   - Kopieren Sie den Key

### 2. Environment-Variablen konfigurieren

In Ihrer `.env`-Datei:

```env
# Brevo API Key (required)
BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Sender Info
BREVO_SENDER_EMAIL="noreply@golfplatz-siek.de"
BREVO_SENDER_NAME="Golfplatz Siek"
```

### 3. Contact Lists erstellen

Erstellen Sie folgende Listen im Brevo Dashboard:

1. **Alle Mitglieder** (`All Members`)
   - Für alle registrierten Mitglieder
   - Notieren Sie die List ID

2. **Aktive Spieler** (`Active Players`)
   - Für Spieler mit Marketing-Consent
   - Notieren Sie die List ID

3. **Turnier-Teilnehmer** (`Tournament Participants`)
   - Für Spieler, die an Turnieren teilnehmen
   - Notieren Sie die List ID

Fügen Sie die List IDs zu `.env` hinzu:

```env
BREVO_LIST_ALL_MEMBERS="12"
BREVO_LIST_ACTIVE_PLAYERS="13"
BREVO_LIST_TOURNAMENT_PARTICIPANTS="14"
```

### 4. Email Templates erstellen (Optional)

Für professionelle, branded Emails können Sie Templates im Brevo Dashboard erstellen:

#### Template 1: Turnierbestätigung

**Name**: `Tournament Registration Confirmation`

**Variablen**:
```
{{ params.playerName }}
{{ params.tournamentName }}
{{ params.tournamentDate }}
{{ params.tournamentTime }}
{{ params.registrationNumber }}
{{ params.entryFee }}
{{ params.paymentStatus }}
{{ params.paymentLink }}
{{ params.showPaymentLink }}
```

**Template ID** notieren und in `.env` eintragen:
```env
BREVO_TEMPLATE_REGISTRATION_CONFIRMATION="1"
```

#### Template 2: Turnier-Erinnerung

**Name**: `Tournament Reminder`

**Variablen**:
```
{{ params.playerName }}
{{ params.tournamentName }}
{{ params.tournamentDate }}
{{ params.startTime }}
{{ params.flightNumber }}
{{ params.startingHole }}
{{ params.hasFlightInfo }}
```

```env
BREVO_TEMPLATE_TOURNAMENT_REMINDER="2"
```

#### Template 3: Turnier-Ergebnisse

**Name**: `Tournament Results`

**Variablen**:
```
{{ params.playerName }}
{{ params.tournamentName }}
{{ params.position }}
{{ params.positionSuffix }}
{{ params.totalGross }}
{{ params.totalNet }}
{{ params.totalPoints }}
{{ params.participantCount }}
{{ params.resultsUrl }}
```

```env
BREVO_TEMPLATE_TOURNAMENT_RESULTS="3"
```

#### Template 4: Scorecard eingereicht

**Name**: `Scorecard Submitted`

**Variablen**:
```
{{ params.playerName }}
{{ params.tournamentName }}
{{ params.totalGross }}
{{ params.totalNet }}
{{ params.totalPoints }}
{{ params.submittedAt }}
```

```env
BREVO_TEMPLATE_SCORECARD_SUBMITTED="4"
```

> **Hinweis**: Wenn keine Templates konfiguriert sind, werden automatisch Fallback-HTML-Emails verwendet.

---

## 📝 Verwendung

### Emails senden

```typescript
import { emailService } from '@/infrastructure/services/email-service'

// Turnierbestätigung
await emailService.sendTournamentRegistrationConfirmation(
  { email: 'player@example.com', name: 'Max Mustermann' },
  {
    playerName: 'Max Mustermann',
    tournamentName: 'Herbst-Clubmeisterschaft',
    tournamentDate: new Date('2025-09-15T09:00:00'),
    registrationNumber: 'REG-12345',
    entryFee: 35.0,
    paymentStatus: 'pending',
    paymentLink: 'https://...',
  }
)

// Erinnerung
await emailService.sendTournamentReminder(
  { email: 'player@example.com', name: 'Max Mustermann' },
  {
    playerName: 'Max Mustermann',
    tournamentName: 'Herbst-Clubmeisterschaft',
    tournamentDate: new Date('2025-09-15T09:00:00'),
    startTime: '09:00',
    flightNumber: 3,
    startingHole: 1,
  }
)

// Ergebnisse
await emailService.sendTournamentResults(
  { email: 'player@example.com', name: 'Max Mustermann' },
  {
    playerName: 'Max Mustermann',
    tournamentName: 'Herbst-Clubmeisterschaft',
    position: 2,
    totalGross: 85,
    totalNet: 67,
    totalPoints: 42,
    participantCount: 48,
    resultsUrl: 'https://...',
  }
)
```

### Contact Sync

```typescript
import { contactSyncService } from '@/infrastructure/services/contact-sync-service'

// Einzelnen Spieler syncen
await contactSyncService.syncPlayer(player)

// Zu Liste hinzufügen
await contactSyncService.addToList('player@example.com', 14)

// Bulk-Sync
const result = await contactSyncService.bulkSyncPlayers(players)
console.log(`Synced: ${result.success}, Failed: ${result.failed}`)

// Unsubscribe (DSGVO)
await contactSyncService.unsubscribe('player@example.com')
```

---

## 🧪 Test-Emails

### API Endpoint

```bash
curl -X POST http://localhost:3000/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "registration-confirmation",
    "recipient": {
      "email": "your-email@example.com",
      "name": "Test User"
    }
  }'
```

### Verfügbare Test-Typen

- `registration-confirmation` - Turnierbestätigung
- `tournament-reminder` - Turnier-Erinnerung
- `tournament-results` - Ergebnisse
- `scorecard-submitted` - Scorecard-Bestätigung

---

## 🔔 Webhooks konfigurieren

Richten Sie Webhooks in Brevo ein, um Events zu verarbeiten:

1. Gehen Sie zu: **Transactional** → **Settings** → **Webhooks**
2. Fügen Sie Ihre Webhook-URL hinzu:
   ```
   https://your-domain.com/api/webhooks/brevo
   ```
3. Wählen Sie Events aus:
   - ✅ Hard Bounce
   - ✅ Soft Bounce
   - ✅ Blocked
   - ✅ Spam
   - ✅ Unsubscribed
   - ✅ Delivered
   - ✅ Opened
   - ✅ Click

### Webhook-Events

Das System verarbeitet automatisch:

- **Bounces**: Kennzeichnet ungültige Email-Adressen
- **Spam-Complaints**: Entzieht Marketing-Consent
- **Unsubscribes**: Aktualisiert Player-Präferenzen
- **Delivered/Opened/Click**: Logging für Analytics

---

## 📊 Best Practices

### DSGVO-Compliance

1. **Double Opt-In** für Marketing-Emails:
   ```typescript
   // Player muss marketingConsent = true haben
   if (player.marketingConsent) {
     await contactSyncService.syncPlayer(player)
   }
   ```

2. **Unsubscribe-Link** in allen Marketing-Emails:
   - Brevo fügt automatisch Unsubscribe-Links hinzu
   - Verwenden Sie `{{unsubscribe}}` in Templates

3. **Datenminimierung**:
   - Syncen Sie nur notwendige Attribute
   - Löschen Sie inaktive Kontakte regelmäßig

### Email-Deliverability

1. **SPF/DKIM/DMARC** konfigurieren:
   - Folgen Sie Brevo's Setup-Anleitung für Ihre Domain
   - Verifizieren Sie Ihre Domain in Brevo

2. **Sender Reputation** schützen:
   - Senden Sie keine Emails an bounced Adressen
   - Respektieren Sie Unsubscribes sofort
   - Verwenden Sie double opt-in für Listen

3. **Email-Frequenz**:
   - Maximal 1 Marketing-Email pro Woche
   - Transactional Emails unbegrenzt
   - Verwenden Sie Brevo's Rate Limiting

### Template-Design

1. **Mobile-First**:
   - 60%+ der Emails werden auf mobilen Geräten geöffnet
   - Große Buttons (min. 44x44px)
   - Kurze Zeilen (max. 600px Breite)

2. **Alt-Text** für Bilder:
   - Viele Clients blockieren Bilder standardmäßig
   - Wichtige Info nicht nur in Bildern

3. **Call-to-Action**:
   - Klar und deutlich
   - Oberhalb des Folds
   - Kontrastfarbe verwenden

---

## 📈 Monitoring

### Brevo Dashboard

Überwachen Sie:
- Öffnungsrate (Ziel: >20%)
- Klickrate (Ziel: >3%)
- Bounce-Rate (Ziel: <2%)
- Spam-Complaints (Ziel: <0.1%)

### Application Logs

```bash
# Logs für Email-Versand
docker-compose logs -f app | grep "Email"

# Logs für Webhook-Events
docker-compose logs -f app | grep "Brevo webhook"
```

---

## 🔧 Troubleshooting

### "Brevo is not configured"

**Problem**: API Key fehlt oder ist ungültig

**Lösung**:
```bash
# Prüfen Sie .env
cat .env | grep BREVO_API_KEY

# Key sollte mit "xkeysib-" beginnen
```

### Emails kommen nicht an

**Checkliste**:
1. ✅ API Key korrekt?
2. ✅ Sender-Email verifiziert in Brevo?
3. ✅ SPF/DKIM konfiguriert?
4. ✅ Empfänger-Email existiert?
5. ✅ Spam-Ordner prüfen

**Debug-Logs**:
```typescript
// In email-service.ts aktivieren
console.log('Sending email:', sendSmtpEmail)
```

### Webhook-Fehler

**Problem**: Webhooks werden nicht empfangen

**Lösung**:
1. URL muss öffentlich erreichbar sein (kein localhost)
2. HTTPS erforderlich (in Produktion)
3. Prüfen Sie Brevo Webhook-Logs

---

## 💰 Kosten

**Brevo Free Plan**:
- ✅ 300 Emails/Tag
- ✅ Unbegrenzte Kontakte
- ✅ Alle Features (außer Premium Templates)

**Brevo Starter** (€25/Monat):
- ✅ 20.000 Emails/Monat
- ✅ Kein Daily Limit
- ✅ Advanced Stats

**Empfehlung für Golfplatz Siek**:
- Start: **Free Plan**
- Nach 800 Spieler-Sync: **Starter Plan**

---

## 📚 Weiterführende Links

- [Brevo API Docs](https://developers.brevo.com/)
- [Brevo Node.js SDK](https://github.com/getbrevo/brevo-node)
- [Email Best Practices](https://www.brevo.com/de/blog/email-best-practices/)
- [DSGVO & Email Marketing](https://www.brevo.com/de/gdpr/)

---

## ✅ Checklist für Production

- [ ] API Key konfiguriert
- [ ] Sender-Email verifiziert
- [ ] SPF/DKIM/DMARC konfiguriert
- [ ] Contact Lists erstellt
- [ ] Email Templates erstellt (optional)
- [ ] Webhooks konfiguriert
- [ ] Test-Emails versendet
- [ ] DSGVO-Compliance geprüft
- [ ] Unsubscribe-Links getestet
- [ ] Monitoring eingerichtet

---

**Need Help?**
- Brevo Support: support@brevo.com
- Internal: Siehe `infrastructure/services/email-service.ts`
