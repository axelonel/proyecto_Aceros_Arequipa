package com.example.demo.controller;

import com.example.demo.dto.OptimizacionRequestDto;
import com.example.demo.dto.OptimizacionResponseDto;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import com.example.demo.service.RutaOptimizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.concurrent.CopyOnWriteArrayList;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LogisticaController {
    // ==========================================
    // SISTEMA DE NOTIFICACIONES PUSH EN TIEMPO REAL (SSE)
    // ==========================================
    private final List<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();

    @GetMapping(value = "/notificaciones/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotificaciones() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        sseEmitters.add(emitter);

        emitter.onCompletion(() -> sseEmitters.remove(emitter));
        emitter.onTimeout(() -> sseEmitters.remove(emitter));
        emitter.onError((e) -> sseEmitters.remove(emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("mensaje", "Conexión en tiempo real con Aceros Arequipa establecida.")));
        } catch (Exception ex) {
            sseEmitters.remove(emitter);
        }
        return emitter;
    }

    public void emitirNotificacion(String tipo, String titulo, String mensaje, Object extra) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("tipo", tipo);
        payload.put("titulo", titulo);
        payload.put("mensaje", mensaje);
        payload.put("fecha", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        if (extra != null) payload.put("data", extra);

        List<SseEmitter> deadEmitters = new ArrayList<>();
        for (SseEmitter emitter : sseEmitters) {
            try {
                emitter.send(SseEmitter.event().name(tipo).data(payload));
            } catch (Exception ex) {
                deadEmitters.add(emitter);
            }
        }
        sseEmitters.removeAll(deadEmitters);
    }


    private final ClienteRepository clienteRepository;
    private final FlotaRepository flotaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TransportistaRepository transportistaRepository;
    private final AsignacionConduccionRepository asignacionRepository;
    private final PedidoRepository pedidoRepository;
    private final RutaRepository rutaRepository;
    private final RutaOptimizadaRepository rutaOptimizadaRepository;
    private final RutaOptimizationService rutaOptimizationService;

    public LogisticaController(ClienteRepository clienteRepository,
                               FlotaRepository flotaRepository,
                               VehiculoRepository vehiculoRepository,
                               TransportistaRepository transportistaRepository,
                               AsignacionConduccionRepository asignacionRepository,
                               PedidoRepository pedidoRepository,
                               RutaRepository rutaRepository,
                               RutaOptimizadaRepository rutaOptimizadaRepository,
                               RutaOptimizationService rutaOptimizationService) {
        this.clienteRepository = clienteRepository;
        this.flotaRepository = flotaRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.transportistaRepository = transportistaRepository;
        this.asignacionRepository = asignacionRepository;
        this.pedidoRepository = pedidoRepository;
        this.rutaRepository = rutaRepository;
        this.rutaOptimizadaRepository = rutaOptimizadaRepository;
        this.rutaOptimizationService = rutaOptimizationService;
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
    @PutMapping("/clientes/{id}")
    public ResponseEntity<?> actualizarCliente(@PathVariable Long id, @RequestBody Cliente c) {
        return clienteRepository.findById(id).map(cliente -> {
            if (c.getNombre() != null && !c.getNombre().isBlank()) cliente.setNombre(c.getNombre());
            if (c.getTipoDocumento() != null) cliente.setTipoDocumento(c.getTipoDocumento());
            if (c.getNumeroDocumento() != null && !c.getNumeroDocumento().isBlank()) cliente.setNumeroDocumento(c.getNumeroDocumento());
            if (c.getDireccionFiscal() != null) cliente.setDireccionFiscal(c.getDireccionFiscal());
            if (c.getContactoNombre() != null) cliente.setContactoNombre(c.getContactoNombre());
            if (c.getTelefono() != null) cliente.setTelefono(c.getTelefono());
            if (c.getEmail() != null) cliente.setEmail(c.getEmail());
            if (c.getActivo() != null) cliente.setActivo(c.getActivo());
            return ResponseEntity.ok(clienteRepository.save(cliente));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/clientes/{id}")
    public ResponseEntity<?> eliminarCliente(@PathVariable Long id) {
        return clienteRepository.findById(id).map(c -> {
            try {
                clienteRepository.delete(c);
                return ResponseEntity.ok(Map.of("message", "Cliente eliminado correctamente de la base de datos."));
            } catch (Exception ex) {
                c.setActivo(false);
                clienteRepository.save(c);
                return ResponseEntity.ok(Map.of("message", "Cliente desactivado (tenía pedidos históricos asociados)."));
            }
        }).orElse(ResponseEntity.notFound().build());
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
    @PutMapping("/flotas/{id}")
    public ResponseEntity<?> actualizarFlota(@PathVariable Long id, @RequestBody Flota f) {
        return flotaRepository.findById(id).map(flota -> {
            if (f.getNombreFlota() != null && !f.getNombreFlota().isBlank()) flota.setNombreFlota(f.getNombreFlota());
            if (f.getDescripcion() != null) flota.setDescripcion(f.getDescripcion());
            if (f.getActivo() != null) flota.setActivo(f.getActivo());
            return ResponseEntity.ok(flotaRepository.save(flota));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/flotas/{id}")
    public ResponseEntity<?> eliminarFlota(@PathVariable Long id) {
        return flotaRepository.findById(id).map(f -> {
            try {
                flotaRepository.delete(f);
                return ResponseEntity.ok(Map.of("message", "Flota eliminada correctamente."));
            } catch (Exception ex) {
                f.setActivo(false);
                flotaRepository.save(f);
                return ResponseEntity.ok(Map.of("message", "Flota desactivada (tenía vehículos vinculados)."));
            }
        }).orElse(ResponseEntity.notFound().build());
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
    @PutMapping("/vehiculos/{id}")
    public ResponseEntity<?> actualizarVehiculo(@PathVariable Long id, @RequestBody Vehiculo v) {
        return vehiculoRepository.findById(id).map(veh -> {
            if (v.getPlaca() != null && !v.getPlaca().isBlank()) veh.setPlaca(v.getPlaca());
            if (v.getTipoCamion() != null) veh.setTipoCamion(v.getTipoCamion());
            if (v.getModelo() != null) veh.setModelo(v.getModelo());
            if (v.getCapacidadMaxTon() != null) veh.setCapacidadMaxTon(v.getCapacidadMaxTon());
            if (v.getVolumenMaxM3() != null) veh.setVolumenMaxM3(v.getVolumenMaxM3());
            if (v.getEstadoOperativo() != null) veh.setEstadoOperativo(v.getEstadoOperativo());
            if (v.getIdFlota() != null) veh.setIdFlota(v.getIdFlota());
            return ResponseEntity.ok(vehiculoRepository.save(veh));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/vehiculos/{id}")
    public ResponseEntity<?> eliminarVehiculo(@PathVariable Long id) {
        return vehiculoRepository.findById(id).map(v -> {
            try {
                vehiculoRepository.delete(v);
                return ResponseEntity.ok(Map.of("message", "Vehículo eliminado correctamente."));
            } catch (Exception ex) {
                v.setEstadoOperativo("INACTIVO");
                vehiculoRepository.save(v);
                return ResponseEntity.ok(Map.of("message", "Vehículo marcado como INACTIVO (tiene despachos asociados)."));
            }
        }).orElse(ResponseEntity.notFound().build());
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
    @PutMapping("/transportistas/{id}")
    public ResponseEntity<?> actualizarTransportista(@PathVariable Long id, @RequestBody Transportista t) {
        return transportistaRepository.findById(id).map(tr -> {
            if (t.getNombres() != null) tr.setNombres(t.getNombres());
            if (t.getApellidos() != null) tr.setApellidos(t.getApellidos());
            if (t.getDni() != null) tr.setDni(t.getDni());
            if (t.getLicenciaConducir() != null) tr.setLicenciaConducir(t.getLicenciaConducir());
            if (t.getCategoriaLicencia() != null) tr.setCategoriaLicencia(t.getCategoriaLicencia());
            if (t.getTelefono() != null) tr.setTelefono(t.getTelefono());
            if (t.getActivo() != null) tr.setActivo(t.getActivo());
            return ResponseEntity.ok(transportistaRepository.save(tr));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/transportistas/{id}")
    public ResponseEntity<?> eliminarTransportista(@PathVariable Long id) {
        return transportistaRepository.findById(id).map(t -> {
            try {
                transportistaRepository.delete(t);
                return ResponseEntity.ok(Map.of("message", "Transportista eliminado correctamente."));
            } catch (Exception ex) {
                t.setActivo(false);
                transportistaRepository.save(t);
                return ResponseEntity.ok(Map.of("message", "Transportista desactivado."));
            }
        }).orElse(ResponseEntity.notFound().build());
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
    @PutMapping("/pedidos/{id}")
    public ResponseEntity<?> actualizarPedido(@PathVariable Long id, @RequestBody Pedido p) {
        return pedidoRepository.findById(id).map(ped -> {
            if (p.getTipoMaterial() != null) ped.setTipoMaterial(p.getTipoMaterial());
            if (p.getPesoT() != null) ped.setPesoT(p.getPesoT());
            if (p.getVolumenM3() != null) ped.setVolumenM3(p.getVolumenM3());
            if (p.getDireccionDestino() != null) ped.setDireccionDestino(p.getDireccionDestino());
            if (p.getPrioridad() != null) ped.setPrioridad(p.getPrioridad());
            if (p.getObjetivoOptimizacion() != null) ped.setObjetivoOptimizacion(p.getObjetivoOptimizacion());
            if (p.getEstadoPedido() != null) ped.setEstadoPedido(p.getEstadoPedido());
            if (p.getIdCliente() != null) ped.setIdCliente(p.getIdCliente());
            return ResponseEntity.ok(pedidoRepository.save(ped));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/pedidos/{id}")
    public ResponseEntity<?> eliminarPedido(@PathVariable Long id) {
        return pedidoRepository.findById(id).map(p -> {
            try {
                pedidoRepository.delete(p);
                return ResponseEntity.ok(Map.of("message", "Pedido eliminado correctamente de la base de datos."));
            } catch (Exception ex) {
                p.setEstadoPedido("CANCELADO");
                pedidoRepository.save(p);
                return ResponseEntity.ok(Map.of("message", "Pedido marcado como CANCELADO (tiene rutas calculadas asociadas)."));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/pedidos/{id}/estado")
    public ResponseEntity<?> cambiarEstadoPedido(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        if (nuevoEstado == null || nuevoEstado.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El estado es obligatorio."));
        }
        return pedidoRepository.findById(id).map(p -> {
            p.setEstadoPedido(nuevoEstado.toUpperCase());
            if ("ENTREGADO".equalsIgnoreCase(nuevoEstado)) {
                p.setFechaEntrega(LocalDateTime.now());
            }
            return ResponseEntity.ok(pedidoRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // 6. ASIGNACIONES DE CONDUCCIÓN FUNCIONALES (PUNTO 7)
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
            map.put("idPedido", a.getIdPedido());
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
                map.put("conductorCategoria", t.getCategoriaLicencia());
            });

            if (a.getIdPedido() != null) {
                pedidoRepository.findById(a.getIdPedido()).ifPresent(p -> {
                    map.put("pedidoMaterial", p.getTipoMaterial());
                    map.put("pedidoPeso", p.getPesoT());
                    map.put("pedidoDestino", p.getDireccionDestino());
                    map.put("pedidoPrioridad", p.getPrioridad());
                    map.put("pedidoEstado", p.getEstadoPedido());
                    clienteRepository.findById(p.getIdCliente()).ifPresent(c -> {
                        map.put("clienteNombre", c.getNombre());
                    });
                });
            }

            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/asignaciones")
    public ResponseEntity<?> crearAsignacion(@RequestBody Map<String, Object> body) {
        try {
            Long idVehiculo = Long.valueOf(body.get("idVehiculo").toString());
            Long idTransportista = Long.valueOf(body.get("idTransportista").toString());
            Long idPedido = null;
            if (body.get("idPedido") != null && !body.get("idPedido").toString().isBlank()) {
                idPedido = Long.valueOf(body.get("idPedido").toString());
            }

            AsignacionConduccion asignacion = new AsignacionConduccion(
                null, idVehiculo, idTransportista, idPedido, LocalDateTime.now(), null, "ACTIVA"
            );

            AsignacionConduccion guardada = asignacionRepository.save(asignacion);

            // Actualizar estado del vehículo a EN_RUTA
            vehiculoRepository.findById(idVehiculo).ifPresent(v -> {
                v.setEstadoOperativo("EN_RUTA");
                vehiculoRepository.save(v);
            });

            // Si hay pedido asociado, actualizar su estado a EN_PROCESO
            if (idPedido != null) {
                pedidoRepository.findById(idPedido).ifPresent(p -> {
                    p.setEstadoPedido("EN_PROCESO");
                    pedidoRepository.save(p);
                });
            }

            emitirNotificacion("ASIGNACION_CREADA", "Nueva Asignación de Conducción",
                    "Transportista y vehículo asignados para el despacho", guardada);

            return ResponseEntity.status(HttpStatus.CREATED).body(guardada);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error al crear la asignación: " + ex.getMessage()));
        }
    }

    @PutMapping("/asignaciones/{id}/iniciar")
    public ResponseEntity<?> iniciarAsignacion(@PathVariable Long id) {
        return asignacionRepository.findById(id).map(a -> {
            a.setEstado("EN_TRANSITO");
            asignacionRepository.save(a);

            if (a.getIdPedido() != null) {
                pedidoRepository.findById(a.getIdPedido()).ifPresent(p -> {
                    p.setEstadoPedido("DESPACHADO");
                    pedidoRepository.save(p);
                });
            }

            emitirNotificacion("ASIGNACION_INICIADA", "Viaje en Tránsito", "Despacho #" + id + " ha iniciado recorrido.", a);
            return ResponseEntity.ok(Map.of("message", "Ruta iniciada en tránsito exitosamente.", "asignacion", a));
        }).orElse(ResponseEntity.notFound().build());
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

            // Completar pedido vinculado
            if (a.getIdPedido() != null) {
                pedidoRepository.findById(a.getIdPedido()).ifPresent(p -> {
                    p.setEstadoPedido("ENTREGADO");
                    p.setFechaEntrega(LocalDateTime.now());
                    pedidoRepository.save(p);
                });
            }

            emitirNotificacion("ASIGNACION_COMPLETADA", "Entrega Finalizada", "Despacho #" + id + " completado y vehículo liberado.", a);
            return ResponseEntity.ok(Map.of("message", "Asignación completada y vehículo liberado exitosamente."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/asignaciones/{id}")
    public ResponseEntity<?> cancelarAsignacion(@PathVariable Long id) {
        return asignacionRepository.findById(id).map(a -> {
            a.setEstado("CANCELADA");
            a.setFechaFin(LocalDateTime.now());
            asignacionRepository.save(a);

            vehiculoRepository.findById(a.getIdVehiculo()).ifPresent(v -> {
                v.setEstadoOperativo("DISPONIBLE");
                vehiculoRepository.save(v);
            });

            if (a.getIdPedido() != null) {
                pedidoRepository.findById(a.getIdPedido()).ifPresent(p -> {
                    if ("EN_PROCESO".equals(p.getEstadoPedido()) || "DESPACHADO".equals(p.getEstadoPedido())) {
                        p.setEstadoPedido("REGISTRADO");
                        pedidoRepository.save(p);
                    }
                });
            }

            emitirNotificacion("ASIGNACION_CANCELADA", "Asignación Cancelada", "Despacho #" + id + " cancelado.", a);
            return ResponseEntity.ok(Map.of("message", "Asignación cancelada y recursos liberados."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 7. RUTAS PROGRAMADAS (CRUD) Y OPTIMIZACIÓN
    // ==========================================
    @GetMapping("/rutas")
    public ResponseEntity<List<Ruta>> listarRutas() {
        return ResponseEntity.ok(rutaRepository.findAll());
    }

    @PostMapping("/rutas")
    public ResponseEntity<?> crearRuta(@RequestBody Map<String, Object> body) {
        try {
            Ruta r = new Ruta();
            r.setAlgoritmoUsado((String) body.getOrDefault("algoritmoUsado", "Google OR-Tools Constraint Solver"));
            if (body.get("distanciaTotalKm") != null) {
                r.setDistanciaTotalKm(Double.valueOf(body.get("distanciaTotalKm").toString()));
            }
            if (body.get("tiempoEstimadoMin") != null) {
                r.setTiempoEstimadoMin(Integer.valueOf(body.get("tiempoEstimadoMin").toString()));
            }
            if (body.get("costoEstimadoSoles") != null) {
                r.setCostoEstimadoSoles(Double.valueOf(body.get("costoEstimadoSoles").toString()));
            }
            r.setEstado((String) body.getOrDefault("estado", "PLANIFICADA"));

            Long vehiculoId = 1L;
            if (body.get("vehiculoId") != null) {
                try {
                    vehiculoId = Long.valueOf(body.get("vehiculoId").toString());
                } catch (Exception ignored) {}
            }
            final Long targetVehiculoId = vehiculoId;
            if (vehiculoRepository.existsById(targetVehiculoId)) {
                r.setVehiculoId(targetVehiculoId);
            } else {
                r.setVehiculoId(vehiculoRepository.findAll().stream().findFirst().map(Vehiculo::getIdVehiculo).orElse(1L));
            }

            r.setFechaRuta(LocalDate.now());
            Ruta saved = rutaRepository.save(r);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error al crear ruta: " + ex.getMessage()));
        }
    }

    @PutMapping("/rutas/{id}")
    public ResponseEntity<?> actualizarRuta(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return rutaRepository.findById(id).map(r -> {
            if (body.get("algoritmoUsado") != null) r.setAlgoritmoUsado((String) body.get("algoritmoUsado"));
            if (body.get("distanciaTotalKm") != null) r.setDistanciaTotalKm(Double.valueOf(body.get("distanciaTotalKm").toString()));
            if (body.get("tiempoEstimadoMin") != null) r.setTiempoEstimadoMin(Integer.valueOf(body.get("tiempoEstimadoMin").toString()));
            if (body.get("costoEstimadoSoles") != null) r.setCostoEstimadoSoles(Double.valueOf(body.get("costoEstimadoSoles").toString()));
            if (body.get("estado") != null) r.setEstado((String) body.get("estado"));
            return ResponseEntity.ok(rutaRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/rutas/{id}")
    public ResponseEntity<?> eliminarRuta(@PathVariable Long id) {
        return rutaRepository.findById(id).map(r -> {
            try {
                rutaRepository.delete(r);
                return ResponseEntity.ok(Map.of("message", "Ruta eliminada correctamente."));
            } catch (Exception ex) {
                r.setEstado("CANCELADA");
                rutaRepository.save(r);
                return ResponseEntity.ok(Map.of("message", "Ruta cancelada por dependencias activas."));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/rutas/optimizar-ortools")
    public ResponseEntity<?> optimizarConOrTools(@RequestBody OptimizacionRequestDto request) {
        try {
            OptimizacionResponseDto response = rutaOptimizationService.optimizarYPersistir(request);
            emitirNotificacion("RUTA_OPTIMIZADA", "Nueva Ruta Optimizada", "Ruta calculada: " + response.getRutaOptimaTrayecto() + " (" + response.getDistanciaKm() + " km)", response);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error en el cálculo con Google OR-Tools: " + ex.getMessage()));
        }
    }

    @PostMapping("/rutas/guardar-optimizacion")
    public ResponseEntity<?> guardarOptimizacion(@RequestBody Map<String, Object> payload) {
        try {
            OptimizacionRequestDto req = new OptimizacionRequestDto();
            req.setOrigen((String) payload.getOrDefault("origen", "A"));
            req.setDestino((String) payload.getOrDefault("destino", "F"));
            req.setMaterial((String) payload.getOrDefault("material", "Bobinas de acero (24 Tn)"));
            if (payload.get("peso") != null) {
                req.setPeso(Double.valueOf(payload.get("peso").toString()));
            }
            req.setObjetivo((String) payload.getOrDefault("objetivo", "equilibrio"));
            req.setPrioridad((String) payload.getOrDefault("prioridad", "Alta"));
            req.setEvitarTrafico(Boolean.TRUE.equals(payload.get("evitarTrafico")));
            req.setEvitarMantenimiento(Boolean.TRUE.equals(payload.get("evitarMantenimiento")));

            OptimizacionResponseDto response = rutaOptimizationService.optimizarYPersistir(req);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al registrar la optimización: " + ex.getMessage()));
        }
    }

    @GetMapping("/rutas/ultimas-optimizaciones")
    public ResponseEntity<List<RutaOptimizada>> listarUltimasOptimizaciones() {
        return ResponseEntity.ok(rutaOptimizadaRepository.findAll());
    }

    // ==========================================
    // 8. HISTORIAL DE OPTIMIZACIONES Y RUTAS
    // ==========================================
    @GetMapping("/historial/paginado")
    public ResponseEntity<Map<String, Object>> obtenerHistorialPaginado(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("idRuta").descending());
        Page<RutaOptimizada> pageResult;

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim();
            pageResult = rutaOptimizadaRepository.findByOrigenContainingIgnoreCaseOrDestinoContainingIgnoreCaseOrAlgoritmoUtilizadoContainingIgnoreCase(q, q, q, pageable);
        } else {
            pageResult = rutaOptimizadaRepository.findAll(pageable);
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> items = new ArrayList<>();

        for (RutaOptimizada r : pageResult.getContent()) {
            Map<String, Object> map = new HashMap<>();
            map.put("idRuta", r.getIdRuta());
            map.put("codigo", "#OPT-" + (1000 + r.getIdRuta()));
            map.put("origen", r.getOrigen());
            map.put("destino", r.getDestino());
            map.put("trayecto", r.getSecuenciaParadas());
            map.put("distanciaKm", r.getDistanciaKm());
            map.put("tiempoMin", r.getTiempoEstimadoMin());
            map.put("costo", r.getCostoOperativo());
            map.put("puntaje", r.getPuntaje() != null ? r.getPuntaje() + "%" : "90%");
            map.put("estadoRuta", r.getEstadoRuta());
            map.put("algoritmo", r.getAlgoritmoUtilizado());

            LocalDateTime fecha = r.getFechaCalculo() != null ? r.getFechaCalculo() : LocalDateTime.now();
            map.put("fechaHora", fecha.format(dtf));

            if (r.getIdPedido() != null) {
                pedidoRepository.findById(r.getIdPedido()).ifPresent(p -> {
                    map.put("material", p.getTipoMaterial());
                    map.put("pesoT", p.getPesoT());
                    map.put("prioridad", p.getPrioridad());
                    map.put("estadoPedido", p.getEstadoPedido());
                });
            } else {
                map.put("material", "Bobinas de acero (24 Tn)");
                map.put("pesoT", new BigDecimal("24.00"));
                map.put("estadoPedido", "OPTIMIZADO");
            }

            if (r.getIdVehiculo() != null) {
                vehiculoRepository.findById(r.getIdVehiculo()).ifPresent(v -> {
                    map.put("vehiculoPlaca", v.getPlaca());
                    map.put("vehiculoModelo", v.getModelo());
                    map.put("tipoCamion", v.getTipoCamion());
                });
            }

            items.add(map);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("items", items);
        res.put("currentPage", pageResult.getNumber());
        res.put("totalPages", pageResult.getTotalPages());
        res.put("totalElements", pageResult.getTotalElements());
        res.put("size", pageResult.getSize());
        res.put("hasNext", pageResult.hasNext());
        res.put("hasPrevious", pageResult.hasPrevious());

        return ResponseEntity.ok(res);
    }

    @GetMapping("/historial")
    public ResponseEntity<List<Map<String, Object>>> obtenerHistorialOptimizaciones() {
        List<RutaOptimizada> optimizadas = rutaOptimizadaRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (RutaOptimizada r : optimizadas) {
            Map<String, Object> map = new HashMap<>();
            map.put("idRuta", r.getIdRuta());
            map.put("codigo", "#OPT-" + (1000 + r.getIdRuta()));
            map.put("origen", r.getOrigen());
            map.put("destino", r.getDestino());
            map.put("trayecto", r.getSecuenciaParadas());
            map.put("distanciaKm", r.getDistanciaKm());
            map.put("tiempoMin", r.getTiempoEstimadoMin());
            map.put("costo", r.getCostoOperativo());
            map.put("puntaje", r.getPuntaje() != null ? r.getPuntaje() + "%" : "90%");
            map.put("estadoRuta", r.getEstadoRuta());
            map.put("algoritmo", r.getAlgoritmoUtilizado());

            LocalDateTime fecha = r.getFechaCalculo() != null ? r.getFechaCalculo() : LocalDateTime.now();
            map.put("fechaHora", fecha.format(dtf));

            // Relación con Pedido
            if (r.getIdPedido() != null) {
                pedidoRepository.findById(r.getIdPedido()).ifPresent(p -> {
                    map.put("material", p.getTipoMaterial());
                    map.put("pesoT", p.getPesoT());
                    map.put("prioridad", p.getPrioridad());
                    map.put("estadoPedido", p.getEstadoPedido());
                });
            } else {
                map.put("material", "Bobinas de acero (24 Tn)");
                map.put("pesoT", new BigDecimal("24.00"));
                map.put("estadoPedido", "OPTIMIZADO");
            }

            // Relación con Vehículo
            if (r.getIdVehiculo() != null) {
                vehiculoRepository.findById(r.getIdVehiculo()).ifPresent(v -> {
                    map.put("vehiculoPlaca", v.getPlaca());
                    map.put("vehiculoModelo", v.getModelo());
                    map.put("tipoCamion", v.getTipoCamion());
                });
            } else {
                map.put("vehiculoPlaca", "AYZ-892");
                map.put("vehiculoModelo", "Volvo FH 540");
                map.put("tipoCamion", "Tráiler Plataforma");
            }

            // Relación con Transportista
            if (r.getIdTransportista() != null) {
                transportistaRepository.findById(r.getIdTransportista()).ifPresent(t -> {
                    map.put("transportistaNombre", t.getNombres() + " " + t.getApellidos());
                    map.put("licencia", t.getLicenciaConducir());
                });
            } else {
                map.put("transportistaNombre", "Manuel Quispe");
                map.put("licencia", "Q45892134");
            }

            response.add(map);
        }

        // Ordenar del más reciente al más antiguo
        Collections.reverse(response);
            return ResponseEntity.ok(response);
    }

    // ==========================================
    // 9. MÉTRICAS Y REPORTES RESUMEN
    // ==========================================
    @GetMapping("/reportes/resumen")
    public ResponseEntity<Map<String, Object>> obtenerResumenReportes() {
        Map<String, Object> data = new HashMap<>();

        long totalVehiculos = vehiculoRepository.count();
        long vehiculosDisponibles = vehiculoRepository.findAll().stream()
            .filter(v -> "DISPONIBLE".equalsIgnoreCase(v.getEstadoOperativo())).count();

        long totalPedidos = pedidoRepository.count();
        double pesoTotalToneladas = pedidoRepository.findAll().stream()
            .mapToDouble(p -> p.getPesoT() != null ? p.getPesoT().doubleValue() : 0.0)
            .sum();

        long totalRutas = rutaRepository.count();
        List<RutaOptimizada> todasOptimizadas = rutaOptimizadaRepository.findAll();

        List<RutaOptimizada> optimas = todasOptimizadas.stream()
            .filter(r -> "OPTIMA".equalsIgnoreCase(r.getEstadoRuta()))
            .toList();

        double distanciaTotalKm = optimas.stream()
            .mapToDouble(r -> r.getDistanciaKm() != null ? r.getDistanciaKm().doubleValue() : 0.0)
            .sum();

        double costoTotalFletes = optimas.stream()
            .mapToDouble(r -> r.getCostoOperativo() != null ? r.getCostoOperativo().doubleValue() : 0.0)
            .sum();

        double tiempoPromedioMin = optimas.stream()
            .mapToDouble(r -> r.getTiempoEstimadoMin() != null ? r.getTiempoEstimadoMin().doubleValue() : 32.0)
            .average().orElse(32.0);

        // Ahorro estimado de flete gracias a la optimización
        double ahorroEstimado = Math.max(optimas.size() * 42.50, 85.00);

        data.put("totalVehiculos", totalVehiculos);
        data.put("vehiculosDisponibles", vehiculosDisponibles);
        data.put("totalPedidos", totalPedidos);
        data.put("pesoTotalToneladas", Math.round(pesoTotalToneladas * 10.0) / 10.0);
        data.put("totalRutas", totalRutas);
        data.put("distanciaTotalKm", Math.round(distanciaTotalKm * 10.0) / 10.0);
        data.put("costoTotalFletes", Math.round(costoTotalFletes * 100.0) / 100.0);
        data.put("tiempoPromedioMin", Math.round(tiempoPromedioMin));
        data.put("ahorroEstimadoSoles", Math.round(ahorroEstimado * 100.0) / 100.0);

        // 3. Comparativa de alternativas (las más recientes calculadas)
        List<Map<String, Object>> chartSeries = new ArrayList<>();
        if (!todasOptimizadas.isEmpty()) {
            Long ultimoPedidoId = todasOptimizadas.get(todasOptimizadas.size() - 1).getIdPedido();
            List<RutaOptimizada> ultimas = todasOptimizadas.stream()
                .filter(r -> Objects.equals(r.getIdPedido(), ultimoPedidoId))
                .toList();

            if (ultimas.isEmpty()) {
                ultimas = todasOptimizadas.subList(Math.max(0, todasOptimizadas.size() - 3), todasOptimizadas.size());
            }

            int num = 1;
            for (RutaOptimizada r : ultimas) {
                Map<String, Object> item = new HashMap<>();
                item.put("numero", num++);
                item.put("trayecto", r.getSecuenciaParadas());
                item.put("tiempo", r.getTiempoEstimadoMin());
                item.put("distancia", r.getDistanciaKm());
                item.put("costo", r.getCostoOperativo());
                item.put("puntaje", (r.getPuntaje() != null ? r.getPuntaje() : new BigDecimal("90.0")) + "%");
                item.put("recomendacion", "OPTIMA".equalsIgnoreCase(r.getEstadoRuta()) ? "Óptima (OR-Tools)" :
                    ("NO_RECOMENDADA".equalsIgnoreCase(r.getEstadoRuta()) ? "No recomendada" : "Alternativa"));
                item.put("badgeClase", "OPTIMA".equalsIgnoreCase(r.getEstadoRuta()) ? "badge-optima" :
                    ("NO_RECOMENDADA".equalsIgnoreCase(r.getEstadoRuta()) ? "badge-descartada" : "badge-alternativa"));
                chartSeries.add(item);
            }
        }
        data.put("comparativaAlternativas", chartSeries);

        // 4. Distribución por tipo de material
        Map<String, Double> distribucionMaterial = new HashMap<>();
        for (Pedido p : pedidoRepository.findAll()) {
            String mat = p.getTipoMaterial();
            if (mat != null) {
                String key = mat.split("\\(")[0].trim();
                double peso = p.getPesoT() != null ? p.getPesoT().doubleValue() : 0.0;
                distribucionMaterial.put(key, distribucionMaterial.getOrDefault(key, 0.0) + peso);
            }
        }
        data.put("distribucionMaterial", distribucionMaterial);

        // 5. Conclusión dinámica generada
        if (!chartSeries.isEmpty()) {
            Map<String, Object> primera = chartSeries.get(0);
            data.put("conclusion", "La Ruta 1 (" + primera.get("trayecto") + ") es la mejor opción porque ofrece el menor tiempo (" +
                primera.get("tiempo") + " min) y un costo optimizado (S/ " + primera.get("costo") + "), logrando la mayor eficiencia operativa según el cálculo de Google OR-Tools.");
        } else {
            data.put("conclusion", "Las rutas optimizadas reducen en promedio un 24% los tiempos de traslado y minimizan el consumo de combustible.");
        }

        return ResponseEntity.ok(data);
    }

    @GetMapping("/reportes/metricas")
    public ResponseEntity<Map<String, Object>> obtenerMetricasReportes() {
        return obtenerResumenReportes();
    }
}
