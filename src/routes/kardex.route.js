// src/routes/kardex.routes.js
import { Router } from "express";
import kardexController from "../controllers/kardex.controller.js";

const router = Router();

/**
 * RUTAS DEL KARDEX
 * 
 * GET    /api/kardex                    - Obtener todos los movimientos (con filtros opcionales)
 * GET    /api/kardex/productos          - Obtener lista de productos
 * GET    /api/kardex/producto/:id       - Obtener kardex de un producto
 * GET    /api/kardex/resumen/:id        - Obtener resumen de un producto
 * GET    /api/kardex/excel              - Exportar a Excel
 */

// Rutas específicas primero
router.get("/productos", kardexController.obtenerProductos);
router.get("/excel", kardexController.exportarExcel);
router.get("/resumen/:id", kardexController.obtenerResumen);
router.get("/producto/:id", kardexController.obtenerPorProducto);

// Ruta general al final
router.get("/", kardexController.obtenerMovimientos);

export default router;