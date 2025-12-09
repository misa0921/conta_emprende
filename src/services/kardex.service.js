// src/services/kardex.service.js
import prisma from "../lib/prisma.js";

/**
 * Servicio para manejar el Kardex (Movimientos de Inventario)
 * 
 * Funcionalidades:
 * - obtenerMovimientos(filtros): Consultar movimientos con filtros
 * - obtenerMovimientosPorProducto(productoId, filtros): Kardex de un producto específico
 * - obtenerResumenProducto(productoId): Resumen de entradas, salidas y stock actual
 */

const kardexService = {
  /**
   * Obtener movimientos de inventario con filtros opcionales
   */
  obtenerMovimientos: async (filtros = {}) => {
    const { productoId, tipo, desde, hasta } = filtros;
    
    const where = {};

    // Filtro por producto
    if (productoId) {
      where.productoId = Number(productoId);
    }

    // Filtro por tipo (ENTRADA/SALIDA)
    if (tipo) {
      where.tipo = String(tipo).toUpperCase();
    }

    // Filtro por rango de fechas
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: true
      },
      orderBy: {
        fecha: "desc"
      }
    });

    return movimientos;
  },

  /**
   * Obtener kardex completo de un producto específico
   */
  obtenerMovimientosPorProducto: async (productoId, filtros = {}) => {
    const { desde, hasta, tipo } = filtros;
    
    const where = {
      productoId: Number(productoId)
    };

    if (tipo) {
      where.tipo = String(tipo).toUpperCase();
    }

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) where.fecha.lte = new Date(hasta);
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        producto: true
      },
      orderBy: {
        fecha: "asc" // Orden cronológico para el kardex
      }
    });

    return movimientos;
  },

  /**
   * Obtener resumen de un producto (totales de entradas y salidas)
   */
  obtenerResumenProducto: async (productoId) => {
    const producto = await prisma.producto.findUnique({
      where: { id: Number(productoId) },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" }
        }
      }
    });

    if (!producto) {
      throw new Error("Producto no encontrado");
    }

    // Calcular totales
    const entradas = producto.movimientos
      .filter(m => m.tipo === "ENTRADA")
      .reduce((sum, m) => sum + m.cantidad, 0);

    const salidas = producto.movimientos
      .filter(m => m.tipo === "SALIDA")
      .reduce((sum, m) => sum + m.cantidad, 0);

    const costoTotalEntradas = producto.movimientos
      .filter(m => m.tipo === "ENTRADA")
      .reduce((sum, m) => sum + m.costo_total, 0);

    const costoTotalSalidas = producto.movimientos
      .filter(m => m.tipo === "SALIDA")
      .reduce((sum, m) => sum + m.costo_total, 0);

    return {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        stock_actual: producto.stock
      },
      resumen: {
        total_entradas: entradas,
        total_salidas: salidas,
        costo_total_entradas: costoTotalEntradas,
        costo_total_salidas: costoTotalSalidas,
        stock_actual: producto.stock
      },
      movimientos: producto.movimientos
    };
  },

  /**
   * Obtener todos los productos con su stock actual (para el selector)
   */
  obtenerProductos: async () => {
    return await prisma.producto.findMany({
      select: {
        id: true,
        nombre: true,
        stock: true
      },
      orderBy: {
        nombre: "asc"
      }
    });
  }
};

export default kardexService;