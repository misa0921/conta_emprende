import { Router } from "express";
import productoController from "../controllers/producto.controller.js";

const router = Router();

// PDF primero para evitar conflicto con "/:id"
router.get("/reporte/pdf", productoController.generarPDF);
router.post("/", productoController.crearProducto);
router.get("/", productoController.obtenerProductos);
router.get("/:id", productoController.obtenerProductoPorId);
router.put("/:id", productoController.actualizarProducto);
router.delete("/:id", productoController.eliminarProducto);

export default router;
