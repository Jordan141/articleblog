describe('My First Test', () => {
    it('Does not do much', () => {
        expect(true).to.equal(true)
    })
    it('Should fail', () => {
        expect(true).to.equal(false)
    })
    it('Visits the kitchen sink', () => {
        cy.visit('https://example.cypress.io')
    })
    it('Finds the content "type"', () => {
        cy.visit('https://example.cypress.io')
        cy.contains('type')
        cy.contains('type').click()
        cy.url().should('include', '/commands/actions')

        cy.get('.action-email')
        .type('fake@email.com')
        .should('have.value', 'fake@email.com')
    })
})