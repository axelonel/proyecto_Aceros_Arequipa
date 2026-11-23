package com.example.demo.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Properties;

@Service
public class JakartaEmailService {

    private static final Logger log = LoggerFactory.getLogger(JakartaEmailService.class);

    @Value("${app.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${app.mail.port:465}")
    private String smtpPort;

    @Value("${app.mail.username:axel29condori@gmail.com}")
    private String remitenteEmail;

    @Value("${app.mail.password:shmi bonl yhix gpum}")
    private String remitentePassword;

    @Value("${app.mail.admin-email:axel29condori@gmail.com}")
    private String adminEmail;

    @Value("${app.mail.admin-nombre:Alex Alvaro Leon Condori}")
    private String adminNombre;

    /**
     * Envía un correo HTML en segundo plano al Administrador Alex León notificando la descarga.
     * Al ser @Async y capturar excepciones dentro del método, NUNCA interrumpe ni bloquea
     * el flujo de descarga de los usuarios.
     */
    @Async
    public void notificarDescargaReporte(String usuarioDescarga, String formato, String filtros) {
        try {
            // Eliminar posibles espacios en blanco de la contraseña de aplicación de Google
            final String cleanPassword = remitentePassword != null ? remitentePassword.replace(" ", "") : "";

            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.host", smtpHost);
            props.put("mail.smtp.port", smtpPort);

            if ("465".equals(smtpPort)) {
                props.put("mail.smtp.ssl.enable", "true");
                props.put("mail.smtp.socketFactory.port", smtpPort);
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
            }
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");

            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(remitenteEmail, cleanPassword);
                }
            });

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(remitenteEmail, "Sistema Logístico Aceros Arequipa"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(adminEmail));
            message.setSubject("🚨 [Auditoría] Descarga de Reporte " + formato.toUpperCase() + " - Aceros Arequipa");

            String fechaHora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #1e3a8a; padding: 22px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">CORPORACIÓN ACEROS AREQUIPA S.A.</h2>
                        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Alerta de Auditoría y Control de Descargas</p>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #1e293b;">
                        <p style="font-size: 15px; margin-top: 0;">Estimado Administrador <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.5; color: #475569;">
                            Se le notifica que se acaba de descargar un reporte oficial desde el <strong>Sistema Experto de Optimización de Rutas</strong>:
                        </p>
                        
                        <table style="width: 100%%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b; width: 40%%;">Formato Generado:</td>
                                <td style="padding: 10px; color: #0f172a; font-weight: bold;">Reporte %s</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b;">Usuario Ejecutor:</td>
                                <td style="padding: 10px; color: #0f172a;">%s</td>
                            </tr>
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 10px; font-weight: bold; color: #64748b;">Filtros de Búsqueda:</td>
                                <td style="padding: 10px; color: #0f172a;">%s</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #64748b;">Fecha y Hora Exacta:</td>
                                <td style="padding: 10px; color: #0f172a;">%s</td>
                            </tr>
                        </table>
                        
                        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; font-size: 12px; color: #166534; border-radius: 4px;">
                            ✔ Evento registrado satisfactoriamente en los registros de seguridad y auditoría del sistema.
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        Este es un mensaje automático de seguridad dirigido a: <strong>%s</strong>.<br>
                        © 2026 Corporación Aceros Arequipa S.A. | Departamento de Ingeniería de Sistemas y Logística
                    </div>
                </div>
                """, adminNombre, formato.toUpperCase(), usuarioDescarga, filtros, fechaHora, adminEmail);

            message.setContent(htmlBody, "text/html; charset=UTF-8");

            Transport.send(message);
            log.info("Notificación enviada con éxito a Alex León ({}) sobre la descarga de reporte {}", adminEmail, formato);

        } catch (Exception e) {
            log.error("Aviso: No se pudo enviar el correo de notificación pero la descarga continúa normalmente: {}", e.getMessage());
        }
    }

    /**
     * Envía un correo con código de verificación de 6 dígitos para restablecer contraseña
     * tipo Google / Facebook. Se envía al correo del usuario y con copia BCC a Alex León.
     */
    public boolean enviarCodigoRecuperacion(String destinatarioEmail, String nombreUsuario, String codigoVerificacion) {
        try {
            final String cleanPassword = remitentePassword != null ? remitentePassword.replace(" ", "") : "";

            Properties props = new Properties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.host", smtpHost);
            props.put("mail.smtp.port", smtpPort);

            if ("465".equals(smtpPort)) {
                props.put("mail.smtp.ssl.enable", "true");
                props.put("mail.smtp.socketFactory.port", smtpPort);
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
            }
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
            props.put("mail.smtp.connectiontimeout", "10000");
            props.put("mail.smtp.timeout", "10000");

            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(remitenteEmail, cleanPassword);
                }
            });

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(remitenteEmail, "Seguridad Aceros Arequipa"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatarioEmail));
            
            // Si el correo del usuario no es el del admin, agregar BCC al admin para respaldo y control
            if (adminEmail != null && !adminEmail.equalsIgnoreCase(destinatarioEmail)) {
                message.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(adminEmail));
            }

            message.setSubject("🔐 [" + codigoVerificacion + "] Código de Recuperación de Contraseña - Aceros Arequipa");

            String fechaHora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));

            String htmlBody = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);">
                    <div style="background-color: #1e3a8a; padding: 25px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 21px; letter-spacing: 0.5px;">CORPORACIÓN ACEROS AREQUIPA S.A.</h2>
                        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Seguridad y Recuperación de Cuentas</p>
                    </div>
                    <div style="padding: 28px; background-color: #ffffff; color: #1e293b;">
                        <p style="font-size: 16px; margin-top: 0;">Estimado(a) <strong>%s</strong>,</p>
                        <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                            Hemos recibido una solicitud para restablecer la contraseña de acceso de tu cuenta en el <strong>Sistema Experto de Optimización de Rutas</strong>.
                        </p>
                        
                        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">
                            Usa el siguiente código de verificación de 6 dígitos para continuar:
                        </p>

                        <div style="background: #eff6ff; border: 2px dashed #2563eb; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1e3a8a; font-family: 'Courier New', Courier, monospace;">%s</span>
                        </div>

                        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                            ⏱️ <strong>Validez:</strong> Este código expira en <strong>15 minutos</strong>.<br>
                            🛡️ <strong>Seguridad:</strong> Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña actual no será modificada.
                        </p>
                        
                        <div style="margin-top: 20px; padding: 10px 14px; background-color: #f8fafc; border-left: 4px solid #0284c7; font-size: 12px; color: #0369a1; border-radius: 4px;">
                            ℹ️ Fecha de solicitud: %s | Destinatario: %s
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        Este es un mensaje automático de seguridad generado por el Sistema Logístico.<br>
                        © 2026 Corporación Aceros Arequipa S.A. | Todos los derechos reservados.
                    </div>
                </div>
                """, nombreUsuario, codigoVerificacion, fechaHora, destinatarioEmail);

            message.setContent(htmlBody, "text/html; charset=UTF-8");

            Transport.send(message);
            log.info("Código de recuperación [{}] enviado satisfactoriamente a {}", codigoVerificacion, destinatarioEmail);
            return true;
        } catch (Exception e) {
            log.error("Error al enviar código de recuperación por correo a {}: {}", destinatarioEmail, e.getMessage(), e);
            return false;
        }
    }
}