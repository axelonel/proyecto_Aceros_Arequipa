package com.example.demo;

import com.example.demo.dto.OptimizacionRequestDto;
import com.example.demo.dto.OptimizacionResponseDto;
import com.example.demo.service.RutaOptimizationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DemoApplicationTests {

	@Autowired
	private RutaOptimizationService rutaOptimizationService;

	@Test
	void testGoogleOrToolsServiceExecution() {
		OptimizacionRequestDto request = new OptimizacionRequestDto();
		request.setOrigen("A");
		request.setDestino("F");
		request.setMaterial("Bobinas de acero (24 Tn)");
		request.setPeso(24.0);
		request.setObjetivo("equilibrio");
		request.setPrioridad("Alta");
		request.setEvitarTrafico(true);
		request.setEvitarMantenimiento(false);

		OptimizacionResponseDto response = rutaOptimizationService.optimizarYPersistir(request);

		assertNotNull(response);
		assertTrue(response.isExito());
		assertNotNull(response.getIdRuta());
		assertNotNull(response.getIdPedido());
		assertNotNull(response.getRutaOptimaTrayecto());
		assertTrue(response.getDistanciaKm() > 0);
		assertTrue(response.getTiempoMinutos() > 0);
		assertTrue(response.getCostoSoles() > 0);
		assertEquals(3, response.getRutasAlternativas().size());

		System.out.println("✅ Test Exitoso: Ruta optimizada con Google OR-Tools: " + response.getRutaOptimaTrayecto());
		System.out.println("   Distancia: " + response.getDistanciaKm() + " km | Tiempo: " + response.getTiempoMinutos() + " min | Costo: S/ " + response.getCostoSoles());
	}
}
