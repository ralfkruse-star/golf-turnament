/**
 * Player Registration Page Object
 */

import { Page } from '@playwright/test'
import { BasePage } from './BasePage'

export class PlayerRegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  async navigateToRegistration() {
    await this.goto('/register')
  }

  async fillPersonalInfo(data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: string
    gender?: 'MALE' | 'FEMALE' | 'OTHER'
  }) {
    await this.fill('[name="firstName"]', data.firstName)
    await this.fill('[name="lastName"]', data.lastName)
    await this.fill('[name="email"]', data.email)

    if (data.phone) {
      await this.fill('[name="phone"]', data.phone)
    }

    if (data.dateOfBirth) {
      await this.fill('[name="dateOfBirth"]', data.dateOfBirth)
    }

    if (data.gender) {
      await this.selectOption('[name="gender"]', data.gender)
    }
  }

  async fillHandicapInfo(data: {
    handicapIndex: number
    homeClub?: string
    whsId?: string
  }) {
    await this.fill('[name="handicapIndex"]', data.handicapIndex.toString())

    if (data.homeClub) {
      await this.fill('[name="homeClub"]', data.homeClub)
    }

    if (data.whsId) {
      await this.fill('[name="whsId"]', data.whsId)
    }
  }

  async selectMembershipType(type: 'MEMBER' | 'GUEST' | 'CORPORATE' | 'TRIAL') {
    await this.selectOption('[name="membershipType"]', type)
  }

  async acceptDSGVO() {
    await this.check('[name="consentGiven"]')
  }

  async acceptMarketing() {
    await this.check('[name="marketingConsent"]')
  }

  async submitRegistration() {
    await this.click('[data-testid="submit-registration"]')
  }

  async completeRegistration(data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    handicapIndex: number
    membershipType?: 'MEMBER' | 'GUEST' | 'CORPORATE' | 'TRIAL'
    acceptMarketing?: boolean
  }) {
    await this.fillPersonalInfo(data)
    await this.fillHandicapInfo({ handicapIndex: data.handicapIndex })

    if (data.membershipType) {
      await this.selectMembershipType(data.membershipType)
    }

    await this.acceptDSGVO()

    if (data.acceptMarketing) {
      await this.acceptMarketing()
    }

    await this.submitRegistration()
  }

  async verifyRegistrationSuccess() {
    await this.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 })
  }

  async getErrorMessage(field: string): Promise<string> {
    return await this.getText(`[data-testid="error-${field}"]`)
  }
}
