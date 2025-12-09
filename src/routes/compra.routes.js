// src/routes/compra.routes.js
import { Router } from "express";
import compraController from "../controllers/compra.controller.js";

const router = Router();

/**
 * ORDEN CORRECTO DE RUTAS
 * 1) Rutas específicas primero
 * 2) Rutas dinámicas definidas (detalle/:id)
 * 3) Rutas con parámetros largos (reporte/:year/:month)
 * 4) Rutas genéricas al final
 */

router.post("/", compraController.crearCompra);
router.post("/:id/pagar", compraController.pagarCompra);

// RUTAS ESPECÍFICAS
router.get("/detalle/:id", compraController.obtenerCompraPorId);

router.put("/:id", compraController.actualizarCompra);

// REPORTES (SIEMPRE ANTES DE RUTAS DINÁMICAS SIMPLES)
router.get("/reportes", compraController.reporteCompras);
router.get("/reportes/excel", compraController.reporteExcel);

// REPORTE POR MES – ruta larga, NO puede ir arriba
router.get("/reporte/:year/:month", compraController.obtenerComprasPorMes);

// TODAS LAS COMPRAS – SIEMPRE AL FINAL
router.get("/", compraController.obtenerTodas);

export default router;
