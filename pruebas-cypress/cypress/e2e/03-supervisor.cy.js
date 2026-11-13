describe('Supervisor: permisos y módulos', () => {
  beforeEach(() => {
    cy.loginAs('supervisor')
  })

  it('ve su rol y el menú SIN Configuración de cuentas', () => {
    cy.get('#userBadgeRole').should('contain', 'SUPERVISOR')
    ;[
      '#menuInicio', '#menuMisRutas', '#menuRutas', '#menuOptimizar',
      '#menuHistorial', '#menuReportes', '#menuFlota', '#menuClientes',
    ].forEach((id) => cy.get(id).should('be.visible'))
    cy.get('#menuUsuarios').should('not.be.visible')
    cy.get('#menuMisRutasText').should('have.text', 'Rutas Asignadas')
  })

  it('Inicio: muestra las mismas métricas que el administrador', () => {
    cy.contains('PANEL PRINCIPAL').should('be.visible')
    cy.get('#kpiRutas').invoke('text').should('match', /^\d[\d.,]*$/)
    cy.get('#kpiAhorro').invoke('text').should('match', /S\.\/ \d[\d.,]*/)
    cy.get('#kpiTiempo').invoke('text').should('match', /^\d+%$/)
    cy.get('#performanceChart').should('exist')
  })

  it('Rutas Asignadas: ve el selector de conductor y puede asignar', () => {
    cy.get('#menuMisRutas').click()
    cy.get('#rutasHeaderTitle').should('contain', 'RUTAS ASIGNADAS')
    cy.get('#conductorSelectorWrapper').should('be.visible')
    cy.get('#btnAsignarConduccionMisRutas').should('be.visible')
  })

  it('Rutas: ve la red de puntos y las secciones de gestión', () => {
    cy.get('#menuRutas').click()
    cy.contains('RED DE PUNTOS Y RUTAS LOGÍSTICAS').should('be.visible')
    cy.get('#mapaRedLogistica').should('exist')
    cy.get('#btnRegistrarNuevaRuta').should('be.visible')
    cy.get('#seccionFlujoEstadosPedidos').should('be.visible')
  })

  it('Optimizar Ruta: ve el formulario y la tabla de pedidos pendientes', () => {
    cy.get('#menuOptimizar').click()
    cy.contains('NUEVA OPTIMIZACIÓN DE RUTA').should('be.visible')
    cy.get('#optOrigen').should('be.visible')
    cy.get('#optDestino').should('be.visible')
    cy.get('#btnAnalizarRuta').should('be.visible')
    cy.contains('Pedidos Pendientes de Optimización').should('be.visible')
  })

  it('Historial y Reportes: puede entrar y descargar reportes', () => {
    cy.get('#menuHistorial').click()
    cy.get('#historialTableBody').should('exist')
    cy.get('#menuReportes').click()
    cy.get('#reportesTableBody').should('exist')
    cy.get('button[onclick="exportarReportePDF()"]').should('be.visible')
    cy.get('button[onclick="exportarReporteExcel()"]').should('be.visible')
  })

  it('Flotas: puede abrir los formularios de nueva flota y nuevo vehículo', () => {
    cy.get('#menuFlota').click()
    cy.get('#vehiculosTbody tr').should('have.length.greaterThan', 0)

    cy.contains('button', '+ Nueva Flota').click()
    cy.get('#flotaModal').should('have.class', 'active')
    cy.contains('#flotaModal button', 'Cancelar').click()
    cy.get('#flotaModal').should('not.have.class', 'active')

    cy.contains('button', '+ Nuevo Vehículo').click()
    cy.get('#vehiculoModal').should('have.class', 'active')
    cy.contains('#vehiculoModal button', 'Cancelar').click()
    cy.get('#vehiculoModal').should('not.have.class', 'active')
  })

  it('Clientes y Pedidos: puede abrir los formularios de cliente y pedido', () => {
    cy.abrirClientes()
    cy.get('#clientesTbody tr').should('exist')

    cy.contains('button', '+ Registrar Cliente').click()
    cy.get('#clienteModal').should('have.class', 'active')
    cy.contains('#clienteModal button', 'Cancelar').click()
    cy.get('#clienteModal').should('not.have.class', 'active')

    cy.contains('button', '+ Registrar Pedido').click()
    cy.get('#pedidoModal').should('have.class', 'active')
    cy.contains('#pedidoModal button', 'Cancelar').click()
    cy.get('#pedidoModal').should('not.have.class', 'active')
  })

  it('NO puede abrir Configuración de cuentas: ve alerta y vuelve a Inicio', () => {
    const alerta = cy.stub().as('alerta')
    cy.on('window:alert', alerta)
    cy.window().invoke('showView', 'usuarios')
    cy.get('@alerta').should('have.been.calledWithMatch', /Acceso Restringido/)
    cy.location('hash').should('eq', '#inicio')
    cy.contains('PANEL PRINCIPAL').should('be.visible')
  })

  it('Cerrar sesión: vuelve a la pantalla de login', () => {
    cy.contains('.nav-item.logout', 'Cerrar sesión').click()
    cy.url().should('include', 'index.html')
  })
})