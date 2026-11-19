import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# Márgenes de 1 pulgada (formato académico/corporativo)
for section in doc.sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

COLOR_PRIMARY = RGBColor(30, 58, 138)      # #1e3a8a Azul marino
COLOR_SECONDARY = RGBColor(15, 118, 110)   # #0f766e Verde azulado
COLOR_TEXT = RGBColor(30, 41, 59)          # #1e293b Gris oscuro

def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

# Encabezado institucional
p_inst = doc.add_paragraph()
r_inst = p_inst.add_run('CORPORACIÓN ACEROS AREQUIPA S.A.\nDEPARTAMENTO DE INGENIERÍA DE SISTEMAS Y LOGÍSTICA')
r_inst.bold = True
r_inst.font.size = Pt(10)
r_inst.font.color.rgb = COLOR_SECONDARY
p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Título Principal
p_title = doc.add_paragraph()
r_title = p_title.add_run('INFORME TÉCNICO DE IMPLEMENTACIÓN:\nSISTEMA DE AUDITORÍA Y NOTIFICACIÓN POR CORREO ELECTRÓNICO (JAKARTA MAIL)')
r_title.bold = True
r_title.font.size = Pt(16)
r_title.font.color.rgb = COLOR_PRIMARY
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_after = Pt(16)

# Ficha técnica
table_meta = doc.add_table(rows=6, cols=2)
table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Proyecto:', 'Sistema Experto de Optimización y Ruteo de Flotas Logísticas'),
    ('Módulo Desarrollado:', 'Auditoría y Notificación de Descarga de Reportes Confidenciales (Excel, PDF, PPTX)'),
    ('Destinatario de Notificaciones:', 'Alex Alvaro León Condori (axel29condori@gmail.com)'),
    ('Arquitectura y Tecnologías:', 'Java 22, Spring Boot 3, Jakarta Mail 2.1, Eclipse Angus Mail 2.0'),
    ('Mecanismo de Despacho:', 'Asíncrono no bloqueante (@Async, Executor ThreadPool) sobre TLS 587'),
    ('Fecha de Finalización:', 'Noviembre 2026')
]
for idx, (label, val) in enumerate(meta_data):
    cell_lbl, cell_val = table_meta.rows[idx].cells
    set_cell_shading(cell_lbl, 'F1F5F9')
    set_cell_shading(cell_val, 'FFFFFF')
    set_cell_margins(cell_lbl, 80, 80, 120, 120)
    set_cell_margins(cell_val, 80, 80, 120, 120)
    
    p_l = cell_lbl.paragraphs[0]
    r_l = p_l.add_run(label)
    r_l.bold = True
    r_l.font.size = Pt(9.5)
    r_l.font.color.rgb = COLOR_PRIMARY
    
    p_v = cell_val.paragraphs[0]
    r_v = p_v.add_run(val)
    r_v.font.size = Pt(9.5)
    r_v.font.color.rgb = COLOR_TEXT

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Sección 1
h1 = doc.add_heading(level=1)
r_h1 = h1.add_run('1. OBJETIVO DEL REQUERIMIENTO')
r_h1.font.color.rgb = COLOR_PRIMARY

p1 = doc.add_paragraph(
    'El objetivo de esta implementación técnica es establecer un mecanismo automático, confidencial y de alta fidelidad '
    'para auditar en tiempo real la descarga y extracción de información sensible de ruteo de carga pesada en Corporación Aceros Arequipa S.A. '
    'Cada vez que un usuario con perfil de Supervisor, Planificador o Conductor genera o descarga un reporte en formato Excel (.xlsx), PDF (.pdf) '
    'o PowerPoint (.pptx), el backend dispara inmediatamente una notificación formal por correo electrónico dirigida al Administrador Principal Alex León (axel29condori@gmail.com).'
)
p1.paragraph_format.line_spacing = 1.15
p1.paragraph_format.space_after = Pt(8)

p_req = doc.add_paragraph()
r_req_t = p_req.add_run('Criterios de Ingeniería y Requisitos No Funcionales (RNF):')
r_req_t.bold = True
p_req.paragraph_format.space_after = Pt(4)

reqs = [
    ('Cero Bloqueo / Latencia Nula (@Async): ', 'El proceso de envío de correo electrónico jamás debe congelar, demorar ni bloquear el flujo de descarga del usuario. La entrega del archivo binario en streaming debe ser instantánea, mientras que el correo se despacha en un hilo de ejecución secundario en segundo plano.'),
    ('Tolerancia Total a Fallos (Fail-Safe): ', 'Si el servidor SMTP de Google presenta latencia, saturación o intermitencia de red, la excepción debe ser capturada y registrada internamente en los logs del servidor, sin propagar jamás un error HTTP 500 al cliente ni cancelar la descarga del reporte.'),
    ('Presentación Corporativa Responsiva: ', 'El correo electrónico no debe enviarse en texto plano simple. Debe presentar una estructura HTML con la paleta de colores institucional de Aceros Arequipa (#1e3a8a azul marino, #0f766e verde industrial) con tablas legibles y marcas de tiempo exactas.'),
    ('Estándares Modernos Jakarta EE: ', 'Uso estricto del namespace jakarta.mail.* propio de Spring Boot 3 y Java 22, erradicando el uso de dependencias heredadas u obsoletas (javax.mail).')
]

for title, desc in reqs:
    p_item = doc.add_paragraph(style='List Bullet')
    r_t = p_item.add_run(title)
    r_t.bold = True
    r_t.font.color.rgb = COLOR_PRIMARY
    r_d = p_item.add_run(desc)
    r_d.font.color.rgb = COLOR_TEXT
    p_item.paragraph_format.line_spacing = 1.15

# Sección 2
h2 = doc.add_heading(level=1)
r_h2 = h2.add_run('2. ARQUITECTURA DEL FLUJO ASÍNCRONO')
r_h2.font.color.rgb = COLOR_PRIMARY

p2 = doc.add_paragraph(
    'Para desacoplar el procesamiento del archivo del envío del correo electrónico, se diseñó un flujo de ejecución paralelo mediante un ThreadPool '
    'administrado por el contenedor de Spring Boot:'
)
p2.paragraph_format.line_spacing = 1.15

table_flujo = doc.add_table(rows=5, cols=3)
table_flujo.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ['Paso / Hilo', 'Componente / Capa', 'Acción Técnica Ejecutada']
for c_idx, h in enumerate(headers):
    cell = table_flujo.rows[0].cells[c_idx]
    set_cell_shading(cell, '1E3A8A')
    set_cell_margins(cell, 100, 100, 120, 120)
    p = cell.paragraphs[0]
    r = p.add_run(h)
    r.bold = True
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(255, 255, 255)

filas_flujo = [
    ('1. Hilo HTTP Principal', 'Frontend (Cliente) -> ReportController', 'El usuario solicita GET /api/reportes/excel (o /pdf, /pptx) enviando su token JWT en la cabecera Authorization.'),
    ('2. Hilo Asíncrono (@Async)', 'JakartaEmailService -> Gmail SMTP', 'ReportController delega inmediatamente la tarea notificarDescargaReporte(...) al ThreadPool secundario sin esperar respuesta.'),
    ('3. Hilo HTTP Principal', 'ReportService -> StreamingResponseBody', 'De forma simultánea, ReportService escribe los bytes directamente al OutputStream del cliente HTTP (Descarga inmediata con HTTP 200).'),
    ('4. Notificación Final', 'Gmail SMTP -> axel29condori@gmail.com', 'El hilo secundario autentica la sesión TLS 587 con la Contraseña de Aplicación y deposita el correo HTML en la bandeja del administrador.')
]

for r_idx, fila in enumerate(filas_flujo, start=1):
    bg_color = 'F8FAFC' if r_idx % 2 == 1 else 'FFFFFF'
    for c_idx, txt in enumerate(fila):
        cell = table_flujo.rows[r_idx].cells[c_idx]
        set_cell_shading(cell, bg_color)
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(txt)
        r.font.size = Pt(9)
        r.font.color.rgb = COLOR_TEXT

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Sección 3
h3 = doc.add_heading(level=1)
r_h3 = h3.add_run('3. PASO A PASO DETALLADO DE LA IMPLEMENTACIÓN')
r_h3.font.color.rgb = COLOR_PRIMARY

steps = [
    ('Paso 1: Configuración de Dependencias en pom.xml',
     'En el archivo descriptor de construcción Maven (pom.xml), se añadieron los artefactos oficiales de Jakarta Mail API 2.1.3 y su motor de implementación Angus Mail 2.0.3, garantizando total compatibilidad con Java 22 y Spring Boot 3 sin colisiones con librerías legadas.',
     '<dependency>\n    <groupId>jakarta.mail</groupId>\n    <artifactId>jakarta.mail-api</artifactId>\n    <version>2.1.3</version>\n</dependency>\n<dependency>\n    <groupId>org.eclipse.angus</groupId>\n    <artifactId>angus-mail</artifactId>\n    <version>2.0.3</version>\n</dependency>'),

    ('Paso 2: Parámetros del Servidor en application.properties',
     'Se centralizaron las variables de conexión SMTP hacia Google (smtp.gmail.com) bajo el puerto 587 con protocolo STARTTLS. Se configuró el destinatario principal Alex León (axel29condori@gmail.com) y se asignó la Contraseña de Aplicación de 16 caracteres generada bajo autenticación en dos pasos.',
     '# CONFIGURACIÓN DE AUDITORÍA Y CORREO (JAKARTA MAIL)\napp.mail.admin-email=axel29condori@gmail.com\napp.mail.admin-nombre=Alex Alvaro Leon Condori\napp.mail.host=smtp.gmail.com\napp.mail.port=587\napp.mail.username=axel29condori@gmail.com\napp.mail.password=shmi bonl yhix gpum'),

    ('Paso 3: Activación del Soporte Asíncrono en DemoApplication.java',
     'Para que las anotaciones @Async surtan efecto en el ciclo de vida del contenedor de Spring, se habilitó el escaneo asíncrono decorando la clase principal con @EnableAsync.',
     '@SpringBootApplication\n@EnableAsync // Habilita la delegación de tareas en segundo plano\npublic class DemoApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(DemoApplication.class, args);\n    }\n}'),

    ('Paso 4: Construcción del Servicio JakartaEmailService.java',
     'Se desarrolló el componente JakartaEmailService en com.example.demo.service. Este servicio construye una sesión Session autenticada mediante un Authenticator nativo, limpia posibles espacios en blanco en la contraseña, fuerza el protocolo seguro TLSv1.2, inyecta la plantilla HTML corporativa con datos dinámicos y envía el mensaje MimeMessage mediante Transport.send.',
     '@Service\npublic class JakartaEmailService {\n    @Async\n    public void notificarDescargaReporte(String usuarioDescarga, String formato, String filtros) {\n        try {\n            final String cleanPassword = remitentePassword.replace(" ", "");\n            Properties props = new Properties();\n            props.put("mail.smtp.auth", "true");\n            props.put("mail.smtp.starttls.enable", "true");\n            props.put("mail.smtp.host", smtpHost);\n            props.put("mail.smtp.port", smtpPort);\n            props.put("mail.smtp.ssl.protocols", "TLSv1.2");\n\n            Session session = Session.getInstance(props, new Authenticator() {\n                protected PasswordAuthentication getPasswordAuthentication() {\n                    return new PasswordAuthentication(remitenteEmail, cleanPassword);\n                }\n            });\n\n            Message message = new MimeMessage(session);\n            message.setFrom(new InternetAddress(remitenteEmail, "Sistema Logístico Aceros Arequipa"));\n            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(adminEmail));\n            message.setSubject("🚨 [Auditoría] Descarga de Reporte " + formato.toUpperCase() + " - Aceros Arequipa");\n            message.setContent(htmlBody, "text/html; charset=UTF-8");\n\n            Transport.send(message);\n        } catch (Exception e) {\n            log.error("Fallo al enviar correo pero la descarga continúa: {}", e.getMessage());\n        }\n    }\n}'),

    ('Paso 5: Intercepción en ReportController.java para Descargas',
     'En el controlador ReportController, se inyectó JakartaEmailService y se invocó el método notificarDescargaReporte(...) en cada uno de los endpoints de descarga (/excel, /pdf y /pptx). El controlador extrae el usuario autenticado del objeto Authentication de Spring Security y captura los parámetros de fecha y estado aplicados en la consulta.',
     '@GetMapping("/excel")\npublic ResponseEntity<StreamingResponseBody> descargarReporteExcel(\n        @RequestParam(required = false) LocalDate fechaInicio,\n        @RequestParam(required = false) LocalDate fechaFin,\n        @RequestParam(required = false) String estado,\n        Authentication auth) {\n\n    String usuario = (auth != null) ? auth.getName() : "Usuario Logística";\n    String filtros = String.format("Rango: %s a %s | Estado: %s", fechaInicio, fechaFin, estado);\n    \n    // Disparo asíncrono al hilo secundario:\n    emailService.notificarDescargaReporte(usuario, "Excel (.xlsx)", filtros);\n\n    return ResponseEntity.ok()\n        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Reporte.xlsx")\n        .body(stream);\n}')
]

for st_title, st_desc, st_code in steps:
    p_st = doc.add_paragraph()
    r_st_t = p_st.add_run(st_title)
    r_st_t.bold = True
    r_st_t.font.size = Pt(11)
    r_st_t.font.color.rgb = COLOR_SECONDARY
    p_st.paragraph_format.space_before = Pt(8)
    p_st.paragraph_format.space_after = Pt(4)
    
    p_d = doc.add_paragraph(st_desc)
    p_d.paragraph_format.line_spacing = 1.15
    p_d.paragraph_format.space_after = Pt(4)
    
    table_code = doc.add_table(rows=1, cols=1)
    table_code.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_code = table_code.rows[0].cells[0]
    set_cell_shading(c_code, 'F1F5F9')
    set_cell_margins(c_code, 80, 80, 100, 100)
    p_c = c_code.paragraphs[0]
    r_c = p_c.add_run(st_code)
    r_c.font.name = 'Consolas'
    r_c.font.size = Pt(8.5)
    r_c.font.color.rgb = RGBColor(15, 23, 42)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

# Sección 4
h4 = doc.add_heading(level=1)
r_h4 = h4.add_run('4. RESULTADO DE COMPILACIÓN Y VALIDACIÓN')
r_h4.font.color.rgb = COLOR_PRIMARY

p4 = doc.add_paragraph(
    'Para garantizar la estabilidad y consistencia de todo el proyecto, se ejecutó una compilación completa del código fuente con Maven:'
)
p4.paragraph_format.line_spacing = 1.15

table_val = doc.add_table(rows=1, cols=1)
table_val.alignment = WD_TABLE_ALIGNMENT.CENTER
c_val = table_val.rows[0].cells[0]
set_cell_shading(c_val, '0F172A')
set_cell_margins(c_val, 100, 100, 120, 120)
p_v = c_val.paragraphs[0]
r_v = p_v.add_run('[INFO] Scanning for projects...\n'
                  '[INFO] --------------------------< com.example:demo >--------------------------\n'
                  '[INFO] Building  0.0.1-SNAPSHOT\n'
                  '[INFO] --- resources:3.5.0:resources (default-resources) @ demo ---\n'
                  '[INFO] Copying 16 resources from src/main/resources to target/classes\n'
                  '[INFO] --- compiler:3.15.0:compile (default-compile) @ demo ---\n'
                  '[INFO] Compiling 37 source files with javac [debug parameters release 22] to target/classes\n'
                  '[INFO] ------------------------------------------------------------------------\n'
                  '[INFO] BUILD SUCCESS\n'
                  '[INFO] ------------------------------------------------------------------------\n'
                  '[INFO] Total time:  7.999 s\n'
                  '[INFO] Finished at: 2026-11-18T11:42:17-05:00')
r_v.font.name = 'Consolas'
r_v.font.size = Pt(8.5)
r_v.font.color.rgb = RGBColor(34, 197, 94)

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Sección 5
h5 = doc.add_heading(level=1)
r_h5 = h5.add_run('5. IMPACTO EN LA AUDITORÍA Y EVALUACIÓN DEL CURSO')
r_h5.font.color.rgb = COLOR_PRIMARY

p5 = doc.add_paragraph(
    'Esta solución técnica aporta un valor diferencial de alto impacto ante el jurado evaluador del Curso Integrador I (UTP):\n'
    '1. Sustento del Requisito No Funcional RNF005 (Seguridad y Trazabilidad): El sistema no solo genera reportes, sino que audita quién accede a la información estratégica de la empresa.\n'
    '2. Demostración de Programación Asíncrona: Refleja un dominio avanzado del framework Spring Boot al no bloquear el hilo de ejecución HTTP principal.\n'
    '3. Profesionalismo de Entrega: Proporciona a la gerencia de logística y al administrador Alex León una herramienta con formato corporativo real y alertas automáticas.'
)
p5.paragraph_format.line_spacing = 1.15

# Guardar documento final en Word
docx_path = r'c:\Users\Usuario\Downloads\ruteo_de_Aceros_Arequipa\INFORME_IMPLEMENTACION_CORREO_AUDITORIA_ALEX_LEON.docx'
doc.save(docx_path)
print(f'Documento Word generado exitosamente: {docx_path}')
