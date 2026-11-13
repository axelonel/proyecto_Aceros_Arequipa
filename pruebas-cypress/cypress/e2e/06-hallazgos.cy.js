// PRUEBAS DE HALLAZGOS (solo lectura: no crean, editan ni borran datos).
// Cada prueba afirma el comportamiento CORRECTO. Si el defecto existe, la prueba FALLA
// y el mensaje de error sirve como evidencia para el informe.

const auth = (token) => ({ Authorization: 'Bearer ' + token })

describe('Hallazgos: coherencia de los indicadores', () => {
  it('Historial: "Rutas óptimas" coincide con las rutas óptimas reales de la BD', () => {
    cy.apiToken('admin').then((token) => {
      cy.request({
        url: '/api/historial/paginado?page=0&size=1000&search=',
        headers: auth(token),
        timeout: 120000,
      }).then(({ body }) => {
        const optimas = (body.items || []).filter((r) => r.estadoRuta === 'OPTIMA').length
        cy.loginAs('admin', 'historial')
        cy.get('#kpiHistorialOptimas').should('have.text', String(optimas))
      })
    })
  })

  it('Historial: "Flota en ruta" coincide con los vehículos EN_RUTA de la BD', () => {
    cy.apiToken('admin').then((token) => {
      cy.request({ url: '/api/vehiculos', headers: auth(token) }).then(({ body }) => {
        const enRuta = body.filter((v) => v.estadoOperativo === 'EN_RUTA').length
        cy.loginAs('admin', 'historial')
        cy.get('#kpiHistorialFlotaActiva').should('have.text', String(enRuta))
      })
    })
  })

  it('"Rutas analizadas" del Inicio coincide con "Rutas optimizadas" de Reportes', () => {
    cy.loginAs('admin')
    cy.get('#kpiRutas').invoke('text').should('match', /^\d[\d.,]*$/).then((inicio) => {
      cy.get('#menuReportes').click()
      cy.get('#kpiReporteRutas').should('have.text', inicio)
    })
  })

  it('Conductor: "Por iniciar / en tránsito" suma las rutas por iniciar y en tránsito', () => {
    cy.loginAs('conductor')
    cy.get('#kpiDriverTotal').should(($k) => {
      expect(Cypress.$('#misRutasList .dispatch-card').length).to.eq(Number($k.text()))
    })
    cy.get('#kpiDriverTransito').should(($k) => {
      const activas = Cypress.$(
        '#misRutasList .badge-status-asignada, #misRutasList .badge-status-transito'
      ).length
      expect(Number($k.text())).to.eq(activas)
    })
  })

  it('Conductor: el campo DNI de su tarjeta muestra un DNI y no su código de empleado', () => {
    cy.loginAs('conductor')
    cy.get('#driverCardDni').invoke('text').should('match', /^\d{8}$/)
  })
})

describe('Hallazgos: coherencia entre pantallas', () => {
  it('Flotas: el estado de cada vehículo coincide con sus despachos en tránsito', () => {
    cy.apiToken('admin').then((token) => {
      cy.request({ url: '/api/vehiculos', headers: auth(token) }).then(({ body: vehiculos }) => {
        cy.request({ url: '/api/asignaciones', headers: auth(token) }).then(({ body: asignaciones }) => {
          const enTransito = new Set(
            asignaciones.filter((a) => a.estado === 'EN_TRANSITO').map((a) => Number(a.idVehiculo))
          )
          const problemas = vehiculos
            .filter((v) => (v.estadoOperativo === 'EN_RUTA') !== enTransito.has(Number(v.idVehiculo)))
            .map(
              (v) =>
                `${v.placa}: estado ${v.estadoOperativo}, ` +
                `${enTransito.has(Number(v.idVehiculo)) ? 'CON' : 'SIN'} despacho en tránsito`
            )
          expect(problemas, problemas.join(' | ')).to.be.empty
        })
      })
    })
  })

  it('Rutas: el flujo de pedidos muestra el nombre del cliente y no "Cliente #n"', () => {
    cy.loginAs('admin', 'rutas')
    cy.get('#pedidosFlujoTbody tr').should('have.length.greaterThan', 0)
    cy.get('#pedidosFlujoTbody').invoke('text').should('not.match', /Cliente #\d+/)
  })

  it('Rutas: una asignación "Por Iniciar" no debe tener el botón "Entregar" (saltaría el inicio)', () => {
    cy.loginAs('admin', 'rutas')
    cy.get('#asignacionesTbody tr').should('have.length.greaterThan', 0)
    cy.get('#asignacionesTbody tr').each(($tr) => {
      if ($tr.text().includes('Por Iniciar')) {
        expect(
          $tr.find('button:contains("Entregar")').length,
          'botón Entregar en una fila Por Iniciar'
        ).to.eq(0)
      }
    })
  })
})

describe('Hallazgos: permisos en la API (el servidor debe validar el rol)', () => {
  it('un conductor solo recibe SUS asignaciones, no las de otros conductores', () => {
    cy.apiToken('conductor').then((token) => {
      cy.request({ url: '/api/asignaciones', headers: auth(token) }).then(({ body }) => {
        const ajenas = body
          .filter((a) => !(a.conductorNombre || '').includes('Quispe'))
          .map((a) => `#ASG-${a.idAsignacion}: ${a.conductorNombre}`)
        expect(ajenas, 'asignaciones de otros conductores').to.be.empty
      })
    })
  })

  // Se usa un id que no existe (999999) para no borrar nada. Si el servidor responde 404
  // en vez de 403, significa que NO comprobó el rol antes de buscar el registro.
  it('un supervisor NO puede eliminar usuarios por la API', () => {
    cy.apiToken('supervisor').then((token) => {
      cy.request({
        method: 'DELETE',
        url: '/api/usuarios/999999',
        headers: auth(token),
        failOnStatusCode: false,
      })
        .its('status')
        .should('be.oneOf', [401, 403])
    })
  })

  it('un conductor NO puede eliminar vehículos por la API', () => {
    cy.apiToken('conductor').then((token) => {
      cy.request({
        method: 'DELETE',
        url: '/api/vehiculos/999999',
        headers: auth(token),
        failOnStatusCode: false,
      })
        .its('status')
        .should('be.oneOf', [401, 403])
    })
  })
})