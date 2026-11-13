describe('Login del Sistema Experto de Optimización de Rutas', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080')
  })

  const iniciarSesion = (correo, clave) => {
    cy.get('input:visible').first().clear().type(correo)
    cy.get('input[type="password"]:visible').first().clear().type(clave)
    cy.get('#btnSubmit').click()
  }

  it('muestra la pantalla de login con los tres tipos de acceso', () => {
    cy.contains(/sistema experto/i).should('exist')
    cy.contains('Administrador').should('be.visible')
    cy.contains('Supervisor').should('be.visible')
    cy.contains('Transportista').should('be.visible')
    cy.get('input[type="password"]:visible').should('have.length.at.least', 1)
    cy.get('#btnSubmit').should('be.visible')
  })

  it('el administrador inicia sesión correctamente', () => {
    iniciarSesion('admin@acerosarequipa.com', '123456')
    cy.get('#btnSubmit:visible').should('not.exist')
  })

  it('el supervisor inicia sesión correctamente', () => {
    cy.contains('Supervisor').click()
    iniciarSesion('rgomez@acerosarequipa.com', '123456')
    cy.get('#btnSubmit:visible').should('not.exist')
  })

  it('el transportista inicia sesión correctamente', () => {
    cy.contains('Transportista').click()
    iniciarSesion('mquispe@acerosarequipa.com', '123456')
    cy.get('#btnSubmit:visible').should('not.exist')
  })

  it('rechaza una contraseña incorrecta', () => {
    iniciarSesion('admin@acerosarequipa.com', 'clave_incorrecta')
    cy.get('#btnSubmit:visible').should('exist')
  })

  it('no entra con los campos vacíos', () => {
    cy.get('input:visible').first().clear()
    cy.get('#btnSubmit').click()
    cy.get('#btnSubmit:visible').should('exist')
  })
})