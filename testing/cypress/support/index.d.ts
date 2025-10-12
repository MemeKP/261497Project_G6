/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Login as admin using session-based auth
     * Stores cookie in Cypress.env("sessionCookie")
     */
    sessionLoginAdmin(): Chainable<void>;

    /**
     *  Send request with admin session cookie automatically attached
     */
    sessionRequest(
      method: string,
      url: string,
      body?: any
    ): Chainable<Cypress.Response<any>>;
  }
}
