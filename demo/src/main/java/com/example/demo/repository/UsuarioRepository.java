package com.example.demo.repository;

import com.example.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    List<Usuario> findByActivoTrueOrderByIdUsuarioDesc();

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByCodEmpleado(String codEmpleado);

    boolean existsByEmail(String email);

    boolean existsByCodEmpleado(String codEmpleado);
}
