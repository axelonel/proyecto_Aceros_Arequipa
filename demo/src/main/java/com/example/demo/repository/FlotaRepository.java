package com.example.demo.repository;

import com.example.demo.model.Flota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlotaRepository extends JpaRepository<Flota, Long> {
}
