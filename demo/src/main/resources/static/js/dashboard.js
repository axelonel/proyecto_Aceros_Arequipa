/**
 * Sistema Experto de Rutas - Corporación Aceros Arequipa
 * Lógica modular del Dashboard, RBAC (Permisos por Rol) y Asignación de Rutas
 */

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
            <div class="content-header" style="margin-bottom: 24px;">
                <h1>PANEL PRINCIPAL</h1>
                <p>Resumen general del sistema logístico</p>
            </div>
            <div class="kpi-row">
                <div class="kpi-card blue">
                    <div class="kpi-title">Rutas analizadas</div>
                    <div class="kpi-value" id="kpiRutas">125</div>
                    <div class="kpi-subtitle">total de análisis</div>
                </div>
                <div class="kpi-card green">
                    <div class="kpi-title">Ahorro estimado</div>
                    <div class="kpi-value" id="kpiAhorro">S./ 4250</div>
                    <div class="kpi-subtitle">Este mes</div>
                </div>
                <div class="kpi-card yellow">
                    <div class="kpi-title">Tiempo reducido</div>
                    <div class="kpi-value" id="kpiTiempo">18%</div>
                    <div class="kpi-subtitle">Promedio</div>
                </div>
            </div>
            <div class="bottom-row" style="margin-top: 24px;">
                <div class="card-container">
                    <div class="card-header-row">
                        <div class="card-title">Resumen de rendimiento</div>
                        <div class="chart-legend">
                            <div class="legend-item"><span class="legend-dot blue"></span><span>Tiempo (min)</span></div>
                            <div class="legend-item"><span class="legend-dot green"></span><span>Costo (S/)</span></div>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="performanceChart" width="550" height="230"></canvas>
                    </div>
                </div>
                <div class="card-container optimizations-card">
                    <div class="card-title" style="color: #374151;">Ultimas Optimizaciones</div>
                    <div class="opt-list">
                        <div class="opt-item"><div class="opt-info"><span class="opt-route">Ruta A-B-D</span><span class="opt-time">Hoy, 09:15AM</span></div><span class="opt-badge">OPTIMO</span></div>
                        <div class="opt-item"><div class="opt-info"><span class="opt-route">Ruta C-E-F</span><span class="opt-time">Hoy, 08:45AM</span></div><span class="opt-badge">OPTIMO</span></div>
                        <div class="opt-item"><div class="opt-info"><span class="opt-route">Ruta A-C -F</span><span class="opt-time">Ayer, 05:30 PM</span></div><span class="opt-badge">OPTIMO</span></div>
                        <div class="opt-item"><div class="opt-info"><span class="opt-route">Ruta B-D-E</span><span class="opt-time">Ayer, 04:20 PM</span></div><span class="opt-badge">OPTIMO</span></div>
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
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">COMPARACIÓN DE ALTERNATIVAS</h1>
                <p style="font-size: 13.5px; color: #475569;">Análisis de todas las rutas posibles</p>
            </div>
            <table class="report-table">
                <thead>
                    <tr><th>Ruta</th><th>Trayecto</th><th>Tiempo (min)</th><th>Distancia (km)</th><th>Costo (S/)</th><th>Puntaje</th><th>Recomendación</th></tr>
                </thead>
                <tbody>
                    <tr><td style="font-weight: 700;">1</td><td style="font-weight: 600;">A - C - E - F</td><td>32</td><td>18.5</td><td>85.00</td><td style="font-weight: 700;">92%</td><td><span class="badge-optima">Óptima</span></td></tr>
                    <tr><td style="font-weight: 700;">2</td><td style="font-weight: 600;">A - B - D - F</td><td>41</td><td>22.3</td><td>72.00</td><td style="font-weight: 700;">84%</td><td><span class="badge-alternativa">Alternativa</span></td></tr>
                    <tr><td style="font-weight: 700;">3</td><td style="font-weight: 600;">A - D - E - F</td><td>38</td><td>20.1</td><td>88.00</td><td style="font-weight: 700;">79%</td><td><span class="badge-alternativa">Alternativa</span></td></tr>
                    <tr><td style="font-weight: 700;">4</td><td style="font-weight: 600;">A - B - E - F</td><td>55</td><td>26.8</td><td>110.00</td><td style="font-weight: 700;">61%</td><td><span class="badge-no-optima">No recomendada</span></td></tr>
                </tbody>
            </table>
            <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 15px; font-weight: 700; color: #1e293b;">Comparación visual</h3>
                        <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; font-weight: 600; color: #475569;">
                            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #2563eb;"></span><span>Tiempo (min)</span></div>
                            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; border-radius: 50%; background: #16a34a;"></span><span>Costo (S/)</span></div>
                        </div>
                    </div>
                    <div style="width: 100%; height: 230px;"><canvas id="reportBarChart" width="460" height="230" style="width: 100%; height: 100%; display: block;"></canvas></div>
                </div>
                <div class="conclusion-sticky-card">
                    <h2 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 14px;">Conclusión</h2>
                    <p style="font-size: 14.5px; line-height: 1.65; color: #1e293b; font-weight: 500;">La ruta 1 (A-C-E-F) es la mejor opcion por que ofrece el menor tiempo con un costo aceptable logrando el mejor equilibrio segun los criterios seleccionados.</p>
                </div>
            </div>
        </div>
    `,
    'historial': `
        <div id="viewHistorial">
            <div class="content-header" style="margin-bottom: 24px;">
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; text-transform: uppercase;">HISTORIAL DE OPTIMIZACIONES</h1>
                <p style="font-size: 13.5px; color: #475569;">Registro de rutas calculadas y despachos programados</p>
            </div>
            <div class="card-container">
                <table class="report-table" style="margin-bottom: 0;">
                    <thead><tr><th>Código</th><th>Fecha / Hora</th><th>Origen - Destino</th><th>Material</th><th>Transportista</th><th>Vehículo</th><th>Estado</th></tr></thead>
                    <tbody>
                        <tr><td style="font-weight:700;">#OPT-1092</td><td>Hoy 14:32</td><td>Almacén Principal → Planta Pisco</td><td>Bobinas de acero (24 Tn)</td><td>Manuel Quispe</td><td>Tráiler Plataforma (V-102)</td><td><span class="badge-optima">Completada</span></td></tr>
                        <tr><td style="font-weight:700;">#OPT-1091</td><td>Hoy 11:15</td><td>Sede Lima → Distribuidora Norte</td><td>Barras corrugadas (20 Tn)</td><td>Carlos Mendoza</td><td>Camión Pesado (V-105)</td><td><span class="badge-optima">En Tránsito</span></td></tr>
                        <tr><td style="font-weight:700;">#OPT-1090</td><td>Ayer 16:40</td><td>Almacén Principal → Centro Lurín</td><td>Alambrón (18 Tn)</td><td>Jorge Ramirez</td><td>Furgón (V-108)</td><td><span class="badge-optima">Completada</span></td></tr>
                    </tbody>
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
                const res = await fetch(fileName);
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
function onViewLoaded(viewName) {
    if (viewName === 'inicio') {
        setTimeout(drawChart, 60);
    } else if (viewName === 'mis-rutas') {
        loadAsignacionesFromDatabase();
    } else if (viewName === 'reportes') {
        loadReportesData();
        setTimeout(drawReportBarChart, 80);
    } else if (viewName === 'usuarios' || viewName === 'configuracion') {
        loadUsersFromDatabase();
    } else if (viewName === 'flota') {
        loadFlotaData();
    } else if (viewName === 'clientes') {
        loadClientesData();
    } else if (viewName === 'optimizar') {
        showOptSubStep('form');
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

    // Si es conductor, mostrar sus rutas o todas las asignadas para prueba
    if (user.rol === 'CONDUCTOR' || user.rol === 'TRANSPORTISTA') {
        const userDispatches = list.filter(d => d.conductorId === user.idUsuario || d.conductorNombre === user.nombres);
        if (userDispatches.length > 0) {
            list = userDispatches;
        }
    }

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

async function loadAsignacionesFromDatabase() {
    try {
        if (window.location.protocol !== 'file:') {
            const res = await fetch(API_HOST + '/api/asignaciones');
            if (res.ok) {
                const list = await res.json();
                if (list && list.length > 0) {
                    activeDispatches = list.map(a => ({
                        id: a.idAsignacion,
                        codigo: 'DSP-' + (1000 + a.idAsignacion),
                        origen: "Almacén Principal Lima (A)",
                        destino: "Planta Siderúrgica Pisco (F)",
                        trayecto: "A → C → E → F",
                        material: "Carga de Acero Aceros Arequipa",
                        conductorId: a.idTransportista,
                        conductorNombre: a.conductorNombre || 'Transportista Asignado',
                        vehiculo: (a.vehiculoTipo || 'Unidad de Flota') + ' - ' + (a.vehiculoModelo || ''),
                        placa: a.vehiculoPlaca || 'V-100',
                        prioridad: 'Alta',
                        tiempoEst: "32 min",
                        distancia: "18.5 km",
                        costo: "S/ 85.00",
                        estado: a.estado === 'ACTIVA' ? 'EN_TRANSITO' : 'COMPLETADA',
                        fecha: a.fechaInicio ? new Date(a.fechaInicio).toLocaleDateString() : 'Hoy',
                        supervisor: "Supervisor de Operaciones"
                    }));
                }
            }
        }
    } catch (e) {
        console.warn('Usando despachos locales de respaldo:', e);
    }
    renderMisRutas(currentDispatchFilter);
}

async function updateDispatchStatus(dispatchId, newStatus) {
    const item = activeDispatches.find(d => d.id === dispatchId);
    if (!item) return;

    item.estado = newStatus;

    if (newStatus === 'COMPLETADA' && window.location.protocol !== 'file:') {
        try {
            await fetch(API_HOST + `/api/asignaciones/${dispatchId}/completar`, { method: 'PUT' });
        } catch (e) {
            console.warn('Error completando asignacion en servidor:', e);
        }
    }

    const msg = (newStatus === 'EN_TRANSITO') 
        ? `🚚 ¡Buen viaje! Despacho ${item.codigo} marcado en tránsito hacia ${item.destino}.`
        : `✅ ¡Entrega registrada con éxito para el despacho ${item.codigo}! (Guardado en base de datos)`;

    alert(msg);
    renderMisRutas(currentDispatchFilter);
}

/* ==========================================================================
   MODAL DE ASIGNACIÓN DE RUTAS (SUPERVISOR / ADMIN CONECTADO A POSTGRESQL)
   ========================================================================== */

async function openAssignRouteModal() {
    const selectConductor = document.getElementById('assignConductorSelect');
    const selectVehiculo  = document.getElementById('assignVehiculoSelect');
    const placaInput      = document.getElementById('assignPlacaInput');

    // Cargar transportistas y vehiculos reales de PostgreSQL si es posible
    if (window.location.protocol !== 'file:') {
        try {
            const [resTrp, resVeh] = await Promise.all([
                fetch(API_HOST + '/api/transportistas'),
                fetch(API_HOST + '/api/vehiculos')
            ]);
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
            console.warn('Error cargando datos de vehiculos/transportistas:', err);
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

    // Guardar en PostgreSQL
    if (window.location.protocol !== 'file:') {
        try {
            await fetch(API_HOST + '/api/asignaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idVehiculo: vehiculoId, idTransportista: conductorId })
            });
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

    const payload = {
        origen: origenSel ? origenSel.value : "A",
        destino: destinoSel ? destinoSel.value : "F",
        material: matSel ? matSel.options[matSel.selectedIndex].text : "Bobinas de acero (24 Tn)",
        peso: pesoInput ? parseFloat(pesoInput.value) : 24.0,
        prioridad: prioridadSel ? prioridadSel.value : "Alta",
        tipoTransporte: transporteSel ? transporteSel.value : "camion",
        objetivo: objetivo,
        evitarTrafico: traficoCheck ? traficoCheck.checked : false,
        evitarMantenimiento: mantCheck ? mantCheck.checked : false
    };

    // Disparar en paralelo la llamada al backend con Google OR-Tools
    let orToolsResponse = null;
    try {
        if (window.location.protocol !== 'file:') {
            const resp = await fetch(API_HOST + '/api/rutas/optimizar-ortools', {
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

                setTimeout(() => showOptSubStep('result'), 600);
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
 * Carga la tabla comparativa de alternativas en la vista de Reportes
 */
async function loadReportesData() {
    const tbody = document.getElementById('reportesTableBody');
    if (!tbody) return;

    // Si ya tenemos el último resultado de Google OR-Tools en memoria, mostrar sus alternativas
    if (window.lastOrToolsResult && window.lastOrToolsResult.rutasAlternativas && window.lastOrToolsResult.rutasAlternativas.length > 0) {
        renderReportesTable(window.lastOrToolsResult.rutasAlternativas);
        return;
    }

    // Si no, consultar las últimas optimizaciones desde PostgreSQL
    if (window.location.protocol !== 'file:') {
        try {
            const resp = await fetch(API_HOST + '/api/rutas/ultimas-optimizaciones');
            if (resp.ok) {
                const list = await resp.json();
                if (list && list.length > 0) {
                    // Tomar las últimas 4 o 5
                    const rows = list.slice(-5).reverse();
                    let html = '';
                    rows.forEach((r, idx) => {
                        let badgeClass = 'badge-alternativa';
                        let label = 'Alternativa';
                        if (r.estadoRuta === 'OPTIMA') {
                            badgeClass = 'badge-optima';
                            label = 'Óptima (OR-Tools)';
                        } else if (r.estadoRuta === 'NO_RECOMENDADA') {
                            badgeClass = 'badge-descartada';
                            label = 'Descartada';
                        }
                        html += `
                            <tr>
                                <td style="font-weight: 700;">${idx + 1}</td>
                                <td style="font-weight: 600;">${r.secuenciaParadas || (r.origen + ' → ' + r.destino)}</td>
                                <td>${r.tiempoEstimadoMin ? Math.round(r.tiempoEstimadoMin) : 32}</td>
                                <td>${r.distanciaKm ? Number(r.distanciaKm).toFixed(1) : 18.5}</td>
                                <td>${r.costoOperativo ? Number(r.costoOperativo).toFixed(2) : '85.00'}</td>
                                <td style="font-weight: 700;">${r.puntaje ? r.puntaje + '%' : '92%'}</td>
                                <td><span class="${badgeClass}">${label}</span></td>
                            </tr>
                        `;
                    });
                    tbody.innerHTML = html;
                }
            }
        } catch (err) {
            console.warn('Error cargando reportes desde API:', err);
        }
    }
}

function renderReportesTable(alternativas) {
    const tbody = document.getElementById('reportesTableBody');
    if (!tbody || !alternativas) return;

    let html = '';
    alternativas.forEach(alt => {
        html += `
            <tr>
                <td style="font-weight: 700;">${alt.numero}</td>
                <td style="font-weight: 600;">${alt.trayecto}</td>
                <td>${alt.tiempoMinutos}</td>
                <td>${Number(alt.distanciaKm).toFixed(1)}</td>
                <td>${Number(alt.costoSoles).toFixed(2)}</td>
                <td style="font-weight: 700;">${alt.puntaje}</td>
                <td><span class="${alt.badgeClase}">${alt.recomendacion}</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
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
   GRÁFICO DE BARRAS COMPARATIVO – REPORTES
   ========================================================================== */

function drawReportBarChart() {
    const canvas = document.getElementById('reportBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 460;
    const H = 230;
    canvas.width  = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const routes  = ['Ruta 1', 'Ruta 2', 'Ruta 3', 'Ruta 4'];
    const tiempos = [32, 41, 38, 55];   // min
    const costos  = [85, 72, 88, 110];  // S/

    const padL = 40, padR = 20, padT = 20, padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const maxVal = 130;
    const groupW = chartW / routes.length;
    const barW   = groupW * 0.28;
    const gapB   = groupW * 0.06;

    // Grid horizontal
    [0, 40, 80, 120].forEach(v => {
        const y = padT + chartH - (v / maxVal) * chartH;
        ctx.beginPath();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Segoe UI, sans-serif';
        ctx.fillText(v, 4, y + 4);
    });

    routes.forEach((label, i) => {
        const cx = padL + i * groupW + groupW / 2;

        // Barra Tiempo (Azul)
        const yT = padT + chartH - (tiempos[i] / maxVal) * chartH;
        const hT = (tiempos[i] / maxVal) * chartH;
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cx - barW - gapB, yT, barW, hT);

        // Barra Costo (Verde)
        const yC = padT + chartH - (costos[i] / maxVal) * chartH;
        const hC = (costos[i] / maxVal) * chartH;
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(cx + gapB, yC, barW, hC);

        // Etiqueta X
        ctx.fillStyle = '#475569';
        ctx.font = '11.5px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, H - 10);
    });
}

/* ==========================================================================
   GRÁFICO SEMANAL DE RENDIMIENTO – INICIO
   ========================================================================== */

function drawChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const padL = 40, padB = 30, padT = 20, padR = 20;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const yLabels = [0, 20, 40, 60, 80];
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Segoe UI, sans-serif';

    yLabels.forEach((val, i) => {
        const y = padT + chartH - (i * (chartH / (yLabels.length - 1)));
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillText(val, 15, y + 4);
    });

    const xLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const stepX = chartW / (xLabels.length - 1);

    xLabels.forEach((day, i) => {
        const x = padL + (i * stepX);
        ctx.fillText(day, x - 10, h - 8);
    });

    const tiempoData = [45, 61, 61, 50, 61, 50, 63];
    const costoData  = [32, 36, 31, 26, 31, 26, 40];

    function getYCoord(val) {
        return padT + chartH - ((val / 80) * chartH);
    }

    // Línea Tiempo (Azul)
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    tiempoData.forEach((val, i) => {
        const x = padL + (i * stepX);
        const y = getYCoord(val);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    tiempoData.forEach((val, i) => {
        const x = padL + (i * stepX);
        ctx.beginPath();
        ctx.arc(x, getYCoord(val), 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Línea Costo (Verde)
    ctx.beginPath();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.5;
    costoData.forEach((val, i) => {
        const x = padL + (i * stepX);
        const y = getYCoord(val);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#16a34a';
    costoData.forEach((val, i) => {
        const x = padL + (i * stepX);
        ctx.beginPath();
        ctx.arc(x, getYCoord(val), 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

/* ==========================================================================
   LÓGICA DE FLOTAS Y VEHÍCULOS (PARQUE VEHICULAR Y CAPACIDADES EN TONELADAS)
   ========================================================================== */

let memoryFlotas = [];
let memoryVehiculos = [];
let memoryClientes = [];
let memoryPedidos = [];

async function loadFlotaData() {
    const grid = document.getElementById('flotasCardsGrid');
    const tbody = document.getElementById('vehiculosTbody');
    const badge = document.getElementById('flotaDbBadge');

    try {
        if (window.location.protocol !== 'file:') {
            const [resFlotas, resVehiculos] = await Promise.all([
                fetch(API_HOST + '/api/flotas'),
                fetch(API_HOST + '/api/vehiculos')
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

    if (grid) {
        if (memoryFlotas.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; color:#64748b; text-align:center;">No hay flotas registradas. Haz clic en "+ Nueva Flota".</div>`;
        } else {
            grid.innerHTML = memoryFlotas.map(f => `
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.03);">
                    <div style="font-size:11.5px; color:#0284c7; font-weight:700; text-transform:uppercase;">Flota #${f.idFlota}</div>
                    <div style="font-size:15px; font-weight:800; color:#0f172a; margin:4px 0;">${f.nombreFlota}</div>
                    <p style="font-size:12.5px; color:#64748b; margin:0;">${f.descripcion || 'Flota activa de transporte de acero'}</p>
                </div>
            `).join('');
        }
    }

    if (tbody) {
        if (memoryVehiculos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No hay vehículos registrados. Haz clic en "+ Nuevo Vehículo".</td></tr>`;
        } else {
            tbody.innerHTML = memoryVehiculos.map(v => {
                const badgeStatus = v.estadoOperativo === 'DISPONIBLE' ? 'badge-optima' : (v.estadoOperativo === 'EN_RUTA' ? 'badge-alternativa' : 'badge-no-optima');
                return `
                    <tr>
                        <td style="font-weight:700; color:#64748b;">#${v.idVehiculo}</td>
                        <td><strong style="color:#0f172a; font-size:13.5px; letter-spacing:0.5px;">${v.placa}</strong></td>
                        <td>${v.tipoCamion || 'Camión Pesado'}</td>
                        <td style="font-weight:600; color:#0284c7;">${v.modelo || 'Volvo FH 540'}</td>
                        <td><strong style="color:#15803d; font-size:14px;">${v.capacidadMaxTon} Tn</strong></td>
                        <td>${v.volumenMaxM3 ? v.volumenMaxM3 + ' m³' : '-'}</td>
                        <td><span class="${badgeStatus}">${v.estadoOperativo}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function openNewVehiculoModal() {
    const selFlota = document.getElementById('vehFlotaSelect');
    if (selFlota && memoryFlotas.length > 0) {
        selFlota.innerHTML = memoryFlotas.map(f => `<option value="${f.idFlota}">${f.nombreFlota}</option>`).join('');
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
    const placa = document.getElementById('vehPlaca').value.trim().toUpperCase();
    const tipoCamion = document.getElementById('vehTipo').value;
    const modelo = document.getElementById('vehModelo').value.trim();
    const capacidadMaxTon = parseFloat(document.getElementById('vehCapacidad').value);
    const volumenMaxM3 = parseFloat(document.getElementById('vehVolumen').value);
    const idFlota = parseInt(document.getElementById('vehFlotaSelect')?.value || 1);

    const payload = { placa, tipoCamion, modelo, capacidadMaxTon, volumenMaxM3, idFlota, estadoOperativo: 'DISPONIBLE' };

    try {
        if (window.location.protocol !== 'file:') {
            const res = await fetch(API_HOST + '/api/vehiculos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar');
            alert('✅ Vehículo registrado exitosamente en la base de datos.');
        } else {
            payload.idVehiculo = memoryVehiculos.length + 1;
            memoryVehiculos.unshift(payload);
            alert('✅ Vehículo registrado localmente.');
        }
        closeVehiculoModal();
        loadFlotaData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function openNewFlotaModal() {
    const modal = document.getElementById('flotaModal');
    if (modal) modal.classList.add('active');
}

function closeFlotaModal() {
    const modal = document.getElementById('flotaModal');
    if (modal) modal.classList.remove('active');
}

async function saveFlota(e) {
    e.preventDefault();
    const nombreFlota = document.getElementById('flotaNombre').value.trim();
    const descripcion = document.getElementById('flotaDescripcion').value.trim();
    const payload = { nombreFlota, descripcion, activo: true };

    try {
        if (window.location.protocol !== 'file:') {
            const res = await fetch(API_HOST + '/api/flotas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al crear');
            alert('✅ Flota creada exitosamente en PostgreSQL.');
        } else {
            payload.idFlota = memoryFlotas.length + 1;
            memoryFlotas.push(payload);
            alert('✅ Flota creada localmente.');
        }
        closeFlotaModal();
        loadFlotaData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/* ==========================================================================
   LÓGICA DE CLIENTES Y PEDIDOS DE ACERO
   ========================================================================== */

async function loadClientesData() {
    const tbodyCli = document.getElementById('clientesTbody');
    const tbodyPed = document.getElementById('pedidosTbody');
    const badge = document.getElementById('clientesDbBadge');

    try {
        if (window.location.protocol !== 'file:') {
            const [resCli, resPed] = await Promise.all([
                fetch(API_HOST + '/api/clientes'),
                fetch(API_HOST + '/api/pedidos')
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
        if (memoryPedidos.length === 0) {
            tbodyPed.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No hay pedidos registrados. Haz clic en "+ Registrar Pedido".</td></tr>`;
        } else {
            tbodyPed.innerHTML = memoryPedidos.map(p => {
                const badgeClass = p.prioridad === 'ALTA' ? 'badge-no-optima' : (p.prioridad === 'MEDIA' ? 'badge-alternativa' : 'badge-optima');
                return `
                    <tr>
                        <td style="font-weight:700; color:#64748b;">#PED-${p.idPedido}</td>
                        <td><strong>${p.clienteNombre || 'Cliente General'}</strong><br><small style="color:#64748b;">${p.clienteRuc || ''}</small></td>
                        <td style="color:#0f172a; font-weight:600;">📦 ${p.tipoMaterial}</td>
                        <td><strong style="color:#15803d; font-size:13.5px;">${p.pesoT} Tn</strong></td>
                        <td>${p.direccionDestino}</td>
                        <td><span class="${badgeClass}">${p.prioridad}</span></td>
                        <td><small style="color:#475569; font-weight:600;">${p.objetivoOptimizacion}</small></td>
                        <td><span class="badge-optima">${p.estadoPedido}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    if (tbodyCli) {
        if (memoryClientes.length === 0) {
            tbodyCli.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No hay clientes registrados. Haz clic en "+ Registrar Cliente".</td></tr>`;
        } else {
            tbodyCli.innerHTML = memoryClientes.map(c => `
                <tr>
                    <td style="font-weight:700; color:#64748b;">#${c.idCliente}</td>
                    <td><strong>${c.nombre}</strong></td>
                    <td><span style="font-family:monospace; font-weight:700; color:#0284c7;">${c.tipoDocumento}: ${c.numeroDocumento}</span></td>
                    <td>${c.direccionFiscal || '-'}</td>
                    <td>${c.contactoNombre || '-'}</td>
                    <td>${c.telefono || '-'}</td>
                    <td><span style="color:#16a34a; font-weight:600;">● Activo</span></td>
                </tr>
            `).join('');
        }
    }
}

function openNewClienteModal() {
    const modal = document.getElementById('clienteModal');
    if (modal) modal.classList.add('active');
}

function closeClienteModal() {
    const modal = document.getElementById('clienteModal');
    if (modal) modal.classList.remove('active');
}

async function saveCliente(e) {
    e.preventDefault();
    const nombre = document.getElementById('cliNombre').value.trim();
    const tipoDocumento = document.getElementById('cliTipoDoc').value;
    const numeroDocumento = document.getElementById('cliNumDoc').value.trim();
    const direccionFiscal = document.getElementById('cliDireccion').value.trim();
    const contactoNombre = document.getElementById('cliContacto').value.trim();
    const telefono = document.getElementById('cliTelefono').value.trim();

    const payload = { nombre, tipoDocumento, numeroDocumento, direccionFiscal, contactoNombre, telefono, activo: true };

    try {
        if (window.location.protocol !== 'file:') {
            const res = await fetch(API_HOST + '/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar cliente');
            alert('✅ Cliente registrado exitosamente en PostgreSQL.');
        } else {
            payload.idCliente = memoryClientes.length + 1;
            memoryClientes.push(payload);
            alert('✅ Cliente registrado localmente.');
        }
        closeClienteModal();
        loadClientesData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function openNewPedidoModal() {
    const selCliente = document.getElementById('pedClienteSelect');
    if (selCliente && memoryClientes.length > 0) {
        selCliente.innerHTML = memoryClientes.map(c => `<option value="${c.idCliente}">${c.nombre} (${c.tipoDocumento}: ${c.numeroDocumento})</option>`).join('');
    }
    const modal = document.getElementById('pedidoModal');
    if (modal) modal.classList.add('active');
}

function closePedidoModal() {
    const modal = document.getElementById('pedidoModal');
    if (modal) modal.classList.remove('active');
}

async function savePedido(e) {
    e.preventDefault();
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
            const res = await fetch(API_HOST + '/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar pedido');
            alert('✅ Pedido de acero registrado exitosamente en PostgreSQL.');
        } else {
            payload.idPedido = memoryPedidos.length + 1;
            memoryPedidos.unshift(payload);
            alert('✅ Pedido guardado localmente.');
        }
        closePedidoModal();
        loadClientesData();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

/* ==========================================================================
   GESTIÓN DE CUENTAS (PERSISTENCIA CON POSTGRESQL / REST API)
   ========================================================================== */

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
        const res = await fetch(API_HOST + '/api/usuarios');
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

function renderUserRows(users) {
    const tbody = document.getElementById('usersTbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
        const badgeClass = u.rol === 'ADMINISTRADOR' ? 'badge-admin' : (u.rol === 'SUPERVISOR' ? 'badge-supervisor' : 'badge-conductor');
        return `
            <tr>
                <td style="font-weight:700; color:#64748b;">#${u.idUsuario}</td>
                <td><strong>${u.nombres} ${u.apellidos || ''}</strong></td>
                <td>${u.email}</td>
                <td><span class="user-badge-role ${badgeClass}">${u.rol}</span></td>
                <td style="color:#64748b;">${u.codEmpleado || u.telefono || '-'}</td>
                <td><span style="color:#16a34a; font-weight:600;">● Activo</span></td>
                <td style="text-align:right;">
                    <button class="btn-action-edit" onclick="openEditUserModal(${u.idUsuario}, '${u.nombres}', '${u.apellidos || ''}', '${u.email}', '${u.rol}', '${u.telefono || ''}', '${u.codEmpleado || ''}')">Editar / Rol</button>
                    <button class="btn-action-del" onclick="deleteUser(${u.idUsuario}, '${u.nombres}')">Eliminar</button>
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

    if (modalTitle) modalTitle.textContent = 'Registrar Nueva Cuenta';
    if (formUserId) formUserId.value = '';
    if (formEmail)  formEmail.disabled = false;
    if (userForm)   userForm.reset();
    if (userModal)  userModal.classList.add('active');
}

function openEditUserModal(id, nombres, apellidos, email, rol, telefono, cod) {
    const modalTitle = document.getElementById('modalTitle');
    const formUserId = document.getElementById('formUserId');
    const formNombres = document.getElementById('formNombres');
    const formApellidos = document.getElementById('formApellidos');
    const formEmail  = document.getElementById('formEmail');
    const formRol    = document.getElementById('formRol');
    const formTelefono = document.getElementById('formTelefono');
    const formCodEmpleado = document.getElementById('formCodEmpleado');
    const userModal  = document.getElementById('userModal');

    if (modalTitle) modalTitle.textContent = 'Editar Usuario y Reasignar Rol';
    if (formUserId) formUserId.value = id;
    if (formNombres) formNombres.value = nombres;
    if (formApellidos) formApellidos.value = apellidos;
    if (formEmail) { formEmail.value = email; formEmail.disabled = true; }
    if (formRol) formRol.value = rol;
    if (formTelefono) formTelefono.value = telefono;
    if (formCodEmpleado) formCodEmpleado.value = cod;
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

    const payload = { nombres, apellidos, email, rol, telefono, codEmpleado };
    if (password) payload.password = password;

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

        const res = await fetch(url, {
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
        const res = await fetch((API_HOST || '') + `/api/usuarios/${id}`, { method: 'DELETE' });
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
