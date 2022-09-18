/// <reference types="cypress" />

describe('validate authentication', () => {
    it('cannot access flowchart without login', () => {
      cy.visit('http://localhost:3000/flowchart');
      cy.location().should((location) => {
        expect(location.href).to.eq('http://localhost:3000/auth/sign-in')
        expect(location.search).to.be.empty
      })
    })
})