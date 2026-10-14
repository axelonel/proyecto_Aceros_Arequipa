package com.example.demo.config;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ClienteRepository clienteRepository;
    private final FlotaRepository flotaRepository;
    private final VehiculoRepository vehiculoRepository;
    private final TransportistaRepository transportistaRepository;
    private final AsignacionConduccionRepository asignacionConduccionRepository;
    private final PedidoRepository pedidoRepository;
    private final RutaRepository rutaRepository;
    private final RutaOptimizadaRepository rutaOptimizadaRepository;
    private final UsuarioRepository usuarioRepository;

    public DataInitializer(ClienteRepository clienteRepository,
                           FlotaRepository flotaRepository,
                           VehiculoRepository vehiculoRepository,
                           TransportistaRepository transportistaRepository,
                           AsignacionConduccionRepository asignacionConduccionRepository,
                           PedidoRepository pedidoRepository,
                           RutaRepository rutaRepository,
                           RutaOptimizadaRepository rutaOptimizadaRepository,
                           UsuarioRepository usuarioRepository) {
        this.clienteRepository = clienteRepository;
        this.flotaRepository = flotaRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.transportistaRepository = transportistaRepository;
        this.asignacionConduccionRepository = asignacionConduccionRepository;
        this.pedidoRepository = pedidoRepository;
        this.rutaRepository = rutaRepository;
        this.rutaOptimizadaRepository = rutaOptimizadaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void run(String... args) {
        inicializarFlotas();
        inicializarTransportistas();
        inicializarVehiculos();
        inicializarClientes();
        inicializarPedidosYRutas();
    }

    private void inicializarFlotas() {
        if (flotaRepository.count() == 0) {
            flotaRepository.saveAll(List.of(
                new Flota(null, "Flota Pesada Siderúrgica Pisco", "Transporte pesado de bobinas, palanquillas y planchas desde planta", true, null),
                new Flota(null, "Flota Distribución Centro - Lima y Callao", "Distribución de barras corrugadas y perfiles a obras y almacenes de Lima", true, null),
                new Flota(null, "Flota Corrugados Sur - Arequipa", "Distribución en la macro región sur (Arequipa, Cusco, Moquegua, Tacna)", true, null)
            ));
            System.out.println("✅ [DataInitializer] 3 Flotas logísticas inicializadas en PostgreSQL.");
        }
    }

    private void inicializarTransportistas() {
        if (transportistaRepository.count() == 0) {
            transportistaRepository.saveAll(List.of(
                new Transportista(null, "Manuel", "Quispe", "45892134", "Q45892134", "A-IIIc", "987654321", true, null),
                new Transportista(null, "Carlos", "Suares", "47123985", "S47123985", "A-IIIc", "976543210", true, null),
                new Transportista(null, "Jorge", "Ramírez", "43678912", "R43678912", "A-IIIb", "965432109", true, null)
            ));
            System.out.println("✅ [DataInitializer] Transportistas autorizados inicializados en PostgreSQL.");
        }
    }

    private void inicializarVehiculos() {
        if (vehiculoRepository.count() == 0) {
            List<Flota> flotas = flotaRepository.findAll();
            Long flota1 = flotas.size() > 0 ? flotas.get(0).getIdFlota() : null;
            Long flota2 = flotas.size() > 1 ? flotas.get(1).getIdFlota() : flota1;
            Long flota3 = flotas.size() > 2 ? flotas.get(2).getIdFlota() : flota1;

            vehiculoRepository.saveAll(List.of(
                new Vehiculo(null, flota1, "AYZ-892", "Tráiler Plataforma (V-102)", new BigDecimal("32.00"), new BigDecimal("45.00"), "DISPONIBLE", "Volvo FH 540 Globetrotter 6x4", 11.5, null, null),
                new Vehiculo(null, flota2, "B8U-711", "Camión Pesado (V-105)", new BigDecimal("28.00"), new BigDecimal("38.00"), "DISPONIBLE", "Scania R500 V8 Heavy Duty", 11.0, null, null),
                new Vehiculo(null, flota1, "T1A-904", "Furgón Cerrado (V-108)", new BigDecimal("22.00"), new BigDecimal("30.00"), "DISPONIBLE", "Mercedes-Benz Actros 2645", 9.5, null, null),
                new Vehiculo(null, flota3, "C3E-845", "Camión Plataforma (V-110)", new BigDecimal("18.00"), new BigDecimal("25.00"), "DISPONIBLE", "Hino 500 Series 2628", 8.0, null, null)
            ));
            System.out.println("✅ [DataInitializer] 4 Vehículos con marcas y capacidad de peso inicializados.");
        }
    }

    private void inicializarClientes() {
        if (clienteRepository.count() == 0) {
            clienteRepository.saveAll(List.of(
                new Cliente(null, "Consorcio Constructor Graña y Montero S.A.A.", "RUC", "20100010724", "Av. Paseo de la República 4675, Surquillo, Lima", "Ing. Eduardo Morales", "01-2136500", "compras@gym.com.pe", true, null, null),
                new Cliente(null, "Distribuidora de Fierros El Progreso S.A.C.", "RUC", "20512896541", "Av. Augusto B. Leguía 1420, Chiclayo", "Sr. Alberto Mendoza", "074-238910", "ventas@elprogreso.com.pe", true, null, null),
                new Cliente(null, "Maestro Perú S.A. - Sucursal Pisco", "RUC", "20456123987", "Carretera Panamericana Sur Km 231, Pisco", "Lic. Patricia Flores", "056-532100", "logistica@maestro.com.pe", true, null, null),
                new Cliente(null, "Sodimac Perú S.A. - Arequipa", "RUC", "20501234567", "Av. Ejército 798, Yanahuara, Arequipa", "Ing. Renato Salas", "054-256789", "obras@sodimac.com.pe", true, null, null),
                new Cliente(null, "Constructora San Martín S.A.C.", "RUC", "20489761234", "Parque Industrial Lurín Mz. C Lote 4, Lurín", "Ing. Carlos Ugarte", "01-4301298", "proyectos@sanmartin.pe", true, null, null)
            ));
            System.out.println("✅ [DataInitializer] 5 Clientes corporativos inicializados en PostgreSQL.");
        }
    }

    private void inicializarPedidosYRutas() {
        if (pedidoRepository.count() == 0) {
            List<Cliente> clientes = clienteRepository.findAll();
            Long idCliente1 = clientes.size() > 0 ? clientes.get(0).getIdCliente() : 1L;
            Long idCliente2 = clientes.size() > 1 ? clientes.get(1).getIdCliente() : 1L;
            Long idCliente3 = clientes.size() > 2 ? clientes.get(2).getIdCliente() : 1L;

            List<Usuario> usuarios = usuarioRepository.findAll();
            Long idSupervisor = 1L;
            for (Usuario u : usuarios) {
                if ("SUPERVISOR".equalsIgnoreCase(u.getRol())) {
                    idSupervisor = u.getIdUsuario();
                    break;
                }
            }

            // Pedido 1
            Pedido p1 = pedidoRepository.save(new Pedido(
                null, idCliente1, idSupervisor, "Bobinas de acero laminado (24 Tn)",
                new BigDecimal("24.00"), new BigDecimal("32.50"), "Planta Siderúrgica Pisco (F)",
                "ALTA", "EQUILIBRIO", true, false, "OPTIMIZADO", null, null, null
            ));

            // Pedido 2
            Pedido p2 = pedidoRepository.save(new Pedido(
                null, idCliente2, idSupervisor, "Barras de construcción corrugadas 1/2\" (20 Tn)",
                new BigDecimal("20.00"), new BigDecimal("26.00"), "Distribuidora Norte Chiclayo (D)",
                "MEDIA", "MENOR_COSTO", false, false, "REGISTRADO", null, null, null
            ));

            // Pedido 3
            Pedido p3 = pedidoRepository.save(new Pedido(
                null, idCliente3, idSupervisor, "Alambrón industrial para trefilería (18 Tn)",
                new BigDecimal("18.00"), new BigDecimal("22.00"), "Zona Industrial Lurín (C)",
                "ALTA", "MENOR_TIEMPO", true, true, "REGISTRADO", null, null, null
            ));

            // Ruta registrada
            List<Vehiculo> vehiculos = vehiculoRepository.findAll();
            Long idVehiculo1 = vehiculos.size() > 0 ? vehiculos.get(0).getIdVehiculo() : 1L;

            Ruta ruta1 = rutaRepository.save(new Ruta(
                null, "Dijkstra + Reglas Expertas", 85.00, 18.5,
                "EN_EJECUCION", LocalDate.now(), 32, idSupervisor, idVehiculo1, null
            ));

            p1.setRutaId(ruta1.getId());
            p1.setEstadoPedido("DESPACHADO");
            pedidoRepository.save(p1);

            // Rutas Optimizadas para el pedido 1
            List<Transportista> transportistas = transportistaRepository.findAll();
            Long idTrp1 = transportistas.size() > 0 ? transportistas.get(0).getIdTransportista() : 1L;

            rutaOptimizadaRepository.saveAll(List.of(
                new RutaOptimizada(null, p1.getIdPedido(), idVehiculo1, idTrp1,
                    "Almacén Principal Lima (A)", "Planta Siderúrgica Pisco (F)",
                    "A → C → E → F", new BigDecimal("18.50"), new BigDecimal("32.00"),
                    new BigDecimal("85.00"), "Dijkstra Multicriterio", new BigDecimal("95.50"), "OPTIMA", null),
                new RutaOptimizada(null, p1.getIdPedido(), idVehiculo1, idTrp1,
                    "Almacén Principal Lima (A)", "Planta Siderúrgica Pisco (F)",
                    "A → B → C → F", new BigDecimal("24.80"), new BigDecimal("41.00"),
                    new BigDecimal("105.00"), "Dijkstra Ponderado", new BigDecimal("82.00"), "ALTERNATIVA", null),
                new RutaOptimizada(null, p1.getIdPedido(), idVehiculo1, idTrp1,
                    "Almacén Principal Lima (A)", "Planta Siderúrgica Pisco (F)",
                    "A → B → D → F", new BigDecimal("32.10"), new BigDecimal("55.00"),
                    new BigDecimal("125.00"), "Camino Secundario", new BigDecimal("68.50"), "NO_RECOMENDADA", null)
            ));

            // Asignación de conducción activa inicial
            if (asignacionConduccionRepository.count() == 0) {
                asignacionConduccionRepository.save(new AsignacionConduccion(
                    null, idVehiculo1, idTrp1, LocalDateTime.now(), null, "ACTIVA"
                ));
            }

            System.out.println("✅ [DataInitializer] Pedidos, Rutas y Asignaciones inicializadas en PostgreSQL.");
        }
    }
}
