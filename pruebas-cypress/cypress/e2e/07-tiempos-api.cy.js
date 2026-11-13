// Mide cuánto tarda cada endpoint con UN solo usuario (solo lectura).
// Si una prueba falla, el mensaje dice cuántos milisegundos tardó: ese dato va al informe
// y es el punto de partida para la prueba de carga con JMeter.

const ENDPOINTS = [
  '/api/dashboard/resumen',
  '/api/pedidos',
  '/api/clientes',
  '/api/vehiculos',
  '/api/flotas',
  '/api/asignaciones',
  '/api/transportistas',
  '/api/usuarios',
  '/api/historial',
  '/api/reportes/resumen',
]

describe('Tiempos de respuesta de la API (1 usuario)', () => {
  ENDPOINTS.forEach((endpoint) => {
    it(`${endpoint} responde en menos de 60 segundos`, () => {
      cy.apiToken('admin').then((token) => {
        cy.request({
          url: endpoint,
          headers: { Authorization: 'Bearer ' + token },
          timeout: 240000, // espera hasta 4 min para poder medir el tiempo real
        }).then((res) => {
          cy.log(`${endpoint}: ${res.duration} ms`)
          expect(res.duration, `${endpoint} tardó ${res.duration} ms`).to.be.lessThan(60000)
        })
      })
    })
  })
})
