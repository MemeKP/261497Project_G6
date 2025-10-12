import './command';

/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      // ==== token-based (ของเดิม) ====
      loginAndGetToken(email?: string, password?: string): Chainable<string>;
      loginAsAdmin(): Chainable<string>;
      authGet(url: string, token: string): Chainable<Response<any>>;
      authPost(url: string, token: string, body?: any): Chainable<Response<any>>;
      authPatch(url: string, token: string, body?: any): Chainable<Response<any>>;
      authDelete(url: string, token: string): Chainable<Response<any>>;

      // ==== session-based (ของใหม่) ====
      sessionLogin(email: string, password: string): Chainable<void>;
      sessionRequest(
        method: Cypress.HttpMethod, //  ใช้ของ Cypress แทน
        url: string,
        body?: any
      ): Chainable<Response<any>>;
    }
  }
}

export {};
