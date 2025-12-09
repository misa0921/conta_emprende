// src/services/cuenta.service.js
import prisma from "../lib/prisma.js";

const cuentaService = {

  // Obtener todas las cuentas
  obtenerCuentas: async () => {
    return await prisma.cuenta.findMany({ orderBy: { id: "asc" } });
  },

  // Crear una cuenta nueva
crearCuenta: async ({ nombre, tipo, saldo, bancoNombre, bancoTipo }) => {
  return await prisma.cuenta.create({
    data: {
      nombre,
      tipo, // BANCO o CAJA_CHICA
      saldo: Number(saldo || 0),

      // si es banco se guardan, si es caja chica quedan como null
      bancoNombre: tipo === "BANCO" ? bancoNombre : null,
      bancoTipo: tipo === "BANCO" ? bancoTipo : null,
    }
  });
},

  // Buscar cuenta por ID
  obtenerCuentaPorId: async (id) => {
    return await prisma.cuenta.findUnique({
      where: { id: Number(id) }
    });
  },

  // Obtener movimientos de la cuenta (pagos / cobros / ajustes)
  obtenerMovimientos: async (cuentaId) => {
    return await prisma.movimientoCuenta.findMany({
      where: { cuentaId: Number(cuentaId) },
      orderBy: { fecha: "desc" },
      include: { usuario: true, compra: true, venta: true }
    });
  },

  // 🔥 Actualizar nombre / tipo / saldo inicial
  actualizarCuenta: async (id, data) => {
    const { nombre, tipo, saldo } = data;

    return await prisma.cuenta.update({
      where: { id: Number(id) },
      data: {
        nombre,
        tipo,
        ...(saldo !== undefined && { saldo: Number(saldo) }) // solo si viene
      }
    });
  },

  // Ajuste de saldo manual (solo si tú lo usas)
  ajustarSaldo: async (cuentaId, monto, usuarioId = null) => {
    return await prisma.$transaction(async (tx) => {

      const cuentaActualizada = await tx.cuenta.update({
        where: { id: Number(cuentaId) },
        data: { saldo: { increment: monto } }
      });

      const movimiento = await tx.movimientoCuenta.create({
        data: {
          cuentaId: Number(cuentaId),
          tipo: "AJUSTE",
          monto,
          usuarioId: usuarioId ? Number(usuarioId) : undefined
        }
      });

      return { cuentaActualizada, movimiento };
    });
  }
};

export default cuentaService;
