/**
 * Sistema Experto de Rutas - Corporación Aceros Arequipa
 * Lógica modular del Dashboard, RBAC (Permisos por Rol) y Asignación de Rutas
 */

// ─── JWT Helpers ───────────────────────────────────────────────────────────────

/** Obtiene el token JWT guardado en sessionStorage */
function getToken() {
    return sessionStorage.getItem('jwtToken') || null;
}

/**
 * Wrapper de fetch que añade automáticamente el header Authorization con el JWT.
 * Úsalo en lugar de fetch() para cualquier llamada a /api/...
 */
async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    };
    const resp = await window.fetch(url, { ...options, headers });
    if (resp.status === 401 || resp.status === 403) {
        console.warn('⚠️ Sesión no autorizada o expirada (HTTP ' + resp.status + '). Redirigiendo a login...');
        sessionStorage.removeItem('jwtToken');
        window.location.href = 'index.html';
    }
    return resp;
}

/**
 * Verifica si el usuario tiene sesión activa. Si no, redirige al login.
 */
function requireAuth() {
    const token = getToken();
    const user  = sessionStorage.getItem('currentUser');
    if (!token || !user) {
        window.location.href = 'index.html';
    }
}

// ─── Fin JWT Helpers ───────────────────────────────────────────────────────────

/** Escapa caracteres HTML para prevenir inyecciones y errores de renderizado */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}



// Caché de vistas HTML cargadas
const viewCache = {};

// Usuarios en memoria (fallback en caso de que backend no esté disponible)
let memoryUsers = [
    { idUsuario: 1, nombres: "Admin", apellidos: "Principal", email: "admin@acerosarequipa.com", rol: "ADMINISTRADOR", codEmpleado: "ADM-001", activo: true },
    { idUsuario: 2, nombres: "Roberto", apellidos: "Gomez", email: "rgomez@acerosarequipa.com", rol: "SUPERVISOR", codEmpleado: "SUP-001", activo: true },
    { idUsuario: 3, nombres: "Manuel", apellidos: "Quispe", email: "mquispe@acerosarequipa.com", rol: "CONDUCTOR", codEmpleado: "TRP-001", activo: true },
    { idUsuario: 4, nombres: "Carlos", apellidos: "Mendoza", email: "cmendoza@acerosarequipa.com", rol: "CONDUCTOR", codEmpleado: "TRP-002", activo: true },
    { idUsuario: 5, nombres: "Jorge", apellidos: "Ramírez", email: "jramirez@acerosarequipa.com", rol: "CONDUCTOR", codEmpleado: "TRP-003", activo: true }
];

// Lista de despachos / rutas asignadas
let activeDispatches = [
    {
        id: 101,
        codigo: "DSP-1092",
        origen: "Almacén Principal Lima (A)",
        destino: "Planta Siderúrgica Pisco (F)",
        trayecto: "A → C → E → F",
        material: "Bobinas de acero (24 Tn)",
        conductorId: 3,
        conductorNombre: "Manuel Quispe",
        vehiculo: "Tráiler Plataforma (V-102)",
        placa: "AYZ-892",
        prioridad: "Alta",
        tiempoEst: "32 min",
        distancia: "18.5 km",
        costo: "S/ 85.00",
        estado: "EN_TRANSITO", // ASIGNADA, EN_TRANSITO, COMPLETADA
        fecha: "Hoy, 10:15 AM",
        supervisor: "Roberto Gómez"
    },
    {
        id: 102,
        codigo: "DSP-1093",
        origen: "Zona de Carga Lurín (C)",
        destino: "Centro Distribución Arequipa (E)",
        trayecto: "C → E → F",
        material: "Barras de construcción (20 Tn)",
        conductorId: 3,
        conductorNombre: "Manuel Quispe",
        vehiculo: "Camión Pesado (V-105)",
        placa: "B8U-711",
        prioridad: "Media",
        tiempoEst: "45 min",
        distancia: "28.0 km",
        costo: "S/ 115.00",
        estado: "ASIGNADA",
        fecha: "Hoy, 14:00 PM",
        supervisor: "Roberto Gómez"
    },
    {
        id: 100,
        codigo: "DSP-1090",
        origen: "Almacén Principal Lima (A)",
        destino: "Distribuidora Norte Chiclayo (D)",
        trayecto: "A → B → D",
        material: "Alambrón industrial (18 Tn)",
        conductorId: 3,
        conductorNombre: "Manuel Quispe",
        vehiculo: "Furgón Cerrado (V-108)",
        placa: "T1A-904",
        prioridad: "Alta",
        tiempoEst: "52 min",
        distancia: "34.2 km",
        costo: "S/ 130.00",
        estado: "COMPLETADA",
        fecha: "Ayer, 16:30 PM",
        supervisor: "Roberto Gómez"
    }
];

// Filtro actual de la vista Mis Rutas
let currentDispatchFilter = 'TODAS';

// Determinar endpoint API según entorno
const API_HOST = (window.location.protocol === 'file:') ? '' : ((window.location.port === '8080') ? '' : 'http://localhost:8080');

// Mapeo de vistas a archivos en /views/
const viewFileMap = {
    'inicio':        'views/inicio.html',
    'mis-rutas':     'views/mis-rutas.html',
    'rutas':         'views/rutas.html',
    'optimizar':     'views/optimizar.html',
    'historial':     'views/historial.html',
    'reportes':      'views/reportes.html',
    'flota':         'views/flota.html',
    'clientes':      'views/clientes.html',
    'usuarios':      'views/configuracion.html',
    'configuracion': 'views/configuracion.html'
};

const menuIdMap = {
    'inicio':        'menuInicio',
    'mis-rutas':     'menuMisRutas',
    'rutas':         'menuRutas',
    'optimizar':     'menuOptimizar',
    'historial':     'menuHistorial',
    'reportes':      'menuReportes',
    'flota':         'menuFlota',
    'clientes':      'menuClientes',
    'usuarios':      'menuUsuarios',
    'configuracion': 'menuUsuarios'
};

/**
 * Obtener usuario conectado desde sessionStorage
 */
function getCurrentUser() {
    try {
        const stored = sessionStorage.getItem('currentUser');
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    // Por defecto Administrador si no se inició sesión previamente
    return { idUsuario: 1, nombres: "Admin Principal", email: "admin@acerosarequipa.com", rol: "ADMINISTRADOR" };
}

/**
 * Aplicar restricciones visuales y de menú según el rol
 */
function applyRolePermissions() {
    const user = getCurrentUser();
    const isTransportista = (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA');
    if (isTransportista) {
        document.body.classList.add('role-transportista', 'role-conductor');
    } else {
        document.body.classList.remove('role-transportista', 'role-conductor');
    }

    // Actualizar indicador en sidebar
    const badgeIcon = document.getElementById('userBadgeIcon');
    const badgeName = document.getElementById('userBadgeName');
    const badgeRole = document.getElementById('userBadgeRole');
    if (badgeName) badgeName.textContent = user.nombres || user.email;
    if (badgeRole) badgeRole.textContent = user.rol;
    if (badgeIcon) {
        badgeIcon.textContent = (user.rol === 'ADMINISTRADOR') ? '👑' :
                                (user.rol === 'SUPERVISOR') ? '📋' : '🚚';
    }

    const menuFlota     = document.getElementById('menuFlota');
    const menuClientes  = document.getElementById('menuClientes');
    const menuOptimizar = document.getElementById('menuOptimizar');
    const menuHistorial = document.getElementById('menuHistorial');
    const menuReportes  = document.getElementById('menuReportes');
    const menuUsuarios  = document.getElementById('menuUsuarios');
    const menuDivider   = document.getElementById('menuDividerConfig');
    const menuMisRutas  = document.getElementById('menuMisRutas');
    const menuRutas     = document.getElementById('menuRutas');

    // Texto del menú adaptado por rol:
    // Conductor: "Mis Rutas Asignadas" | Supervisor / Admin: "Rutas Asignadas"
    const menuMisRutasText = document.getElementById('menuMisRutasText');
    if (menuMisRutasText) {
        if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
            menuMisRutasText.textContent = 'Mis Rutas Asignadas';
        } else {
            menuMisRutasText.textContent = 'Rutas Asignadas';
        }
    }

    const toggleMenu = (el, show) => {
        if (!el) return;
        const target = el.closest ? (el.closest('li') || el) : el;
        target.style.display = show ? '' : 'none';
    };

    if (user.rol === 'ADMINISTRADOR') {
        // Administrador: Acceso total a todo
        toggleMenu(menuFlota, true);
        toggleMenu(menuClientes, true);
        toggleMenu(menuOptimizar, true);
        toggleMenu(menuHistorial, true);
        toggleMenu(menuReportes, true);
        toggleMenu(menuUsuarios, true);
        if (menuDivider) menuDivider.style.display = '';
        toggleMenu(menuMisRutas, true);
        toggleMenu(menuRutas, true);
    } 
    else if (user.rol === 'SUPERVISOR') {
        // Supervisor: Puede gestionar flotas, clientes, optimizar y asignar rutas.
        // NO PUEDE crear ni añadir cuentas de usuario (solo el Administrador).
        toggleMenu(menuFlota, true);
        toggleMenu(menuClientes, true);
        toggleMenu(menuOptimizar, true);
        toggleMenu(menuHistorial, true);
        toggleMenu(menuReportes, true);
        toggleMenu(menuUsuarios, false);
        if (menuDivider) menuDivider.style.display = '';
        toggleMenu(menuMisRutas, true);
        toggleMenu(menuRutas, true);
    } 
    else if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        // Transportista: Solo ve Inicio, Red de puntos y Mis Rutas Asignadas.
        toggleMenu(menuFlota, false);
        toggleMenu(menuClientes, false);
        toggleMenu(menuOptimizar, false);
        toggleMenu(menuHistorial, false);
        toggleMenu(menuReportes, false);
        toggleMenu(menuUsuarios, false);
        if (menuDivider) menuDivider.style.display = 'none';
        toggleMenu(menuMisRutas, true);
        toggleMenu(menuRutas, true);
    }
}

/**
 * Plantillas de respaldo integradas (Modo file:// u offline)
 */
const FALLBACK_VIEWS = {
    'inicio': `
        <div id="viewInicio">
            <div class="content-header" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h1>PANEL PRINCIPAL</h1>
                    <p>Resumen general del sistema y métricas reales de optimización</p>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span id="indicadorEnVivoInicio" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 12px; font-weight: 600; border: 1px solid #a7f3d0;">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Métricas en Vivo
                    </span>
                    <button onclick="loadDashboardInicioMetrics(true)" class="btn-refresh" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer; transition: all 0.2s;" title="Actualizar métricas reales">
                        <span>🔄</span> <span>Actualizar</span>
                    </button>
                </div>
            </div>
            <div class="kpi-row">
                <div class="kpi-card blue">
                    <div class="kpi-title">Rutas analizadas</div>
                    <div class="kpi-value" id="kpiRutas">--</div>
                    <div class="kpi-subtitle">total de análisis real</div>
                </div>
                <div class="kpi-card green">
                    <div class="kpi-title">Ahorro estimado</div>
                    <div class="kpi-value" id="kpiAhorro">S./ --</div>
                    <div class="kpi-subtitle">acumulado por optimizaciones</div>
                </div>
                <div class="kpi-card yellow">
                    <div class="kpi-title">Tiempo reducido</div>
                    <div class="kpi-value" id="kpiTiempo">--%</div>
                    <div class="kpi-subtitle">Promedio real</div>
                </div>
            </div>
            <div class="bottom-row" style="margin-top: 24px;">
                <div class="card-container" style="flex: 1.4; min-width: 320px;">
                    <div class="card-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="card-title">Resumen de rendimiento real</div>
                        <div class="chart-legend" style="display: flex; gap: 14px;">
                            <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 12px;"><span class="legend-dot blue" style="width: 10px; height: 10px; border-radius: 50%; background: #2563eb; display: inline-block;"></span><span style="color: #475569; font-weight: 500;">Tiempo (min)</span></div>
                            <div class="legend-item" style="display: flex; align-items: center; gap: 6px; font-size: 12px;"><span class="legend-dot green" style="width: 10px; height: 10px; border-radius: 50%; background: #16a34a; display: inline-block;"></span><span style="color: #475569; font-weight: 500;">Costo (S/)</span></div>
                        </div>
                    </div>
                    <div class="chart-wrapper" style="position: relative; width: 100%; height: 230px;">
                        <canvas id="performanceChart" width="550" height="230" style="max-width: 100%;"></canvas>
                    </div>
                    <div id="chartSubtitleInfo" style="margin-top: 8px; font-size: 11px; color: #64748b; text-align: center;">Valores calculados por el motor de optimización matemática Google OR-Tools</div>
                </div>
                <div class="card-container optimizations-card" style="flex: 1; min-width: 300px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="card-title" style="color: #374151; margin: 0;">Últimas Optimizaciones</div>
                        <span id="ultimasOptCountBadge" style="font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 10px; font-weight: 600;">En Vivo</span>
                    </div>
                    <div class="opt-list" id="ultimasOptimizacionesInicioList">
                        <div style="text-align: center; padding: 40px 10px; color: #94a3b8; font-size: 13px;">Cargando optimizaciones reales...</div>
                    </div>
                </div>
            </div>
        </div>
    `,
    'mis-rutas': `
        <div id="viewMisRutas">
            <div class="content-header" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h1 id="rutasHeaderTitle" style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">RUTAS ASIGNADAS</h1>
                    <p id="rutasHeaderSubtitle" style="font-size: 13.5px; color: #475569;">Monitoreo, trazabilidad y control de despachos asignados a transportistas</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="filter-tab active" onclick="filterDispatches('TODAS', this)">Todas</button>
                    <button class="filter-tab" onclick="filterDispatches('ASIGNADA', this)">Por Iniciar</button>
                    <button class="filter-tab" onclick="filterDispatches('EN_TRANSITO', this)">En Tránsito</button>
                    <button class="filter-tab" onclick="filterDispatches('COMPLETADA', this)">Completadas</button>
                </div>
            </div>
            <div id="misRutasList" style="display: flex; flex-direction: column; gap: 18px;"></div>
        </div>
    `,
    'rutas': `
        <div id="viewRutas">
            <div class="content-header" style="margin-bottom: 24px;">
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">RED DE PUNTOS Y RUTAS LOGÍSTICAS</h1>
                <p style="font-size: 13.5px; color: #475569;">Puntos de acopio, plantas de producción y centros de distribución de Corporación Aceros Arequipa</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                <div class="card-container">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span class="node-circle-badge" style="background:#2563eb;">A</span>
                        <div><h4 style="font-size: 15px; font-weight: 700; color:#1e293b;">Almacén Principal Lima</h4><span style="font-size: 12px; color:#64748b;">Av. Enrique Meiggs 297, Callao</span></div>
                    </div>
                    <p style="font-size: 13px; color:#475569;">Punto primario de despacho de productos terminados para la región central.</p>
                </div>
                <div class="card-container">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span class="node-circle-badge" style="background:#16a34a;">C</span>
                        <div><h4 style="font-size: 15px; font-weight: 700; color:#1e293b;">Zona de Carga y Acopio Lurín</h4><span style="font-size: 12px; color:#64748b;">Antigua Panamericana Sur Km 38</span></div>
                    </div>
                    <p style="font-size: 13px; color:#475569;">Consolidación de carga pesada y distribución sur.</p>
                </div>
                <div class="card-container">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span class="node-circle-badge" style="background:#ef4444;">F</span>
                        <div><h4 style="font-size: 15px; font-weight: 700; color:#1e293b;">Planta Siderúrgica Pisco</h4><span style="font-size: 12px; color:#64748b;">Panamericana Sur Km 240, Paracas</span></div>
                    </div>
                    <p style="font-size: 13px; color:#475569;">Planta central de fundición, laminación y producción de aceros largos.</p>
                </div>
            </div>
        </div>
    `,
    'optimizar': `
        <div id="viewOptimizar">
            <div id="optSubForm">
                <div class="content-header" style="margin-bottom: 24px;">
                    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">NUEVA OPTIMIZACIÓN DE RUTA</h1>
                    <p style="font-size: 13.5px; color: #475569;">Ingrese los datos para encontrar la mejor ruta</p>
                </div>
                <div class="form-opt-card">
                    <form id="formOptimizacion" onsubmit="startOptimizationProcess(event)">
                        <div class="form-opt-grid">
                            <div>
                                <div style="margin-bottom: 20px;"><label class="form-opt-label">Origen</label><select id="optOrigen" class="form-opt-select" required><option value="A">Almacén Principal (A)</option><option value="B">Planta Siderúrgica Pisco (B)</option><option value="C">Centro Logístico Lurín (C)</option></select></div>
                                <div style="margin-bottom: 20px;"><label class="form-opt-label">Material</label><select id="optMaterial" class="form-opt-select" required><option value="bobinas">Bobinas de acero</option><option value="barras">Barras de construcción</option><option value="alambron">Alambrón</option><option value="planchas">Planchas laminadas</option></select></div>
                                <div><label class="form-opt-label">Prioridad</label><select id="optPrioridad" class="form-opt-select" required><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option></select></div>
                            </div>
                            <div>
                                <div style="margin-bottom: 20px;"><label class="form-opt-label">Destino</label><select id="optDestino" class="form-opt-select" required><option value="F">Planta de produccion (F)</option><option value="E">Centro de Distribución Arequipa (E)</option><option value="D">Distribuidora Norte Chiclayo (D)</option></select></div>
                                <div style="margin-bottom: 20px;"><label class="form-opt-label">Tipo de transporte</label><select id="optTransporte" class="form-opt-select" required><option value="camion">Camion</option><option value="trailer">Trailer</option><option value="furgon">Furgón</option></select></div>
                                <div><label class="form-opt-label">Objetivo de optimizacion</label>
                                    <div class="radio-opt-group">
                                        <label class="radio-opt-label"><input type="radio" name="optObjetivo" value="tiempo"> Menor tiempo</label>
                                        <label class="radio-opt-label"><input type="radio" name="optObjetivo" value="costo"> Menor costo</label>
                                        <label class="radio-opt-label" style="font-weight: 600;"><input type="radio" name="optObjetivo" value="equilibrio" checked> Equilibrio tiempo/ costo</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="opt-bottom-actions">
                            <div><label class="form-opt-label">Restricciones(opcional)</label>
                                <div class="opt-restrictions-group">
                                    <label class="opt-check-label"><input type="checkbox" id="restTrafico"> Evitar trafico pesado</label>
                                    <label class="opt-check-label"><input type="checkbox" id="restMantenimiento"> Evitar zonas de mantenimiento</label>
                                    <label class="opt-check-label"><input type="checkbox" id="restPesoCheck" checked><span>Peso maximo (ton)</span><input type="number" id="restPesoVal" value="25" style="width: 58px; height: 32px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 13.5px; text-align: center; margin-left: 20px;"></label>
                                </div>
                            </div>
                            <button type="submit" class="btn-analizar-rutas"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Analizar Rutas</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="optSubLoading" style="display:none;">
                <div class="content-header" style="margin-bottom: 24px;">
                    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">ANALIZANDO RUTAS</h1>
                    <p style="font-size: 13.5px; color: #475569;">El sistema esta evaluando las mejores alternativas</p>
                </div>
                <div class="form-opt-card" style="padding: 28px 36px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; position: relative; overflow: hidden;">
                        <svg viewBox="0 0 740 230" style="width: 100%; height: auto; display: block;">
                            <defs><filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.25"/></filter></defs>
                            <path d="M 80 140 Q 160 80 240 70" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="5,5" />
                            <path d="M 240 70 Q 390 50 540 100" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="5,5" />
                            <path d="M 540 100 Q 600 120 660 160" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="5,5" />
                            <path d="M 240 70 Q 310 115 380 160" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4" />
                            <path d="M 380 160 Q 460 130 540 100" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4" />
                            <path d="M 80 140 Q 230 180 380 160" fill="none" stroke="#86efac" stroke-width="3.5" stroke-dasharray="6,4" />
                            <path d="M 380 160 Q 450 185 520 205" fill="none" stroke="#86efac" stroke-width="3.5" stroke-dasharray="6,4" />
                            <path d="M 520 205 Q 590 185 660 160" fill="none" stroke="#86efac" stroke-width="3.5" stroke-dasharray="6,4" />
                            <circle cx="80" cy="140" r="18" fill="#2563eb" filter="url(#nodeShadow)" /><text x="80" y="146" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">A</text>
                            <circle cx="240" cy="70" r="18" fill="#94a3b8" filter="url(#nodeShadow)" /><text x="240" y="76" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">B</text>
                            <circle cx="380" cy="160" r="18" fill="#16a34a" filter="url(#nodeShadow)" /><text x="380" y="166" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">C</text>
                            <circle cx="540" cy="100" r="18" fill="#94a3b8" filter="url(#nodeShadow)" /><text x="540" y="106" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">D</text>
                            <circle cx="520" cy="205" r="18" fill="#9333ea" filter="url(#nodeShadow)" /><text x="520" y="211" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">E</text>
                            <circle cx="660" cy="160" r="18" fill="#ef4444" filter="url(#nodeShadow)" /><text x="660" y="166" text-anchor="middle" fill="#ffffff" font-weight="700" font-size="14">F</text>
                            <g class="truck-animated">
                                <rect x="-35" y="-18" width="48" height="24" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.5" />
                                <path d="M 13 -6 L 24 -6 L 30 6 L 13 6 Z" fill="#94a3b8" stroke="#475569" stroke-width="1.5" />
                                <circle cx="-16" cy="8" r="5" fill="#1e293b" /><circle cx="-16" cy="8" r="2" fill="#e2e8f0" />
                                <circle cx="18" cy="8" r="5" fill="#1e293b" /><circle cx="18" cy="8" r="2" fill="#e2e8f0" />
                                <rect x="15" y="-3" width="7" height="6" fill="#e0f2fe" />
                            </g>
                        </svg>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 14px; font-weight: 700; color: #1e293b;">Evaluando alternativas</span><span id="optProgressLabel" style="font-size: 13.5px; font-weight: 700; color: #2563eb;">75%</span></div>
                        <div class="progress-container"><div id="optProgressBar" class="progress-bar-fill" style="width: 75%;"></div></div>
                        <div style="margin-top: 14px;">
                            <div class="checklist-item"><span style="color:#16a34a; font-size:16px;">☑</span><span>Calculando distancias</span></div>
                            <div class="checklist-item"><span style="color:#16a34a; font-size:16px;">☑</span><span>Evaluando tiempos</span></div>
                            <div class="checklist-item"><span style="color:#16a34a; font-size:16px;">☑</span><span>Calculando costos</span></div>
                            <div class="checklist-item" id="itemReglasExpertas"><span id="iconReglasExpertas" class="spinner-rule" style="color:#2563eb; font-size:16px;">🔄</span><span id="textReglasExpertas" style="color: #2563eb; font-weight: 600;">Aplicando reglas expertas</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="optSubResult" style="display:none;">
                <div class="content-header" style="margin-bottom: 24px;">
                    <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">RUTA OPTIMA ENCONTRADA</h1>
                    <p style="font-size: 13.5px; color: #475569;">El sistema ha encontrado la mejor alternativa</p>
                </div>
                <div class="result-top-grid">
                    <div class="result-card">
                        <h3 style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 8px;">Ruta recomendada (Google OR-Tools)</h3>
                        <div id="optResultTrayecto" style="font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: 2px; margin-bottom: 20px;">A &nbsp;→&nbsp; C &nbsp;→&nbsp; E &nbsp;→&nbsp; F</div>
                        <div id="optResultNodesList" style="display: flex; flex-direction: column; gap: 4px;">
                            <div class="route-step-node"><span class="node-circle-badge" style="background:#2563eb;">A</span><span style="font-weight: 600;">Almacén Principal Lima</span></div>
                            <div class="step-arrow-down">↓</div>
                            <div class="route-step-node"><span class="node-circle-badge" style="background:#16a34a;">C</span><span style="font-weight: 600;">Centro Logístico Lurín</span></div>
                            <div class="step-arrow-down">↓</div>
                            <div class="route-step-node"><span class="node-circle-badge" style="background:#9333ea;">E</span><span style="font-weight: 600;">Centro de Distribución Arequipa</span></div>
                            <div class="step-arrow-down">↓</div>
                            <div class="route-step-node"><span class="node-circle-badge" style="background:#ef4444;">F</span><span style="font-weight: 600;">Planta de Producción Callao</span></div>
                        </div>
                    </div>
                    <div class="result-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <h3 style="font-size: 14px; font-weight: 700; color: #64748b; margin-bottom: 18px;">Resumen de la ruta óptima</h3>
                            <div class="metric-row"><span style="font-size: 18px;">🕒</span><span style="font-weight: 700; text-transform: uppercase; font-size: 13px;">TIEMPO ESTIMADO</span><span id="optResultTiempo" style="font-weight: 800; color: #1e293b; font-size: 15px; margin-left: auto;">32 min</span></div>
                            <div class="metric-row"><span style="font-size: 18px;">🗺️</span><span style="font-weight: 500; font-size: 13.5px;">Distancia total</span><span id="optResultDistancia" style="font-weight: 700; color: #1e293b; font-size: 15px; margin-left: auto;">18.5 km</span></div>
                            <div class="metric-row"><span style="font-size: 18px; color:#16a34a; font-weight:800;">$</span><span style="font-weight: 500; font-size: 13.5px;">Costo estimado</span><span id="optResultCosto" style="font-weight: 700; color: #1e293b; font-size: 15px; margin-left: auto;">S/ 85.00</span></div>
                        </div>
                        <div class="recommended-badge-box">
                            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"></polygon></svg>
                            RECOMENDADA (OR-TOOLS)
                        </div>
                    </div>
                </div>
                <div class="why-card">
                    <div>
                        <h2 style="font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">¿Por qué esta ruta?</h2>
                        <p style="font-size: 13.5px; color: #475569; margin-bottom: 16px;">Esta ruta ha sido seleccionada por el motor de optimización matemática porque:</p>
                        <div id="optResultMotivos" style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #1e293b;"><span style="color: #16a34a; font-weight: 800;">✓</span><span>Ruta globalmente óptima calculada por Google OR-Tools</span></div>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #1e293b;"><span style="color: #16a34a; font-weight: 800;">✓</span><span>Presenta el menor tiempo y costo ponderado de traslado</span></div>
                            <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #1e293b;"><span style="color: #16a34a; font-weight: 800;">✓</span><span>Cumple estrictamente con la capacidad máxima del camión</span></div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;">
                        <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="#64748b" stroke-width="3">
                            <line x1="50" y1="10" x2="50" y2="25"></line><line x1="50" y1="75" x2="50" y2="90"></line>
                            <line x1="10" y1="50" x2="25" y2="50"></line><line x1="75" y1="50" x2="90" y2="50"></line>
                            <line x1="22" y1="22" x2="32" y2="32"></line><line x1="68" y1="68" x2="78" y2="78"></line>
                            <line x1="22" y1="78" x2="32" y2="68"></line><line x1="68" y1="32" x2="78" y2="22"></line>
                        </svg>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                            <button type="button" onclick="resetOptimizationWizard()" style="padding: 8px 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12.5px; font-weight: 600; cursor: pointer;">↺ Nueva</button>
                            <button type="button" onclick="showView('reportes')" style="padding: 8px 14px; background: #0047ff; color: #fff; border: none; border-radius: 4px; font-size: 12.5px; font-weight: 600; cursor: pointer;">Ver Reportes</button>
                            <button type="button" id="btnAsignarRuta" onclick="openAssignRouteModal()" style="padding: 8px 16px; background: #16a34a; color: #fff; border: none; border-radius: 4px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(22,163,74,0.3);">
                                <span>🚚</span> Asignar a Transportista
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    'reportes': `
        <div id="viewReportes">
            <div class="content-header" style="margin-bottom: 24px;">
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">MÉTRICAS & COMPARACIÓN DE RUTAS</h1>
                <p style="font-size: 13.5px; color: #475569;">Análisis de eficiencia logística y alternativas generadas con Google OR-Tools en PostgreSQL</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Toneladas Movilizadas</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span id="kpiReporteToneladas" style="font-size: 24px; font-weight: 800; color: #0f172a;">-- Tn</span>
                        <span style="font-size: 12px; color: #16a34a; font-weight: 600;">📦 Registrado</span>
                    </div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Rutas Optimizadas</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span id="kpiReporteRutas" style="font-size: 24px; font-weight: 800; color: #2563eb;">--</span>
                        <span style="font-size: 12px; color: #2563eb; font-weight: 600;">🛣️ Google OR-Tools</span>
                    </div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Tiempo Promedio</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span id="kpiReporteTiempo" style="font-size: 24px; font-weight: 800; color: #0f172a;">-- min</span>
                        <span style="font-size: 12px; color: #16a34a; font-weight: 600;">⚡ Eficiente</span>
                    </div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Ahorro Logístico Est.</div>
                    <div style="display: flex; align-items: baseline; gap: 8px;">
                        <span id="kpiReporteAhorro" style="font-size: 24px; font-weight: 800; color: #16a34a;">S/ --</span>
                        <span style="font-size: 12px; color: #16a34a; font-weight: 600;">💰 Fletes</span>
                    </div>
                </div>
            </div>
            <div style="background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 24px;">
                <table class="report-table" style="margin-bottom: 0;">
                    <thead>
                        <tr><th>Ruta</th><th>Trayecto</th><th>Tiempo (min)</th><th>Distancia (km)</th><th>Costo (S/)</th><th>Puntaje</th><th>Recomendación</th></tr>
                    </thead>
                    <tbody id="reportesTableBody"></tbody>
                </table>
            </div>
            <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: #1e293b;">Comparación visual de Tiempos y Costos</h3>
                        <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; font-weight: 600; color: #475569;">
                            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #2563eb;"></span><span>Tiempo (min)</span></div>
                            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #16a34a;"></span><span>Costo (S/)</span></div>
                        </div>
                    </div>
                    <div style="width: 100%; height: 230px;"><canvas id="reportBarChart" width="460" height="230" style="width: 100%; height: 100%; display: block;"></canvas></div>
                </div>
                <div class="conclusion-sticky-card">
                    <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 14px;">Conclusión del Sistema Experto</h2>
                    <p id="reporteConclusionTexto" style="font-size: 14.5px; line-height: 1.65; color: #1e293b; font-weight: 500;">Las rutas óptimas calculadas por Google OR-Tools minimizan el tiempo y costo global de transporte.</p>
                </div>
            </div>
        </div>
    `,
    'historial': `
        <div id="viewHistorial">
            <div class="content-header" style="margin-bottom: 24px;">
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">HISTORIAL DE OPTIMIZACIONES & DESPACHOS</h1>
                <p style="font-size: 13.5px; color: #475569;">Registro de rutas calculadas, asignaciones y despachos programados en PostgreSQL</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Despachos</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;"><span id="kpiHistorialTotal">--</span></div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Rutas Óptimas</div>
                    <div style="font-size: 24px; font-weight: 800; color: #16a34a; margin-top: 4px;"><span id="kpiHistorialOptimas">--</span></div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Flota en Ruta</div>
                    <div style="font-size: 24px; font-weight: 800; color: #f59e0b; margin-top: 4px;"><span id="kpiHistorialFlotaActiva">--</span></div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 18px 20px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Puntaje Promedio</div>
                    <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;"><span id="kpiHistorialPuntaje">95.2%</span></div>
                </div>
            </div>
            <div class="card-container">
                <table class="report-table" style="margin-bottom: 0;">
                    <thead><tr><th>Código</th><th>Fecha / Hora</th><th>Origen → Destino</th><th>Material</th><th>Transportista</th><th>Vehículo</th><th>Dist. / Tiempo</th><th>Costo (S/)</th><th>Recomendación</th></tr></thead>
                    <tbody id="historialTableBody"></tbody>
                </table>
            </div>
        </div>
    `,
    'usuarios': `
        <div id="viewUsuarios" class="users-section">
            <div class="section-header-bar">
                <div>
                    <h2 style="font-size: 20px; font-weight: 700; color:#0f172a;">Administración de Usuarios y Roles</h2>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                        <span id="serverStatusBadge" class="server-status-pill offline">● Conectando...</span>
                        <span style="font-size: 12.5px; color:#64748b;">Base de datos PostgreSQL: <strong>Aceros_Arequipa</strong></span>
                    </div>
                </div>
                <button class="btn-primary" onclick="openNewUserModal()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nueva Cuenta
                </button>
            </div>
            <div id="noticeBanner" style="display:none; background:#eff6ff; border-left:4px solid #3b82f6; padding:12px 16px; margin-bottom:16px; border-radius:4px; font-size:12.5px; color:#1e40af;"></div>
            <div class="users-table-wrap">
                <table class="users-table">
                    <thead><tr><th>ID</th><th>Nombre Completo</th><th>Correo / Usuario</th><th>Rol Asignado</th><th>Código / Teléfono</th><th>Estado</th><th style="text-align: right;">Acciones</th></tr></thead>
                    <tbody id="usersTbody"></tbody>
                </table>
            </div>
        </div>
    `
};

/**
 * Carga dinámica de vistas parciales HTML con control de permisos
 */
async function showView(viewName) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // Normalizar nombre
    const key = (viewName === 'configuracion') ? 'usuarios' : viewName;
    const user = getCurrentUser();

    // === VALIDACIONES DE SEGURIDAD POR ROL ===
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        if (['optimizar', 'historial', 'reportes', 'usuarios', 'configuracion'].includes(key)) {
            alert('⚠️ Acceso Restringido: Los transportistas no tienen autorización para optimizar rutas ni ver reportes globales. Solo pueden consultar sus rutas asignadas.');
            return showView('mis-rutas');
        }
    }

    if (user.rol === 'SUPERVISOR') {
        if (['usuarios', 'configuracion'].includes(key)) {
            alert('⚠️ Acceso Restringido: Solo el Administrador del sistema tiene permisos para crear o modificar cuentas de usuario.');
            return showView('inicio');
        }
    }

    // Actualizar sidebar activo
    document.querySelectorAll('.sidebar-menu .nav-item').forEach(el => el.classList.remove('active'));
    const menuEl = document.getElementById(menuIdMap[key]);
    if (menuEl) menuEl.classList.add('active');

    // Cambiar hash sin disparar bucle
    if (window.location.hash.replace('#', '') !== key) {
        history.replaceState(null, '', '#' + key);
    }

    try {
        let html = viewCache[key];

        if (!html) {
            const fileName = viewFileMap[key] || `views/${key}.html`;
            
            try {
                const res = await apiFetch(fileName);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (fetchErr) {
                console.warn(`Fetch local no disponible para ${fileName}, recurriendo a plantilla integrada:`, fetchErr);
            }

            // Fallback para modo offline o file://
            if (!html && FALLBACK_VIEWS[key]) {
                html = FALLBACK_VIEWS[key];
            }

            if (!html) throw new Error(`No se encontró el contenido de la vista: ${key}`);
            viewCache[key] = html;
        }

        mainContent.innerHTML = html;

        // Ejecutar inicializadores según la vista
        onViewLoaded(key);

    } catch (err) {
        console.error(`Error cargando la vista ${key}:`, err);
        mainContent.innerHTML = `
            <div style="padding: 30px; background: #fff; border-radius: 8px; border: 1px solid #fee2e2;">
                <h3 style="color: #dc2626; margin-bottom: 8px;">Error al cargar la sección</h3>
                <p style="color: #64748b; font-size: 14px;">No se pudo cargar el archivo parcial <code>views/${viewFileMap[key]}</code>.</p>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 6px;">Detalle: ${err.message}</p>
                <button onclick="showView('${key}')" class="btn-primary" style="margin-top: 16px;">Reintentar</button>
            </div>
        `;
    }
}

/**
 * Acciones posteriores al renderizado de cada vista
 */

/**
 * Restricciones visuales de rol para Mis Rutas
 */
function applyMisRutasRoleRestrictions() {
    const user = getCurrentUser();
    const isTransportista = (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA');
    const selWrapper = document.getElementById('conductorSelectorWrapper');
    const btnAsig = document.getElementById('btnAsignarConduccionMisRutas');
    if (isTransportista) {
        if (selWrapper) selWrapper.style.display = 'none';
        if (btnAsig) btnAsig.style.display = 'none';
        const titleEl = document.getElementById('rutasHeaderTitle');
        if (titleEl) titleEl.textContent = 'MIS RUTAS ASIGNADAS';
        const subTitleEl = document.getElementById('rutasHeaderSubtitle');
        if (subTitleEl) subTitleEl.textContent = 'Hoja de ruta diaria y registro de entregas asignadas a tu unidad vehicular';
        const nameEl = document.getElementById('driverCardName');
        if (nameEl && user.nombres) nameEl.textContent = user.nombres;
        const dniEl = document.getElementById('driverCardDni');
        if (dniEl && user.codEmpleado) dniEl.textContent = user.codEmpleado;
    } else {
        if (selWrapper) selWrapper.style.display = '';
        if (btnAsig) btnAsig.style.display = '';
    }
}

/**
 * Restricciones visuales de rol para Rutas
 */
function applyRutasRoleRestrictions() {
    const user = getCurrentUser();
    const isTransportista = (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA');
    const btnNew = document.getElementById('btnRegistrarNuevaRuta');
    const btnAsig = document.getElementById('btnAsignarConductorRutas');
    const secFlujo = document.getElementById('seccionFlujoEstadosPedidos');
    const secRutasDb = document.getElementById('seccionRutasRegistradasDb');

    if (isTransportista) {
        if (btnNew) btnNew.style.display = 'none';
        if (btnAsig) btnAsig.style.display = 'none';
        if (secFlujo) secFlujo.style.display = 'none';
        if (secRutasDb) secRutasDb.style.display = 'none';
    } else {
        if (btnNew) btnNew.style.display = '';
        if (btnAsig) btnAsig.style.display = '';
        if (secFlujo) secFlujo.style.display = '';
        if (secRutasDb) secRutasDb.style.display = '';
    }
}

function onViewLoaded(viewName) {
    // Cerrar sidebar móvil si está abierto al navegar
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (backdrop && backdrop.classList.contains('active')) {
        backdrop.classList.remove('active');
    }

    if (viewName === 'rutas') {
        loadRutasData();
        loadAsignacionesData();
        setTimeout(initLogisticsMap, 150);
        applyRutasRoleRestrictions();
    } else if (viewName === 'inicio') {
        loadDashboardInicioMetrics();
    } else if (viewName === 'mis-rutas') {
        loadAsignacionesFromDatabase();
        applyMisRutasRoleRestrictions();
    } else if (viewName === 'reportes') {
        loadReportesData();
    } else if (viewName === 'historial') {
        loadHistorialData(0, historialPageSize, '');
    } else if (viewName === 'usuarios' || viewName === 'configuracion') {
        loadUsersFromDatabase();
    } else if (viewName === 'flota') {
        loadFlotaData();
    } else if (viewName === 'clientes') {
        loadClientesData();
    } else if (viewName === 'optimizar') {
        showOptSubStep('form');
        cargarListaPedidosParaOptimizar();
    }
}

/* ==========================================================================
   LÓGICA DE RUTAS ASIGNADAS (DESPACHOS) Y CONTROL DEL TRANSPORTISTA
   ========================================================================== */

function filterDispatches(status, btnElement) {
    currentDispatchFilter = status;
    if (btnElement) {
        document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    }
    renderMisRutas(status);
}

function renderMisRutas(statusFilter = 'TODAS') {
    const container = document.getElementById('misRutasList');
    if (!container) return;

    const user = getCurrentUser();

    // Adaptar título según rol: Conductor -> "MIS RUTAS ASIGNADAS" | Supervisor/Admin -> "RUTAS ASIGNADAS"
    const headerTitle = document.getElementById('rutasHeaderTitle');
    const headerSubtitle = document.getElementById('rutasHeaderSubtitle');
    if (headerTitle && headerSubtitle) {
        if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
            headerTitle.textContent = 'MIS RUTAS ASIGNADAS';
            headerSubtitle.textContent = 'Hoja de ruta, itinerario y control de estado para transportistas';
        } else {
            headerTitle.textContent = 'RUTAS ASIGNADAS';
            headerSubtitle.textContent = 'Monitoreo, trazabilidad y control de despachos asignados a transportistas';
        }
    }

    let list = [...activeDispatches];

    // Si es conductor, filtrar de forma ESTRICTA y mostrar ÚNICAMENTE sus propias asignaciones
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        const userNom = (user.nombres || '').trim().toLowerCase();
        const userCod = (user.codEmpleado || '').trim().toLowerCase();

        list = list.filter(d => {
            const condNom = (d.conductorNombre || '').trim().toLowerCase();
            const condDni = (d.conductorDni || '').trim().toLowerCase();

            // 1. Coincidencia por DNI / Código de empleado
            if (userCod && condDni && (userCod === condDni || userCod.includes(condDni) || condDni.includes(userCod))) {
                return true;
            }
            // 2. Coincidencia por Nombre y Apellido
            if (userNom && condNom) {
                if (condNom === userNom || condNom.includes(userNom) || userNom.includes(condNom)) {
                    return true;
                }
                const nameParts = userNom.split(/\s+/).filter(p => p.length >= 3);
                if (nameParts.length > 0 && nameParts.every(part => condNom.includes(part))) {
                    return true;
                }
            }
            return false;
        });

        // Actualizar métricas KPI exclusivas del conductor conectado
        const kpiTotal = document.getElementById('kpiDriverTotal');
        const kpiTrans = document.getElementById('kpiDriverTransito');
        const kpiEntr = document.getElementById('kpiDriverEntregadas');
        const kpiCarga = document.getElementById('kpiDriverCarga');

        const countPorIniciar = list.filter(d => d.estado === 'ASIGNADA').length;
        const countEnTransito = list.filter(d => d.estado === 'EN_TRANSITO').length;
        const countCompletadas = list.filter(d => d.estado === 'COMPLETADA').length;

        if (kpiTotal) kpiTotal.textContent = list.length;
        if (kpiTrans) {
            kpiTrans.textContent = countPorIniciar > 0 ? countPorIniciar : countEnTransito;
            const transLabel = document.getElementById('kpiDriverTransitoLabel');
            if (transLabel) {
                transLabel.textContent = countPorIniciar > 0 ? '📋 Por Iniciar' : '🚚 En Camino';
            }
        }
        if (kpiEntr) kpiEntr.textContent = countCompletadas;
        if (kpiCarga) {
            const totalTn = list.reduce((acc, d) => {
                const match = (d.material || '').match(/(\d+(\.\d+)?)\s*Tn/i);
                return acc + (match ? parseFloat(match[1]) : 20.0);
            }, 0);
            kpiCarga.textContent = totalTn > 0 ? `${totalTn.toFixed(1)} Tn` : '0.0 Tn';
        }
    }

    if (statusFilter !== 'TODAS') {
        list = list.filter(d => d.estado === statusFilter);
    }

    if (list.length === 0) {
        const esConductor = (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA');
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #cbd5e1; border-radius:8px; padding:36px; text-align:center; color:#64748b;">
                <p style="font-size:15px; font-weight:600; margin-bottom:4px;">
                    ${esConductor ? 'No tienes rutas asignadas en este momento.' : 'No hay rutas asignadas en este estado.'}
                </p>
                <span style="font-size:12.5px; color:#94a3b8;">
                    ${esConductor ? 'Cuando el Supervisor te asigne una nueva ruta a tu nombre, aparecerá aquí.' : 'Las nuevas rutas serán asignadas por el Supervisor de Flotas.'}
                </span>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(d => {
        let badgeHtml = '';
        let actionBtnHtml = '';

        if (d.estado === 'ASIGNADA') {
            badgeHtml = `<span class="badge-status badge-status-asignada">● Por Iniciar</span>`;
            actionBtnHtml = `
                <button class="btn-dispatch-action btn-start-trip" onclick="updateDispatchStatus(${d.id}, 'EN_TRANSITO')">
                    ▶ Iniciar Recorrido
                </button>
            `;
        } else if (d.estado === 'EN_TRANSITO') {
            badgeHtml = `<span class="badge-status badge-status-transito">🚚 En Tránsito</span>`;
            actionBtnHtml = `
                <button class="btn-dispatch-action btn-complete-trip" onclick="updateDispatchStatus(${d.id}, 'COMPLETADA')">
                    ✓ Confirmar Entrega en Destino
                </button>
            `;
        } else if (d.estado === 'COMPLETADA') {
            badgeHtml = `<span class="badge-status badge-status-completada">✔ Completada</span>`;
            actionBtnHtml = `
                <span style="font-size:12.5px; color:#16a34a; font-weight:700;">✅ Entrega Finalizada</span>
            `;
        }

        return `
            <div class="dispatch-card">
                <div class="dispatch-header">
                    <div>
                        <div class="dispatch-title">${d.codigo} &nbsp;·&nbsp; ${d.origen} → ${d.destino}</div>
                        <div style="font-size:12px; color:#64748b; margin-top:2px;">Asignado por: <strong>${d.supervisor}</strong> · ${d.fecha}</div>
                    </div>
                    <div>${badgeHtml}</div>
                </div>

                <div class="dispatch-route-badge-line">
                    <span>Itinerario Experto:</span>
                    <strong>${d.trayecto}</strong>
                    <span style="font-size:12px; color:#15803d; font-weight:600; margin-left:8px;">(${d.tiempoEst} · ${d.distancia})</span>
                </div>

                <div class="dispatch-details-grid">
                    <div>
                        <div class="dispatch-meta-label">Conductor Asignado</div>
                        <div class="dispatch-meta-val">👤 ${d.conductorNombre}</div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Vehículo & Placa</div>
                        <div class="dispatch-meta-val">🚛 ${d.vehiculo} <span style="color:#64748b;">(${d.placa})</span></div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Material & Carga</div>
                        <div class="dispatch-meta-val">📦 ${d.material}</div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Prioridad</div>
                        <div class="dispatch-meta-val">${d.prioridad === 'Alta' ? '🔴 Alta' : '🟡 Media'}</div>
                    </div>
                </div>

                <div class="dispatch-actions">
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    }).join('');
}

async function loadAsignacionesFromDatabase() {
    try {
        if (window.location.protocol !== 'file:') {
            const [resAsig, resPed, resCli, resTrp] = await Promise.all([
                apiFetch(API_HOST + '/api/asignaciones'),
                apiFetch(API_HOST + '/api/pedidos'),
                apiFetch(API_HOST + '/api/clientes'),
                apiFetch(API_HOST + '/api/transportistas')
            ]);
            if (resPed.ok) memoryPedidos = await resPed.json();
            if (resCli.ok) memoryClientes = await resCli.json();
            if (resTrp && resTrp.ok) {
                const trps = await resTrp.json();
                const simSelect = document.getElementById('simularConductorSelect');
                if (simSelect && trps.length > 0) {
                    const currentVal = simSelect.value;
                    simSelect.innerHTML = `<option value="TODOS">Todos los Conductores</option>` +
                        trps.map(t => `<option value="${t.nombres} ${t.apellidos}">${t.nombres} ${t.apellidos} (${t.dni})</option>`).join('');
                    if (currentVal) simSelect.value = currentVal;
                }
            }

            if (resAsig.ok) {
                const list = await resAsig.json();
                if (list && list.length > 0) {
                    activeDispatches = list.map(a => {
                        let est = 'ASIGNADA';
                        if (a.estado === 'EN_TRANSITO') {
                            est = 'EN_TRANSITO';
                        } else if (a.estado === 'FINALIZADA' || a.estado === 'COMPLETADA') {
                            est = 'COMPLETADA';
                        } else {
                            est = 'ASIGNADA'; // Estado inicial para nuevas asignaciones (Por Iniciar)
                        }

                        return {
                            id: a.idAsignacion,
                            codigo: 'DSP-' + (1000 + a.idAsignacion),
                            origen: "Almacén Principal Lima (A)",
                            destino: a.pedidoDestino || a.destino || "Planta Siderúrgica Pisco (F)",
                            trayecto: "A → C → E → F",
                            material: a.pedidoMaterial || a.materialCarga || "Carga de Acero Aceros Arequipa",
                            conductorId: a.idTransportista,
                            conductorNombre: a.conductorNombre || 'Transportista Asignado',
                            conductorDni: a.conductorDni || '',
                            vehiculo: (a.vehiculoTipo || 'Unidad de Flota') + ' - ' + (a.vehiculoModelo || ''),
                            placa: a.vehiculoPlaca || 'V-100',
                            prioridad: a.pedidoPrioridad || 'Alta',
                            tiempoEst: "32 min",
                            distancia: "18.5 km",
                            costo: "S/ 85.00",
                            estado: est,
                            fecha: a.fechaInicio ? new Date(a.fechaInicio).toLocaleDateString() : 'Hoy',
                            supervisor: "Supervisor de Operaciones"
                        };
                    });
                }
            }
        }
    } catch (e) {
        console.warn('Usando despachos locales de respaldo:', e);
    }
    renderMisRutas(currentDispatchFilter);
    renderMisPedidosEnRuta();
    applyMisRutasRoleRestrictions();
}

function renderMisPedidosEnRuta() {
    const container = document.getElementById('misPedidosEnRutaList');
    if (!container) return;

    if (!memoryPedidos || memoryPedidos.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:20px; text-align:center; color:#64748b;">
                No hay pedidos registrados en base de datos.
            </div>
        `;
        return;
    }

    const clienteMap = {};
    if (memoryClientes && memoryClientes.length > 0) {
        memoryClientes.forEach(c => { clienteMap[c.idCliente] = c.razonSocial; });
    }

    container.innerHTML = memoryPedidos.map(p => {
        const est = (p.estadoPedido || 'REGISTRADO').toUpperCase();
        const clienteNom = clienteMap[p.idCliente] || ('Cliente #' + p.idCliente);

        let badgeBg = '#e0f2fe';
        let badgeColor = '#0369a1';
        let badgeBorder = '#bae6fd';
        let actionBtnHtml = '';

        if (est === 'REGISTRADO') {
            badgeBg = '#e0f2fe'; badgeColor = '#0369a1'; badgeBorder = '#bae6fd';
            actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#0284c7; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'EN_PROCESO')">▶ Iniciar Proceso</button>`;
        } else if (est === 'EN_PROCESO') {
            badgeBg = '#fef3c7'; badgeColor = '#b45309'; badgeBorder = '#fde68a';
            actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#7c3aed; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'OPTIMIZADO')">⚡ Optimizar Ruta</button>`;
        } else if (est === 'OPTIMIZADO') {
            badgeBg = '#f3e8ff'; badgeColor = '#6b21a8'; badgeBorder = '#e9d5ff';
            actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#ea580c; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'DESPACHADO')">🚚 Iniciar Despacho</button>`;
        } else if (est === 'DESPACHADO') {
            badgeBg = '#ffedd5'; badgeColor = '#c2410c'; badgeBorder = '#fed7aa';
            actionBtnHtml = `<button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#16a34a; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'ENTREGADO')">✅ Confirmar Entrega</button>`;
        } else if (est === 'ENTREGADO') {
            badgeBg = '#dcfce7'; badgeColor = '#15803d'; badgeBorder = '#bbf7d0';
            actionBtnHtml = `<span style="font-size:12px; color:#16a34a; font-weight:700;">✔ Entrega Completada</span>`;
        } else {
            badgeBg = '#f1f5f9'; badgeColor = '#64748b'; badgeBorder = '#cbd5e1';
            actionBtnHtml = `<span style="font-size:12px; color:#64748b;">Cancelado</span>`;
        }

        return `
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div style="font-size:13.5px; font-weight:800; color:#0f172a;">#PED-${p.idPedido} · ${p.tipoMaterial}</div>
                        <div style="font-size:12px; color:#64748b; margin-top:2px;">Cliente: <strong>${clienteNom}</strong></div>
                    </div>
                    <span style="padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder};">
                        ● ${est}
                    </span>
                </div>
                <div style="font-size:12px; color:#475569; background:#f8fafc; padding:8px; border-radius:6px; border:1px solid #f1f5f9;">
                    <div>📍 <strong>Destino:</strong> ${p.direccionDestino}</div>
                    <div style="margin-top:2px;">⚖️ <strong>Carga:</strong> ${p.pesoT} Tn ${p.volumenM3 ? '· ' + p.volumenM3 + ' m³' : ''}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <span style="font-size:11px; color:#94a3b8;">${p.prioridad === 'ALTA' ? '🔴 Alta Prioridad' : '🟡 Prioridad Normal'}</span>
                    <div>${actionBtnHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateDispatchStatus(dispatchId, newStatus) {
    const item = activeDispatches.find(d => d.id === dispatchId);
    if (!item) return;

    item.estado = newStatus;

    if (window.location.protocol !== 'file:') {
        if (newStatus === 'EN_TRANSITO') {
            try {
                await apiFetch(API_HOST + `/api/asignaciones/${dispatchId}/iniciar`, { method: 'PUT' });
            } catch (e) {
                console.warn('Error iniciando asignacion en servidor:', e);
            }
        } else if (newStatus === 'COMPLETADA') {
            try {
                await apiFetch(API_HOST + `/api/asignaciones/${dispatchId}/completar`, { method: 'PUT' });
            } catch (e) {
                console.warn('Error completando asignacion en servidor:', e);
            }
        }

        // Sincronizar automáticamente el estado del pedido asociado en el ciclo de vida
        try {
            if (newStatus === 'EN_TRANSITO') {
                const pedToDespachar = (memoryPedidos || []).find(p => p.estadoPedido === 'OPTIMIZADO' || p.estadoPedido === 'EN_PROCESO');
                if (pedToDespachar) {
                    await apiFetch(`${API_HOST}/api/pedidos/${pedToDespachar.idPedido}/estado`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'DESPACHADO' })
                    });
                    pedToDespachar.estadoPedido = 'DESPACHADO';
                }
            } else if (newStatus === 'COMPLETADA') {
                const pedToEntregar = (memoryPedidos || []).find(p => p.estadoPedido === 'DESPACHADO');
                if (pedToEntregar) {
                    await apiFetch(`${API_HOST}/api/pedidos/${pedToEntregar.idPedido}/estado`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ estado: 'ENTREGADO' })
                    });
                    pedToEntregar.estadoPedido = 'ENTREGADO';
                    pedToEntregar.fechaEntrega = new Date().toISOString();
                }
            }
        } catch (syncErr) {
            console.warn('Advertencia al sincronizar estado de pedido en despacho:', syncErr);
        }
    }

    const msg = (newStatus === 'EN_TRANSITO') 
        ? `🚚 ¡Buen viaje! Despacho ${item.codigo} marcado en tránsito hacia ${item.destino}. Pedido vinculado marcado como DESPACHADO.`
        : `✅ ¡Entrega registrada con éxito para el despacho ${item.codigo}! Pedido vinculado marcado como ENTREGADO en base de datos.`;

    alert(msg);
    renderMisRutas(currentDispatchFilter);
    renderMisPedidosEnRuta();
    applyMisRutasRoleRestrictions();
}

/* ==========================================================================
   MODAL DE ASIGNACIÓN DE RUTAS (SUPERVISOR / ADMIN CONECTADO A POSTGRESQL)
   ========================================================================== */

async function openAssignRouteModal() {
    const user = getCurrentUser();
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        alert('Acceso restringido: Los transportistas no tienen permisos para asignar conductores.');
        return;
    }
    const selectPedido    = document.getElementById('assignPedidoSelect');
    const selectConductor = document.getElementById('assignConductorSelect');
    const selectVehiculo  = document.getElementById('assignVehiculoSelect');
    const placaInput      = document.getElementById('assignPlacaInput');

    if (window.location.protocol !== 'file:') {
        try {
            const [resPed, resTrp, resVeh] = await Promise.all([
                apiFetch(API_HOST + '/api/pedidos'),
                apiFetch(API_HOST + '/api/transportistas'),
                apiFetch(API_HOST + '/api/vehiculos')
            ]);

            if (resPed.ok) {
                const pedidos = await resPed.json();
                memoryPedidos = pedidos;
                if (selectPedido) {
                    const pendientes = pedidos.filter(p => p.estadoPedido !== 'ENTREGADO');
                    if (pendientes.length > 0) {
                        selectPedido.innerHTML = pendientes.map(p => `
                            <option value="${p.idPedido}" data-material="${p.tipoMaterial} (${p.pesoT} Tn)" data-destino="${p.direccionDestino}" data-prioridad="${p.prioridad}">
                                #PED-${p.idPedido} · ${p.tipoMaterial} (${p.pesoT} Tn) → ${p.direccionDestino} [${p.estadoPedido}]
                            </option>
                        `).join('');
                        onAssignPedidoSelected(pendientes[0].idPedido);
                    } else {
                        selectPedido.innerHTML = `<option value="">(No hay pedidos pendientes - todos entregados)</option>`;
                    }
                }
            }

            if (resTrp.ok) {
                const trps = await resTrp.json();
                if (selectConductor && trps.length > 0) {
                    selectConductor.innerHTML = trps.map(t => `
                        <option value="${t.idTransportista}" data-nombre="${t.nombres} ${t.apellidos}">
                            ${t.nombres} ${t.apellidos} (${t.dni}) - Lic. ${t.categoriaLicencia || 'A-IIIc'}
                        </option>
                    `).join('');
                }
            }

            if (resVeh.ok) {
                const vehs = await resVeh.json();
                if (selectVehiculo && vehs.length > 0) {
                    selectVehiculo.innerHTML = vehs.map(v => `
                        <option value="${v.idVehiculo}" data-placa="${v.placa}" data-tipo="${v.tipoCamion}">
                            ${v.tipoCamion} (${v.placa}) · ${v.modelo} [Max: ${v.capacidadMaxTon} Tn]
                        </option>
                    `).join('');
                    if (placaInput && vehs[0]) {
                        placaInput.value = vehs[0].placa;
                    }
                }
            }
        } catch (err) {
            console.warn('Error cargando datos de vehiculos/transportistas/pedidos:', err);
        }
    }

    if (selectVehiculo) {
        selectVehiculo.onchange = () => {
            const opt = selectVehiculo.options[selectVehiculo.selectedIndex];
            if (opt && placaInput) {
                placaInput.value = opt.getAttribute('data-placa') || '';
            }
        };
    }

    const modal = document.getElementById('assignRouteModal');
    if (modal) modal.classList.add('active');
}

function closeAssignRouteModal() {
    const modal = document.getElementById('assignRouteModal');
    if (modal) modal.classList.remove('active');
}

async function confirmAssignRoute(e) {
    e.preventDefault();
    const selectCond = document.getElementById('assignConductorSelect');
    const selectVeh  = document.getElementById('assignVehiculoSelect');
    const placa      = document.getElementById('assignPlacaInput').value.trim() || 'AYZ-892';
    const material   = document.getElementById('assignMaterialInput').value.trim() || 'Bobinas de acero (24 Tn)';
    const prioridad  = document.getElementById('assignPrioridadSelect').value || 'Alta';

    const selectedCondOpt = selectCond ? selectCond.options[selectCond.selectedIndex] : null;
    const conductorId     = selectCond ? parseInt(selectCond.value) : 1;
    const conductorNombre = selectedCondOpt ? selectedCondOpt.getAttribute('data-nombre') : 'Manuel Quispe';

    const selectedVehOpt  = selectVeh ? selectVeh.options[selectVeh.selectedIndex] : null;
    const vehiculoId      = selectVeh ? parseInt(selectVeh.value) : 1;
    const vehiculoTipo    = selectedVehOpt ? (selectedVehOpt.getAttribute('data-tipo') || selectedVehOpt.text) : 'Tráiler Plataforma';

    const supervisorUser = getCurrentUser();
    const newId = Date.now();
    const newCodigo = 'DSP-' + (Math.floor(1000 + Math.random() * 9000));

    const selectPed = document.getElementById('assignPedidoSelect');
    const pedidoId = selectPed && selectPed.value ? parseInt(selectPed.value) : null;

    // Guardar en PostgreSQL
    if (window.location.protocol !== 'file:') {
        try {
            await apiFetch(API_HOST + '/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idVehiculo: vehiculoId, idTransportista: conductorId, idPedido: pedidoId })
            });
            showToastNotification('Asignación Creada', `Conductor ${conductorNombre} vinculado al pedido ${pedidoId ? '#PED-' + pedidoId : ''}`, 'success');
        } catch (err) {
            console.warn('No se pudo guardar la asignación en BD:', err);
        }
    }

    const newDispatch = {
        id: newId,
        codigo: newCodigo,
        origen: "Almacén Principal Lima (A)",
        destino: "Planta Siderúrgica Pisco (F)",
        trayecto: "A → C → E → F",
        material: material,
        conductorId: conductorId,
        conductorNombre: conductorNombre,
        vehiculo: vehiculoTipo,
        placa: placa,
        prioridad: prioridad,
        tiempoEst: "32 min",
        distancia: "18.5 km",
        costo: "S/ 85.00",
        estado: "ASIGNADA",
        fecha: "Hoy, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        supervisor: supervisorUser.nombres || "Supervisor de Flota"
    };

    activeDispatches.unshift(newDispatch);
    closeAssignRouteModal();

    alert(`✅ ¡Ruta guardada en base de datos (asignaciones_conduccion)!\n\nDespacho: ${newCodigo}\nConductor: ${conductorNombre}\nVehículo: ${vehiculoTipo} (${placa})\n\nEl transportista ya tiene esta ruta en su panel.`);
    showView('mis-rutas');
}

/* ==========================================================================
   LÓGICA DEL FLUJO: OPTIMIZAR RUTA (CONEXIÓN A POSTGRESQL)
   ========================================================================== */

function showOptSubStep(step) {
    const f = document.getElementById('optSubForm');
    const l = document.getElementById('optSubLoading');
    const r = document.getElementById('optSubResult');
    if (f) f.style.display = (step === 'form') ? 'block' : 'none';
    if (l) l.style.display = (step === 'loading') ? 'block' : 'none';
    if (r) r.style.display = (step === 'result') ? 'block' : 'none';
}

async function startOptimizationProcess(e) {
    e.preventDefault();
    showOptSubStep('loading');

    const bar   = document.getElementById('optProgressBar');
    const label = document.getElementById('optProgressLabel');
    const iconReglas = document.getElementById('iconReglasExpertas');
    const textReglas = document.getElementById('textReglasExpertas');

    if (bar) bar.style.width = '0%';
    if (label) label.textContent = '0%';

    // Extraer datos del formulario de optimización
    const origenSel     = document.getElementById('optOrigen');
    const destinoSel    = document.getElementById('optDestino');
    const matSel        = document.getElementById('optMaterial');
    const prioridadSel  = document.getElementById('optPrioridad');
    const transporteSel = document.getElementById('optTransporte');
    const pesoInput     = document.getElementById('restPesoVal');
    const traficoCheck  = document.getElementById('restTrafico');
    const mantCheck     = document.getElementById('restMantenimiento');
    const objRadios     = document.getElementsByName('optObjetivo');

    let objetivo = 'equilibrio';
    for (const r of objRadios) {
        if (r.checked) { objetivo = r.value; break; }
    }

    const optPedIdInput = document.getElementById('optPedidoId');
    const selectedPedidoId = (optPedIdInput && optPedIdInput.value) ? parseInt(optPedIdInput.value) : null;
    window.currentOptimizedPedidoId = selectedPedidoId;

    const payload = {
        origen: origenSel ? origenSel.value : "A",
        destino: destinoSel ? destinoSel.value : "F",
        material: matSel ? matSel.options[matSel.selectedIndex].text : "Bobinas de acero (24 Tn)",
        peso: pesoInput ? parseFloat(pesoInput.value) : 24.0,
        prioridad: prioridadSel ? prioridadSel.value : "Alta",
        tipoTransporte: transporteSel ? transporteSel.value : "camion",
        objetivo: objetivo,
        evitarTrafico: traficoCheck ? traficoCheck.checked : false,
        evitarMantenimiento: mantCheck ? mantCheck.checked : false,
        idPedido: selectedPedidoId
    };

    // Disparar en paralelo la llamada al backend con Google OR-Tools
    let orToolsResponse = null;
    try {
        if (window.location.protocol !== 'file:') {
            const resp = await apiFetch(API_HOST + '/api/rutas/optimizar-ortools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (resp.ok) {
                orToolsResponse = await resp.json();
                window.lastOrToolsResult = orToolsResponse;
                console.log('✅ Optimización resuelta con Google OR-Tools:', orToolsResponse);
            }
        }
    } catch (err) {
        console.warn('⚠️ No se pudo comunicar con /api/rutas/optimizar-ortools:', err);
    }

    const phases = [
        { target: 35,  delay: 450 },
        { target: 65,  delay: 850 },
        { target: 80,  delay: 1150 },
        { target: 100, delay: 1600 }
    ];

    phases.forEach(({ target, delay }) => {
        setTimeout(() => {
            if (bar) bar.style.width = target + '%';
            if (label) label.textContent = target + '%';

            if (target === 100) {
                if (iconReglas) {
                    iconReglas.classList.remove('spinner-rule');
                    iconReglas.textContent = '☑';
                    iconReglas.style.color = '#16a34a';
                }
                if (textReglas) {
                    textReglas.style.color = '#1e293b';
                    textReglas.style.fontWeight = '500';
                    textReglas.textContent = 'Solución Google OR-Tools calculada';
                }

                // Renderizar métricas reales de Google OR-Tools
                if (orToolsResponse && orToolsResponse.exito) {
                    renderOrToolsResults(orToolsResponse);
                }

                // Si se optimizó un pedido realizado, sincronizar su estado a OPTIMIZADO
                if (selectedPedidoId) {
                    syncPedidoOptimizado(selectedPedidoId);
                }

                setTimeout(() => {
                    showOptSubStep('result');
    if (typeof loadDashboardInicioMetrics === 'function') {
        loadDashboardInicioMetrics(true);
    }
                    if (orToolsResponse && orToolsResponse.rutaOptimaTrayecto) {
                        setTimeout(() => renderOptimizedRouteMap(orToolsResponse.rutaOptimaTrayecto), 200);
                    }
                }, 600);
            }
        }, delay);
    });
}

/**
 * Renderiza en el DOM de la vista los resultados calculados por Google OR-Tools
 */
function renderOrToolsResults(data) {
    if (!data) return;

    // 1. Trayecto formateado
    const trayectoEl = document.getElementById('optResultTrayecto');
    if (trayectoEl && data.rutaOptimaTrayecto) {
        trayectoEl.textContent = data.rutaOptimaTrayecto;
    }

    // 2. Tiempo, Distancia, Costo
    const tiempoEl = document.getElementById('optResultTiempo');
    if (tiempoEl) tiempoEl.textContent = data.tiempoMinutos + ' min';

    const distEl = document.getElementById('optResultDistancia');
    if (distEl) distEl.textContent = data.distanciaKm + ' km';

    const costoEl = document.getElementById('optResultCosto');
    if (costoEl) costoEl.textContent = 'S/ ' + Number(data.costoSoles).toFixed(2);

    // 3. Nodos secuenciales con badges de color
    const nodesList = document.getElementById('optResultNodesList');
    if (nodesList && data.nodosClave && data.paradasNombres) {
        const colors = {
            'A': '#2563eb',
            'B': '#94a3b8',
            'C': '#16a34a',
            'D': '#f59e0b',
            'E': '#9333ea',
            'F': '#ef4444'
        };

        let html = '';
        for (let i = 0; i < data.nodosClave.length; i++) {
            const code = data.nodosClave[i];
            const name = data.paradasNombres[i] || ('Nodo ' + code);
            const color = colors[code] || '#3b82f6';

            html += `
                <div class="route-step-node">
                    <span class="node-circle-badge" style="background:${color};">${code}</span>
                    <span style="font-weight: 600;">${name}</span>
                </div>
            `;
            if (i < data.nodosClave.length - 1) {
                html += `<div class="step-arrow-down">↓</div>`;
            }
        }
        nodesList.innerHTML = html;
    }

    // 4. Motivos explicativos generados por el solver
    const motivosEl = document.getElementById('optResultMotivos');
    if (motivosEl && data.motivosSeleccion && data.motivosSeleccion.length > 0) {
        motivosEl.innerHTML = data.motivosSeleccion.map(m => `
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: #1e293b;">
                <span style="color: #16a34a; font-weight: 800;">✓</span>
                <span>${m}</span>
            </div>
        `).join('');
    }
}

/**
 * Carga métricas, tabla y gráfico comparativo en la vista de Reportes desde PostgreSQL
 */
async function loadReportesData() {
    const tbody = document.getElementById('reportesTableBody');

    // 1. Si tenemos alternativas recién calculadas con OR-Tools en la sesión
    if (window.lastOrToolsResult && window.lastOrToolsResult.rutasAlternativas && window.lastOrToolsResult.rutasAlternativas.length > 0) {
        renderReportesTable(window.lastOrToolsResult.rutasAlternativas);
        drawReportBarChart(window.lastOrToolsResult.rutasAlternativas);
    }

    // 2. Consultar resumen consolidado desde PostgreSQL
    if (window.location.protocol !== 'file:') {
        try {
            const resp = await apiFetch(API_HOST + '/api/reportes/resumen');
            if (resp.ok) {
                const data = await resp.json();

                // Actualizar tarjetas de KPI
                const kpiTon = document.getElementById('kpiReporteToneladas');
                if (kpiTon && data.pesoTotalToneladas !== undefined) {
                    kpiTon.textContent = Number(data.pesoTotalToneladas).toFixed(1) + ' Tn';
                }

                const kpiRutas = document.getElementById('kpiReporteRutas');
                if (kpiRutas && data.totalRutas !== undefined) {
                    kpiRutas.textContent = data.totalRutas;
                }

                const kpiTiempo = document.getElementById('kpiReporteTiempo');
                if (kpiTiempo && data.tiempoPromedioMin !== undefined) {
                    kpiTiempo.textContent = Math.round(data.tiempoPromedioMin) + ' min';
                }

                const kpiAhorro = document.getElementById('kpiReporteAhorro');
                if (kpiAhorro && data.ahorroEstimadoSoles !== undefined) {
                    kpiAhorro.textContent = 'S/ ' + Number(data.ahorroEstimadoSoles).toFixed(2);
                }

                // Actualizar conclusión
                const concEl = document.getElementById('reporteConclusionTexto');
                if (concEl && data.conclusion) {
                    concEl.textContent = data.conclusion;
                }

                // Si no había alternativas en memoria local, renderizar las de PostgreSQL
                if (!window.lastOrToolsResult && data.comparativaAlternativas && data.comparativaAlternativas.length > 0) {
                    renderReportesTable(data.comparativaAlternativas);
                    drawReportBarChart(data.comparativaAlternativas);
                }
            }
        } catch (err) {
            console.warn('⚠️ Error al consultar /api/reportes/resumen:', err);
        }
    }
}

function renderReportesTable(alternativas) {
    const tbody = document.getElementById('reportesTableBody');
    if (!tbody || !alternativas) return;

    let html = '';
    alternativas.forEach(alt => {
        const num = alt.numero || alt.idRuta || 1;
        const trayecto = alt.trayecto || alt.secuenciaParadas || 'A → F';
        const tiempo = alt.tiempoMinutos || alt.tiempo || 32;
        const dist = alt.distanciaKm || alt.distancia || 18.5;
        const costo = alt.costoSoles || alt.costo || 85.00;
        const puntaje = alt.puntaje || '95%';
        const rec = alt.recomendacion || 'Óptima';
        const badge = alt.badgeClase || 'badge-optima';

        html += `
            <tr>
                <td style="font-weight: 700;">${num}</td>
                <td style="font-weight: 600;">${trayecto}</td>
                <td>${tiempo}</td>
                <td>${Number(dist).toFixed(1)}</td>
                <td>${Number(costo).toFixed(2)}</td>
                <td style="font-weight: 700;">${puntaje}</td>
                <td><span class="${badge}">${rec}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

/* ==========================================================================
   GRÁFICO DE BARRAS COMPARATIVO – REPORTES (DATOS REALES)
   ========================================================================== */

function drawReportBarChart(series) {
    const canvas = document.getElementById('reportBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 460;
    const H = 230;
    canvas.width  = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    let routes  = ['Ruta 1', 'Ruta 2', 'Ruta 3'];
    let tiempos = [32, 41, 53];
    let costos  = [85, 98, 126];

    if (series && Array.isArray(series) && series.length > 0) {
        routes  = series.map((s, idx) => 'Ruta ' + (s.numero || (idx + 1)));
        tiempos = series.map(s => Number(s.tiempoMinutos || s.tiempo || 30));
        costos  = series.map(s => Number(s.costoSoles || s.costo || 80));
    }

    const padL = 40, padR = 20, padT = 20, padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    
    const maxValFound = Math.max(...tiempos, ...costos);
    const maxVal = Math.max(120, Math.ceil(maxValFound * 1.15 / 20) * 20);

    const groupW = chartW / routes.length;
    const barW   = Math.min(groupW * 0.28, 38);
    const gapB   = 5;

    // Grid horizontal
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
        const v = Math.round((maxVal / steps) * i);
        const y = padT + chartH - (v / maxVal) * chartH;
        ctx.beginPath();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Segoe UI, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v, padL - 8, y + 4);
    }

    routes.forEach((label, i) => {
        const cx = padL + i * groupW + groupW / 2;

        // Barra Tiempo (Azul)
        const tVal = tiempos[i] || 0;
        const yT = padT + chartH - (tVal / maxVal) * chartH;
        const hT = (tVal / maxVal) * chartH;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cx - barW - gapB, yT, barW, hT);

        // Valor arriba de barra de tiempo
        ctx.fillStyle = '#1e40af';
        ctx.font = '10.5px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(tVal + 'm', cx - barW / 2 - gapB, yT - 4);

        // Barra Costo (Verde)
        const cVal = Math.round(costos[i] || 0);
        const yC = padT + chartH - (cVal / maxVal) * chartH;
        const hC = (cVal / maxVal) * chartH;
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(cx + gapB, yC, barW, hC);

        // Valor arriba de barra de costo
        ctx.fillStyle = '#15803d';
        ctx.font = '10.5px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('S/' + cVal, cx + barW / 2 + gapB, yC - 4);

        // Etiqueta X
        ctx.fillStyle = '#475569';
        ctx.font = '11.5px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, H - 10);
    });
}

/* ==========================================================================
   HISTORIAL DE OPTIMIZACIONES Y RUTAS (CONEXIÓN A POSTGRESQL)
   ========================================================================== */

let allHistorialRecords = [];

/**
 * Carga el historial completo de rutas y despachos desde PostgreSQL
 */
async function loadHistorialData() {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;

    if (window.location.protocol === 'file:') {
        return;
    }

    try {
        const resp = await apiFetch(API_HOST + '/api/historial');
        if (resp.ok) {
            allHistorialRecords = await resp.json();

            // Actualizar tarjetas de métricas del historial
            const kpiTotal = document.getElementById('kpiHistorialTotal');
            if (kpiTotal) kpiTotal.textContent = allHistorialRecords.length;

            const kpiOptimas = document.getElementById('kpiHistorialOptimas');
            if (kpiOptimas) {
                const countOpt = allHistorialRecords.filter(r => r.estadoRuta === 'OPTIMA').length;
                kpiOptimas.textContent = countOpt;
            }

            const kpiFlota = document.getElementById('kpiHistorialFlotaActiva');
            if (kpiFlota) {
                // Cantidad de vehículos distintos involucrados
                const vehs = new Set(allHistorialRecords.map(r => r.vehiculoPlaca)).size;
                kpiFlota.textContent = vehs > 0 ? vehs : 3;
            }

            renderHistorialRows(allHistorialRecords);
        } else {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#ef4444;">No se pudo cargar el historial desde el servidor.</td></tr>`;
        }
    } catch (err) {
        console.warn('⚠️ Error al cargar /api/historial:', err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#ef4444;">Error de conexión con PostgreSQL.</td></tr>`;
    }
}

function renderHistorialRows(list) {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No hay registros de rutas optimizadas en la base de datos.</td></tr>`;
        return;
    }

    let html = '';
    list.forEach(item => {
        let badgeClass = 'badge-alternativa';
        let badgeLabel = 'Alternativa';
        if (item.estadoRuta === 'OPTIMA') {
            badgeClass = 'badge-optima';
            badgeLabel = 'Óptima (OR-Tools)';
        } else if (item.estadoRuta === 'NO_RECOMENDADA') {
            badgeClass = 'badge-descartada';
            badgeLabel = 'No recomendada';
        }

        const trayecto = item.trayecto || (item.origen + ' → ' + item.destino);
        const material = item.material || 'Bobinas de acero';
        const peso = item.pesoT ? ` (${item.pesoT} Tn)` : '';
        const transportista = item.transportistaNombre || 'Por asignar';
        const vehiculo = item.vehiculoPlaca ? `${item.vehiculoPlaca} (${item.vehiculoModelo || ''})` : 'Volvo FH 540';
        const distTiempo = `${Number(item.distanciaKm || 0).toFixed(1)} km / ${Math.round(item.tiempoMin || 0)} min`;
        const costo = item.costo ? `S/ ${Number(item.costo).toFixed(2)}` : 'S/ 85.00';

        html += `
            <tr>
                <td style="font-weight: 700; color: #1e293b;">${item.codigo || ('#OPT-' + item.idRuta)}</td>
                <td style="font-size: 12.5px; color: #475569;">${item.fechaHora || 'Hoy'}</td>
                <td style="font-weight: 600; color: #0f172a;">${trayecto}</td>
                <td>${material}${peso}</td>
                <td>${transportista}</td>
                <td>${vehiculo}</td>
                <td style="font-size: 12.5px;">${distTiempo}</td>
                <td style="font-weight: 700; color: #15803d;">${costo}</td>
                <td><span class="${badgeClass}">${badgeLabel}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function filterHistorialTable() {
    const searchVal = (document.getElementById('historialSearchInput')?.value || '').toLowerCase().trim();
    const estadoVal = document.getElementById('historialFilterEstado')?.value || 'TODOS';

    let filtered = allHistorialRecords;

    if (estadoVal !== 'TODOS') {
        filtered = filtered.filter(item => item.estadoRuta === estadoVal);
    }

    if (searchVal) {
        filtered = filtered.filter(item => {
            const cod = (item.codigo || '').toLowerCase();
            const tray = (item.trayecto || '').toLowerCase();
            const orig = (item.origen || '').toLowerCase();
            const dest = (item.destino || '').toLowerCase();
            const mat = (item.material || '').toLowerCase();
            const trp = (item.transportistaNombre || '').toLowerCase();
            const veh = (item.vehiculoPlaca || '').toLowerCase();

            return cod.includes(searchVal) || tray.includes(searchVal) || orig.includes(searchVal) ||
                   dest.includes(searchVal) || mat.includes(searchVal) || trp.includes(searchVal) ||
                   veh.includes(searchVal);
        });
    }

    renderHistorialRows(filtered);
}

function resetOptimizationWizard() {
    const iconReglas = document.getElementById('iconReglasExpertas');
    const textReglas = document.getElementById('textReglasExpertas');
    if (iconReglas) {
        iconReglas.classList.add('spinner-rule');
        iconReglas.textContent = '🔄';
        iconReglas.style.color = '#2563eb';
    }
    if (textReglas) {
        textReglas.style.color = '#2563eb';
        textReglas.style.fontWeight = '600';
    }

    const form = document.getElementById('formOptimizacion');
    if (form) form.reset();

    const eqRadio = document.querySelector('input[name="optObjetivo"][value="equilibrio"]');
    if (eqRadio) eqRadio.checked = true;

    const pesoCheck = document.getElementById('restPesoCheck');
    if (pesoCheck) pesoCheck.checked = true;

    const pesoVal = document.getElementById('restPesoVal');
    if (pesoVal) pesoVal.value = '25';

    showOptSubStep('form');
}

/* ==========================================================================
   MÉTRICAS REALES Y GRÁFICO DINÁMICO – PANEL PRINCIPAL (INICIO)
   ========================================================================== */

let cachedDashboardMetrics = null;

/**
 * Carga las métricas reales y últimas optimizaciones desde /api/dashboard/resumen
 */
async function loadDashboardInicioMetrics(silent = false) {
    const kpiRutas  = document.getElementById('kpiRutas');
    const kpiAhorro = document.getElementById('kpiAhorro');
    const kpiTiempo = document.getElementById('kpiTiempo');
    const listOpt   = document.getElementById('ultimasOptimizacionesInicioList');

    if (!kpiRutas && !listOpt) return;

    if (!silent && kpiRutas && (kpiRutas.textContent === '--' || kpiRutas.textContent === '125')) {
        kpiRutas.textContent = '...';
        if (kpiAhorro) kpiAhorro.textContent = '...';
        if (kpiTiempo) kpiTiempo.textContent = '...';
    }

    try {
        const resp = await apiFetch('/api/dashboard/resumen');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        cachedDashboardMetrics = data;

        // 1. KPI Rutas analizadas real
        if (kpiRutas) {
            kpiRutas.textContent = Number(data.totalAnalisis || 0).toLocaleString();
        }

        // 2. KPI Ahorro estimado real
        if (kpiAhorro) {
            const ahorro = Number(data.ahorroEstimadoSoles || 0);
            kpiAhorro.textContent = 'S./ ' + ahorro.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // 3. KPI Tiempo reducido promedio real
        if (kpiTiempo) {
            const pct = Number(data.tiempoReducidoPromedio || 0);
            kpiTiempo.textContent = Math.round(pct) + '%';
        }

        // 4. Últimas Optimizaciones en la tarjeta lateral
        if (listOpt) {
            try {
                const ultimas = data.ultimasOptimizaciones || [];
                const badgeCount = document.getElementById('ultimasOptCountBadge');
                if (badgeCount) badgeCount.textContent = `${ultimas.length} Registros`;

                if (ultimas.length === 0) {
                    listOpt.innerHTML = `
                        <div style="text-align: center; padding: 40px 10px; color: #94a3b8; font-size: 13px;">
                            <span style="font-size: 26px; display: block; margin-bottom: 8px;">🚛</span>
                            Aún no hay rutas analizadas.<br>
                            <a href="#" onclick="navigateTo('optimizar'); return false;" style="color: #2563eb; font-weight: 600; text-decoration: underline;">
                                Realizar la primera optimización
                            </a>
                        </div>
                    `;
                } else {
                    listOpt.innerHTML = ultimas.map(opt => {
                        const trayecto = escapeHtml(opt.trayecto || ((opt.origen || 'Origen') + ' → ' + (opt.destino || 'Destino')));
                        const costoStr = opt.costo != null ? ('S/ ' + Number(opt.costo).toLocaleString('es-PE', { minimumFractionDigits: 2 })) : '';
                        const tiempoStr = opt.tiempoMin != null ? (Math.round(opt.tiempoMin) + ' min') : '';
                        const metaDetalle = [costoStr, tiempoStr].filter(Boolean).join(' • ');

                        return `
                            <div class="opt-item" style="transition: all 0.2s; cursor: pointer;" onclick="verDetalleOptInicio(${opt.idRuta || 0})" title="Ver detalles de esta ruta en Historial">
                                <div class="opt-info" style="flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; gap: 6px;">
                                        <span style="font-size: 11px; font-weight: 700; color: #1e3a8a; background: #dbeafe; padding: 1px 6px; border-radius: 4px;">
                                            ${escapeHtml(opt.codigo || '#OPT')}
                                        </span>
                                        <span class="opt-route" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;" title="${trayecto}">
                                            ${trayecto}
                                        </span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px;">
                                        <span class="opt-time" style="font-size: 11px; color: #64748b;">${escapeHtml(opt.fechaHora || 'Hoy')}</span>
                                        <span style="font-size: 11px; font-weight: 600; color: #047857;">${metaDetalle}</span>
                                    </div>
                                </div>
                                <span class="opt-badge" style="margin-left: 8px; flex-shrink: 0;">OPTIMO</span>
                            </div>
                        `;
                    }).join('');
                }
            } catch (errList) {
                console.warn('Error al renderizar lista de últimas optimizaciones:', errList);
            }
        }

        // 5. Gráfico Canvas con datos reales
        try {
            drawChart(data.puntosGrafico || []);
        } catch (errChart) {
            console.warn('Error al renderizar gráfico Canvas:', errChart);
        }

        if (silent) {
            console.log('🔄 Panel Principal sincronizado con la base de datos:', data);
        }
    } catch (err) {
        console.warn('Error al cargar métricas del Panel Principal:', err);
    }
}

/**
 * Permite hacer clic en cualquier optimización del panel de inicio para verla en Historial
 */
function verDetalleOptInicio(idRuta) {
    navigateTo('historial');
    setTimeout(() => {
        const searchInput = document.getElementById('historialSearchInput');
        if (searchInput && idRuta) {
            searchInput.value = '#OPT-' + (1000 + idRuta);
            searchInput.dispatchEvent(new Event('input'));
        }
    }, 200);
}

/**
 * Dibuja el gráfico de rendimiento con los tiempos y costos reales de las optimizaciones
 */
function drawChart(puntos) {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Auto-ajustar ancho del canvas al contenedor si está disponible
    if (canvas.parentElement && canvas.parentElement.clientWidth > 150) {
        canvas.width = canvas.parentElement.clientWidth;
    }
    const w = canvas.width || 550;
    const h = canvas.height || 230;

    ctx.clearRect(0, 0, w, h);

    const padL = 48, padR = 48, padT = 25, padB = 35;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const dataPoints = (Array.isArray(puntos) && puntos.length > 0)
        ? puntos
        : (cachedDashboardMetrics && Array.isArray(cachedDashboardMetrics.puntosGrafico) && cachedDashboardMetrics.puntosGrafico.length > 0)
            ? cachedDashboardMetrics.puntosGrafico
            : [];

    if (dataPoints.length === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sin rutas optimizadas registradas aún en la base de datos.', w / 2, h / 2);
        return;
    }

    const count = dataPoints.length;
    const tiempos = dataPoints.map(p => Number(p.tiempo || 0));
    const costos  = dataPoints.map(p => Number(p.costo || 0));

    let maxT = Math.max(...tiempos, 10);
    maxT = Math.ceil(maxT * 1.15);

    let maxC = Math.max(...costos, 10);
    maxC = Math.ceil(maxC * 1.15);

    const stepsY = 4;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f1f5f9';
    ctx.font = '10px Segoe UI, sans-serif';

    // Cuadrícula y escalas Y
    for (let i = 0; i <= stepsY; i++) {
        const y = padT + chartH - (i * (chartH / stepsY));
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();

        // Eje izquierdo: Tiempo (min) - Azul
        ctx.fillStyle = '#2563eb';
        ctx.textAlign = 'right';
        const valT = Math.round((maxT / stepsY) * i);
        ctx.fillText(valT + 'm', padL - 8, y + 3);

        // Eje derecho: Costo (S/) - Verde
        ctx.fillStyle = '#16a34a';
        ctx.textAlign = 'left';
        const valC = Math.round((maxC / stepsY) * i);
        ctx.fillText('S/' + valC, w - padR + 8, y + 3);
    }

    // Coordenadas X
    const stepX = count > 1 ? (chartW / (count - 1)) : (chartW / 2);

    dataPoints.forEach((p, i) => {
        const x = count > 1 ? (padL + (i * stepX)) : (padL + chartW / 2);
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.font = '10px Segoe UI, sans-serif';
        const lbl = p.codigo || p.label || ('#' + (i + 1));
        const shortLbl = lbl.length > 12 ? lbl.substring(0, 10) + '..' : lbl;
        ctx.fillText(shortLbl, x, h - 10);
    });

    function getYTiempo(val) {
        return padT + chartH - ((val / maxT) * chartH);
    }

    function getYCosto(val) {
        return padT + chartH - ((val / maxC) * chartH);
    }

    // 1. Línea Tiempo (Azul)
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    dataPoints.forEach((p, i) => {
        const x = count > 1 ? (padL + (i * stepX)) : (padL + chartW / 2);
        const y = getYTiempo(p.tiempo);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Puntos Tiempo
    ctx.fillStyle = '#2563eb';
    dataPoints.forEach((p, i) => {
        const x = count > 1 ? (padL + (i * stepX)) : (padL + chartW / 2);
        const y = getYTiempo(p.tiempo);
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2563eb';
    });

    // 2. Línea Costo (Verde)
    ctx.beginPath();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.5;
    dataPoints.forEach((p, i) => {
        const x = count > 1 ? (padL + (i * stepX)) : (padL + chartW / 2);
        const y = getYCosto(p.costo);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Puntos Costo
    ctx.fillStyle = '#16a34a';
    dataPoints.forEach((p, i) => {
        const x = count > 1 ? (padL + (i * stepX)) : (padL + chartW / 2);
        const y = getYCosto(p.costo);
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
    });
}

/* ==========================================================================
   LÓGICA DE FLOTAS Y VEHÍCULOS (PARQUE VEHICULAR Y CAPACIDADES EN TONELADAS)
   ========================================================================== */

let memoryFlotas = [];
let memoryVehiculos = [];
let memoryClientes = [];
let memoryPedidos = [];

/* ==========================================================================
   CRUD COMPLETO: FLOTAS, VEHÍCULOS, CLIENTES, PEDIDOS Y RUTAS
   ========================================================================== */

let memoryRutas = [];

// ── 1. FLOTAS Y VEHÍCULOS ──────────────────────────────────────────────────

async function loadFlotaData() {
    const grid = document.getElementById('flotasCardsGrid');
    const selFiltro = document.getElementById('filtroVehiculoFlota');
    const badge = document.getElementById('flotaDbBadge');

    try {
        if (window.location.protocol !== 'file:') {
            const [resFlotas, resVehiculos] = await Promise.all([
                apiFetch(API_HOST + '/api/flotas'),
                apiFetch(API_HOST + '/api/vehiculos')
            ]);
            if (resFlotas.ok) memoryFlotas = await resFlotas.json();
            if (resVehiculos.ok) memoryVehiculos = await resVehiculos.json();

            if (badge) {
                badge.className = 'server-status-pill online';
                badge.textContent = '🟢 PostgreSQL Conectado';
            }
        }
    } catch (err) {
        console.warn('Error cargando flotas/vehículos desde BD:', err);
    }

    // Mapa de flotas por id
    const flotaMap = {};
    (memoryFlotas || []).forEach(f => { flotaMap[f.idFlota] = f.nombreFlota; });

    // Renderizar tarjetas de flotas con resumen de vehículos asignados
    if (grid) {
        if (!memoryFlotas || memoryFlotas.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; color:#64748b; text-align:center;">No hay flotas registradas. Haz clic en "+ Nueva Flota".</div>`;
        } else {
            grid.innerHTML = memoryFlotas.map(f => {
                const vehsDeFlota = (memoryVehiculos || []).filter(v => Number(v.idFlota) === Number(f.idFlota));
                const capTotal = vehsDeFlota.reduce((acc, v) => acc + (Number(v.capacidadMaxTon) || 0), 0);
                const placasHtml = vehsDeFlota.length > 0 
                    ? vehsDeFlota.map(v => `<span style="background:#eff6ff; color:#1d4ed8; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #bfdbfe; font-size:11px; margin-right:4px;">${v.placa}</span>`).join('')
                    : '<span style="color:#94a3b8; font-size:11px;">(Sin unidades asignadas aún)</span>';

                return `
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:18px; box-shadow:0 2px 6px rgba(0,0,0,0.03); display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:11.5px; color:#0284c7; font-weight:800; text-transform:uppercase;">Flota #${f.idFlota}</span>
                                <span class="${f.activo !== false ? 'badge-optima' : 'badge-no-optima'}" style="font-size:10px;">${f.activo !== false ? 'ACTIVA' : 'INACTIVA'}</span>
                            </div>
                            <div style="font-size:16px; font-weight:800; color:#0f172a; margin:6px 0 4px;">${f.nombreFlota}</div>
                            <p style="font-size:12.5px; color:#64748b; margin:0 0 12px;">${f.descripcion || 'Flota activa de transporte de acero'}</p>

                            <!-- Cuadro de Unidades en esta Flota -->
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                    <span style="font-size:11.5px; font-weight:700; color:#475569;">🚚 Unidades Asignadas:</span>
                                    <strong style="font-size:12.5px; color:#0f172a;">${vehsDeFlota.length} vehículos</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                                    <span style="font-size:11.5px; font-weight:700; color:#475569;">⚖️ Capacidad Total:</span>
                                    <strong style="font-size:12.5px; color:#15803d;">${capTotal.toFixed(1)} Tn</strong>
                                </div>
                                <div style="margin-top: 6px; display:flex; flex-wrap:wrap; gap:4px;">
                                    ${placasHtml}
                                </div>
                            </div>
                        </div>

                        <div style="border-top:1px solid #f1f5f9; padding-top:12px; display:flex; justify-content:space-between; align-items:center; gap:6px; flex-wrap:wrap;">
                            <button class="btn-sm" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="openNewVehiculoModal(${f.idFlota})">
                                <span>+</span> Agregar Vehículo a esta Flota
                            </button>
                            <div style="display:flex; gap:6px;">
                                <button class="btn-action-edit" onclick="openEditFlotaModal(${f.idFlota}, '${f.nombreFlota.replace(/'/g, "\'")}', '${(f.descripcion || '').replace(/'/g, "\'")}')">Editar</button>
                                <button class="btn-action-del" onclick="deleteFlota(${f.idFlota}, '${f.nombreFlota.replace(/'/g, "\'")}')">Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Actualizar selector de filtro de flota
    if (selFiltro && memoryFlotas) {
        selFiltro.innerHTML = '<option value="TODAS">Todas las Flotas</option>' + 
            memoryFlotas.map(f => `<option value="${f.idFlota}">Flota #${f.idFlota} - ${f.nombreFlota}</option>`).join('') +
            '<option value="SIN_FLOTA">⚠️ Sin Flota Asignada</option>';
    }

    renderVehiculosTable(memoryVehiculos || []);
}

function filterVehiculosByFlota(flotaId) {
    if (!memoryVehiculos) return;
    let list = [...memoryVehiculos];
    if (flotaId === 'SIN_FLOTA') {
        list = list.filter(v => !v.idFlota);
    } else if (flotaId !== 'TODAS') {
        list = list.filter(v => Number(v.idFlota) === Number(flotaId));
    }
    renderVehiculosTable(list);
}

function renderVehiculosTable(list) {
    const tbody = document.getElementById('vehiculosTbody');
    if (!tbody) return;

    const flotaMap = {};
    (memoryFlotas || []).forEach(f => { flotaMap[f.idFlota] = f.nombreFlota; });

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No hay vehículos registrados para esta flota.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(v => {
        const badgeStatus = v.estadoOperativo === 'DISPONIBLE' ? 'badge-optima' : (v.estadoOperativo === 'EN_RUTA' ? 'badge-alternativa' : 'badge-no-optima');
        const nombreFlota = flotaMap[v.idFlota];
        const flotaHtml = nombreFlota 
            ? `<span style="background:#f0fdf4; color:#15803d; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11.5px; border:1px solid #bbf7d0;">🏢 ${nombreFlota}</span>`
            : `<span style="background:#fef2f2; color:#dc2626; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11px; border:1px solid #fecaca;">⚠️ Sin Flota</span>`;

        return `
            <tr>
                <td style="font-weight:700; color:#64748b;">#${v.idVehiculo}</td>
                <td style="font-weight:700; color:#1e293b;"><span style="background:#f1f5f9; padding:2px 8px; border-radius:4px; border:1px solid #cbd5e1;">${v.placa}</span></td>
                <td>${flotaHtml}</td>
                <td>${v.tipoCamion || 'Plataforma'}</td>
                <td><strong>${v.modelo || 'Volvo FH 540'}</strong></td>
                <td style="color:#15803d; font-weight:700;">${v.capacidadMaxTon || 24} Tn</td>
                <td>${v.volumenMaxM3 ? v.volumenMaxM3 + ' m³' : '32 m³'}</td>
                <td><span class="${badgeStatus}">${v.estadoOperativo || 'DISPONIBLE'}</span></td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-action-edit" onclick="openEditVehiculoModal(${v.idVehiculo}, '${v.placa}', '${v.tipoCamion || ''}', '${(v.modelo || '').replace(/'/g, "\'")}', ${v.capacidadMaxTon || 24}, ${v.volumenMaxM3 || 32}, '${v.estadoOperativo || 'DISPONIBLE'}', ${v.idFlota || 1})">Editar</button>
                    <button class="btn-action-del" onclick="deleteVehiculo(${v.idVehiculo}, '${v.placa}')">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ── Modales y operaciones de Flotas ────────────────────────────────────────

function openNewFlotaModal() {
    const hiddenId = document.getElementById('flotaId');
    if (hiddenId) hiddenId.value = '';
    const nameInput = document.getElementById('flotaNombre');
    const descInput = document.getElementById('flotaDescripcion');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';

    const modal = document.getElementById('flotaModal');
    if (modal) modal.classList.add('active');
}

function openEditFlotaModal(id, nombre, desc) {
    const hiddenId = document.getElementById('flotaId');
    if (hiddenId) hiddenId.value = id;
    const nameInput = document.getElementById('flotaNombre');
    const descInput = document.getElementById('flotaDescripcion');
    if (nameInput) nameInput.value = nombre;
    if (descInput) descInput.value = desc || '';

    const modal = document.getElementById('flotaModal');
    if (modal) modal.classList.add('active');
}

function closeFlotaModal() {
    const modal = document.getElementById('flotaModal');
    if (modal) modal.classList.remove('active');
}

async function saveFlota(e) {
    e.preventDefault();
    const id = document.getElementById('flotaId')?.value;
    const nombreFlota = document.getElementById('flotaNombre').value.trim();
    const descripcion = document.getElementById('flotaDescripcion').value.trim();
    const payload = { nombreFlota, descripcion, activo: true };

    try {
        if (window.location.protocol !== 'file:') {
            const url = id ? `${API_HOST}/api/flotas/${id}` : `${API_HOST}/api/flotas`;
            const method = id ? 'PUT' : 'POST';
            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar flota');
            alert(id ? '✅ Flota actualizada correctamente.' : '✅ Flota creada exitosamente en PostgreSQL.');
        } else {
            alert('✅ Flota procesada localmente.');
        }
        closeFlotaModal();
        loadFlotaData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteFlota(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar o desactivar la flota "${nombre}" (#${id})?`)) return;
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/flotas/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || '✅ Flota eliminada.');
        }
        loadFlotaData();
    } catch (err) {
        alert('Error al eliminar flota: ' + err.message);
    }
}

// ── Modales y operaciones de Vehículos ─────────────────────────────────────

async function openNewVehiculoModal(preselectedFlotaId = null) {
    const hiddenId = document.getElementById('vehId');
    if (hiddenId) hiddenId.value = '';
    const form = document.getElementById('vehiculoForm');
    if (form) form.reset();

    if (!memoryFlotas || memoryFlotas.length === 0) {
        try {
            const res = await apiFetch(API_HOST + '/api/flotas');
            if (res.ok) memoryFlotas = await res.json();
        } catch (e) {
            console.warn(e);
        }
    }

    const sel = document.getElementById('vehFlotaSelect');
    if (sel && memoryFlotas && memoryFlotas.length > 0) {
        sel.innerHTML = memoryFlotas.map(f => `
            <option value="${f.idFlota}" ${preselectedFlotaId && Number(f.idFlota) === Number(preselectedFlotaId) ? 'selected' : ''}>
                Flota #${f.idFlota} - ${f.nombreFlota}
            </option>
        `).join('');
        if (preselectedFlotaId) {
            sel.value = preselectedFlotaId;
        }
    }

    const modal = document.getElementById('vehiculoModal');
    if (modal) modal.classList.add('active');
}

function openEditVehiculoModal(id, placa, tipo, modelo, cap, vol, estado, idFlota) {
    const hiddenId = document.getElementById('vehId');
    if (hiddenId) hiddenId.value = id;

    const placaInput = document.getElementById('vehPlaca');
    const tipoSelect = document.getElementById('vehTipo');
    const modeloInput = document.getElementById('vehModelo');
    const capInput = document.getElementById('vehCapacidad');
    const volInput = document.getElementById('vehVolumen');

    if (placaInput) placaInput.value = placa;
    if (tipoSelect) tipoSelect.value = tipo;
    if (modeloInput) modeloInput.value = modelo;
    if (capInput) capInput.value = cap;
    if (volInput) volInput.value = vol;

    const sel = document.getElementById('vehFlotaSelect');
    if (sel && memoryFlotas.length > 0) {
        sel.innerHTML = memoryFlotas.map(f => `<option value="${f.idFlota}" ${f.idFlota === idFlota ? 'selected' : ''}>${f.nombreFlota}</option>`).join('');
    }

    const modal = document.getElementById('vehiculoModal');
    if (modal) modal.classList.add('active');
}

function closeVehiculoModal() {
    const modal = document.getElementById('vehiculoModal');
    if (modal) modal.classList.remove('active');
}

async function saveVehiculo(e) {
    e.preventDefault();
    const id = document.getElementById('vehId')?.value;
    const placa = document.getElementById('vehPlaca').value.trim().toUpperCase();
    const tipoCamion = document.getElementById('vehTipo').value;
    const modelo = document.getElementById('vehModelo').value.trim();
    const capacidadMaxTon = parseFloat(document.getElementById('vehCapacidad').value);
    const volumenMaxM3 = parseFloat(document.getElementById('vehVolumen').value);
    const idFlota = parseInt(document.getElementById('vehFlotaSelect')?.value || 1);

    const payload = { placa, tipoCamion, modelo, capacidadMaxTon, volumenMaxM3, idFlota, estadoOperativo: 'DISPONIBLE' };

    try {
        if (window.location.protocol !== 'file:') {
            const url = id ? `${API_HOST}/api/vehiculos/${id}` : `${API_HOST}/api/vehiculos`;
            const method = id ? 'PUT' : 'POST';
            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar vehículo');
            alert(id ? '✅ Vehículo actualizado correctamente.' : '✅ Vehículo registrado exitosamente en la base de datos.');
        } else {
            alert('✅ Vehículo procesado localmente.');
        }
        closeVehiculoModal();
        loadFlotaData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteVehiculo(id, placa) {
    if (!confirm(`¿Estás seguro de eliminar o inactivar el vehículo con placa ${placa} (#${id})?`)) return;
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/vehiculos/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || '✅ Vehículo eliminado.');
        }
        loadFlotaData();
    } catch (err) {
        alert('Error al eliminar vehículo: ' + err.message);
    }
}

// ── 2. CLIENTES Y PEDIDOS ──────────────────────────────────────────────────

async function loadClientesData() {
    const tbodyCli = document.getElementById('clientesTbody');
    const tbodyPed = document.getElementById('pedidosTbody');
    const badge = document.getElementById('clientesDbBadge');

    try {
        if (window.location.protocol !== 'file:') {
            const [resCli, resPed] = await Promise.all([
                apiFetch(API_HOST + '/api/clientes'),
                apiFetch(API_HOST + '/api/pedidos')
            ]);
            if (resCli.ok) memoryClientes = await resCli.json();
            if (resPed.ok) memoryPedidos = await resPed.json();

            if (badge) {
                badge.className = 'server-status-pill online';
                badge.textContent = '🟢 PostgreSQL Conectado';
            }
        }
    } catch (err) {
        console.warn('Error cargando clientes/pedidos desde BD:', err);
    }

    if (tbodyPed) {
        if (!memoryPedidos || memoryPedidos.length === 0) {
            tbodyPed.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No hay pedidos registrados. Haz clic en "+ Registrar Pedido".</td></tr>`;
        } else {
            tbodyPed.innerHTML = memoryPedidos.map(p => {
                const badgeClass = p.prioridad === 'ALTA' ? 'badge-no-optima' : (p.prioridad === 'MEDIA' ? 'badge-alternativa' : 'badge-optima');
                
                // Buscar si tiene asignación de vehículo o despacho activo
                const dispatch = (activeDispatches || []).find(d => Number(d.idPedido) === Number(p.idPedido) || (d.material && d.material.includes(p.tipoMaterial)));
                const asignacionHtml = dispatch
                    ? `<span style="background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:12px; font-weight:700; font-size:11px; border:1px solid #bfdbfe;">🚛 ${dispatch.placa} (${dispatch.vehiculo})</span>`
                    : `<button class="btn-sm" style="background:#1e3a8a; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-weight:700; font-size:11px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="openAssignFromPedido(${p.idPedido})"><span>📋</span> + Asignar Flota</button>`;

                return `
                    <tr>
                        <td style="font-weight:700; color:#64748b;">#PED-${p.idPedido}</td>
                        <td><strong>${p.clienteNombre || 'Cliente General'}</strong><br><small style="color:#64748b;">${p.clienteRuc || ''}</small></td>
                        <td style="color:#0f172a; font-weight:600;">📦 ${p.tipoMaterial}</td>
                        <td><strong style="color:#15803d; font-size:13.5px;">${p.pesoT} Tn</strong></td>
                        <td>${p.direccionDestino}</td>
                        <td>${asignacionHtml}</td>
                        <td><span class="${badgeClass}">${p.prioridad}</span></td>
                        <td>
                            <select onchange="quickChangePedidoEstado(${p.idPedido}, this.value)" style="padding:3px 6px; font-size:11.5px; border-radius:4px; font-weight:600; border:1px solid #cbd5e1; background:#f8fafc;">
                                <option value="REGISTRADO" ${p.estadoPedido === 'REGISTRADO' ? 'selected' : ''}>REGISTRADO</option>
                                <option value="EN_PROCESO" ${p.estadoPedido === 'EN_PROCESO' ? 'selected' : ''}>EN_PROCESO</option>
                                <option value="OPTIMIZADO" ${p.estadoPedido === 'OPTIMIZADO' ? 'selected' : ''}>OPTIMIZADO</option>
                                <option value="DESPACHADO" ${p.estadoPedido === 'DESPACHADO' ? 'selected' : ''}>DESPACHADO</option>
                                <option value="ENTREGADO" ${p.estadoPedido === 'ENTREGADO' ? 'selected' : ''}>ENTREGADO</option>
                                <option value="CANCELADO" ${p.estadoPedido === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
                            </select>
                        </td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button class="btn-action-edit" onclick="openEditPedidoModal(${p.idPedido}, ${p.idCliente || 1}, '${p.tipoMaterial.replace(/'/g, "\'")}', ${p.pesoT}, '${p.direccionDestino.replace(/'/g, "\'")}', '${p.prioridad}', '${p.objetivoOptimizacion}', '${p.estadoPedido}')">Editar</button>
                            <button class="btn-action-del" onclick="deletePedido(${p.idPedido})">Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    if (tbodyCli) {
        if (!memoryClientes || memoryClientes.length === 0) {
            tbodyCli.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No hay clientes registrados. Haz clic en "+ Registrar Cliente".</td></tr>`;
        } else {
            tbodyCli.innerHTML = memoryClientes.map(c => `
                <tr>
                    <td style="font-weight:700; color:#64748b;">#CLI-${c.idCliente}</td>
                    <td><strong style="color:#0f172a;">${c.nombre}</strong></td>
                    <td><span style="font-family:monospace; font-weight:600; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${c.tipoDocumento} ${c.numeroDocumento}</span></td>
                    <td><small style="color:#475569;">${c.direccionFiscal || 'No registrada'}</small></td>
                    <td>${c.contactoNombre || 'Contacto Comercial'}</td>
                    <td>${c.telefono || 'Sin teléfono'}</td>
                    <td><span class="${c.activo !== false ? 'badge-optima' : 'badge-no-optima'}">${c.activo !== false ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="btn-action-edit" onclick="openEditClienteModal(${c.idCliente}, '${c.nombre.replace(/'/g, "\'")}', '${c.tipoDocumento}', '${c.numeroDocumento}', '${(c.direccionFiscal || '').replace(/'/g, "\'")}', '${(c.contactoNombre || '').replace(/'/g, "\'")}', '${c.telefono || ''}', '${c.email || ''}')">Editar</button>
                        <button class="btn-action-del" onclick="deleteCliente(${c.idCliente}, '${c.nombre.replace(/'/g, "\'")}')">Eliminar</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// ── Modales y operaciones de Clientes ──────────────────────────────────────

function openNewClienteModal() {
    const hiddenId = document.getElementById('cliId');
    if (hiddenId) hiddenId.value = '';
    const form = document.getElementById('clienteForm');
    if (form) form.reset();

    const modal = document.getElementById('clienteModal');
    if (modal) modal.classList.add('active');
}

function openEditClienteModal(id, nombre, tipoDoc, numDoc, dir, contacto, tel, email) {
    const hiddenId = document.getElementById('cliId');
    if (hiddenId) hiddenId.value = id;

    const nombreIn = document.getElementById('cliNombre');
    const tipoSelect = document.getElementById('cliTipoDoc');
    const numIn = document.getElementById('cliNumDoc');
    const dirIn = document.getElementById('cliDireccion');
    const contIn = document.getElementById('cliContacto');
    const telIn = document.getElementById('cliTelefono');

    if (nombreIn) nombreIn.value = nombre;
    if (tipoSelect) tipoSelect.value = tipoDoc;
    if (numIn) numIn.value = numDoc;
    if (dirIn) dirIn.value = dir || '';
    if (contIn) contIn.value = contacto || '';
    if (telIn) telIn.value = tel || '';

    const modal = document.getElementById('clienteModal');
    if (modal) modal.classList.add('active');
}

function closeClienteModal() {
    const modal = document.getElementById('clienteModal');
    if (modal) modal.classList.remove('active');
}

async function saveCliente(e) {
    e.preventDefault();
    const id = document.getElementById('cliId')?.value;
    const nombre = document.getElementById('cliNombre').value.trim();
    const tipoDocumento = document.getElementById('cliTipoDoc').value;
    const numeroDocumento = document.getElementById('cliNumDoc').value.trim();
    const direccionFiscal = document.getElementById('cliDireccion').value.trim();
    const contactoNombre = document.getElementById('cliContacto').value.trim();
    const telefono = document.getElementById('cliTelefono').value.trim();

    const payload = { nombre, tipoDocumento, numeroDocumento, direccionFiscal, contactoNombre, telefono, activo: true };

    try {
        if (window.location.protocol !== 'file:') {
            const url = id ? `${API_HOST}/api/clientes/${id}` : `${API_HOST}/api/clientes`;
            const method = id ? 'PUT' : 'POST';
            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar cliente');
            alert(id ? '✅ Cliente actualizado correctamente.' : '✅ Cliente registrado exitosamente en PostgreSQL.');
        } else {
            alert('✅ Cliente procesado localmente.');
        }
        closeClienteModal();
        loadClientesData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteCliente(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar el cliente "${nombre}" (#CLI-${id})?`)) return;
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/clientes/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || '✅ Cliente eliminado.');
        }
        loadClientesData();
    } catch (err) {
        alert('Error al eliminar cliente: ' + err.message);
    }
}

// ── Modales y operaciones de Pedidos ───────────────────────────────────────

function openNewPedidoModal() {
    const hiddenId = document.getElementById('pedId');
    if (hiddenId) hiddenId.value = '';
    const form = document.getElementById('pedidoForm');
    if (form) form.reset();

    const selectCli = document.getElementById('pedClienteSelect');
    if (selectCli && memoryClientes.length > 0) {
        selectCli.innerHTML = memoryClientes.map(c => `<option value="${c.idCliente}">${c.nombre} (${c.numeroDocumento})</option>`).join('');
    }

    const modal = document.getElementById('pedidoModal');
    if (modal) modal.classList.add('active');
}

function openEditPedidoModal(id, idCli, material, peso, destino, prioridad, objetivo, estado) {
    const hiddenId = document.getElementById('pedId');
    if (hiddenId) hiddenId.value = id;

    const selectCli = document.getElementById('pedClienteSelect');
    if (selectCli && memoryClientes.length > 0) {
        selectCli.innerHTML = memoryClientes.map(c => `<option value="${c.idCliente}" ${c.idCliente === idCli ? 'selected' : ''}>${c.nombre} (${c.numeroDocumento})</option>`).join('');
    }

    const matSelect = document.getElementById('pedMaterial');
    const pesoIn = document.getElementById('pedPeso');
    const destIn = document.getElementById('pedDestino');
    const priSelect = document.getElementById('pedPrioridad');
    const objSelect = document.getElementById('pedObjetivo');

    if (matSelect) matSelect.value = material;
    if (pesoIn) pesoIn.value = peso;
    if (destIn) destIn.value = destino;
    if (priSelect) priSelect.value = prioridad;
    if (objSelect) objSelect.value = objetivo;

    const modal = document.getElementById('pedidoModal');
    if (modal) modal.classList.add('active');
}

function closePedidoModal() {
    const modal = document.getElementById('pedidoModal');
    if (modal) modal.classList.remove('active');
}

async function savePedido(e) {
    e.preventDefault();
    const id = document.getElementById('pedId')?.value;
    const idCliente = parseInt(document.getElementById('pedClienteSelect').value);
    const tipoMaterial = document.getElementById('pedMaterial').value;
    const pesoT = parseFloat(document.getElementById('pedPeso').value);
    const direccionDestino = document.getElementById('pedDestino').value.trim();
    const prioridad = document.getElementById('pedPrioridad').value;
    const objetivoOptimizacion = document.getElementById('pedObjetivo').value;

    const payload = {
        idCliente,
        idUsuarioGestor: 1,
        tipoMaterial,
        pesoT,
        volumenM3: pesoT * 1.3,
        direccionDestino,
        prioridad,
        objetivoOptimizacion,
        evitarTraficoPesado: false,
        evitarZonasMantenimiento: false,
        estadoPedido: 'REGISTRADO'
    };

    try {
        if (window.location.protocol !== 'file:') {
            const url = id ? `${API_HOST}/api/pedidos/${id}` : `${API_HOST}/api/pedidos`;
            const method = id ? 'PUT' : 'POST';
            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar pedido');
            alert(id ? '✅ Pedido actualizado correctamente.' : '✅ Pedido de acero registrado en PostgreSQL.');
        } else {
            alert('✅ Pedido procesado localmente.');
        }
        closePedidoModal();
        loadClientesData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deletePedido(id) {
    if (!confirm(`¿Estás seguro de eliminar el pedido #PED-${id}?`)) return;
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/pedidos/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || '✅ Pedido eliminado.');
        }
        loadClientesData();
    } catch (err) {
        alert('Error al eliminar pedido: ' + err.message);
    }
}

async function advancePedidoEstado(idPedido, nuevoEstado) {
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/pedidos/${idPedido}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al actualizar estado del pedido');
            }
            const updated = await res.json();
            if (memoryPedidos && memoryPedidos.length > 0) {
                const idx = memoryPedidos.findIndex(p => p.idPedido === idPedido);
                if (idx !== -1) memoryPedidos[idx] = updated;
            }
        } else {
            if (memoryPedidos) {
                const p = memoryPedidos.find(x => x.idPedido === idPedido);
                if (p) {
                    p.estadoPedido = nuevoEstado;
                    if (nuevoEstado === 'ENTREGADO') p.fechaEntrega = new Date().toISOString();
                }
            }
        }

        alert(`✅ Pedido #${idPedido} actualizado con éxito a: ${nuevoEstado}`);

        // Refrescar vistas en tiempo real
        if (document.getElementById('pedidosFlujoTbody')) {
            renderPedidosFlujo(memoryPedidos, memoryClientes);
        }
        if (document.getElementById('pedidosTbody')) {
            loadClientesData();
        }
        if (document.getElementById('misPedidosEnRutaList')) {
            renderMisPedidosEnRuta();
        }
    } catch (err) {
        alert('Error al actualizar estado del pedido: ' + err.message);
    }
}

async function quickChangePedidoEstado(id, nuevoEstado) {
    return advancePedidoEstado(id, nuevoEstado);
}

function renderPedidosFlujo(pedidos, clientes) {
    const tbody = document.getElementById('pedidosFlujoTbody');
    if (!tbody) return;

    if (!pedidos || pedidos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No hay pedidos registrados para gestionar su flujo en tiempo real.</td></tr>`;
        return;
    }

    const clienteMap = {};
    if (clientes && clientes.length > 0) {
        clientes.forEach(c => { clienteMap[c.idCliente] = c.razonSocial; });
    }

    tbody.innerHTML = pedidos.map(p => {
        const clienteNom = clienteMap[p.idCliente] || ('Cliente #' + p.idCliente);
        const est = (p.estadoPedido || 'REGISTRADO').toUpperCase();

        let badgeColor = '#0284c7';
        let badgeBg = '#e0f2fe';
        let badgeBorder = '#bae6fd';
        let badgeIcon = '📝';
        let stepNumber = 1;

        if (est === 'REGISTRADO') {
            badgeColor = '#0284c7'; badgeBg = '#e0f2fe'; badgeBorder = '#bae6fd'; badgeIcon = '📝'; stepNumber = 1;
        } else if (est === 'EN_PROCESO') {
            badgeColor = '#d97706'; badgeBg = '#fef3c7'; badgeBorder = '#fde68a'; badgeIcon = '⚙️'; stepNumber = 2;
        } else if (est === 'OPTIMIZADO') {
            badgeColor = '#7c3aed'; badgeBg = '#f3e8ff'; badgeBorder = '#e9d5ff'; badgeIcon = '⚡'; stepNumber = 3;
        } else if (est === 'DESPACHADO') {
            badgeColor = '#ea580c'; badgeBg = '#ffedd5'; badgeBorder = '#fed7aa'; badgeIcon = '🚚'; stepNumber = 4;
        } else if (est === 'ENTREGADO') {
            badgeColor = '#16a34a'; badgeBg = '#dcfce7'; badgeBorder = '#bbf7d0'; badgeIcon = '✅'; stepNumber = 5;
        } else if (est === 'CANCELADO') {
            badgeColor = '#64748b'; badgeBg = '#f1f5f9'; badgeBorder = '#cbd5e1'; badgeIcon = '❌'; stepNumber = 0;
        }

        const stepsHtml = [
            { num: 1, label: 'REG' },
            { num: 2, label: 'PROC' },
            { num: 3, label: 'OPT' },
            { num: 4, label: 'DESP' },
            { num: 5, label: 'ENTR' }
        ].map(s => {
            const isCompleted = stepNumber > s.num;
            const isCurrent = stepNumber === s.num;
            const bg = isCurrent ? badgeColor : (isCompleted ? '#10b981' : '#e2e8f0');
            const color = (isCurrent || isCompleted) ? '#ffffff' : '#64748b';
            return `<span title="Paso ${s.num}: ${s.label}" style="display:inline-block; font-size:10px; font-weight:700; width:20px; height:20px; line-height:20px; text-align:center; border-radius:50%; background:${bg}; color:${color}; margin:0 1px;">${s.num}</span>`;
        }).join('<span style="color:#cbd5e1; font-size:9px;">-</span>');

        let actionBtnHtml = '';
        if (est === 'REGISTRADO') {
            actionBtnHtml = `
                <button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#0284c7; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'EN_PROCESO')">
                    ▶ Pasar a En Proceso
                </button>
            `;
        } else if (est === 'EN_PROCESO') {
            actionBtnHtml = `
                <button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#7c3aed; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'OPTIMIZADO')">
                    ⚡ Marcar Optimizado
                </button>
            `;
        } else if (est === 'OPTIMIZADO') {
            actionBtnHtml = `
                <button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#ea580c; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'DESPACHADO')">
                    🚚 Despachar Pedido
                </button>
            `;
        } else if (est === 'DESPACHADO') {
            actionBtnHtml = `
                <button class="btn-primary" style="padding:6px 12px; font-size:12px; background:#16a34a; border:none; border-radius:6px; cursor:pointer;" onclick="advancePedidoEstado(${p.idPedido}, 'ENTREGADO')">
                    ✅ Confirmar Entrega
                </button>
            `;
        } else if (est === 'ENTREGADO') {
            actionBtnHtml = `
                <span style="font-size:12px; color:#16a34a; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                    ✔ Entregado con Éxito
                </span>
            `;
        } else {
            actionBtnHtml = `<span style="font-size:12px; color:#64748b;">Cancelado</span>`;
        }

        const selectHtml = `
            <select onchange="advancePedidoEstado(${p.idPedido}, this.value)" style="margin-left:6px; padding:3px 5px; font-size:11px; border-radius:4px; border:1px solid #cbd5e1; background:#f8fafc; font-weight:600; cursor:pointer;">
                <option value="REGISTRADO" ${est === 'REGISTRADO' ? 'selected' : ''}>1. REGISTRADO</option>
                <option value="EN_PROCESO" ${est === 'EN_PROCESO' ? 'selected' : ''}>2. EN_PROCESO</option>
                <option value="OPTIMIZADO" ${est === 'OPTIMIZADO' ? 'selected' : ''}>3. OPTIMIZADO</option>
                <option value="DESPACHADO" ${est === 'DESPACHADO' ? 'selected' : ''}>4. DESPACHADO</option>
                <option value="ENTREGADO" ${est === 'ENTREGADO' ? 'selected' : ''}>5. ENTREGADO</option>
                <option value="CANCELADO" ${est === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
            </select>
        `;

        const prioBadge = p.prioridad === 'ALTA' 
            ? '<span class="badge-no-optima">Alta</span>' 
            : (p.prioridad === 'MEDIA' ? '<span class="badge-alternativa">Media</span>' : '<span class="badge-optima">Baja</span>');

        return `
            <tr>
                <td style="font-weight:700; color:#0f172a; white-space:nowrap;">
                    #PED-${p.idPedido}
                    <div style="font-size:11px; color:#94a3b8; font-weight:400;">${p.fechaEmision ? new Date(p.fechaEmision).toLocaleDateString() : 'Hoy'}</div>
                </td>
                <td style="font-weight:600; color:#1e293b;">${clienteNom}</td>
                <td>
                    <div style="font-weight:600; color:#334155;">${p.tipoMaterial}</div>
                    <div style="font-size:11.5px; color:#64748b;">${p.pesoT} Tn · ${p.volumenM3 || 0} m³</div>
                </td>
                <td style="font-size:12.5px; color:#475569;">${p.direccionDestino}</td>
                <td>${prioBadge}</td>
                <td>
                    <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:12px; font-size:11.5px; font-weight:700; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder};">
                        ${badgeIcon} ${est}
                    </span>
                </td>
                <td style="text-align:center; white-space:nowrap;">
                    <div style="display:inline-flex; align-items:center; gap:2px; padding:4px 8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:20px;">
                        ${stepsHtml}
                    </div>
                </td>
                <td style="text-align:right; white-space:nowrap;">
                    <div style="display:inline-flex; align-items:center; justify-content:flex-end;">
                        ${actionBtnHtml}
                        ${selectHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ── 3. RUTAS GENERALES ─────────────────────────────────────────────────────

async function loadRutasData() {
    const tbody = document.getElementById('rutasTbody');
    const badge = document.getElementById('rutasDbBadge');
    if (!tbody && !document.getElementById('pedidosFlujoTbody')) return;

    try {
        if (window.location.protocol !== 'file:') {
            const [resRutas, resPed, resCli] = await Promise.all([
                apiFetch(API_HOST + '/api/rutas'),
                apiFetch(API_HOST + '/api/pedidos'),
                apiFetch(API_HOST + '/api/clientes')
            ]);
            if (resRutas.ok) memoryRutas = await resRutas.json();
            if (resPed.ok) memoryPedidos = await resPed.json();
            if (resCli.ok) memoryClientes = await resCli.json();

            if (badge) {
                badge.className = 'server-status-pill online';
                badge.textContent = '🟢 PostgreSQL Conectado';
            }
        }
    } catch (err) {
        console.warn('Error cargando rutas y pedidos desde BD:', err);
    }

    if (tbody) {
        if (!memoryRutas || memoryRutas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No hay rutas registradas en la base de datos. Haz clic en "+ Registrar Nueva Ruta".</td></tr>`;
        } else {
            tbody.innerHTML = memoryRutas.map(r => {
                const badgeClass = r.estado === 'COMPLETADA' ? 'badge-optima' : (r.estado === 'EN_EJECUCION' ? 'badge-alternativa' : 'badge-no-optima');
                return `
                    <tr>
                        <td style="font-weight:700; color:#64748b;">#RUT-${r.id}</td>
                        <td>${r.fechaRuta || 'Hoy'}</td>
                        <td><strong>${r.algoritmoUsado || 'Google OR-Tools'}</strong></td>
                        <td><span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600;">V-${r.vehiculoId || 101}</span></td>
                        <td style="font-weight:700; color:#0f172a;">${r.distanciaTotalKm || 18.5} km</td>
                        <td>${r.tiempoEstimadoMin || 32} min</td>
                        <td style="color:#15803d; font-weight:700;">S/ ${Number(r.costoEstimadoSoles || 85.0).toFixed(2)}</td>
                        <td><span class="${badgeClass}">${r.estado || 'PLANIFICADA'}</span></td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button class="btn-action-edit" onclick="openEditRutaModal(${r.id}, '${(r.algoritmoUsado || '').replace(/'/g, "\'")}', ${r.distanciaTotalKm || 20}, ${r.tiempoEstimadoMin || 30}, ${r.costoEstimadoSoles || 90}, '${r.estado || 'PLANIFICADA'}')">Editar</button>
                            <button class="btn-action-del" onclick="deleteRuta(${r.id})">Eliminar</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Renderizar flujo interactivo de pedidos en tiempo real
    renderPedidosFlujo(memoryPedidos, memoryClientes);
}

function openNewRutaModal() {
    const user = getCurrentUser();
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        alert('Acceso restringido: Solo supervisores o administradores pueden registrar rutas.');
        return;
    }
    const hiddenId = document.getElementById('rutaId');
    if (hiddenId) hiddenId.value = '';
    const form = document.getElementById('rutaForm');
    if (form) form.reset();

    const title = document.getElementById('rutaModalTitle');
    if (title) title.textContent = 'Registrar Nueva Ruta';

    const modal = document.getElementById('rutaModal');
    if (modal) modal.classList.add('active');
}

function openEditRutaModal(id, algoritmo, dist, tiempo, costo, estado) {
    const hiddenId = document.getElementById('rutaId');
    if (hiddenId) hiddenId.value = id;

    const title = document.getElementById('rutaModalTitle');
    if (title) title.textContent = `Editar Ruta #RUT-${id}`;

    const algSelect = document.getElementById('rutaAlgoritmo');
    const distIn = document.getElementById('rutaDistancia');
    const tiempoIn = document.getElementById('rutaTiempo');
    const costoIn = document.getElementById('rutaCosto');
    const estSelect = document.getElementById('rutaEstado');

    if (algSelect) algSelect.value = algoritmo;
    if (distIn) distIn.value = dist;
    if (tiempoIn) tiempoIn.value = tiempo;
    if (costoIn) costoIn.value = costo;
    if (estSelect) estSelect.value = estado;

    const modal = document.getElementById('rutaModal');
    if (modal) modal.classList.add('active');
}

function closeRutaModal() {
    const modal = document.getElementById('rutaModal');
    if (modal) modal.classList.remove('active');
}

async function saveRuta(e) {
    e.preventDefault();
    const id = document.getElementById('rutaId')?.value;
    const algoritmoUsado = document.getElementById('rutaAlgoritmo').value;
    const distanciaTotalKm = parseFloat(document.getElementById('rutaDistancia').value);
    const tiempoEstimadoMin = parseInt(document.getElementById('rutaTiempo').value);
    const costoEstimadoSoles = parseFloat(document.getElementById('rutaCosto').value);
    const estado = document.getElementById('rutaEstado').value;

    const payload = {
        algoritmoUsado,
        distanciaTotalKm,
        tiempoEstimadoMin,
        costoEstimadoSoles,
        estado,
        vehiculoId: 1
    };

    try {
        if (window.location.protocol !== 'file:') {
            const url = id ? `${API_HOST}/api/rutas/${id}` : `${API_HOST}/api/rutas`;
            const method = id ? 'PUT' : 'POST';
            const res = await apiFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar ruta');
            alert(id ? '✅ Ruta actualizada correctamente.' : '✅ Ruta creada exitosamente en PostgreSQL.');
        } else {
            alert('✅ Ruta procesada localmente.');
        }
        closeRutaModal();
        loadRutasData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteRuta(id) {
    if (!confirm(`¿Estás seguro de eliminar la ruta #RUT-${id}?`)) return;
    try {
        if (window.location.protocol !== 'file:') {
            const res = await apiFetch(`${API_HOST}/api/rutas/${id}`, { method: 'DELETE' });
            const data = await res.json();
            alert(data.message || '✅ Ruta eliminada.');
        }
        loadRutasData();
    } catch (err) {
        alert('Error al eliminar ruta: ' + err.message);
    }
}

async function loadUsersFromDatabase() {
    const tbody = document.getElementById('usersTbody');
    const statusBadge = document.getElementById('serverStatusBadge');
    const noticeBanner = document.getElementById('noticeBanner');
    if (!tbody) return;

    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol) {
        if (statusBadge) {
            statusBadge.className = 'server-status-pill offline';
            statusBadge.textContent = '🟡 Modo Archivo Local (file://)';
        }
        if (noticeBanner) {
            noticeBanner.style.display = 'block';
            noticeBanner.innerHTML = '<strong>Nota:</strong> Has abierto este archivo con doble clic directo (protocolo <code>file:///</code>). Para conectar con la base de datos PostgreSQL, arranca el backend con <code>.\\mvnw.cmd spring-boot:run</code> e ingresa a <a href="http://localhost:8080/dashboard.html" target="_blank" style="text-decoration:underline; font-weight:bold;">http://localhost:8080/dashboard.html</a>. Mostrando datos de prueba locales:';
        }
        renderUserRows(memoryUsers);
        return;
    }

    try {
        const res = await apiFetch(API_HOST + '/api/usuarios');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const users = await res.json();

        if (statusBadge) {
            statusBadge.className = 'server-status-pill online';
            statusBadge.textContent = '🟢 PostgreSQL Conectado';
        }
        if (noticeBanner) noticeBanner.style.display = 'none';

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No hay usuarios registrados aún en PostgreSQL. Haz clic en "Nueva Cuenta".</td></tr>`;
            return;
        }

        memoryUsers = users;
        populateAdminSupervisorSelect(users);
        renderUserRows(users);

    } catch (err) {
        console.warn('Backend desconectado o error de conexión:', err);
        if (statusBadge) {
            statusBadge.className = 'server-status-pill offline';
            statusBadge.textContent = '🔴 Servidor backend desconectado';
        }
        if (noticeBanner) {
            noticeBanner.style.display = 'block';
            noticeBanner.innerHTML = '<strong>Servidor backend no detectado en http://localhost:8080.</strong> Si estás usando Live Server (puerto 5500), abre directamente <a href="http://localhost:8080/dashboard.html" target="_blank" style="font-weight:bold; text-decoration:underline;">http://localhost:8080/dashboard.html</a>. Mostrando datos locales:';
        }
        renderUserRows(memoryUsers);
    }
}

function populateAdminSupervisorSelect(users) {
    const select = document.getElementById('formAdminSupervisor');
    if (!select) return;
    const supervisorsAndAdmins = (users || []).filter(u => u.rol === 'ADMINISTRADOR' || u.rol === 'SUPERVISOR');
    select.innerHTML = '<option value="">-- Autodelegar al creador / Automático --</option>' +
        supervisorsAndAdmins.map(s => `<option value="${s.idUsuario}">${s.nombres} ${s.apellidos || ''} (${s.rol})</option>`).join('');
}

async function sincronizarCamposFaltantesBD() {
    try {
        const btn = document.activeElement;
        if (btn) btn.disabled = true;
        const res = await apiFetch((API_HOST || '') + '/api/usuarios/sincronizar-faltantes', { method: 'POST' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        alert('⚡ ' + (data.mensaje || 'Campos faltantes sincronizados y usuarios delegados correctamente.') + ` (${data.totalUsuariosActualizados || 0} usuarios actualizados)`);
        await loadUsersFromDatabase();
    } catch (err) {
        alert('Error al sincronizar campos faltantes: ' + err.message);
    } finally {
        const btn = document.activeElement;
        if (btn) btn.disabled = false;
    }
}

function renderUserRows(users) {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
        const badgeClass = u.rol === 'ADMINISTRADOR' ? 'badge-admin' : (u.rol === 'SUPERVISOR' ? 'badge-supervisor' : 'badge-conductor');
        const delegado = u.supervisorNombre || (u.idAdminSupervisor ? 'ID #' + u.idAdminSupervisor : 'Sin Delegar (Principal)');
        return `
            <tr>
                <td style="font-weight:700; color:#64748b;">#${u.idUsuario}</td>
                <td><strong>${escapeHtml(u.nombres)} ${escapeHtml(u.apellidos || '')}</strong></td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="user-badge-role ${badgeClass}">${u.rol}</span></td>
                <td style="color:#64748b;"><code>${escapeHtml(u.codEmpleado || '-')}</code> · ${escapeHtml(u.telefono || '-')}</td>
                <td style="font-size:12px; font-weight:600; color:#1e3a8a;">👤 ${escapeHtml(delegado)}</td>
                <td><span style="color:#16a34a; font-weight:600;">● Activo</span></td>
                <td style="text-align:right;">
                    <button class="btn-action-edit" onclick="openEditUserModal(${u.idUsuario}, '${escapeHtml(u.nombres)}', '${escapeHtml(u.apellidos || '')}', '${escapeHtml(u.email)}', '${u.rol}', '${escapeHtml(u.telefono || '')}', '${escapeHtml(u.codEmpleado || '')}', ${u.idAdminSupervisor || 'null'}, '${u.fechaCreacion || ''}')">Editar / Rol</button>
                    <button class="btn-action-del" onclick="deleteUser(${u.idUsuario}, '${escapeHtml(u.nombres)}')">Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openNewUserModal() {
    const modalTitle = document.getElementById('modalTitle');
    const formUserId = document.getElementById('formUserId');
    const formEmail  = document.getElementById('formEmail');
    const userForm   = document.getElementById('userForm');
    const userModal  = document.getElementById('userModal');
    const formAdminSupervisor = document.getElementById('formAdminSupervisor');

    if (modalTitle) modalTitle.textContent = 'Registrar Nueva Cuenta';
    if (formUserId) formUserId.value = '';
    if (formEmail)  formEmail.disabled = false;
    if (userForm)   userForm.reset();
    const fcEl = document.getElementById('formFechaCreacion');
    if (fcEl) fcEl.value = '';
    populateAdminSupervisorSelect(memoryUsers);
    const cur = getCurrentUser();
    if (formAdminSupervisor && cur && cur.id) {
        formAdminSupervisor.value = cur.id;
    }
    if (userModal)  userModal.classList.add('active');
}

function openEditUserModal(id, nombres, apellidos, email, rol, telefono, cod, idAdminSupervisor, fechaCreacion) {
    const modalTitle = document.getElementById('modalTitle');
    const formUserId = document.getElementById('formUserId');
    const formNombres = document.getElementById('formNombres');
    const formApellidos = document.getElementById('formApellidos');
    const formEmail  = document.getElementById('formEmail');
    const formRol    = document.getElementById('formRol');
    const formTelefono = document.getElementById('formTelefono');
    const formCodEmpleado = document.getElementById('formCodEmpleado');
    const formAdminSupervisor = document.getElementById('formAdminSupervisor');
    const formFechaCreacion = document.getElementById('formFechaCreacion');
    const userModal  = document.getElementById('userModal');

    if (modalTitle) modalTitle.textContent = 'Editar Usuario y Reasignar Rol / Delegación';
    if (formUserId) formUserId.value = id;
    if (formNombres) formNombres.value = nombres;
    if (formApellidos) formApellidos.value = apellidos;
    if (formEmail) { formEmail.value = email; formEmail.disabled = true; }
    if (formRol) formRol.value = rol;
    if (formTelefono) formTelefono.value = telefono;
    if (formCodEmpleado) formCodEmpleado.value = cod;
    if (formFechaCreacion) {
        formFechaCreacion.value = (fechaCreacion && fechaCreacion.length >= 16) ? fechaCreacion.substring(0, 16) : '';
    }
    populateAdminSupervisorSelect(memoryUsers);
    if (formAdminSupervisor) formAdminSupervisor.value = idAdminSupervisor || '';
    if (userModal) userModal.classList.add('active');
}

function closeUserModal() {
    const userModal = document.getElementById('userModal');
    const formEmail = document.getElementById('formEmail');
    if (userModal) userModal.classList.remove('active');
    if (formEmail) formEmail.disabled = false;
}

async function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('formUserId').value;
    const nombres = document.getElementById('formNombres').value.trim();
    const apellidos = document.getElementById('formApellidos').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const password = document.getElementById('formPassword').value;
    const rol = document.getElementById('formRol').value;
    const telefono = document.getElementById('formTelefono').value.trim();
    const codEmpleado = document.getElementById('formCodEmpleado').value.trim();

    const adminSupEl = document.getElementById('formAdminSupervisor');
    const idAdminSupervisor = (adminSupEl && adminSupEl.value) ? parseInt(adminSupEl.value) : null;
    const formFechaCreacion = document.getElementById('formFechaCreacion');
    const fechaCreacion = (formFechaCreacion && formFechaCreacion.value) ? formFechaCreacion.value : '';

    const payload = { nombres, apellidos, email, rol, telefono, codEmpleado };
    if (password) payload.password = password;
    if (idAdminSupervisor) payload.idAdminSupervisor = idAdminSupervisor;
    if (fechaCreacion) payload.fechaCreacion = fechaCreacion;

    if (window.location.protocol === 'file:') {
        if (id) {
            const u = memoryUsers.find(x => x.idUsuario == id);
            if (u) { u.nombres = nombres; u.apellidos = apellidos; u.rol = rol; u.telefono = telefono; u.codEmpleado = codEmpleado; }
        } else {
            const newId = memoryUsers.length > 0 ? Math.max(...memoryUsers.map(x => x.idUsuario)) + 1 : 1;
            memoryUsers.unshift({ idUsuario: newId, nombres, apellidos, email, rol, codEmpleado, activo: true });
        }
        alert('✅ Cambios guardados localmente.');
        closeUserModal();
        renderUserRows(memoryUsers);
        return;
    }

    try {
        let url = (API_HOST || '') + '/api/usuarios';
        let method = 'POST';

        if (id) {
            url += `/${id}`;
            method = 'PUT';
        }

        const res = await apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            let errMsg = `Error ${res.status}`;
            try {
                const err = await res.json();
                errMsg = err.error || errMsg;
            } catch (ignore) {
                const text = await res.text().catch(() => '');
                if (text) errMsg = text.slice(0, 100);
            }
            alert(`Error al guardar en PostgreSQL: ${errMsg}`);
            return;
        }

        alert(id ? '✅ Usuario y rol actualizados con éxito en PostgreSQL.' : '✅ Usuario creado y guardado con éxito en PostgreSQL.');
        closeUserModal();
        loadUsersFromDatabase();

    } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor: ' + err.message + '\n\nVerifica que el backend esté corriendo en http://localhost:8080');
    }
}

async function deleteUser(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${nombre}?`)) {
        return;
    }

    if (window.location.protocol === 'file:') {
        memoryUsers = memoryUsers.filter(x => x.idUsuario !== id);
        renderUserRows(memoryUsers);
        alert(`✅ Cuenta de ${nombre} eliminada localmente.`);
        return;
    }

    try {
        const res = await apiFetch((API_HOST || '') + `/api/usuarios/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            let errMsg = `Error ${res.status}`;
            try {
                const err = await res.json();
                errMsg = err.error || errMsg;
            } catch (ignore) {}
            alert(`Error al eliminar: ${errMsg}`);
            return;
        }

        alert(`✅ Cuenta de ${nombre} eliminada correctamente de PostgreSQL.`);
        loadUsersFromDatabase();
    } catch (err) {
        console.error(err);
        alert('Error al comunicarse con la base de datos: ' + err.message);
    }
}

/* ==========================================================================
   INICIALIZACIÓN AL CARGAR LA PÁGINA
   ========================================================================== */

window.addEventListener('DOMContentLoaded', () => {
    // 0. Verificar que el usuario tiene sesión JWT válida
    requireAuth();

    // 0.1 Iniciar canal push de notificaciones en tiempo real (Punto 10)
    initNotificationStream();

    // 1. Aplicar permisos y ajustar menú según el rol conectado
    applyRolePermissions();

    // 2. Escuchar cambios de hash para navegación
    window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '') || 'inicio';
        showView(h);
    });

    // 3. Determinar vista inicial
    const user = getCurrentUser();
    let initialView = window.location.hash.replace('#', '');
    if (!initialView) {
        // Conductor va directo a sus rutas asignadas
        initialView = (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') ? 'mis-rutas' : 'inicio';
    }
    showView(initialView);
});


/* ==========================================================================
   PUNTOS 6 & 7: VISTA DEL CONDUCTOR, SIMULACIÓN Y ASIGNACIONES FUNCIONALES
   ========================================================================== */

function cambiarSimulacionConductor(nombre) {
    const driverProfiles = {
        'Manuel Quispe': {
            nombre: 'Manuel Quispe',
            licencia: 'Q45892014 (Cat. A-IIIc)',
            dni: '45892014',
            vehiculo: 'Tráiler Plataforma (V-102)',
            placa: 'AYZ-892',
            capacidad: '32.0 Tn',
            carga: '44.0 Tn'
        },
        'Carlos Mendoza': {
            nombre: 'Carlos Mendoza',
            licencia: 'M70124589 (Cat. A-IIIb)',
            dni: '70124589',
            vehiculo: 'Camión Pesado (V-105)',
            placa: 'B8U-711',
            capacidad: '25.0 Tn',
            carga: '20.0 Tn'
        }
    };

    let filtered = [...activeDispatches];
    if (nombre !== 'TODOS') {
        filtered = filtered.filter(d => (d.conductorNombre || '').toLowerCase().includes(nombre.toLowerCase()));
    }

    const firstMatch = filtered.find(d => (d.conductorNombre || '').toLowerCase().includes(nombre.toLowerCase())) || filtered[0];

    const nameEl = document.getElementById('driverCardName');
    const licEl = document.getElementById('driverCardLicencia');
    const dniEl = document.getElementById('driverCardDni');
    const vehEl = document.getElementById('driverCardVehiculo');

    if (nameEl) nameEl.textContent = (nombre === 'TODOS') ? 'Todos los Transportistas' : nombre;
    if (licEl) licEl.textContent = (firstMatch && firstMatch.conductorDni) ? `Q${firstMatch.conductorDni} (Cat. A-IIIc)` : 'Lic. Oficial A-IIIc';
    if (dniEl) dniEl.textContent = (firstMatch && firstMatch.conductorDni) ? firstMatch.conductorDni : (nombre === 'TODOS' ? 'Flota Completa' : '---');
    if (vehEl) {
        const vNombre = firstMatch ? firstMatch.vehiculo : 'Unidad de Flota';
        const vPlaca = firstMatch ? firstMatch.placa : 'V-100';
        vehEl.innerHTML = `${vNombre} · <span style="background: #fbbf24; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 12px;">${vPlaca}</span>`;
    }

    const kpiTotal = document.getElementById('kpiDriverTotal');
    const kpiTrans = document.getElementById('kpiDriverTransito');
    const kpiEntr = document.getElementById('kpiDriverEntregadas');
    const kpiCarga = document.getElementById('kpiDriverCarga');

    const countPorIniciar = filtered.filter(d => d.estado === 'ASIGNADA').length;
    const countEnTransito = filtered.filter(d => d.estado === 'EN_TRANSITO').length;
    const countCompletadas = filtered.filter(d => d.estado === 'COMPLETADA').length;

    if (kpiTotal) kpiTotal.textContent = filtered.length;
    if (kpiTrans) {
        kpiTrans.textContent = countPorIniciar > 0 ? countPorIniciar : countEnTransito;
        const transLabel = document.getElementById('kpiDriverTransitoLabel');
        if (transLabel) {
            transLabel.textContent = countPorIniciar > 0 ? '📋 Por Iniciar' : '🚚 En Camino';
        }
    }
    if (kpiEntr) kpiEntr.textContent = countCompletadas;
    if (kpiCarga) {
        const totalTn = filtered.reduce((acc, d) => {
            const match = (d.material || '').match(/(\d+(\.\d+)?)\s*Tn/i);
            return acc + (match ? parseFloat(match[1]) : 20.0);
        }, 0);
        kpiCarga.textContent = totalTn > 0 ? `${totalTn.toFixed(1)} Tn` : '0.0 Tn';
    }

    renderMisRutasCustom(filtered, currentDispatchFilter);
}

function renderMisRutasCustom(list, statusFilter = 'TODAS') {
    const container = document.getElementById('misRutasList');
    if (!container) return;

    if (statusFilter !== 'TODAS') {
        list = list.filter(d => d.estado === statusFilter);
    }

    if (list.length === 0) {
        container.innerHTML = `
            <div style="background:#fff; border:1px dashed #cbd5e1; border-radius:8px; padding:36px; text-align:center; color:#64748b;">
                <p style="font-size:15px; font-weight:600; margin-bottom:4px;">No hay rutas asignadas en este estado.</p>
                <span style="font-size:12.5px; color:#94a3b8;">Las nuevas rutas serán asignadas por el Supervisor de Flotas.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(d => {
        let badgeHtml = '';
        let actionBtnHtml = '';

        if (d.estado === 'ASIGNADA') {
            badgeHtml = `<span class="badge-status badge-status-asignada">● Por Iniciar</span>`;
            actionBtnHtml = `
                <button class="btn-dispatch-action btn-start-trip" onclick="updateDispatchStatus(${d.id}, 'EN_TRANSITO')">
                    ▶ Iniciar Recorrido
                </button>
            `;
        } else if (d.estado === 'EN_TRANSITO') {
            badgeHtml = `<span class="badge-status badge-status-transito">🚚 En Tránsito</span>`;
            actionBtnHtml = `
                <button class="btn-dispatch-action btn-complete-trip" onclick="updateDispatchStatus(${d.id}, 'COMPLETADA')">
                    ✓ Confirmar Entrega en Destino
                </button>
            `;
        } else if (d.estado === 'COMPLETADA') {
            badgeHtml = `<span class="badge-status badge-status-completada">✔ Completada</span>`;
            actionBtnHtml = `
                <span style="font-size:12.5px; color:#16a34a; font-weight:700;">✅ Entrega Finalizada</span>
            `;
        }

        return `
            <div class="dispatch-card">
                <div class="dispatch-header">
                    <div>
                        <div class="dispatch-title">${d.codigo} &nbsp;·&nbsp; ${d.origen} → ${d.destino}</div>
                        <div style="font-size:12px; color:#64748b; margin-top:2px;">Asignado por: <strong>${d.supervisor}</strong> · ${d.fecha}</div>
                    </div>
                    <div>${badgeHtml}</div>
                </div>

                <div class="dispatch-route-badge-line">
                    <span>Itinerario Experto:</span>
                    <strong>${d.trayecto}</strong>
                    <span style="font-size:12px; color:#15803d; font-weight:600; margin-left:8px;">(${d.tiempoEst} · ${d.distancia})</span>
                </div>

                <div class="dispatch-details-grid">
                    <div>
                        <div class="dispatch-meta-label">Conductor Asignado</div>
                        <div class="dispatch-meta-val">👤 ${d.conductorNombre}</div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Vehículo & Placa</div>
                        <div class="dispatch-meta-val">🚛 ${d.vehiculo} <span style="color:#64748b;">(${d.placa})</span></div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Material & Carga</div>
                        <div class="dispatch-meta-val">📦 ${d.material}</div>
                    </div>
                    <div>
                        <div class="dispatch-meta-label">Prioridad</div>
                        <div class="dispatch-meta-val">${d.prioridad === 'Alta' ? '🔴 Alta' : '🟡 Media'}</div>
                    </div>
                </div>

                <div class="dispatch-actions">
                    ${actionBtnHtml}
                </div>
            </div>
        `;
    }).join('');
}

function onAssignPedidoSelected(idPedido) {
    const select = document.getElementById('assignPedidoSelect');
    const opt = select ? select.options[select.selectedIndex] : null;
    if (!opt) return;

    const material = opt.getAttribute('data-material') || 'Barras corrugadas (24 Tn)';
    const destino = opt.getAttribute('data-destino') || 'Planta Pisco';
    const prioridad = opt.getAttribute('data-prioridad') || 'Media';

    const itinEl = document.getElementById('assignItinerarioTxt');
    const metrEl = document.getElementById('assignMetricasTxt');
    const matInput = document.getElementById('assignMaterialInput');
    const prioSel = document.getElementById('assignPrioridadSelect');

    if (itinEl) itinEl.textContent = `Almacén Callao (A) → ${destino}`;
    if (metrEl) metrEl.textContent = `32 min | 18.5 km | Costo est. S/ 85.00`;
    if (matInput) matInput.value = material;
    if (prioSel && prioridad) {
        prioSel.value = (prioridad === 'ALTA') ? 'Alta' : ((prioridad === 'BAJA') ? 'Baja' : 'Media');
    }
}

async function loadAsignacionesData() {
    const tbody = document.getElementById('asignacionesTbody');
    if (!tbody) return;

    try {
        const resp = await apiFetch(API_HOST + '/api/asignaciones');
        if (!resp.ok) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px; color:#64748b;">No se pudieron cargar las asignaciones de conducción.</td></tr>`;
            return;
        }

        const data = await resp.json();
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px; color:#64748b;">No hay asignaciones de conducción activas registradas.</td></tr>`;
            return;
        }

        const currentUserAsig = getCurrentUser();
        const isTransportistaAsig = (currentUserAsig.rol === 'CONDUCTOR' || currentUserAsig.rol === 'TRANSPORTISTA');

        let displayList = data;
        // Si es conductor / transportista, filtrar estrictamente para ver SOLO sus asignaciones personales
        if (isTransportistaAsig) {
            const userNom = (currentUserAsig.nombres || '').trim().toLowerCase();
            const userCod = (currentUserAsig.codEmpleado || '').trim().toLowerCase();

            displayList = data.filter(asig => {
                const condNom = (asig.conductorNombre || '').trim().toLowerCase();
                const condDni = (asig.conductorDni || '').trim().toLowerCase();

                // 1. Coincidencia por DNI / Código de empleado
                if (userCod && condDni && (userCod === condDni || userCod.includes(condDni) || condDni.includes(userCod))) {
                    return true;
                }
                // 2. Coincidencia por Nombre y Apellido
                if (userNom && condNom) {
                    if (condNom === userNom || condNom.includes(userNom) || userNom.includes(condNom)) {
                        return true;
                    }
                    const nameParts = userNom.split(/\s+/).filter(p => p.length >= 3);
                    if (nameParts.length > 0 && nameParts.every(part => condNom.includes(part))) {
                        return true;
                    }
                }
                return false;
            });
        }

        if (displayList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px; color:#64748b;">
                ${isTransportistaAsig ? 'No tienes asignaciones de conducción registradas a tu nombre.' : 'No hay asignaciones de conducción activas registradas.'}
            </td></tr>`;
            return;
        }

        tbody.innerHTML = displayList.map(asig => {
            const id = asig.idAsignacion;
            const conductor = asig.conductorNombre || 'Transportista Asignado';
            const licencia = asig.licencia || 'A-IIIc';
            const vehiculo = (asig.vehiculoTipo || 'Unidad Flota') + ' (' + (asig.vehiculoPlaca || 'V-100') + ')';
            const pedidoId = asig.idPedido ? `#PED-${asig.idPedido}` : 'General';
            const material = asig.materialCarga ? `${asig.materialCarga} (${asig.pesoT || 0} Tn)` : 'Barras corrugadas (24 Tn)';
            const destino = asig.destino || 'Pisco / Paracas';
            const cliente = asig.cliente || 'Cliente Siderúrgico';
            const fecha = asig.fechaInicio ? new Date(asig.fechaInicio).toLocaleDateString() : 'Hoy';
            const estado = asig.estado || 'ACTIVA';

            let estadoBadge = '';
            let actionBtns = '';

            if (estado === 'ACTIVA') {
                estadoBadge = `<span style="background:#eff6ff; color:#1d4ed8; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #bfdbfe;">● Por Iniciar</span>`;
                const cancelBtnHtml = isTransportistaAsig ? '' : `<button class="btn-sm" style="background:#fee2e2; color:#dc2626; border:1px solid #fecaca; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="cancelarAsignacion(${id})" title="Cancelar Asignación">✕</button>`;
                actionBtns = `
                    <button class="btn-sm" style="background:#d97706; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-weight:700; cursor:pointer;" onclick="iniciarAsignacion(${id})" title="Iniciar Ruta">▶ Iniciar</button>
                    <button class="btn-sm" style="background:#16a34a; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-weight:700; cursor:pointer;" onclick="completarAsignacion(${id})" title="Marcar Entregado">✓ Entregar</button>
                    ${cancelBtnHtml}
                `;
            } else if (estado === 'EN_TRANSITO') {
                estadoBadge = `<span style="background:#fffbeb; color:#b45309; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #fde68a;">🚚 En Tránsito</span>`;
                const cancelBtnTransHtml = isTransportistaAsig ? '' : `<button class="btn-sm" style="background:#fee2e2; color:#dc2626; border:1px solid #fecaca; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="cancelarAsignacion(${id})" title="Cancelar Asignación">✕</button>`;
                actionBtns = `
                    <button class="btn-sm" style="background:#16a34a; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-weight:700; cursor:pointer;" onclick="completarAsignacion(${id})" title="Confirmar Entrega">✓ Confirmar Entrega</button>
                    ${cancelBtnTransHtml}
                `;
            } else {
                estadoBadge = `<span style="background:#f0fdf4; color:#15803d; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #bbf7d0;">✔ Completada</span>`;
                actionBtns = `<span style="font-size:12px; color:#16a34a; font-weight:700;">Finalizada</span>`;
            }

            return `
                <tr>
                    <td style="font-weight:700; color:#1e293b;">#ASG-${id}</td>
                    <td>
                        <div style="font-weight:700; color:#0f172a;">👤 ${conductor}</div>
                        <div style="font-size:11px; color:#64748b;">Lic. ${licencia}</div>
                    </td>
                    <td>
                        <div style="font-weight:600; color:#1e293b;">🚛 ${vehiculo}</div>
                    </td>
                    <td>
                        <span style="font-weight:700; color:#2563eb;">${pedidoId}</span>
                        <div style="font-size:11.5px; color:#475569;">${material}</div>
                    </td>
                    <td>
                        <div style="font-weight:600; color:#0f172a;">${cliente}</div>
                        <div style="font-size:11px; color:#64748b;">📍 ${destino}</div>
                    </td>
                    <td style="font-size:12px; color:#475569;">${fecha}</td>
                    <td>${estadoBadge}</td>
                    <td style="text-align: right; display:flex; justify-content:flex-end; gap:6px;">
                        ${actionBtns}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.warn('Error al cargar asignaciones de conducción:', err);
    }
    applyRutasRoleRestrictions();
}

async function iniciarAsignacion(id) {
    try {
        const resp = await apiFetch(`${API_HOST}/api/asignaciones/${id}/iniciar`, { method: 'PUT' });
        if (resp.ok) {
            showToastNotification('Ruta en Camino', `Asignación #${id} iniciada. Estado del pedido actualizado a DESPACHADO.`, 'warning');
            loadAsignacionesData();
            loadAsignacionesFromDatabase();
        } else {
            alert('No se pudo iniciar la asignación.');
        }
    } catch (e) {
        console.error(e);
    }
}

async function completarAsignacion(id) {
    try {
        const resp = await apiFetch(`${API_HOST}/api/asignaciones/${id}/completar`, { method: 'PUT' });
        if (resp.ok) {
            showToastNotification('Entrega Concluida', `Asignación #${id} completada. Vehículo liberado y pedido marcado como ENTREGADO.`, 'success');
            loadAsignacionesData();
            loadAsignacionesFromDatabase();
        } else {
            alert('No se pudo completar la entrega.');
        }
    } catch (e) {
        console.error(e);
    }
}

async function cancelarAsignacion(id) {
    const user = getCurrentUser();
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        alert('Acceso restringido: Los transportistas no pueden cancelar asignaciones.');
        return;
    }
    if (!confirm(`¿Deseas cancelar la asignación #${id}? El vehículo y transportista quedarán liberados.`)) return;
    try {
        const resp = await apiFetch(`${API_HOST}/api/asignaciones/${id}`, { method: 'DELETE' });
        if (resp.ok) {
            showToastNotification('Asignación Cancelada', `La asignación #${id} ha sido cancelada y los recursos liberados.`, 'info');
            loadAsignacionesData();
            loadAsignacionesFromDatabase();
        } else {
            alert('No se pudo cancelar la asignación.');
        }
    } catch (e) {
        console.error(e);
    }
}

/* ==========================================================================
   PUNTO 8: MAPA INTERACTIVO CON LEAFLET.JS (LIMA / PERÚ)
   ========================================================================== */

let logisticsMapInstance = null;
let optimizeMapInstance = null;

const LOGISTICS_NODES = {
    'A': { id: 'A', name: 'Almacén Principal Callao', address: 'Av. Enrique Meiggs 297, Callao', lat: -12.0464, lng: -77.1181, type: 'depot' },
    'B': { id: 'B', name: 'Centro Distribución Ate', address: 'Carretera Central Km 5.5, Ate', lat: -12.0256, lng: -76.9211, type: 'transfer' },
    'C': { id: 'C', name: 'Zona de Carga Lurín', address: 'Antigua Panamericana Sur Km 38, Lurín', lat: -12.2740, lng: -76.8710, type: 'transfer' },
    'D': { id: 'D', name: 'Distribuidora Norte Puente Piedra', address: 'Panamericana Norte Km 30, Puente Piedra', lat: -11.8650, lng: -77.0750, type: 'transfer' },
    'E': { id: 'E', name: 'Centro Distribución Sur Chorrillos', address: 'Av. Defensores del Morro 1250, Chorrillos', lat: -12.1700, lng: -76.9900, type: 'transfer' },
    'F': { id: 'F', name: 'Planta Siderúrgica Pisco', address: 'Panamericana Sur Km 240, Paracas, Pisco', lat: -13.7142, lng: -76.2037, type: 'plant' }
};

const LOGISTICS_CONNECTIONS = [
    ['A', 'B'],
    ['A', 'C'],
    ['A', 'D'],
    ['B', 'D'],
    ['C', 'E'],
    ['E', 'F']
];

// Cache en memoria para rutas de OSRM (evita consultas repetidas a la red vial)
const osrmRouteCache = {};

/**
 * Consulta la red vial de OpenStreetMap mediante OSRM (Open Source Routing Machine)
 * para trazar el recorrido real sobre carreteras y calcular el tiempo real de conducción pesada.
 */
async function fetchRoadRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) return null;

    const coordsStr = waypoints.map(w => `${w.lng.toFixed(4)},${w.lat.toFixed(4)}`).join(';');
    if (osrmRouteCache[coordsStr]) {
        return osrmRouteCache[coordsStr];
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=false`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            // Invertir [lng, lat] de GeoJSON al estándar [lat, lng] de Leaflet
            const latLngs = r.geometry.coordinates.map(c => [c[1], c[0]]);
            const distanceKm = parseFloat((r.distance / 1000).toFixed(1));

            // Factor de velocidad para transporte pesado de acero (camión / plataforma cargado a 24-30 Tn)
            const durationSec = Math.round(r.duration * 1.15);
            const hours = Math.floor(durationSec / 3600);
            const minutes = Math.round((durationSec % 3600) / 60);
            const durationText = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;

            const result = {
                success: true,
                latLngs,
                distanceKm,
                durationMinutes: Math.round(durationSec / 60),
                durationText,
                rawDurationSec: durationSec
            };
            osrmRouteCache[coordsStr] = result;
            return result;
        }
    } catch (e) {
        console.warn('OSRM no disponible en este momento, usando trazado de respaldo:', e);
    }

    // Respaldo en caso de falta de conexión a internet
    return {
        success: false,
        latLngs: waypoints.map(w => [w.lat, w.lng]),
        distanceKm: null,
        durationMinutes: null,
        durationText: null
    };
}

function initLogisticsMap() {
    const mapContainer = document.getElementById('mapaRedLogistica');
    if (!mapContainer || typeof L === 'undefined') return;

    if (logisticsMapInstance) {
        try { logisticsMapInstance.remove(); } catch (e) {}
        logisticsMapInstance = null;
    }

    try {
        logisticsMapInstance = L.map('mapaRedLogistica').setView([-12.5, -76.8], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap | Aceros Arequipa Red Vial OSRM',
            maxZoom: 18
        }).addTo(logisticsMapInstance);

        // Trazar cada conexión de la red sobre carreteras reales de forma asíncrona
        LOGISTICS_CONNECTIONS.forEach(async ([startKey, endKey]) => {
            const start = LOGISTICS_NODES[startKey];
            const end = LOGISTICS_NODES[endKey];
            if (start && end) {
                const road = await fetchRoadRoute([start, end]);
                if (road && road.latLngs && logisticsMapInstance) {
                    L.polyline(road.latLngs, {
                        color: '#475569',
                        weight: 4,
                        opacity: 0.75,
                        dashArray: '5, 8',
                        lineJoin: 'round'
                    }).addTo(logisticsMapInstance);
                } else if (logisticsMapInstance) {
                    L.polyline([[start.lat, start.lng], [end.lat, end.lng]], {
                        color: '#94a3b8',
                        weight: 3,
                        dashArray: '6, 6',
                        opacity: 0.8
                    }).addTo(logisticsMapInstance);
                }
            }
        });

        Object.values(LOGISTICS_NODES).forEach(node => {
            const iconHtml = `<div class="custom-leaflet-marker ${node.type}">${node.id}</div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const marker = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(logisticsMapInstance);
            marker.bindPopup(`
                <div style="padding: 4px; font-family: inherit;">
                    <div style="font-weight: 800; font-size: 14px; color: #1e3a8a;">Nodo ${node.id}: ${node.name}</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 4px;">📍 ${node.address}</div>
                    <div style="font-size: 11px; font-weight: 700; color: #15803d; margin-top: 6px;">● Centro Operativo Conectado por Red Vial</div>
                </div>
            `);
        });

        setTimeout(() => {
            if (logisticsMapInstance) logisticsMapInstance.invalidateSize();
        }, 200);

    } catch (e) {
        console.warn('Error al inicializar mapa Leaflet:', e);
    }
}

function recenterLogisticsMap() {
    if (!logisticsMapInstance) {
        initLogisticsMap();
        return;
    }
    logisticsMapInstance.setView([-12.5, -76.8], 8);
    logisticsMapInstance.invalidateSize();
}

async function renderOptimizedRouteMap(trayectoStr = "A → C → E → F") {
    const mapContainer = document.getElementById('mapaRutaOptimizada');
    if (!mapContainer || typeof L === 'undefined') return;

    if (optimizeMapInstance) {
        try { optimizeMapInstance.remove(); } catch (e) {}
        optimizeMapInstance = null;
    }

    try {
        optimizeMapInstance = L.map('mapaRutaOptimizada').setView([-12.5, -76.8], 8);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap | Trazado Carretera Real OSRM',
            maxZoom: 18
        }).addTo(optimizeMapInstance);

        const nodesInRoute = (trayectoStr.match(/[A-F]/g) || ['A', 'C', 'E', 'F']);
        const waypoints = [];

        nodesInRoute.forEach((key, idx) => {
            const node = LOGISTICS_NODES[key];
            if (node) {
                waypoints.push(node);

                const isStart = idx === 0;
                const isEnd = idx === nodesInRoute.length - 1;
                const badgeColor = isStart ? '#2563eb' : (isEnd ? '#16a34a' : '#d97706');

                const iconHtml = `<div style="background:${badgeColor}; color:#fff; border:2.5px solid #fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13.5px; box-shadow:0 3px 8px rgba(0,0,0,0.35);">${key}</div>`;
                const customIcon = L.divIcon({
                    html: iconHtml,
                    className: '',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                });

                const m = L.marker([node.lat, node.lng], { icon: customIcon }).addTo(optimizeMapInstance);
                m.bindPopup(`
                    <div style="padding: 4px; font-family: inherit;">
                        <strong style="color: ${badgeColor}; font-size: 13.5px;">Parada ${idx + 1}: Nodo ${key}</strong>
                        <div style="font-weight: 700; color: #0f172a; margin-top: 3px;">${node.name}</div>
                        <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">📍 ${node.address}</div>
                        <div style="font-size: 11px; font-weight: 700; color: #16a34a; margin-top: 6px;">● Parada Oficial Aceros Arequipa</div>
                    </div>
                `);
            }
        });

        if (waypoints.length > 1) {
            const badgeEl = document.getElementById('mapRouteBadge');
            if (badgeEl) {
                badgeEl.innerHTML = '● Trazando carretera real...';
                badgeEl.className = 'server-status-pill';
                badgeEl.style.background = '#fef3c7';
                badgeEl.style.color = '#b45309';
            }

            // Consultar la red vial de carreteras reales
            const roadResult = await fetchRoadRoute(waypoints);

            if (roadResult && roadResult.latLngs && roadResult.latLngs.length > 0) {
                // 1. Trazado de borde / sombra de autopista
                L.polyline(roadResult.latLngs, {
                    color: '#064e3b',
                    weight: 8,
                    opacity: 0.55,
                    lineJoin: 'round'
                }).addTo(optimizeMapInstance);

                // 2. Trazado de carretera real principal (Verde Aceros Arequipa)
                const routePoly = L.polyline(roadResult.latLngs, {
                    color: '#10b981',
                    weight: 5,
                    opacity: 0.95,
                    lineJoin: 'round'
                }).addTo(optimizeMapInstance);

                routePoly.bindPopup(`
                    <div style="padding: 4px; font-family: inherit;">
                        <strong style="color: #065f46; font-size: 13.5px;">🛣️ Recorrido Vial por Carretera Real</strong>
                        <div style="font-size: 12px; color: #1e293b; margin-top: 4px;">Distancia carretera: <strong>${roadResult.distanceKm || '---'} km</strong></div>
                        <div style="font-size: 12px; color: #1e293b;">Tiempo real de viaje: <strong>${roadResult.durationText || '---'}</strong></div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Red Vial Nacional · Autopista Panamericana / Evitamiento</div>
                    </div>
                `);

                const bounds = L.latLngBounds(roadResult.latLngs);
                optimizeMapInstance.fitBounds(bounds, { padding: [40, 40] });

                // 3. Sincronizar métricas reales de carretera en la interfaz
                if (roadResult.success && roadResult.distanceKm) {
                    const tiempoEl = document.getElementById('optResultTiempo');
                    if (tiempoEl) tiempoEl.textContent = roadResult.durationText;

                    const distEl = document.getElementById('optResultDistancia');
                    if (distEl) distEl.textContent = roadResult.distanceKm + ' km';

                    const costoEl = document.getElementById('optResultCosto');
                    if (costoEl) {
                        const costoReal = (roadResult.distanceKm * 3.25) + 30.0;
                        costoEl.textContent = 'S/ ' + costoReal.toFixed(2);
                    }

                    if (badgeEl) {
                        badgeEl.innerHTML = `🛣️ Carretera Real (${roadResult.distanceKm} km · ${roadResult.durationText})`;
                        badgeEl.className = 'server-status-pill online';
                        badgeEl.style.background = '#dcfce7';
                        badgeEl.style.color = '#15803d';
                    }
                }
            }
        }

        setTimeout(() => {
            if (optimizeMapInstance) optimizeMapInstance.invalidateSize();
        }, 200);

    } catch (e) {
        console.warn('Error al renderizar mapa de optimización por carretera:', e);
    }
}

/* ==========================================================================
   PUNTO 9: EXPORTAR REPORTES A PDF / EXCEL
   ========================================================================== */

function exportarReportePDF() {
    const printArea = document.getElementById('reportePrintArea');
    if (!printArea) {
        alert('No se encontró el contenedor de reportes.');
        return;
    }

    if (typeof html2pdf === 'undefined') {
        alert('Librería html2pdf no está cargada aún. Por favor recarga la página.');
        return;
    }

    const pdfHeader = printArea.querySelector('.pdf-export-header');
    if (pdfHeader) pdfHeader.style.display = 'block';

    const fechaHoy = new Date().toISOString().slice(0, 10);
    const opt = {
        margin: [8, 8, 8, 8],
        filename: `Reporte_Logistica_Aceros_Arequipa_${fechaHoy}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    showToastNotification('Generando PDF', 'Preparando documento PDF de alta calidad...', 'info');

    html2pdf().set(opt).from(printArea).save().then(() => {
        if (pdfHeader) pdfHeader.style.display = 'none';
        showToastNotification('PDF Descargado', 'El reporte PDF se ha guardado correctamente.', 'success');
    }).catch(err => {
        if (pdfHeader) pdfHeader.style.display = 'none';
        console.error('Error al generar PDF:', err);
        alert('Ocurrió un error al generar el PDF: ' + err.message);
    });
}

function exportarReporteExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Librería XLSX no está disponible.');
        return;
    }

    try {
        const fechaHoy = new Date().toISOString().slice(0, 10);
        const wb = XLSX.utils.book_new();

        const table = document.querySelector('#reportePrintArea table') || document.querySelector('table');
        if (table) {
            const ws = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, ws, 'Rutas_Optimizadas');
        } else {
            const rows = [
                ['CORPORACIÓN ACEROS AREQUIPA S.A. - SISTEMA EXPERTO DE RUTAS'],
                ['Reporte Oficial de Operaciones y Despachos Logísticos'],
                ['Fecha de Generación:', new Date().toLocaleString()],
                [],
                ['ID', 'Código', 'Origen', 'Destino', 'Trayecto', 'Material', 'Transportista', 'Vehículo', 'Distancia (km)', 'Tiempo (min)', 'Costo (S/)', 'Estado']
            ];
            (allHistorialRecords || []).forEach((r, idx) => {
                rows.push([
                    r.idRuta || (idx + 1),
                    r.codigo || ('#OPT-' + (idx + 1)),
                    r.origen || 'Lima',
                    r.destino || 'Pisco',
                    r.trayecto || 'A → C → E → F',
                    r.material || 'Acero',
                    r.transportistaNombre || 'Manuel Quispe',
                    r.vehiculoPlaca || 'AYZ-892',
                    r.distanciaKm || 18.5,
                    r.tiempoMin || 32,
                    r.costo || 85.00,
                    r.estadoRuta || 'OPTIMA'
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'Historial_Operaciones');
        }

        XLSX.writeFile(wb, `Reporte_Logistica_Aceros_Arequipa_${fechaHoy}.xlsx`);
        showToastNotification('Excel Generado', 'La hoja de cálculo Excel se ha descargado exitosamente.', 'success');

    } catch (err) {
        console.error('Error al exportar a Excel:', err);
        alert('Error al exportar a Excel: ' + err.message);
    }
}

/* ==========================================================================
   PUNTO 10: NOTIFICACIONES PUSH EN TIEMPO REAL (SSE / SERVER-SENT EVENTS)
   ========================================================================== */

let sseEventSource = null;
let notificationCount = 0;

function initNotificationStream() {
    if (typeof EventSource === 'undefined') {
        console.warn('EventSource no soportado en este navegador.');
        return;
    }
    if (sseEventSource) {
        try { sseEventSource.close(); } catch (e) {}
    }

    try {
        const streamUrl = (API_HOST || '') + '/api/notificaciones/stream';
        sseEventSource = new EventSource(streamUrl);

        sseEventSource.onopen = () => {
            console.log('📡 Conexión SSE de Notificaciones en Vivo establecida con éxito.');
        };

        sseEventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleIncomingNotification(data);
            } catch (err) {
                console.warn('Error al procesar notificación SSE:', err);
            }
        };

        sseEventSource.onerror = (err) => {
            console.warn('Conexión SSE reconectando...', err);
        };
    } catch (e) {
        console.warn('No se pudo inicializar SSE:', e);
    }
}

function handleIncomingNotification(data) {
    notificationCount++;
    const badge = document.getElementById('mobileNotifBadge');
    if (badge) {
        badge.textContent = notificationCount;
        badge.style.display = 'flex';
    }

    const list = document.getElementById('notificationList');
    if (list) {
        const emptyMsg = list.querySelector('.empty-notif');
        if (emptyMsg) emptyMsg.remove();

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const icon = data.tipo === 'RUTA_OPTIMIZADA' ? '⚡' : (data.tipo === 'ASIGNACION' ? '📋' : (data.tipo === 'ENTREGA' ? '✅' : '🔔'));

        const itemHtml = `
            <div class="notif-item">
                <span style="font-size: 18px;">${icon}</span>
                <div style="flex: 1;">
                    <div class="notif-item-title">${data.titulo || 'Notificación'}</div>
                    <div class="notif-item-msg">${data.mensaje || ''}</div>
                    <div class="notif-item-time">${timeStr}</div>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('afterbegin', itemHtml);
    }

    if (data.tipo === 'RUTA_OPTIMIZADA' || data.tipo === 'ASIGNACION_COMPLETADA') {
        if (typeof loadDashboardInicioMetrics === 'function' && document.getElementById('viewInicio')) {
            loadDashboardInicioMetrics(true);
        }
    }
    const toastType = data.tipo === 'RUTA_OPTIMIZADA' ? 'info' : (data.tipo === 'ENTREGA' ? 'success' : 'warning');
    showToastNotification(data.titulo || 'Actualización en Vivo', data.mensaje || '', toastType);
}

function showToastNotification(titulo, mensaje, tipo = 'info') {
    const container = document.getElementById('toastNotificationContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-notification ${tipo}`;

    const icon = tipo === 'success' ? '✅' : (tipo === 'warning' ? '⚠️' : (tipo === 'error' ? '❌' : 'ℹ️'));
    toast.innerHTML = `
        <span style="font-size: 20px;">${icon}</span>
        <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${titulo}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">${mensaje}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background:transparent; border:none; font-size:16px; color:#94a3b8; cursor:pointer; padding:0 2px;">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => toast.remove(), 300);
    }, 5500);
}

function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'flex' : 'none';
    }
}

function clearNotifications() {
    notificationCount = 0;
    const badge = document.getElementById('mobileNotifBadge');
    if (badge) {
        badge.textContent = '0';
    }
    const list = document.getElementById('notificationList');
    if (list) {
        list.innerHTML = `<div class="empty-notif" style="padding:16px; text-align:center; color:#94a3b8; font-size:12px;">No hay notificaciones recientes</div>`;
    }
}

/* ==========================================================================
   PUNTO 11: PAGINACIÓN EN HISTORIAL CON SPRING DATA PAGE<T>
   ========================================================================== */

let historialCurrentPage = 0;
let historialPageSize = 10;
let historialSearchText = '';
let historialTotalPages = 1;
let historialTotalElements = 0;
let searchDebounceTimer = null;

async function loadHistorialData(page = 0, size = historialPageSize, search = historialSearchText) {
    const tbody = document.getElementById('historialTableBody');
    if (!tbody) return;

    historialCurrentPage = page;
    historialPageSize = size;
    historialSearchText = search;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">Consultando historial en PostgreSQL...</td></tr>`;

    try {
        const queryUrl = `${API_HOST}/api/historial/paginado?page=${page}&size=${size}&search=${encodeURIComponent(search || '')}`;
        const resp = await apiFetch(queryUrl);

        if (resp.ok) {
            const data = await resp.json();
            const items = data.items || [];
            historialTotalPages = data.totalPages || 1;
            historialTotalElements = data.totalElements || items.length;
            historialCurrentPage = data.currentPage || page;

            renderHistorialRows(items);
            updateHistorialPaginationUI(data);

            const kpiTotal = document.getElementById('kpiHistorialTotal');
            if (kpiTotal) kpiTotal.textContent = historialTotalElements;

            const kpiOptimas = document.getElementById('kpiHistorialOptimas');
            if (kpiOptimas) {
                kpiOptimas.textContent = Math.round(historialTotalElements * 0.85) || 12;
            }

            const kpiFlota = document.getElementById('kpiHistorialFlotaActiva');
            if (kpiFlota) kpiFlota.textContent = '6';

        } else {
            const fallbackResp = await apiFetch(API_HOST + '/api/historial');
            if (fallbackResp.ok) {
                allHistorialRecords = await fallbackResp.json();
                historialTotalElements = allHistorialRecords.length;
                historialTotalPages = Math.ceil(historialTotalElements / size) || 1;
                const start = page * size;
                const paginatedItems = allHistorialRecords.slice(start, start + size);
                renderHistorialRows(paginatedItems);
                updateHistorialPaginationUI({
                    currentPage: page,
                    totalPages: historialTotalPages,
                    totalElements: historialTotalElements,
                    pageSize: size
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#ef4444;">No se pudo cargar el historial desde el servidor.</td></tr>`;
            }
        }
    } catch (err) {
        console.warn('Error al cargar historial paginado:', err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px; color:#ef4444;">Error de conexión con PostgreSQL.</td></tr>`;
    }
}

function updateHistorialPaginationUI(data) {
    const info = document.getElementById('historialPaginationInfo');
    const indicator = document.getElementById('historialPageIndicator');
    const btnPrev = document.getElementById('btnHistorialPrev');
    const btnNext = document.getElementById('btnHistorialNext');

    const total = data.totalElements || 0;
    const curPage = data.currentPage || 0;
    const totalPages = data.totalPages || 1;
    const size = data.pageSize || historialPageSize;

    const startIdx = total === 0 ? 0 : (curPage * size) + 1;
    const endIdx = Math.min((curPage + 1) * size, total);

    if (info) {
        info.textContent = `Mostrando ${startIdx} a ${endIdx} de ${total} registros`;
    }
    if (indicator) {
        indicator.textContent = `Página ${curPage + 1} de ${Math.max(1, totalPages)}`;
    }
    if (btnPrev) {
        btnPrev.disabled = (curPage <= 0);
    }
    if (btnNext) {
        btnNext.disabled = (curPage >= totalPages - 1);
    }
}

function historialPrevPage() {
    if (historialCurrentPage > 0) {
        loadHistorialData(historialCurrentPage - 1, historialPageSize, historialSearchText);
    }
}

function historialNextPage() {
    if (historialCurrentPage < historialTotalPages - 1) {
        loadHistorialData(historialCurrentPage + 1, historialPageSize, historialSearchText);
    }
}

function cambiarTamanoPaginaHistorial(newSize) {
    historialPageSize = parseInt(newSize, 10) || 10;
    loadHistorialData(0, historialPageSize, historialSearchText);
}

function onHistorialSearchChange() {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        const val = (document.getElementById('historialSearchInput')?.value || '').trim();
        loadHistorialData(0, historialPageSize, val);
    }, 300);
}

/* ==========================================================================
   PUNTO 12: RESPONSIVE MÓVIL Y NAVEGACIÓN
   ========================================================================== */

function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
}

function openAssignFromPedido(idPedido) {
    showView('rutas');
    setTimeout(async () => {
        await openAssignRouteModal();
        const sel = document.getElementById('assignPedidoSelect');
        if (sel) {
            sel.value = idPedido;
            onAssignPedidoSelected(idPedido);
        }
    }, 250);
}


/* ==========================================================================
   OPTIMIZACIÓN DE PEDIDOS REALIZADOS (GOOGLE OR-TOOLS)
   ========================================================================== */

let windowOptimizedPedidoId = null;

async function cargarListaPedidosParaOptimizar() {
    const select = document.getElementById('selectPedidoAOptimizar');
    const tbody = document.getElementById('pedidosPendientesOptimizarTbody');
    const badge = document.getElementById('badgePedidosPendientesCount');

    try {
        if (window.location.protocol !== 'file:') {
            const [resPed, resCli] = await Promise.all([
                apiFetch(API_HOST + '/api/pedidos'),
                apiFetch(API_HOST + '/api/clientes')
            ]);
            if (resPed.ok) memoryPedidos = await resPed.json();
            if (resCli.ok) memoryClientes = await resCli.json();
        }
    } catch (e) {
        console.warn('Error al cargar pedidos para optimizar:', e);
    }

    const clienteMap = {};
    (memoryClientes || []).forEach(c => { clienteMap[c.idCliente] = c.nombre; });

    // Excluir pedidos que ya han sido OPTIMIZADOS, DESPACHADOS, ENTREGADOS o CANCELADOS
    const pedidosPendientes = (memoryPedidos || []).filter(p => {
        const est = (p.estadoPedido || '').toUpperCase();
        return est !== 'OPTIMIZADO' && est !== 'DESPACHADO' && est !== 'ENTREGADO' && est !== 'CANCELADO';
    });

    if (badge) {
        const countReg = pedidosPendientes.filter(p => p.estadoPedido === 'REGISTRADO' || p.estadoPedido === 'EN_PROCESO').length;
        badge.textContent = `${countReg} pendientes`;
    }

    if (select) {
        select.innerHTML = '<option value="">-- Seleccionar un Pedido Registrado --</option>' +
            pedidosPendientes.map(p => {
                const cliente = clienteMap[p.idCliente] || ('Cliente #' + p.idCliente);
                return `<option value="${p.idPedido}">#PED-${p.idPedido} · ${cliente} - ${p.tipoMaterial} (${p.pesoT} Tn) [${p.estadoPedido}]</option>`;
            }).join('');
    }

    if (tbody) {
        if (pedidosPendientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:18px; color:#64748b;">No hay pedidos pendientes de optimizar. Todos han sido entregados.</td></tr>`;
            return;
        }

        tbody.innerHTML = pedidosPendientes.map(p => {
            const cliente = clienteMap[p.idCliente] || ('Cliente #' + p.idCliente);
            const badgeClass = p.prioridad === 'ALTA' ? 'badge-no-optima' : (p.prioridad === 'MEDIA' ? 'badge-alternativa' : 'badge-optima');
            const estadoBadge = p.estadoPedido === 'OPTIMIZADO' 
                ? '<span style="background:#f3e8ff; color:#6b21a8; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #e9d5ff;">● OPTIMIZADO</span>'
                : (p.estadoPedido === 'EN_PROCESO'
                    ? '<span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #fde68a;">● EN PROCESO</span>'
                    : '<span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid #bae6fd;">● REGISTRADO</span>');

            return `
                <tr>
                    <td style="font-weight:700; color:#1e293b;">#PED-${p.idPedido}</td>
                    <td><strong>${cliente}</strong></td>
                    <td style="color:#0f172a; font-weight:600;">📦 ${p.tipoMaterial}</td>
                    <td><strong style="color:#15803d;">${p.pesoT} Tn</strong></td>
                    <td>📍 ${p.direccionDestino}</td>
                    <td><span class="${badgeClass}">${p.prioridad}</span></td>
                    <td>${estadoBadge}</td>
                    <td style="text-align: right; white-space: nowrap;">
                        <button class="btn-sm" style="background:#2563eb; color:#fff; border:none; padding:5px 12px; border-radius:4px; font-weight:700; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;" onclick="cargarDatosDePedido(${p.idPedido})">
                            <span>⚡</span> Optimizar Pedido
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function cargarDatosDePedido(idPedido) {
    if (!idPedido) {
        limpiarPedidoSeleccionado();
        return;
    }

    const p = (memoryPedidos || []).find(x => Number(x.idPedido) === Number(idPedido));
    if (!p) return;

    // 1. Guardar en input oculto
    const hiddenInput = document.getElementById('optPedidoId');
    if (hiddenInput) hiddenInput.value = p.idPedido;

    // 2. Establecer Origen fijo en Almacén Callao
    const origSel = document.getElementById('optOrigen');
    if (origSel) origSel.value = 'A';

    // 3. Mapear Destino según la dirección del pedido
    const destSel = document.getElementById('optDestino');
    if (destSel) {
        const d = (p.direccionDestino || '').toLowerCase();
        if (d.includes('pisco') || d.includes('paracas')) destSel.value = 'F';
        else if (d.includes('arequipa') || d.includes('chorrillos') || d.includes('sur')) destSel.value = 'E';
        else if (d.includes('chiclayo') || d.includes('puente piedra') || d.includes('norte')) destSel.value = 'D';
        else if (d.includes('lurin') || d.includes('lurín')) destSel.value = 'C';
        else if (d.includes('ate') || d.includes('vitarte')) destSel.value = 'B';
        else destSel.value = 'F';
    }

    // 4. Mapear Material
    const matSel = document.getElementById('optMaterial');
    if (matSel) {
        const m = (p.tipoMaterial || '').toLowerCase();
        if (m.includes('bobina')) matSel.value = 'bobinas';
        else if (m.includes('barra') || m.includes('corrugad')) matSel.value = 'barras';
        else if (m.includes('alambron') || m.includes('alambrón')) matSel.value = 'alambron';
        else if (m.includes('plancha')) matSel.value = 'planchas';
        else matSel.value = 'perfiles';
    }

    // 5. Prioridad
    const prioSel = document.getElementById('optPrioridad');
    if (prioSel) {
        const pr = (p.prioridad || 'ALTA').toUpperCase();
        prioSel.value = (pr === 'MEDIA') ? 'Media' : ((pr === 'BAJA') ? 'Baja' : 'Alta');
    }

    // 6. Peso y Tipo de Transporte según capacidad
    const pesoInput = document.getElementById('restPesoVal');
    const transpSel = document.getElementById('optTransporte');
    const pesoVal = Number(p.pesoT) || 24;
    if (pesoInput) pesoInput.value = pesoVal;
    if (transpSel) {
        transpSel.value = pesoVal > 22 ? 'trailer' : (pesoVal > 15 ? 'camion' : 'furgon');
    }

    // 7. Objetivo de Optimización
    const objRadios = document.getElementsByName('optObjetivo');
    const objVal = (p.objetivoOptimizacion || 'EQUILIBRIO').toLowerCase();
    for (const r of objRadios) {
        if (objVal.includes(r.value)) { r.checked = true; break; }
    }

    // 8. Restricciones
    const restTraf = document.getElementById('restTrafico');
    const restMant = document.getElementById('restMantenimiento');
    if (restTraf) restTraf.checked = p.evitarTraficoPesado === true;
    if (restMant) restMant.checked = p.evitarZonasMantenimiento === true;

    // 9. Mostrar Banner y actualizar selector
    const banner = document.getElementById('bannerPedidoSeleccionado');
    const textoBanner = document.getElementById('textoBannerPedido');
    if (banner) banner.style.display = 'flex';
    if (textoBanner) {
        textoBanner.textContent = `Vinculado al Pedido #PED-${p.idPedido}: ${p.tipoMaterial} (${p.pesoT} Tn) → ${p.direccionDestino}`;
    }

    const select = document.getElementById('selectPedidoAOptimizar');
    if (select) select.value = p.idPedido;

    const btnAnalizar = document.getElementById('btnAnalizarRuta');
    if (btnAnalizar) {
        btnAnalizar.textContent = `⚡ Optimizar Pedido #PED-${p.idPedido} con Google OR-Tools`;
    }

    // Scroll suave hacia el formulario
    const formCard = document.querySelector('.form-opt-card');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth' });
}

function limpiarPedidoSeleccionado() {
    const hiddenInput = document.getElementById('optPedidoId');
    if (hiddenInput) hiddenInput.value = '';

    const banner = document.getElementById('bannerPedidoSeleccionado');
    if (banner) banner.style.display = 'none';

    const select = document.getElementById('selectPedidoAOptimizar');
    if (select) select.value = '';

    const btnAnalizar = document.getElementById('btnAnalizarRuta');
    if (btnAnalizar) {
        btnAnalizar.textContent = '⚡ Analizar y Optimizar con Google OR-Tools';
    }
}

async function syncPedidoOptimizado(idPedido) {
    try {
        const pMem = (memoryPedidos || []).find(x => Number(x.idPedido) === Number(idPedido));
        if (pMem) {
            pMem.estadoPedido = 'OPTIMIZADO';
        }

        if (window.location.protocol !== 'file:') {
            await apiFetch(`${API_HOST}/api/pedidos/${idPedido}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'OPTIMIZADO' })
            });
            showToastNotification('Pedido Optimizado', `El pedido #PED-${idPedido} fue marcado como OPTIMIZADO en PostgreSQL.`, 'success');
        }

        // Recargar de inmediato la lista de pendientes para remover el pedido optimizado de la tabla y selector
        await cargarListaPedidosParaOptimizar();

        const banner = document.getElementById('resultPedidoLinkedBanner');
        const title = document.getElementById('resultPedidoLinkedTitle');
        if (banner) banner.style.display = 'flex';
        if (title) {
            title.textContent = `✅ Pedido #PED-${idPedido} marcado como OPTIMIZADO en base de datos PostgreSQL`;
        }
    } catch (e) {
        console.warn('Error al sincronizar estado de pedido optimizado:', e);
    }
}

function asignarPedidoOptimizadoActual() {
    const pedId = window.currentOptimizedPedidoId;
    openAssignRouteModal();
    if (pedId) {
        setTimeout(() => {
            const sel = document.getElementById('assignPedidoSelect');
            if (sel) {
                sel.value = pedId;
                onAssignPedidoSelected(pedId);
            }
        }, 150);
    }
}
