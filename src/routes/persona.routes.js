import { Router } from "express";
import personaController from "../controllers/persona.controller.js";

const router = Router();

router.post("/", personaController.crearPersona);
router.get("/", personaController.obtenerPersonas);

// 👉 NUEVA RUTA PARA CONSULTAR SOLO LOS PROVEEDORES
router.get("/proveedores", personaController.obtenerProveedores);
// persona.routes.js
router.get("/clientes", personaController.obtenerClientes);

export default router;
