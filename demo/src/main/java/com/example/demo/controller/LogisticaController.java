package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LogisticaController {

    private final ClienteRepository clienteRepository;
    private final FlotaRepository flotaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TransportistaRepository transportistaRepository;
    private final AsignacionConduccionRepository asignacionRepository;
    private final PedidoRepository pedidoRepository;
    private final RutaRepository rutaRepository;
    private final RutaOptimizadaRepository rutaOptimizadaRepository;

    public LogisticaController(ClienteRepository clienteRepository,
                               FlotaRepository flotaRepository,
                               VehiculoRepository vehiculoRepository,
                               TransportistaRepository transportistaRepository,
                               AsignacionConduccionRepository asignacionRepository,
                               PedidoRepository pedidoRepository,
                               RutaRepository rutaRepository,
                               RutaOptimizadaRepository rutaOptimizadaRepository) {
        this.clienteRepository = clienteRepository;
        this.flotaRepository = flotaRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.transportistaRepository = transportistaRepository;
        this.asignacionRepository = asignacionRepository;
        this.pedidoRepository = pedidoRepository;
        this.rutaRepository = rutaRepository;
        this.rutaOptimizadaRepository = rutaOptimizadaRepository;
    }

    // ==========================================
    // 1. CLIENTES
    // ==========================================
    @GetMapping("/clientes")
    public ResponseEntity<List<Cliente>> listarClientes() {
        return ResponseEntity.ok(clienteRepository.findAll());
    }

    @PostMapping("/clientes")
    public ResponseEntity<?> crearCliente(@RequestBody Cliente cliente) {
        if (cliente.getNombre() == null || cliente.getNumeroDocumento() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre y número de documento son obligatorios."));
        }
        if (clienteRepository.existsByNumeroDocumento(cliente.getNumeroDocumento())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "El documento ya está registrado."));
        }
        Cliente guardado = clienteRepository.save(cliente);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // ==========================================
    // 2. FLOTAS
    // ==========================================
    @GetMapping("/flotas")
    public ResponseEntity<List<Flota>> listarFlotas() {
        return ResponseEntity.ok(flotaRepository.findAll());
    }

    @PostMapping("/flotas")
    public ResponseEntity<?> crearFlota(@RequestBody Flota flota) {
        if (flota.getNombreFlota() == null || flota.getNombreFlota().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de la flota es obligatorio."));
        }
        Flota guardada = flotaRepository.save(flota);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
    }

    // ==========================================
    // 3. VEHÍCULOS (Marcas, Modelos, Peso Max)
    // ==========================================
    @GetMapping("/vehiculos")
    public ResponseEntity<List<Vehiculo>> listarVehiculos() {
        return ResponseEntity.ok(vehiculoRepository.findAll());
    }

    @PostMapping("/vehiculos")
    public ResponseEntity<?> crearVehiculo(@RequestBody Vehiculo v) {
        if (v.getPlaca() == null || v.getCapacidadMaxTon() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "La placa y capacidad máxima en toneladas son obligatorias."));
        }
        if (vehiculoRepository.existsByPlaca(v.getPlaca())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "La placa ya existe en el sistema."));
        }
        Vehiculo guardado = vehiculoRepository.save(v);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // ==========================================
    // 4. TRANSPORTISTAS
    // ==========================================
    @GetMapping("/transportistas")
    public ResponseEntity<List<Transportista>> listarTransportistas() {
        return ResponseEntity.ok(transportistaRepository.findAll());
    }

    @PostMapping("/transportistas")
    public ResponseEntity<?> crearTransportista(@RequestBody Transportista t) {
        if (t.getNombres() == null || t.getDni() == null || t.getLicenciaConducir() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombres, DNI y Licencia de conducir son obligatorios."));
        }
        if (transportistaRepository.existsByDni(t.getDni())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "El DNI ya se encuentra registrado."));
        }
        Transportista guardado = transportistaRepository.save(t);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // ==========================================
    // 5. PEDIDOS
    // ==========================================
    @GetMapping("/pedidos")
    public ResponseEntity<List<Map<String, Object>>> listarPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Pedido p : pedidos) {
            Map<String, Object> map = new HashMap<>();
            map.put("idPedido", p.getIdPedido());
            map.put("tipoMaterial", p.getTipoMaterial());
            map.put("pesoT", p.getPesoT());
            map.put("volumenM3", p.getVolumenM3());
            map.put("direccionDestino", p.getDireccionDestino());
            map.put("prioridad", p.getPrioridad());
            map.put("objetivoOptimizacion", p.getObjetivoOptimizacion());
            map.put("estadoPedido", p.getEstadoPedido());
            map.put("fechaEmision", p.getFechaEmision());

            clienteRepository.findById(p.getIdCliente()).ifPresent(cli -> {
                map.put("clienteNombre", cli.getNombre());
                map.put("clienteRuc", cli.getNumeroDocumento());
            });

            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/pedidos")
    public ResponseEntity<?> crearPedido(@RequestBody Pedido p) {
        if (p.getTipoMaterial() == null || p.getPesoT() == null || p.getDireccionDestino() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tipo de material, peso en toneladas y destino son obligatorios."));
        }
        if (p.getIdCliente() == null) {
            // Asignar primer cliente por defecto si no viene especificado
            clienteRepository.findAll().stream().findFirst().ifPresent(c -> p.setIdCliente(c.getIdCliente()));
        }
        if (p.getIdUsuarioGestor() == null) {
            p.setIdUsuarioGestor(1L);
        }
        Pedido guardado = pedidoRepository.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // ==========================================
    // 6. ASIGNACIONES DE CONDUCCIÓN
    // ==========================================
    @GetMapping("/asignaciones")
    public ResponseEntity<List<Map<String, Object>>> listarAsignaciones() {
        List<AsignacionConduccion> asignaciones = asignacionRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (AsignacionConduccion a : asignaciones) {
            Map<String, Object> map = new HashMap<>();
            map.put("idAsignacion", a.getIdAsignacion());
            map.put("idVehiculo", a.getIdVehiculo());
            map.put("idTransportista", a.getIdTransportista());
            map.put("fechaInicio", a.getFechaInicio());
            map.put("fechaFin", a.getFechaFin());
            map.put("estado", a.getEstado());

            vehiculoRepository.findById(a.getIdVehiculo()).ifPresent(v -> {
                map.put("vehiculoPlaca", v.getPlaca());
                map.put("vehiculoTipo", v.getTipoCamion());
                map.put("vehiculoModelo", v.getModelo());
                map.put("capacidadMaxTon", v.getCapacidadMaxTon());
            });

            transportistaRepository.findById(a.getIdTransportista()).ifPresent(t -> {
                map.put("conductorNombre", t.getNombres() + " " + t.getApellidos());
                map.put("conductorDni", t.getDni());
                map.put("conductorLicencia", t.getLicenciaConducir());
            });

            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/asignaciones")
    public ResponseEntity<?> crearAsignacion(@RequestBody Map<String, Object> body) {
        try {
            Long idVehiculo = Long.valueOf(body.get("idVehiculo").toString());
            Long idTransportista = Long.valueOf(body.get("idTransportista").toString());

            AsignacionConduccion asignacion = new AsignacionConduccion(
                null, idVehiculo, idTransportista, LocalDateTime.now(), null, "ACTIVA"
            );

            AsignacionConduccion guardada = asignacionRepository.save(asignacion);

            // Actualizar estado del vehículo a EN_RUTA
            vehiculoRepository.findById(idVehiculo).ifPresent(v -> {
                v.setEstadoOperativo("EN_RUTA");
                vehiculoRepository.save(v);
            });

            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error al crear la asignación: " + ex.getMessage()));
        }
    }

    @PutMapping("/asignaciones/{id}/completar")
    public ResponseEntity<?> completarAsignacion(@PathVariable Long id) {
        return asignacionRepository.findById(id).map(a -> {
            a.setEstado("FINALIZADA");
            a.setFechaFin(LocalDateTime.now());
            asignacionRepository.save(a);

            // Liberar el vehículo
            vehiculoRepository.findById(a.getIdVehiculo()).ifPresent(v -> {
                v.setEstadoOperativo("DISPONIBLE");
                vehiculoRepository.save(v);
            });

            return ResponseEntity.ok(Map.of("message", "Asignación completada y vehículo liberado exitosamente."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // 7. REGISTRO DE RUTAS OPTIMIZADAS
    // ==========================================
    @PostMapping("/rutas/guardar-optimizacion")
    public ResponseEntity<?> guardarOptimizacion(@RequestBody Map<String, Object> payload) {
        try {
            String origen = (String) payload.getOrDefault("origen", "Almacén Principal Lima (A)");
            String destino = (String) payload.getOrDefault("destino", "Planta Siderúrgica Pisco (F)");
            String material = (String) payload.getOrDefault("material", "Bobinas de acero (24 Tn)");
            Double peso = Double.valueOf(payload.getOrDefault("peso", 24.0).toString());
            String trayectoOptimo = (String) payload.getOrDefault("trayecto", "A → C → E → F");
            Double distancia = Double.valueOf(payload.getOrDefault("distancia", 18.5).toString());
            Integer tiempo = Integer.valueOf(payload.getOrDefault("tiempo", 32).toString());
            Double costo = Double.valueOf(payload.getOrDefault("costo", 85.0).toString());

            // 1. Crear o asociar pedido
            Long idCliente = 1L;
            List<Cliente> clientes = clienteRepository.findAll();
            if (!clientes.isEmpty()) idCliente = clientes.get(0).getIdCliente();

            Pedido pedido = new Pedido(
                null, idCliente, 1L, material, BigDecimal.valueOf(peso),
                BigDecimal.valueOf(peso * 1.3), destino, "ALTA", "EQUILIBRIO",
                true, false, "OPTIMIZADO", null, null, null
            );
            Pedido pedidoGuardado = pedidoRepository.save(pedido);

            // 2. Asociar primer vehículo disponible
            Long idVehiculo = 1L;
            List<Vehiculo> vehiculos = vehiculoRepository.findAll();
            if (!vehiculos.isEmpty()) idVehiculo = vehiculos.get(0).getIdVehiculo();

            // 3. Crear registro en tabla rutas
            Ruta ruta = new Ruta(
                null, "Dijkstra Multicriterio + Reglas Expertas", costo, distancia,
                "PLANIFICADA", LocalDate.now(), tiempo, 1L, idVehiculo, null
            );
            Ruta rutaGuardada = rutaRepository.save(ruta);
            pedidoGuardado.setRutaId(rutaGuardada.getId());
            pedidoRepository.save(pedidoGuardado);

            // 4. Registrar variantes en rutas_optimizadas
            List<Transportista> transportistas = transportistaRepository.findAll();
            Long idTrp = !transportistas.isEmpty() ? transportistas.get(0).getIdTransportista() : 1L;

            List<RutaOptimizada> variantes = List.of(
                new RutaOptimizada(null, pedidoGuardado.getIdPedido(), idVehiculo, idTrp,
                    origen, destino, trayectoOptimo, BigDecimal.valueOf(distancia),
                    BigDecimal.valueOf(tiempo), BigDecimal.valueOf(costo),
                    "Dijkstra Multicriterio", new BigDecimal("95.50"), "OPTIMA", null),
                new RutaOptimizada(null, pedidoGuardado.getIdPedido(), idVehiculo, idTrp,
                    origen, destino, "A → B → C → F", BigDecimal.valueOf(distancia * 1.35),
                    BigDecimal.valueOf(tiempo * 1.3), BigDecimal.valueOf(costo * 1.25),
                    "Dijkstra Alternativo", new BigDecimal("82.00"), "ALTERNATIVA", null),
                new RutaOptimizada(null, pedidoGuardado.getIdPedido(), idVehiculo, idTrp,
                    origen, destino, "A → B → D → F", BigDecimal.valueOf(distancia * 1.7),
                    BigDecimal.valueOf(tiempo * 1.7), BigDecimal.valueOf(costo * 1.5),
                    "Ruta Auxiliar Secundaria", new BigDecimal("68.00"), "NO_RECOMENDADA", null)
            );
            rutaOptimizadaRepository.saveAll(variantes);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Ruta y variantes optimizadas guardadas exitosamente en PostgreSQL.",
                "idPedido", pedidoGuardado.getIdPedido(),
                "idRuta", rutaGuardada.getId(),
                "trayecto", trayectoOptimo,
                "distanciaKm", distancia,
                "tiempoMin", tiempo,
                "costoEst", costo
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al registrar la optimización: " + ex.getMessage()));
        }
    }
}
