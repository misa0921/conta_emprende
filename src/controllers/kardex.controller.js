// src/controllers/kardex.controller.js
import kardexService from "../services/kardex.service.js";
import ExcelJS from "exceljs";

const kardexController = {
  /**
   * Obtener movimientos con filtros opcionales
   * GET /api/kardex?productoId=1&tipo=ENTRADA&desde=2024-01-01&hasta=2024-12-31
   */
  obtenerMovimientos: async (req, res) => {
    try {
      const filtros = req.query;
      const movimientos = await kardexService.obtenerMovimientos(filtros);
      
      return res.json({ 
        ok: true, 
        data: movimientos,
        total: movimientos.length
      });
    } catch (err) {
      console.error("kardex.controller.obtenerMovimientos:", err);
      return res.status(500).json({ 
        ok: false, 
        msg: "Error al obtener movimientos",
        error: err.message
      });
    }
  },

  /**
   * Obtener kardex de un producto específico
   * GET /api/kardex/producto/:id
   */
  obtenerPorProducto: async (req, res) => {
    try {
      const productoId = Number(req.params.id);
      const filtros = req.query;
      
      const movimientos = await kardexService.obtenerMovimientosPorProducto(productoId, filtros);
      
      return res.json({ 
        ok: true, 
        data: movimientos,
        total: movimientos.length
      });
    } catch (err) {
      console.error("kardex.controller.obtenerPorProducto:", err);
      return res.status(500).json({ 
        ok: false, 
        msg: "Error al obtener kardex del producto",
        error: err.message
      });
    }
  },

  /**
   * Obtener resumen de un producto
   * GET /api/kardex/resumen/:id
   */
  obtenerResumen: async (req, res) => {
    try {
      const productoId = Number(req.params.id);
      const resumen = await kardexService.obtenerResumenProducto(productoId);
      
      return res.json({ 
        ok: true, 
        data: resumen
      });
    } catch (err) {
      console.error("kardex.controller.obtenerResumen:", err);
      return res.status(404).json({ 
        ok: false, 
        msg: err.message
      });
    }
  },

  /**
   * Obtener lista de productos
   * GET /api/kardex/productos
   */
  obtenerProductos: async (req, res) => {
    try {
      const productos = await kardexService.obtenerProductos();
      
      return res.json({ 
        ok: true, 
        data: productos
      });
    } catch (err) {
      console.error("kardex.controller.obtenerProductos:", err);
      return res.status(500).json({ 
        ok: false, 
        msg: "Error al obtener productos"
      });
    }
  },

  /**
   * Exportar kardex a Excel
   * GET /api/kardex/excel?productoId=1&desde=2024-01-01&hasta=2024-12-31
   */
  exportarExcel: async (req, res) => {
    try {
      const filtros = req.query;
      const movimientos = await kardexService.obtenerMovimientos(filtros);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Kardex");

      // Configurar columnas
      sheet.columns = [
        { header: "ID", key: "id", width: 8 },
        { header: "Fecha", key: "fecha", width: 15 },
        { header: "Producto", key: "producto", width: 30 },
        { header: "Tipo", key: "tipo", width: 12 },
        { header: "Cantidad", key: "cantidad", width: 10 },
        { header: "Costo Unit.", key: "costo_unitario", width: 12 },
        { header: "Costo Total", key: "costo_total", width: 12 },
        { header: "Stock Antes", key: "stock_antes", width: 12 },
        { header: "Stock Después", key: "stock_despues", width: 12 },
        { header: "Referencia", key: "referencia", width: 15 },
      ];

      // Agregar datos
      movimientos.forEach(m => {
        sheet.addRow({
          id: m.id,
          fecha: new Date(m.fecha).toLocaleDateString(),
          producto: m.producto.nombre,
          tipo: m.tipo,
          cantidad: m.cantidad,
          costo_unitario: m.costo_unitario,
          costo_total: m.costo_total,
          stock_antes: m.stock_antes,
          stock_despues: m.stock_despues,
          referencia: m.referenciaTipo ? `${m.referenciaTipo} #${m.referenciaId}` : "N/A"
        });
      });

      // Estilo de encabezados
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }
      };

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=kardex.xlsx"
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (err) {
      console.error("kardex.controller.exportarExcel:", err);
      res.status(500).json({ 
        ok: false, 
        msg: "Error al generar Excel",
        error: err.message
      });
    }
  }
};

export default kardexController;