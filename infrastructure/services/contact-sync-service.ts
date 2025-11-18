/**
 * Brevo Contact Sync Service
 * Synchronizes players to Brevo contact lists for marketing campaigns
 */

import * as brevo from '@getbrevo/brevo'
import { getBrevoContactsApi, BREVO_CONFIG, isBrevoConfigured } from '@/lib/brevo'
import { Player, MembershipType } from '@prisma/client'

export interface SyncContactParams {
  email: string
  firstName?: string
  lastName?: string
  attributes?: Record<string, any>
  listIds?: number[]
  updateEnabled?: boolean
}

export class ContactSyncService {
  private api: brevo.ContactsApi | null = null

  constructor() {
    if (isBrevoConfigured()) {
      this.api = getBrevoContactsApi()
    }
  }

  /**
   * Sync a player to Brevo contacts
   */
  async syncPlayer(player: Player, listIds?: number[]): Promise<void> {
    if (!this.api) {
      console.warn('Brevo is not configured. Contact sync skipped for:', player.email)
      return
    }

    try {
      const createContact = new brevo.CreateContact()

      createContact.email = player.email
      createContact.attributes = {
        FIRSTNAME: player.firstName,
        LASTNAME: player.lastName,
        PHONE: player.phone || '',
        MEMBER_NUMBER: player.memberNumber || '',
        HANDICAP_INDEX: player.handicapIndex.toString(),
        MEMBERSHIP_TYPE: player.membershipType,
        MEMBER_SINCE: player.memberSince?.toISOString() || '',
        HOME_CLUB: player.homeClub || '',
        CONSENT_MARKETING: player.marketingConsent,
      }

      // Add to lists
      const defaultLists = this.getDefaultListsForPlayer(player)
      createContact.listIds = listIds || defaultLists.filter((id): id is number => id !== undefined)

      // Update if exists, create if not
      createContact.updateEnabled = true

      await this.api.createContact(createContact)
      console.log(`Contact synced successfully: ${player.email}`)
    } catch (error: any) {
      // Ignore "Contact already exists" error
      if (error.response?.body?.code === 'duplicate_parameter') {
        console.log(`Contact already exists, updating: ${player.email}`)
        await this.updateContact(player, listIds)
      } else {
        console.error('Failed to sync contact:', error)
        throw new Error('Failed to sync contact to Brevo')
      }
    }
  }

  /**
   * Update existing contact
   */
  async updateContact(player: Player, listIds?: number[]): Promise<void> {
    if (!this.api) return

    try {
      const updateContact = new brevo.UpdateContact()

      updateContact.attributes = {
        FIRSTNAME: player.firstName,
        LASTNAME: player.lastName,
        PHONE: player.phone || '',
        MEMBER_NUMBER: player.memberNumber || '',
        HANDICAP_INDEX: player.handicapIndex.toString(),
        MEMBERSHIP_TYPE: player.membershipType,
        MEMBER_SINCE: player.memberSince?.toISOString() || '',
        HOME_CLUB: player.homeClub || '',
        CONSENT_MARKETING: player.marketingConsent,
      }

      // Add to lists if provided
      if (listIds && listIds.length > 0) {
        updateContact.listIds = listIds
      }

      await this.api.updateContact(player.email, updateContact)
      console.log(`Contact updated successfully: ${player.email}`)
    } catch (error) {
      console.error('Failed to update contact:', error)
      throw new Error('Failed to update contact in Brevo')
    }
  }

  /**
   * Remove contact from Brevo
   */
  async deleteContact(email: string): Promise<void> {
    if (!this.api) return

    try {
      await this.api.deleteContact(email)
      console.log(`Contact deleted successfully: ${email}`)
    } catch (error) {
      console.error('Failed to delete contact:', error)
      throw new Error('Failed to delete contact from Brevo')
    }
  }

  /**
   * Add contact to specific list
   */
  async addToList(email: string, listId: number): Promise<void> {
    if (!this.api) return

    try {
      const contactEmails = new brevo.AddContactToList()
      contactEmails.emails = [email]

      await this.api.addContactToList(listId, contactEmails)
      console.log(`Contact added to list ${listId}: ${email}`)
    } catch (error) {
      console.error('Failed to add contact to list:', error)
      throw new Error('Failed to add contact to list')
    }
  }

  /**
   * Remove contact from specific list
   */
  async removeFromList(email: string, listId: number): Promise<void> {
    if (!this.api) return

    try {
      const contactEmails = new brevo.RemoveContactFromList()
      contactEmails.emails = [email]

      await this.api.removeContactFromList(listId, contactEmails)
      console.log(`Contact removed from list ${listId}: ${email}`)
    } catch (error) {
      console.error('Failed to remove contact from list:', error)
      throw new Error('Failed to remove contact from list')
    }
  }

  /**
   * Bulk sync players
   */
  async bulkSyncPlayers(players: Player[]): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const player of players) {
      try {
        await this.syncPlayer(player)
        success++
      } catch (error) {
        failed++
        console.error(`Failed to sync player ${player.email}:`, error)
      }
    }

    console.log(`Bulk sync completed: ${success} success, ${failed} failed`)
    return { success, failed }
  }

  /**
   * Get default lists based on player type
   */
  private getDefaultListsForPlayer(player: Player): (number | undefined)[] {
    const lists: (number | undefined)[] = []

    // All members go to ALL_MEMBERS list
    if (player.membershipType === 'MEMBER') {
      lists.push(BREVO_CONFIG.LISTS.ALL_MEMBERS)
    }

    // Active players (with recent activity)
    if (player.consentGiven) {
      lists.push(BREVO_CONFIG.LISTS.ACTIVE_PLAYERS)
    }

    return lists
  }

  /**
   * Unsubscribe contact (DSGVO compliance)
   */
  async unsubscribe(email: string): Promise<void> {
    if (!this.api) return

    try {
      const updateContact = new brevo.UpdateContact()
      updateContact.attributes = {
        CONSENT_MARKETING: false,
      }

      // Remove from all marketing lists
      const allLists = Object.values(BREVO_CONFIG.LISTS).filter(
        (id): id is number => id !== undefined
      )
      updateContact.unlinkListIds = allLists

      await this.api.updateContact(email, updateContact)
      console.log(`Contact unsubscribed: ${email}`)
    } catch (error) {
      console.error('Failed to unsubscribe contact:', error)
      throw new Error('Failed to unsubscribe contact')
    }
  }
}

// Singleton instance
export const contactSyncService = new ContactSyncService()
