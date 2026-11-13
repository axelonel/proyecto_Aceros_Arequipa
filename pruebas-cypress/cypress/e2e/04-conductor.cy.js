describe('Conductor (Transportista): vista restringida', () => {
  beforeEach(() => {
    cy.loginAs('conductor')
  })

  it('entra directo a Mis Rutas y ve solo 3 opciones de menú', () => {
    cy.location('hash').should('eq', '#mis-rutas')
    cy.get('#userBadgeRole').should('contain', 'CONDUCTOR')
    ;['#menuInicio', '#menuMisRutas', '#menuRutas'].forEach((id) =>
      cy.get(id).should('be.visible')
    )
    ;[
      '#menuOptimizar', '#menuHistorial', '#menuReportes',
      '#menuFlota', '#menuClientes', '#menuUsuarios',
    ].forEach((id) => cy.get(id).should('not.be.visible'))
    cy.get('#menuMisRutasText').should('have.text', 'Mis Rutas Asignadas')
  })

  it('Mis Rutas: muestra su perfil, métricas y filtros, sin controles de supervisor', () => {
    cy.get('#rutasHeaderTitle').should('have.text', 'MIS RUTAS ASIGNADAS')
    cy.get('#driverCardName').should('contain', 'Manuel')
    cy.get('#kpiDriverTotal').should('exist')
    cy.get('#kpiDriverEntregadas').should('exist')
    cy.get('#kpiDriverCarga').should('exist')
    cy.get('#conductorSelectorWrapper').should('not.be.visible')
    cy.get('#btnAsignarConduccionMisRutas').should('not.be.visible')
    cy.contains('.filter-tab', 'Por Iniciar').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'En Tránsito').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'Completadas').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'Todas').click().should('have.class', 'active')
  })

  it('el contador "Rutas Asignadas Hoy" coincide con las tarjetas mostradas', () => {
    // Sin hacer clic en "Todas": ese clic dibuja los datos de ejemplo del código, no los de la BD.
    cy.get('#kpiDriverTotal').should(($k) => {
      const n = Number($k.text())
      expect(Cypress.$('#misRutasList .dispatch-card').length).to.eq(n)
    })
  })

  it('Rutas: ve la red de puntos pero no las secciones de gestión', () => {
    cy.get('#menuRutas').click()
    cy.contains('RED DE PUNTOS Y RUTAS LOGÍSTICAS').should('be.visible')
    cy.get('#mapaRedLogistica').should('exist')
    cy.get('#btnRegistrarNuevaRuta').should('not.be.visible')
    cy.get('#seccionFlujoEstadosPedidos').should('not.be.visible')
    cy.get('#seccionRutasRegistradasDb').should('not.be.visible')
  })

  it('Inicio: puede ver el panel principal', () => {
    cy.get('#menuInicio').click()
    cy.contains('PANEL PRINCIPAL').should('be.visible')
  })

  it('NO puede abrir Optimizar por URL: ve alerta y vuelve a Mis Rutas', () => {
    const alerta = cy.stub().as('alerta')
    cy.on('window:alert', alerta)
    cy.window().invoke('showView', 'optimizar')
    cy.get('@alerta').should('have.been.calledWithMatch', /Acceso Restringido/)
    cy.location('hash').should('eq', '#mis-rutas')
  })

  it('NO puede abrir Reportes ni Configuración por URL', () => {
    const alerta = cy.stub().as('alerta')
    cy.on('window:alert', alerta)
    cy.window().invoke('showView', 'reportes')
    cy.get('@alerta').should('have.been.calledWithMatch', /Acceso Restringido/)
    cy.window().invoke('showView', 'usuarios')
    cy.get('@alerta').should('have.been.calledTwice')
    cy.location('hash').should('eq', '#mis-rutas')
  })

  it('Cerrar sesión: vuelve a la pantalla de login', () => {
    cy.contains('.nav-item.logout', 'Cerrar sesión').click()
    cy.url().should('include', 'index.html')
  })
})