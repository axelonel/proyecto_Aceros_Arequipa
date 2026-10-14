package com.example.demo.repository;

import com.example.demo.model.AsignacionConduccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AsignacionConduccionRepository extends JpaRepository<AsignacionConduccion, Long> {
    List<AsignacionConduccion> findByEstado(String estado);
    List<AsignacionConduccion> findByIdTransportista(Long idTransportista);
}
