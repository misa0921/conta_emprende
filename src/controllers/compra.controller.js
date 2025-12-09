// src/controllers/compra.controller.js
import compraService from "../services/compra.service.js";
import ExcelJS from "exceljs";

const compraController = {

  // Crear compra
  crearCompra: async (req, res) => {
    try {
      const usuarioId = req.user?.id ?? req.body.usuarioId;
      const payload = { ...req.body, usuarioId };

      const compra = await compraService.crearCompra(payload);
      return res.status(201).json({ ok: true, compra });
    } catch (err) {
      console.error("compra.controller.crearCompra:", err);
      return res.status(400).json({ ok: false, msg: err.message || "Error al crear compra" });
    }
  },

  // Pagar compra
  pagarCompra: async (req, res) => {
    try {
      const compraId = Number(req.params.id);
      const usuarioId = req.user?.id ?? req.body.usuarioId ?? 1; // si no tienes auth, usa usuarioId del body o 1
      const { cuentaId, permitirSaldoNegativo, cuenta } = req.body;
      // cuenta: opcional objeto { nombre, tipo, saldo } para crearla y usarla

      const resPago = await compraService.pagarCompra({
        compraId,
        cuentaId: cuentaId ? Number(cuentaId) : null,
        nuevaCuenta: cuenta ?? null,
        usuarioId: Number(usuarioId),
        permitirSaldoNegativo: Boolean(permitirSaldoNegativo)
      });

      return res.json({ ok: true, pago: resPago });
    } catch (err) {
      console.error("compra.controller.pagarCompra:", err);
      return res.status(400).json({ ok: false, msg: err.message || "Error al procesar pago" });
    }
  },

  // Reporte mensual
  obtenerComprasPorMes: async (req, res) => {
    try {
      const { year, month } = req.params;
      const compras = await compraService.obtenerComprasPorMes(Number(year), Number(month));
      return res.json({ ok: true, compras });
    } catch (err) {
      console.error("compra.controller.obtenerComprasPorMes:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener compras" });
    }
  },

  // Obtener compra por ID
  obtenerCompraPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const compra = await compraService.obtenerCompraPorId(Number(id));
      if (!compra) return res.status(404).json({ ok: false, msg: "Compra no encontrada" });
      return res.json({ ok: true, compra });
    } catch (err) {
      console.error("compra.controller.obtenerCompraPorId:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener compra" });
    }
  },

  // 🔥 NUEVO: Obtener todas las compras
  obtenerTodas: async (req, res) => {
    try {
      const compras = await compraService.obtenerTodas();
      return res.json({ ok: true, compras });
    } catch (err) {
      console.error("compra.controller.obtenerTodas:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener compras" });
    }
  },
  actualizarCompra: async (req, res) => {
    try {
        const compraId = Number(req.params.id);
        const usuarioId = req.user?.id ?? req.body.usuarioId;

        const payload = {
            ...req.body,
            usuarioId
        };

        const updated = await compraService.actualizarCompra(compraId, payload);

        return res.json({ ok: true, compra: updated });

    } catch (err) {
        console.error("compra.controller.actualizarCompra:", err);
        return res.status(400).json({ ok: false, msg: err.message });
    }
},
reporteCompras: async (req, res) => {
    try {
        const filtros = req.query;
        const data = await compraService.reporteCompras(filtros);

        return res.json({ ok: true, data });

    } catch (err) {
        console.error("reporteCompras:", err);
        return res.status(500).json({ ok: false, msg: err.message });
    }
},
reporteExcel: async (req, res) => {
    try {
        const filtros = req.query;
        const data = await compraService.reporteCompras(filtros);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Reporte Compras");

        sheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Proveedor", key: "proveedor", width: 25 },
            { header: "Factura", key: "num_factura", width: 20 },
            { header: "Fecha", key: "fecha", width: 15 },
            { header: "Base", key: "base", width: 10 },
            { header: "IVA", key: "iva", width: 10 },
            { header: "Total", key: "total", width: 12 },
            { header: "Estado", key: "estado", width: 12 },
        ];

        data.forEach(c => {
            sheet.addRow({
                id: c.id,
                proveedor: c.proveedor.nombre,
                num_factura: c.num_factura,
                fecha: new Date(c.fecha_emision).toLocaleDateString(),
                base: c.base,
                iva: c.iva,
                total: c.total,
                estado: c.estado
            });
        });

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=reporte_compras.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error("reporteExcel:", err);
        res.status(500).json({ ok: false, msg: err.message });
    }
}



};

export default compraController;
