// Usuarios de prueba del proyecto
const USUARIOS = {
  admin:      { email: 'admin@acerosarequipa.com',  password: '123456' },
  supervisor: { email: 'rgomez@acerosarequipa.com', password: '123456' },
  conductor:  { email: 'mquispe@acerosarequipa.com', password: '123456' },
}

// Inicia sesión por API y abre el dashboard ya autenticado (más rápido que escribir en el formulario).
// Uso: cy.loginAs('admin')  o  cy.loginAs('supervisor', 'flota')
//
// Si NO se indica vista, espera a que termine de cargar la vista inicial antes de seguir.
// Motivo: el dashboard tiene una condición de carrera: si se cambia de menú mientras la vista
// anterior todavía se está cargando, la vista anterior llega tarde y tapa a la nueva.
Cypress.Commands.add('loginAs', (rol, vista) => {
  const u = USUARIOS[rol]
  cy.request('POST', '/api/auth/login', { email: u.email, password: u.password }).then(({ body }) => {
    cy.visit('/dashboard.html' + (vista ? '#' + vista : ''), {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('jwtToken', body.token)
        win.sessionStorage.setItem('currentUser', JSON.stringify({
          idUsuario: body.id,
          nombres: body.nombre,
          email: body.email,
          rol: body.rol,
          codEmpleado: body.codEmpleado || '',
        }))
      },
    })
  })
  if (!vista) {
    cy.get(rol === 'conductor' ? '#viewMisRutas' : '#viewInicio', { timeout: 30000 }).should('exist')
  }
})

// Devuelve solo el token JWT de un rol (para probar la API directamente)
Cypress.Commands.add('apiToken', (rol) => {
  const u = USUARIOS[rol]
  return cy.request('POST', '/api/auth/login', { email: u.email, password: u.password })
    .its('body.token')
})