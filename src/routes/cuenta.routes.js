// src/routes/cuenta.routes.js
import { Router } from "express";
import cuentaController from "../controllers/cuenta.controller.js";

const router = Router();

/**
 * ORDEN DE RUTAS
 * 1) POST / PUT
 * 2) Rutas con parámetros
 * 3) Listado general (al final)
 */

// Crear cuenta
router.post("/", cuentaController.crearCuenta);

// Obtener cuenta por ID
router.get("/:id", cuentaController.obtenerCuentaPorId);

// Editar cuenta
router.put("/:id", cuentaController.actualizarCuenta);

// Obtener movimientos de una cuenta
router.get("/:id/movimientos", cuentaController.obtenerMovimientos);

// TODAS LAS CUENTAS – SIEMPRE AL FINAL
router.get("/", cuentaController.obtenerCuentas);

export default router;
