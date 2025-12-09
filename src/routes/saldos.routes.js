import { Router } from "express";
import saldoController from '../controllers/saldos.controller.js';

const router = Router();

// Obtener todas las cuentas
router.get('/', saldoController.getSaldos);

// Obtener movimientos de una cuenta específica
router.get('/movimientos/:cuentaId', saldoController.getMovimientos);

// Obtener resumen total de Banco y Caja Chica
router.get('/resumen', saldoController.getResumen);

export default router;
