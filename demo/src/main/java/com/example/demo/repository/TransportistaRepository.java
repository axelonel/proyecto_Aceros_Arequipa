package com.example.demo.repository;

import com.example.demo.model.Transportista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransportistaRepository extends JpaRepository<Transportista, Long> {
    Optional<Transportista> findByDni(String dni);
    boolean existsByDni(String dni);
    Optional<Transportista> findByLicenciaConducir(String licenciaConducir);
}
