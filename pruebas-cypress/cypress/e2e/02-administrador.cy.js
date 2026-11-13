// Habilitado para la presentación
const itOptimizar = it

describe('Administrador: recorrido por los módulos', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  it('ve su rol y los 9 elementos del menú', () => {
    cy.get('#userBadgeRole').should('contain', 'ADMINISTRADOR')
    ;[
      '#menuInicio', '#menuMisRutas', '#menuRutas', '#menuOptimizar', '#menuHistorial',
      '#menuReportes', '#menuFlota', '#menuClientes', '#menuUsuarios',
    ].forEach((id) => cy.get(id).should('be.visible'))
    cy.get('#menuMisRutasText').should('have.text', 'Rutas Asignadas')
  })

  it('Inicio: muestra métricas, gráfico y últimas optimizaciones', () => {
    cy.contains('PANEL PRINCIPAL').should('be.visible')
    cy.get('#kpiRutas').invoke('text').should('match', /^\d[\d.,]*$/)
    cy.get('#kpiAhorro').invoke('text').should('match', /S\.\/ \d[\d.,]*/)
    cy.get('#kpiTiempo').invoke('text').should('match', /^\d+%$/)
    cy.get('#performanceChart').should('exist')
    cy.get('#ultimasOptimizacionesInicioList').should('exist')
  })

  it('Rutas Asignadas: título, filtros y botón de asignar', () => {
    cy.get('#menuMisRutas').click()
    cy.get('#rutasHeaderTitle', { timeout: 20000 }).should('exist')
    cy.get('#misRutasList').should('exist')
    cy.get('#conductorSelectorWrapper').should('be.visible')
    cy.get('#btnAsignarConduccionMisRutas').should('be.visible')
    cy.contains('.filter-tab', 'Por Iniciar').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'En Tránsito').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'Completadas').click().should('have.class', 'active')
    cy.contains('.filter-tab', 'Todas').click().should('have.class', 'active')
  })

  it('Rutas: muestra la red de puntos, el mapa y las secciones de gestión', () => {
    cy.get('#menuRutas').click()
    cy.contains('RED DE PUNTOS Y RUTAS LOGÍSTICAS').should('be.visible')
    cy.contains('Almacén Principal Lima').should('be.visible')
    cy.contains('Planta Siderúrgica Pisco').should('be.visible')
    cy.get('#mapaRedLogistica').should('exist')
    cy.get('#asignacionesTbody').should('exist')
    cy.get('#btnRegistrarNuevaRuta').should('be.visible')
    cy.get('#seccionFlujoEstadosPedidos').should('be.visible')
  })

  itOptimizar('Optimizar Ruta: analiza una ruta y muestra el resultado (crea un registro en la BD)', () => {
    cy.get('#menuOptimizar').click()
    cy.contains('NUEVA OPTIMIZACIÓN DE RUTA').should('be.visible')
    cy.get('#optOrigen').select('A')
    cy.get('#optDestino').select('F')
    cy.get('#optMaterial').select('bobinas')
    cy.get('#optPrioridad').select('Alta')
    cy.get('#optTransporte').select('trailer')
    cy.get('input[name="optObjetivo"][value="equilibrio"]').check()
    cy.get('#btnAnalizarRuta').click()

    cy.get('#optSubLoading').should('be.visible')
    cy.get('#optSubResult', { timeout: 20000 }).should('be.visible')
    cy.get('#optResultTrayecto').invoke('text').should('match', /A.*F/)
    cy.get('#optResultTiempo').should('contain', 'min')
    cy.get('#optResultDistancia').should('contain', 'km')
    cy.get('#optResultCosto').should('contain', 'S/')
    cy.contains('RECOMENDADA (OR-TOOLS)').should('be.visible')
    cy.get('#btnAsignarRuta').should('be.visible')
  })

  it('Historial: carga la tabla de optimizaciones', () => {
    cy.get('#menuHistorial').click()
    cy.get('#menuHistorial').should('have.class', 'active')
    cy.get('#historialTableBody').should('exist')
  })

  it('Reportes: muestra métricas, tabla, gráfico y botones de descarga', () => {
    cy.get('#menuReportes').click()
    cy.get('#kpiReporteRutas').invoke('text').should('match', /\d/)
    cy.get('#kpiReporteToneladas').should('exist')
    cy.get('#kpiReporteTiempo').should('exist')
    cy.get('#kpiReporteAhorro').should('exist')
    cy.get('#reportesTableBody').should('exist')
    cy.get('#reportBarChart').should('exist')
    cy.get('button[onclick="exportarReportePDF()"]').should('be.visible')
    cy.get('button[onclick="exportarReporteExcel()"]').should('be.visible')
  })

  it('Flotas: muestra flotas y vehículos', () => {
    cy.get('#menuFlota').click()
    cy.contains('Control de Flotas y Parque Vehicular').should('be.visible')
    cy.contains('Flotas Registradas').should('be.visible')
    cy.get('#flotasCardsGrid > div').should('have.length.greaterThan', 0)
    cy.get('#vehiculosTbody').should('exist')
  })

  it('Flotas: agrega un vehículo nuevo y lo elimina', () => {
    const placa = 'QAT-' + Cypress._.random(100, 999)
    cy.get('#menuFlota').click()
    cy.get('#vehiculosTbody').should('exist')

    cy.contains('button', '+ Nuevo Vehículo').click()
    cy.get('#vehiculoModal').should('have.class', 'active')
    cy.get('#vehPlaca').type(placa)
    cy.get('#vehModelo').type('Volvo FH 540 (prueba QA)')
    cy.get('#vehCapacidad').type('30')
    cy.get('#vehVolumen').type('40')
    
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaVentana')
    })

    cy.contains('#vehiculoModal button', 'Guardar Vehículo').click()
    cy.get('@alertaVentana').should('have.been.called')

    cy.contains('#vehiculosTbody tr', placa, { timeout: 10000 }).should('be.visible')

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.contains('#vehiculosTbody tr', placa).contains('button', 'Eliminar').click()
    cy.contains('#vehiculosTbody tr', placa).should('not.exist')
  })

  it('Clientes y Pedidos: muestra las dos tablas', () => {
    cy.get('#menuClientes').click()
    cy.contains('Gestión de Clientes y Pedidos de Acero').should('be.visible')
    cy.get('#pedidosTbody').should('exist')
    cy.get('#clientesTbody').should('exist')
  })

  it('Clientes: registra un cliente nuevo y lo elimina', () => {
    const nombre = 'Cliente QA Cypress ' + Cypress._.random(100, 999)
    const ruc = '20' + Cypress._.random(100000000, 999999999)
    cy.get('#menuClientes').click()
    cy.get('#clientesTbody').should('exist')

    cy.contains('button', '+ Registrar Cliente').click()
    cy.get('#clienteModal').should('have.class', 'active')
    cy.get('#cliNombre').type(nombre)
    cy.get('#cliTipoDoc').select('RUC')
    cy.get('#cliNumDoc').type(ruc)
    cy.get('#cliDireccion').type('Av. Prueba QA 123, Lima')
    cy.get('#cliContacto').type('Contacto QA')
    cy.get('#cliTelefono').type('987654321')
    
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaCliente')
    })
    cy.contains('#clienteModal button', 'Guardar Cliente').click()
    cy.get('@alertaCliente').should('have.been.called')

    // Validación robusta buscando el texto en la tabla general
    cy.get('#clientesTbody', { timeout: 15000 }).should('contain', nombre)

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.contains('#clientesTbody tr', nombre).contains('button', 'Eliminar').click()
    cy.contains('#clientesTbody tr', nombre).should('not.exist')
  })

  it('Pedidos: registra un pedido nuevo y lo elimina', () => {
    const destino = 'Destino QA Cypress ' + Cypress._.random(100, 999)
    cy.get('#menuClientes').click()
    
    // Auto-garantizar que exista al menos un cliente en la BD para el pedido
    cy.get('body').then(($body) => {
      if ($body.find('#clientesTbody tr').length === 0) {
        cy.contains('button', '+ Registrar Cliente').click()
        cy.get('#cliNombre').type('Cliente Base Pedido')
        cy.get('#cliTipoDoc').select('RUC')
        cy.get('#cliNumDoc').type('20123456789')
        cy.get('#cliDireccion').type('Lima')
        cy.get('#cliContacto').type('QA')
        cy.get('#cliTelefono').type('987654321')
        cy.window().then((win) => { cy.stub(win, 'alert') })
        cy.contains('#clienteModal button', 'Guardar Cliente').click()
        cy.get('#menuClientes').click()
      }
    })

    cy.contains('button', '+ Registrar Pedido').click()
    cy.get('#pedidoModal').should('have.class', 'active')
    
    // Seleccionar cliente disponible
    cy.get('#pedClienteSelect option', { timeout: 15000 }).should('have.length.greaterThan', 0)
    cy.get('#pedClienteSelect').select(1)
    cy.get('#pedMaterial').select(1)
    cy.get('#pedPeso').clear().type('18')
    cy.get('#pedDestino').type(destino)
    cy.get('#pedPrioridad').select('MEDIA')
    
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertaPedido')
    })
    cy.contains('#pedidoModal button', 'Crear Pedido').click()
    cy.get('@alertaPedido').should('have.been.called')

    cy.contains('#pedidosTbody tr', destino, { timeout: 15000 }).should('be.visible')

    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true)
    })

    cy.contains('#pedidosTbody tr', destino).contains('button', 'Eliminar').click()
    cy.contains('#pedidosTbody tr', destino).should('not.exist')
  })

  it('Configuración (Cuentas): lista usuarios y abre el formulario de nueva cuenta', () => {
    cy.get('#menuUsuarios').click()
    cy.contains('#usersTbody tr', 'admin@acerosarequipa.com').should('be.visible')
    cy.contains('#usersTbody tr', 'rgomez@acerosarequipa.com').should('be.visible')

    cy.get('button[onclick="openNewUserModal()"]').click()
    cy.get('#userModal').should('have.class', 'active')
    cy.get('#formNombres').should('be.visible')
    cy.get('#formRol').should('be.visible')
    cy.contains('#userModal button', 'Cancelar').click()
    cy.get('#userModal').should('not.have.class', 'active')
  })

  it('Cerrar sesión: vuelve a la pantalla de login', () => {
    cy.contains('.nav-item.logout', 'Cerrar sesión').click()
    cy.url().should('include', 'index.html')
    cy.get('#btnSubmit').should('be.visible')
  })
})