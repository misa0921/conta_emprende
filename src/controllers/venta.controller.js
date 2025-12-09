// src/controllers/venta.controller.js
import ventaService from "../services/venta.service.js";
import ExcelJS from "exceljs";

const ventaController = {

  crearVenta: async (req, res) => {
    try {
      const usuarioId = req.user?.id ?? req.body.usuarioId;
      const payload = { ...req.body, usuarioId };

      const venta = await ventaService.crearVenta(payload);
      return res.status(201).json({ ok: true, venta });
    } catch (err) {
      console.error("venta.controller.crearVenta:", err);
      return res.status(400).json({ ok: false, msg: err.message });
    }
  },

cobrarVenta: async (req, res) => {
  try {
    const ventaId = Number(req.params.id);
    const usuarioId = req.user?.id ?? req.body.usuarioId ?? 1;

    const { cuentaId, permitirSaldoNegativo, cuenta } = req.body;

    // Verificar si la venta ya está cobrada
    const ventaExistente = await ventaService.obtenerVentaPorId(ventaId);
    if (!ventaExistente) return res.status(404).json({ ok: false, msg: "Venta no encontrada" });
    
    if (ventaExistente.estado === "COBRADA") {
      return res.status(400).json({ ok: false, msg: "La venta ya ha sido cobrada" });
    }

    // Usar transacción para asegurar que todo el proceso sea atómico
    const data = await ventaService.cobrarVenta({
      ventaId,
      cuentaId: cuentaId ? Number(cuentaId) : null,
      nuevaCuenta: cuenta ?? null,
      usuarioId: Number(usuarioId),
      permitirSaldoNegativo: Boolean(permitirSaldoNegativo)
    });

    // ❌ ELIMINAR ESTAS LÍNEAS (43-46):
    // await ventaService.actualizarVenta(ventaId, { 
    //   estado: "COBRADA",
    //   clienteId: clienteId ?? ventaExistente.clienteId
    // });

    return res.json({ ok: true, cobro: data });
  } catch (err) {
    console.error("venta.controller.cobrarVenta:", err);
    return res.status(400).json({ ok: false, msg: err.message });
  }
},


  obtenerVentasPorMes: async (req, res) => {
    try {
      const { year, month } = req.params;
      const ventas = await ventaService.obtenerVentasPorMes(Number(year), Number(month));
      return res.json({ ok: true, ventas });
    } catch (err) {
      console.error("venta.controller.obtenerVentasPorMes:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener ventas" });
    }
  },

  obtenerVentaPorId: async (req, res) => {
    try {
      const venta = await ventaService.obtenerVentaPorId(Number(req.params.id));
      if (!venta) return res.status(404).json({ ok: false, msg: "Venta no encontrada" });
      return res.json({ ok: true, venta });
    } catch (err) {
      console.error("venta.controller.obtenerVentaPorId:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener venta" });
    }
  },

  obtenerTodas: async (req, res) => {
    try {
      const ventas = await ventaService.obtenerTodas();
      return res.json({ ok: true, ventas });
    } catch (err) {
      console.error("venta.controller.obtenerTodas:", err);
      return res.status(500).json({ ok: false, msg: "Error al obtener ventas" });
    }
  },

  actualizarVenta: async (req, res) => {
    try {
      const ventaId = Number(req.params.id);
      const usuarioId = req.user?.id ?? req.body.usuarioId;

      const payload = { ...req.body, usuarioId };

      const updated = await ventaService.actualizarVenta(ventaId, payload);
      return res.json({ ok: true, venta: updated });

    } catch (err) {
      console.error("venta.controller.actualizarVenta:", err);
      return res.status(400).json({ ok: false, msg: err.message });
    }
  },

  reporteVentas: async (req, res) => {
    try {
      const data = await ventaService.reporteVentas(req.query);
      return res.json({ ok: true, data });
    } catch (err) {
      console.error("venta.controller.reporteVentas:", err);
      return res.status(500).json({ ok: false, msg: err.message });
    }
  },

 reporteExcel: async (req, res) => {
    try {
      const filtros = req.query;
      const data = await ventaService.reporteVentas(filtros);

      // ✅ Ahora sí funciona directamente
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Reporte Ventas");

      sheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Cliente", key: "cliente", width: 25 },
        { header: "Factura", key: "factura", width: 20 },
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Base", key: "base", width: 10 },
        { header: "IVA", key: "iva", width: 10 },
        { header: "Total", key: "total", width: 12 },
        { header: "Estado", key: "estado", width: 12 },
      ];

      data.forEach(v => {
        sheet.addRow({
          id: v.id,
          cliente: v.cliente.nombre,
          factura: v.num_factura,
          fecha: new Date(v.fecha_emision).toLocaleDateString(),
          base: v.base,
          iva: v.iva,
          total: v.total,
          estado: v.estado
        });
      });

      res.setHeader("Content-Disposition", "attachment; filename=reporte_ventas.xlsx");
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("venta.controller.reporteExcel:", err);
      res.status(500).json({ ok: false, msg: err.message });
    }
  }
};


export default ventaController;
