describe('Control de acceso', () => {
  it('sin sesión, dashboard.html redirige al login', () => {
    cy.visit('/dashboard.html')
    cy.url().should('include', 'index.html')
  })

  it('la API rechaza peticiones sin token', () => {
    cy.request({ url: '/api/usuarios', failOnStatusCode: false })
      .its('status')
      .should('be.oneOf', [401, 403])
  })

  it('la API rechaza un token inventado', () => {
    cy.request({
      url: '/api/usuarios',
      headers: { Authorization: 'Bearer token.falso.123' },
      failOnStatusCode: false,
    })
      .its('status')
      .should('be.oneOf', [401, 403])
  })

  // Si esta prueba FALLA (la API responde 200), es un hallazgo de seguridad para tu informe:
  // el sistema solo oculta el menú en el navegador, pero el servidor no valida el rol.
  it('un conductor NO puede listar usuarios por la API (solo el administrador)', () => {
    cy.apiToken('conductor').then((token) => {
      cy.request({
        url: '/api/usuarios',
        headers: { Authorization: 'Bearer ' + token },
        failOnStatusCode: false,
      })
        .its('status')
        .should('be.oneOf', [401, 403])
    })
  })

  it('el administrador SÍ puede listar usuarios por la API', () => {
    cy.apiToken('admin').then((token) => {
      cy.request({
        url: '/api/usuarios',
        headers: { Authorization: 'Bearer ' + token },
      })
        .its('status')
        .should('eq', 200)
    })
  })
})