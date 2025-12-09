// src/controllers/cuenta.controller.js
import cuentaService from "../services/cuenta.service.js";

const cuentaController = {

    crearCuenta: async (req, res) => {
        try {
            const cuenta = await cuentaService.crearCuenta(req.body);
            return res.status(201).json({ ok: true, cuenta });
        } catch (err) {
            console.error("cuenta.controller.crearCuenta:", err);
            return res.status(400).json({ ok: false, msg: err.message });
        }
    },

    obtenerCuentaPorId: async (req, res) => {
        try {
            const cuenta = await cuentaService.obtenerCuentaPorId(Number(req.params.id));
            if (!cuenta) return res.status(404).json({ ok: false, msg: "Cuenta no encontrada" });
            return res.json({ ok: true, cuenta });
        } catch (err) {
            console.error("cuenta.controller.obtenerCuentaPorId:", err);
            return res.status(500).json({ ok: false, msg: err.message });
        }
    },

    obtenerCuentas: async (req, res) => {
        try {
            const cuentas = await cuentaService.obtenerCuentas();
            return res.json({ ok: true, cuentas });
        } catch (err) {
            console.error("cuenta.controller.obtenerCuentas:", err);
            return res.status(500).json({ ok: false, msg: err.message });
        }
    },

    actualizarCuenta: async (req, res) => {
        try {
            const cuenta = await cuentaService.actualizarCuenta(Number(req.params.id), req.body);
            return res.json({ ok: true, cuenta });
        } catch (err) {
            console.error("cuenta.controller.actualizarCuenta:", err);
            return res.status(400).json({ ok: false, msg: err.message });
        }
    },

    obtenerMovimientos: async (req, res) => {
        try {
            const movimientos = await cuentaService.obtenerMovimientos(Number(req.params.id));
            return res.json({ ok: true, movimientos });
        } catch (err) {
            console.error("cuenta.controller.obtenerMovimientos:", err);
            return res.status(500).json({ ok: false, msg: err.message });
        }
    }

};

export default cuentaController;
