import { Router } from "express";

import kardexRoutes from "./kardex.route.js";
import usuarioRoutes from "./usuario.routes.js";
import productoRoutes from "./producto.routes.js";
import compraRoutes from "./compra.routes.js";
import ventaRoutes from "./venta.routes.js";
import authRoutes from "./auth.routes.js";   // 👈 AGREGAR ESTO
import personaRoutes from "./persona.routes.js";
import cuentaRoutes from "./cuenta.routes.js";
import saldosRouter from './saldos.routes.js';
const router = Router();

router.use("/auth", authRoutes); // 👈 AGREGAR ESTO ANTES DE LAS OTRAS RUTAS

router.use("/kardex", kardexRoutes);  // 👈 AGREGAR ESTO
router.use("/usuarios", usuarioRoutes);
router.use("/productos", productoRoutes);
router.use("/compras", compraRoutes);
router.use("/ventas", ventaRoutes);
router.use("/personas", personaRoutes);
router.use("/cuentas", cuentaRoutes);
router.use("/saldos", saldosRouter);


export default router;
