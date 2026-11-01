package com.example.demo.repository;

import com.example.demo.model.RutaOptimizada;
import jakarta.persistence.QueryHint;
import org.hibernate.jpa.HibernateHints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.stream.Stream;

@Repository
public interface RutaOptimizadaReportRepository extends JpaRepository<RutaOptimizada, Long> {

    /**
     * Consulta general sin filtros con lectura de cursor JDBC (fetch size = 500) y Stream reactivo
     * para no sobrecargar el Heap de la JVM con grandes volúmenes de datos.
     */
    @QueryHints(value = {
        @QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "500"),
        @QueryHint(name = HibernateHints.HINT_CACHEABLE, value = "false"),
        @QueryHint(name = HibernateHints.HINT_READ_ONLY, value = "true")
    })
    @Query("SELECT r FROM RutaOptimizada r ORDER BY r.idRuta ASC")
    Stream<RutaOptimizada> streamAllRutasParaReporte();

    /**
     * Consulta filtrada con lectura de cursor JDBC y Stream reactivo.
     * Se aplican casts explícitos para evitar incompatibilidad de tipos (bytea) en PostgreSQL cuando un parámetro es null.
     */
    @QueryHints(value = {
        @QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "500"),
        @QueryHint(name = HibernateHints.HINT_CACHEABLE, value = "false"),
        @QueryHint(name = HibernateHints.HINT_READ_ONLY, value = "true")
    })
    @Query("""
        SELECT r FROM RutaOptimizada r
        WHERE (cast(:fechaInicio as java.time.LocalDateTime) IS NULL OR r.fechaCalculo >= :fechaInicio)
          AND (cast(:fechaFin as java.time.LocalDateTime) IS NULL OR r.fechaCalculo <= :fechaFin)
          AND (cast(:estado as String) IS NULL OR UPPER(r.estadoRuta) = UPPER(cast(:estado as String)))
        ORDER BY r.idRuta ASC
    """)
    Stream<RutaOptimizada> streamRutasParaReporte(
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin,
        @Param("estado") String estado
    );
}
