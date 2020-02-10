/* eslint-disable cypress/no-unnecessary-waiting */
/* global cy */

const collectResults = (result) => {
  const results = Cypress._
    .chain(result)
    .map('textContent')
    .map((x) => x.trim())
    .value()
    .slice(0, 5)
  return results.length
}

describe('Search', () => {
  before(() => {
    cy.visit('/')
  })

  it('should be available on homepage', () => {
    cy.get('#topbar-search').focus().type('cargo').focus()
    cy.wait(1500).get('.search-results a').then(collectResults).should('be.gte', 2)
    cy.get('#topbar-search').clear()

    cy.get('#topbar-search').focus().type('cargo weight').focus()
    cy.wait(1500).get('.search-results a').then(collectResults).should('be.gte', 1)
    cy.get('#topbar-search').clear()

    cy.get('#topbar-search').focus().type('weight').focus()
    cy.wait(1500).get('.search-results a').then(collectResults).should('be.gte', 3)
    cy.get('#topbar-search').clear()
  })

  it('should close when input loses focus', () => {
    cy.get('#topbar-search').focus().type('cargo').focus()
    cy.get('h1.main-title').click()
    cy.wait(1500).get('.search-results').should('not.be.visible')
  })
})
