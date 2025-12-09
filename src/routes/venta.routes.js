// src/routes/venta.routes.js
import { Router } from "express";
import ventaController from "../controllers/venta.controller.js";

const router = Router();

/**
 * ORDEN CORRECTO DE RUTAS
 * 1) Rutas específicas primero
 * 2) Rutas dinámicas definidas (detalle/:id)
 * 3) Rutas largas como reportes y excel
 * 4) Rutas genéricas al final
 */

router.post("/", ventaController.crearVenta);
router.post("/:id/cobrar", ventaController.cobrarVenta);

// Rutas específicas
router.get("/detalle/:id", ventaController.obtenerVentaPorId);
router.get("/venta/:id", ventaController.obtenerVentaPorId);

router.put("/:id", ventaController.actualizarVenta);

// Reportes
router.get("/reportes", ventaController.reporteVentas);
router.get("/reportes/excel", ventaController.reporteExcel);

// Reporte por mes
router.get("/reporte/:year/:month", ventaController.obtenerVentasPorMes);

// Todas
router.get("/", ventaController.obtenerTodas);

export default router;
