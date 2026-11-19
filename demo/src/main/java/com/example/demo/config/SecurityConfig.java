package com.example.demo.config;

import com.example.demo.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(List.of(
                    "http://localhost:[*]",
                    "http://127.0.0.1:[*]",
                    "https://*.supabase.co",
                    "https://*.supabase.in"
                ));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Cache-Control"));
                config.setAllowCredentials(true);
                return config;
            }))
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                // Anti-MIME-Sniffing (OWASP ZAP: Falta encabezado X-Content-Type-Options)
                .contentTypeOptions(contentType -> {})
                // Anti-Clickjacking
                .frameOptions(frame -> frame.sameOrigin())
                // HSTS (OWASP ZAP: Strict-Transport-Security Header No Establecido)
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                // Content Security Policy (OWASP ZAP: Cabecera CSP no configurada)
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
                        "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
                        "img-src 'self' data: https://*.tile.openstreetmap.org https://unpkg.com; " +
                        "font-src 'self' data:; " +
                        "connect-src 'self' http://localhost:* ws://localhost:* https://*.supabase.co wss://*.supabase.co; " +
                        "frame-ancestors 'self';")
                )
            )
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas — login, interfaz web y métricas básicas
                .requestMatchers(
                    "/", "/index.html", "/dashboard.html",
                    "/css/**", "/js/**", "/images/**", "/views/**",
                    "/error", "/favicon.ico", "/actuator/health", "/actuator/info"
                ).permitAll()
                // Autenticación y reportes públicos para streaming
                .requestMatchers("/api/auth/**", "/api/reportes/**").permitAll()
                // Gestión de usuarios restringida a administradores
                .requestMatchers("/api/usuarios/**").hasAnyRole("ADMINISTRADOR", "ADMIN")
                // Todo lo demás requiere autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
