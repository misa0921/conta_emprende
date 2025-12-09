import prisma from '../prismaClient.js';

// Obtener todas las cuentas
const obtenerSaldos = async () => {
  return await prisma.cuenta.findMany();
};

// Obtener movimientos de una cuenta (solo PAGO)
const obtenerMovimientos = async (cuentaId) => {
  return await prisma.movimientoCuenta.findMany({
    where: { cuentaId: parseInt(cuentaId), tipo: 'PAGO' },
    include: { compra: true },
    orderBy: { fecha: 'desc' }
  });
};

// Obtener todos los pagos (egresos)
const obtenerReportePagos = async () => {
  return await prisma.movimientoCuenta.findMany({
    where: { tipo: 'PAGO' },
    include: { cuenta: true, compra: true },
    orderBy: { fecha: 'desc' }
  });
};

export default { obtenerSaldos, obtenerMovimientos, obtenerReportePagos };
