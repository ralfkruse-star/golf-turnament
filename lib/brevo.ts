/**
 * Brevo (Sendinblue) Client Configuration
 * Official SDK for transactional emails, marketing campaigns, and contacts
 */

import * as brevo from '@getbrevo/brevo'

// Initialize API clients
let apiInstance: brevo.TransactionalEmailsApi | null = null
let contactsApi: brevo.ContactsApi | null = null
let listsApi: brevo.ListsApi | null = null

/**
 * Get configured Brevo Transactional Email API instance
 */
export function getBrevoEmailApi(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set')
    }

    apiInstance = new brevo.TransactionalEmailsApi()
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey)
  }

  return apiInstance
}

/**
 * Get configured Brevo Contacts API instance
 */
export function getBrevoContactsApi(): brevo.ContactsApi {
  if (!contactsApi) {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set')
    }

    contactsApi = new brevo.ContactsApi()
    contactsApi.setApiKey(brevo.ContactsApiApiKeys.apiKey, apiKey)
  }

  return contactsApi
}

/**
 * Get configured Brevo Lists API instance
 */
export function getBrevoListsApi(): brevo.ListsApi {
  if (!listsApi) {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set')
    }

    listsApi = new brevo.ListsApi()
    listsApi.setApiKey(brevo.ListsApiApiKeys.apiKey, apiKey)
  }

  return listsApi
}

/**
 * Check if Brevo is configured
 */
export function isBrevoConfigured(): boolean {
  return !!process.env.BREVO_API_KEY
}

/**
 * Brevo configuration constants
 */
export const BREVO_CONFIG = {
  SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'noreply@golfplatz-siek.de',
  SENDER_NAME: process.env.BREVO_SENDER_NAME || 'Golfplatz Siek',

  // List IDs (create these in Brevo dashboard)
  LISTS: {
    ALL_MEMBERS: Number(process.env.BREVO_LIST_ALL_MEMBERS) || undefined,
    ACTIVE_PLAYERS: Number(process.env.BREVO_LIST_ACTIVE_PLAYERS) || undefined,
    TOURNAMENT_PARTICIPANTS: Number(process.env.BREVO_LIST_TOURNAMENT_PARTICIPANTS) || undefined,
  },

  // Template IDs (create these in Brevo dashboard)
  TEMPLATES: {
    TOURNAMENT_REGISTRATION_CONFIRMATION: Number(process.env.BREVO_TEMPLATE_REGISTRATION_CONFIRMATION) || undefined,
    TOURNAMENT_REMINDER: Number(process.env.BREVO_TEMPLATE_TOURNAMENT_REMINDER) || undefined,
    TOURNAMENT_STARTED: Number(process.env.BREVO_TEMPLATE_TOURNAMENT_STARTED) || undefined,
    TOURNAMENT_RESULTS: Number(process.env.BREVO_TEMPLATE_TOURNAMENT_RESULTS) || undefined,
    SCORECARD_SUBMITTED: Number(process.env.BREVO_TEMPLATE_SCORECARD_SUBMITTED) || undefined,
    PAYMENT_CONFIRMATION: Number(process.env.BREVO_TEMPLATE_PAYMENT_CONFIRMATION) || undefined,
    WELCOME_EMAIL: Number(process.env.BREVO_TEMPLATE_WELCOME) || undefined,
  },
} as const
