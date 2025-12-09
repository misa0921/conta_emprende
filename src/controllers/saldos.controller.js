import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const saldoController = {};

// Todas las cuentas
saldoController.getSaldos = async (req, res) => {
  try {
    const cuentas = await prisma.cuenta.findMany();
    res.json(cuentas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener cuentas" });
  }
};

// Movimientos de una cuenta
saldoController.getMovimientos = async (req, res) => {
  const { cuentaId } = req.params;
  try {
    const movimientos = await prisma.movimientoCuenta.findMany({
      where: { cuentaId: parseInt(cuentaId) },
      orderBy: { fecha: 'desc' }
    });
    res.json(movimientos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener movimientos" });
  }
};

// Resumen total Banco / Caja Chica
saldoController.getResumen = async (req, res) => {
  try {
    const cuentas = await prisma.cuenta.findMany();
    const resumen = cuentas.reduce(
      (acc, c) => {
        if (c.tipo === "BANCO") acc.banco += c.saldo;
        if (c.tipo === "CAJA_CHICA") acc.cajaChica += c.saldo;
        return acc;
      },
      { banco: 0, cajaChica: 0 }
    );
    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener resumen de saldos" });
  }
};

export default saldoController;
