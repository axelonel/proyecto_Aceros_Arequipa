# 🚚 Guía de Explicación del Proyecto: Sistema de Ruteo Aceros Arequipa
*Preparado para exposición y presentación técnica/académica*

---

## 🎯 1. Visión General del Proyecto (Para Iniciar la Presentación)

> *"Este proyecto es un sistema integral de gestión logística y optimización de rutas de transporte para Corporación Aceros Arequipa. Permite administrar vehículos pesados, flotas de distribución, conductores, clientes comerciales y pedidos de acero, calculando además rutas eficientes de entrega."*

### Arquitectura en 3 Capas (Modelo - Vista - Controlador):
1. **Frontend (Capa de Presentación):** HTML5, CSS3 y JavaScript interactivo (asíncrono con `fetch`).
2. **Backend (Capa de Lógica y Servicios):** Java con **Spring Boot**, exponiendo una API REST segura.
3. **Base de Datos (Capa de Persistencia):** **PostgreSQL** relacional con 9 tablas conectadas mediante Spring Data JPA.

---

## 📁 2. Estructura de la Raíz del Proyecto

| Carpeta / Archivo | ¿Qué es de forma sencilla? | ¿Cómo explicarlo en la exposición? |
| :--- | :--- | :--- |
| `pom.xml` | **El archivo de configuración principal de Maven**. | *"Aquí se declaran todas las librerías y tecnologías que usa el sistema: Spring Boot, PostgreSQL Driver, Spring Security, Lombok y Google OR-Tools para optimización."* |
| `mvnw` y `mvnw.cmd` | **Maven Wrapper** (ejecutable de Maven). | *"Son scripts para compilar y ejecutar el proyecto en cualquier computadora sin necesidad de instalar Maven manualmente."* |
| `src/` | **Código fuente**. | *"Aquí está todo el código desarrollado, tanto el backend en Java como las vistas web y scripts de base de datos."* |

---

## ☕ 3. Backend: `src/main/java/com/example/demo`

Es el cerebro del sistema. Sigue el patrón modular de capas de Spring Boot:

### 🌟 Archivo Central
- **`DemoApplication.java`**:
  - **Explicación:** Es la clase principal con el método `main`.
  - **En la presentación:** *"Es el punto de arranque del servidor. Al ejecutar esta clase, Spring Boot levanta el servidor web Tomcat y conecta la base de datos."*

---

### 📂 Carpeta `config/` (Configuraciones del Sistema)
Contiene las reglas de seguridad e inicio automático del sistema.

- **`SecurityConfig.java`**:
  - **Explicación:** Define las políticas de seguridad y CORS (Cross-Origin Resource Sharing).
  - **En la presentación:** *"Permite la comunicación abierta y fluida entre las vistas web y la API REST sin bloqueos indebidos de peticiones."*
- **`DataInitializer.java`**:
  - **Explicación:** Semillero de datos iniciales (`CommandLineRunner`).
  - **En la presentación:** *"Al iniciar el sistema por primera vez, este archivo detecta si la base de datos está vacía e inserta automáticamente datos reales de prueba: flotas, camiones de marcas como Volvo y Scania, clientes ferreteros, pedidos y conductores."*

---

### 📂 Carpeta `controller/` (Controladores REST - Las Puertas de Entrada)
Son los encargados de recibir las peticiones web (HTTP GET, POST, PUT, DELETE) desde el navegador y devolver respuestas en formato JSON.

- **`UsuarioController.java`**:
  - **Explicación:** Gestiona el registro, autenticación, listado, edición y eliminación de usuarios (roles: Administrador, Logística, Conductor).
  - **Detalle clave:** *"Si se crea un usuario con rol Conductor, automáticamente lo sincroniza en el módulo de transportistas."*
- **`LogisticaController.java`**:
  - **Explicación:** Es el controlador principal de operaciones logísticas.
  - **En la presentación:** *"Tiene los endpoints para consultar y registrar las 8 entidades restantes: flotas, camiones con su capacidad de carga, clientes, pedidos de acero, asignaciones y guardado de rutas optimizadas."*

---

### 📂 Carpeta `dto/` (Data Transfer Objects)
- **`UsuarioDto.java`**:
  - **Explicación:** Objeto de transferencia de datos.
  - **En la presentación:** *"Se usa para enviar y recibir datos limpios de los formularios de registro y actualización de usuarios entre el frontend y el backend."*

---

### 📂 Carpeta `model/` (Entidades de la Base de Datos - JPA)
Representan las **tablas de PostgreSQL** convertidas en clases de Java mediante Hibernate/JPA:

| Archivo | Tabla en BD | ¿Qué representa en el negocio? |
| :--- | :--- | :--- |
| `Usuario.java` | `usuarios` | Cuentas de acceso con correo, contraseña cifrada y rol. |
| `Flota.java` | `flota` | Agrupaciones de transporte (ej. Flota Lima Centro, Distribución Pesada). |
| `Vehiculo.java` | `vehiculos` | Camiones y plataformas con placa, marca (Volvo, Scania, etc.) y capacidad de carga en toneladas. |
| `Transportista.java` | `transportistas` | Conductores con licencia, brevete y estado de disponibilidad. |
| `Cliente.java` | `clientes` | Empresas receptoras (Ferreterías, Constructoras, Mineras) con RUC y dirección. |
| `Pedido.java` | `pedidos` | Órdenes de acero (varillas corrugadas, alambrón, perfiles) con peso en kg y prioridad. |
| `AsignacionConduccion.java` | `asignaciones_conduccion` | Relación directa entre un conductor y el vehículo asignado para su turno. |
| `Ruta.java` | `rutas` | Ruta global con origen, destino y fecha programada. |
| `RutaOptimizada.java` | `rutas_optimizadas` | Paradas calculadas con orden de visita, tiempo estimado y distancia recorrida. |

---

### 📂 Carpeta `repository/` (Capa de Acceso a Datos)
Interfaces que extienden `JpaRepository`.
- Contiene: `UsuarioRepository`, `ClienteRepository`, `FlotaRepository`, `VehiculoRepository`, `TransportistaRepository`, `PedidoRepository`, `RutaRepository`, `RutaOptimizadaRepository` y `AsignacionConduccionRepository`.
- **En la presentación:** *"Gracias a Spring Data JPA, no necesitamos escribir sentencias SQL manuales repetitivas. Estas interfaces nos dan automáticamente métodos listos para usar como `.findAll()`, `.findById()` y `.save()`."*

---

## ⚙️ 4. Recursos y Configuración: `src/main/resources`

- **`application.properties`**:
  - **Explicación:** Archivo de configuración general.
  - **En la presentación:** *"Aquí se definen las credenciales y el puerto de conexión a PostgreSQL (puerto 5433, base de datos `Aceros_Arequipa`), y se activa la sincronización automática de esquemas con Hibernate."*
- **`schema.sql`**:
  - **Explicación:** Script DDL de base de datos.
  - **En la presentación:** *"Contiene la estructura formal de creación de tablas, llaves primarias, llaves foráneas e índices relacionales en PostgreSQL."*

---

## 🖥️ 5. Frontend Web: `src/main/resources/static`

Es la interfaz gráfica que ve el usuario final en su navegador.

### Archivos Principales
- **`index.html`**:
  - **Explicación:** Pantalla de bienvenida, inicio de sesión (Login) y registro de nuevos usuarios.
- **`dashboard.html`**:
  - **Explicación:** Panel principal del sistema (Single Page Application - SPA). Contiene la barra lateral de navegación (Sidebar), el área de contenido dinámico y las ventanas modales para registrar nuevos camiones, flotas, clientes y pedidos.
- **`css/styles.css`**:
  - **Explicación:** Hoja de estilos con la identidad corporativa de Aceros Arequipa (colores azul institucional, amarillo/dorado, tipografías modernas, tablas responsivas y animaciones).
- **`js/dashboard.js`**:
  - **Explicación:** El motor JavaScript del cliente.
  - **En la presentación:** *"Controla la navegación entre módulos sin recargar la página, realiza peticiones asíncronas (`fetch`) al backend para cargar datos en tiempo real de PostgreSQL, y envía los formularios para guardar nuevos registros."*

---

### 📂 Carpeta `views/` (Módulos Dinámicos de la Interfaz)
Son plantillas HTML que `dashboard.js` carga dentro del panel principal según la sección elegida por el usuario:

1. **`inicio.html`**: Resumen general con métricas clave (total de camiones activos, pedidos en tránsito, rutas completadas).
2. **`flota.html`**: Gestión de Flotas y Unidades de Transporte (visualización de camiones, marcas, capacidad de carga y asignación de conductores).
3. **`clientes.html`**: Módulo de Clientes comerciales y Pedidos de acero registrados.
4. **`rutas.html`**: Monitoreo de rutas en curso y estado de las entregas.
5. **`optimizar.html`**: Módulo interactivo de cálculo y optimización de rutas eficientes.
6. **`mis-rutas.html`**: Vista especializada para conductores con sus entregas asignadas del día.
7. **`historial.html`**: Registro histórico de despachos y entregas finalizadas.
8. **`reportes.html`**: Gráficos e indicadores de rendimiento operativo y consumo.
9. **`configuracion.html`**: Panel del Administrador para gestionar roles y cuentas de usuarios del sistema.

---

## 🎤 6. Guion Recomendado para tu Presentación (Pitch de 2 minutos)

> *"Estimado profesor / jurado:
> 
> Nuestro proyecto está desarrollado bajo una arquitectura limpia y desacoplada de 3 capas.
> 
> 1. En la **base de datos**, contamos con **PostgreSQL**, modelando 9 tablas relacionales que cubren desde la flota física de camiones hasta los pedidos y rutas optimizadas.
> 2. En el **backend**, utilizamos **Spring Boot**. El flujo comienza en los **Controllers**, que reciben las solicitudes del usuario; pasan por los **Modelos** que representan las reglas del negocio, y se comunican con la base de datos a través de los **Repositories** con JPA. Además, cuenta con un inicializador que precarga datos del rubro siderúrgico para pruebas inmediatas.
> 3. En el **frontend**, implementamos una interfaz web moderna y responsiva orientada a la experiencia de usuario de Aceros Arequipa, donde a través de **JavaScript asíncrono** interactuamos con el backend en tiempo real sin recargar la página.
> 
> A continuación, procederemos a mostrar el funcionamiento en vivo..."*
