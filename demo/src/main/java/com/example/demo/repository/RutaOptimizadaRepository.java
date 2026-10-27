package com.example.demo.repository;

import com.example.demo.model.RutaOptimizada;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RutaOptimizadaRepository extends JpaRepository<RutaOptimizada, Long> {
    List<RutaOptimizada> findByIdPedido(Long idPedido);
    List<RutaOptimizada> findByEstadoRuta(String estadoRuta);
    Page<RutaOptimizada> findByOrigenContainingIgnoreCaseOrDestinoContainingIgnoreCaseOrAlgoritmoUtilizadoContainingIgnoreCase(
            String origen, String destino, String algoritmo, Pageable pageable);
}
