// src/services/compra.service.js
import prisma from "../lib/prisma.js";

/**
 * Servicio para manejar compras.
 *
 * Funciones:
 * - crearCompra(payload)
 * - pagarCompra({ compraId, cuentaId, usuarioId, permitirSaldoNegativo })
 * - obtenerComprasPorMes(year, month)
 * - obtenerCompraPorId(id)
 *
 * NOTA: el pago se implementa por separado (POST /api/compras/:id/pagar)
 */

const validateFactura = (numFactura) => {
  if (!numFactura) return "Número de factura es obligatorio";
  if (String(numFactura).length !== 15) return "Número de factura debe tener 15 caracteres";
  return null;
};

const validateAutorizacion = (numAut) => {
  if (!numAut) return "Número de autorización es obligatorio";
  if (String(numAut).length !== 20) return "Número de autorización debe tener 20 caracteres";
  return null;
};

const validateDetalles = (detalles) => {
  if (!Array.isArray(detalles) || detalles.length === 0) return "Detalles de compra obligatorios";
  for (const d of detalles) {
    if (!d.productoId) return "Cada detalle debe contener productoId";
    if (isNaN(Number(d.cantidad)) || Number(d.cantidad) <= 0) return "Cantidad inválida en detalle";
    if (isNaN(Number(d.precio_unit)) || Number(d.precio_unit) < 0) return "Precio unitario inválido en detalle";
  }
  return null;
};

const calcularIvaYTotal = (base, iva_tipo) => {
  const baseNum = Number(base) || 0;
  let iva = 0;
  const ivaTipo = String(iva_tipo).toUpperCase();
  if (ivaTipo === "QUINCE" || ivaTipo === "15" || ivaTipo === "15%") {
    iva = Number((baseNum * 0.15).toFixed(2));
  } else {
    iva = 0;
  }
  const total = Number((baseNum + iva).toFixed(2));
  return { base: baseNum, iva, total };
};

const compraService = {
  crearCompra: async (payload) => {
    const {
      proveedorId,
      usuarioId,
      num_factura,
      num_autorizacion,
      fecha_emision,
      base,
      iva_tipo,        // "CERO" | "QUINCE" | "NO_OBJETO"
      forma_pago,      // "CAJA_CHICA" | "BANCO"
      detalles
    } = payload;

    if (!proveedorId) throw new Error("ProveedorId es obligatorio");
    if (!usuarioId) throw new Error("UsuarioId es obligatorio");

    const vFac = validateFactura(num_factura);
    if (vFac) throw new Error(vFac);

    const vAut = validateAutorizacion(num_autorizacion);
    if (vAut) throw new Error(vAut);

    const vDet = validateDetalles(detalles);
    if (vDet) throw new Error(vDet);

    const { base: baseNum, iva, total } = calcularIvaYTotal(base, iva_tipo);

    const detallesCreate = detalles.map(d => {
      const cantidad = Number(d.cantidad);
      const precio_unit = Number(d.precio_unit);
      return {
        producto: { connect: { id: Number(d.productoId) } },
        cantidad,
        precio_unit,
        subtotal: Number((cantidad * precio_unit).toFixed(2))
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const compra = await tx.compra.create({
        data: {
          proveedorId: Number(proveedorId),
          usuarioId: Number(usuarioId),
          num_factura: String(num_factura),
          num_autorizacion: String(num_autorizacion),
          fecha_emision: fecha_emision ? new Date(fecha_emision) : new Date(),
          base: baseNum,
          iva,
          iva_tipo: String(iva_tipo),
          total,
          forma_pago: String(forma_pago),
          estado: "PENDIENTE",
          detalles: { create: detallesCreate }
        },
        include: { detalles: true }
      });

      // Actualizar stock y registrar movimiento de inventario por cada detalle
      for (const d of detalles) {
        const productoId = Number(d.productoId);
        const cantidad = Number(d.cantidad);
        // obtener stock antes (opcional, para kardex)
        const prodBefore = await tx.producto.findUnique({ where: { id: productoId } });
        const stockAntes = prodBefore?.stock ?? 0;
        const stockDespues = stockAntes + cantidad;

        // actualizar stock
        await tx.producto.update({
          where: { id: productoId },
          data: { stock: { increment: cantidad } }
        });

        // crear movimiento inventario (kardex)
        await tx.movimientoInventario.create({
          data: {
            productoId,
            tipo: "ENTRADA",
            cantidad,
            costo_unitario: Number(d.precio_unit),
            costo_total: Number((cantidad * Number(d.precio_unit)).toFixed(2)),
            stock_antes: stockAntes,
            stock_despues: stockDespues,
            referenciaTipo: "COMPRA",
            referenciaId: compra.id
          }
        });
      }

      // devolver la compra completa con detalles y proveedor
      const compraFull = await tx.compra.findUnique({
        where: { id: compra.id },
        include: { detalles: { include: { producto: true } }, proveedor: true, pagos: true }
      });

      return compraFull;
    });

    return result;
  },

 pagarCompra: async ({ compraId, cuentaId = null, nuevaCuenta = null, usuarioId, permitirSaldoNegativo = false }) => {
    if (!compraId) throw new Error("compraId es obligatorio");
    if (!usuarioId) throw new Error("usuarioId es obligatorio");

    return await prisma.$transaction(async (tx) => {
      // Obtener compra
      const compra = await tx.compra.findUnique({ where: { id: Number(compraId) } });
      if (!compra) throw new Error("Compra no encontrada");
      if (compra.estado === "PAGADA") throw new Error("La compra ya está pagada");

      // Si es necesario crear cuenta nueva, crear aquí
      let usedCuentaId = cuentaId ? Number(cuentaId) : null;
      if (!usedCuentaId && nuevaCuenta) {
        const c = await tx.cuenta.create({
          data: {
            nombre: nuevaCuenta.nombre,
            tipo: nuevaCuenta.tipo, // debe ser 'BANCO' o 'CAJA_CHICA'
            saldo: Number(nuevaCuenta.saldo ?? 0)
          }
        });
        usedCuentaId = c.id;
      }

      if (!usedCuentaId) {
        throw new Error("Cuenta no proporcionada ni creada");
      }

      // Obtener cuenta
      const cuenta = await tx.cuenta.findUnique({ where: { id: Number(usedCuentaId) } });
      if (!cuenta) throw new Error("Cuenta no encontrada");

      // Verificar saldo (si no se permite saldo negativo)
      if (!permitirSaldoNegativo && Number(cuenta.saldo) < Number(compra.total)) {
        throw new Error("Saldo insuficiente en la cuenta seleccionada");
      }

      // Registrar movimiento de cuenta (PAGO)
      const mov = await tx.movimientoCuenta.create({
        data: {
          cuentaId: Number(usedCuentaId),
          tipo: "PAGO",
          monto: Number(compra.total),
          referencia: `Pago compra #${compra.id}`,
          compraId: compra.id,
          usuarioId: Number(usuarioId)
        }
      });

      // Actualizar saldo de la cuenta (decrementar)
      await tx.cuenta.update({
        where: { id: Number(usedCuentaId) },
        data: { saldo: { decrement: Number(compra.total) } }
      });

      // Marcar compra como PAGADA
      await tx.compra.update({
        where: { id: compra.id },
        data: { estado: "PAGADA" }
      });

      return { ok: true, pago: mov, cuentaId: usedCuentaId };
    });
  },

  obtenerComprasPorMes: async (year, month) => {
    const inicio = new Date(year, month - 1, 1);
    const fin = new Date(year, month, 1);
    return prisma.compra.findMany({
      where: { fecha_emision: { gte: inicio, lt: fin } },
      include: { proveedor: true, detalles: { include: { producto: true } }, pagos: true }
    });
  },

  obtenerCompraPorId: async (id) => {
    return prisma.compra.findUnique({
      where: { id: Number(id) },
      include: { proveedor: true, detalles: { include: { producto: true } }, pagos: true }
    });
  },
  obtenerTodas: async () => {
    return prisma.compra.findMany({
        include: {
            proveedor: true,
            detalles: {
                include: { producto: true }
            },
            pagos: true
        }
    });
},
actualizarCompra: async (compraId, payload) => {
    const {
        proveedorId,
        num_factura,
        num_autorizacion,
        fecha_emision,
        iva_tipo,
        forma_pago,
        detalles
    } = payload;

    if (!proveedorId) throw new Error("Proveedor obligatorio");
    if (!num_factura || num_factura.length !== 15)
        throw new Error("Número de factura debe tener 15 dígitos");
// 📌 Validar longitud correcta de autorización
      if (num_autorizacion.length !== 20) {
          throw new Error("Número de autorización debe tener 20 caracteres");
      }
    if (!Array.isArray(detalles) || detalles.length === 0)
        throw new Error("La compra debe tener detalles");

    const compraOriginal = await prisma.compra.findUnique({
        where: { id: compraId },
        include: { detalles: true }
    });

    if (!compraOriginal) throw new Error("Compra no encontrada");
    if (compraOriginal.estado === "PAGADA")
        throw new Error("No se puede editar una compra PAGADA");

    // Calcular nuevos totales
    let base = 0;
    detalles.forEach(d => {
        d.subtotal = Number(d.cantidad) * Number(d.precio_unit);
        base += d.subtotal;
    });

    let iva = iva_tipo === "QUINCE" ? Number((base * 0.15).toFixed(2)) : 0;
    let total = base + iva;

    return await prisma.$transaction(async tx => {

        // Revertir stock original
        for (const d of compraOriginal.detalles) {
            await tx.producto.update({
                where: { id: d.productoId },
                data: { stock: { decrement: d.cantidad } }
            });
        }

        // Eliminar detalles antiguos
        await tx.compraDetalle.deleteMany({ where: { compraId } });

        // Insertar detalles nuevos
        for (const d of detalles) {
            await tx.compraDetalle.create({
                data: {
                    compraId,
                    productoId: Number(d.productoId),
                    cantidad: Number(d.cantidad),
                    precio_unit: Number(d.precio_unit),
                    subtotal: Number(d.subtotal)
                }
            });

            await tx.producto.update({
                where: { id: Number(d.productoId) },
                data: { stock: { increment: Number(d.cantidad) } }
            });
        }

        // Actualizar cabecera
        await tx.compra.update({
            where: { id: compraId },
            data: {
                proveedor: { connect: { id: Number(proveedorId) } },
                num_factura,
                num_autorizacion,
                fecha_emision: new Date(fecha_emision),
                iva_tipo,
                forma_pago, // ← CORRECTO
                base,
                iva,
                total
            }
        });

        return await tx.compra.findUnique({
            where: { id: compraId },
            include: {
                proveedor: true,
                detalles: { include: { producto: true } }
            }
        });
    });
},


reporteCompras: async (filtros) => {

    const {
        year,
        month,
        proveedorId,
        estado,
        desde,
        hasta
    } = filtros;

    const where = {};

    // Filtro por proveedor
    if (proveedorId) where.proveedorId = Number(proveedorId);

    // Filtro por estado
    if (estado) where.estado = estado;

    // Filtro por mes
    if (year && month) {
        where.fecha_emision = {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1)
        };
    }

    // Rango personalizado
    if (desde || hasta) {
        where.fecha_emision = {};
        if (desde) where.fecha_emision.gte = new Date(desde);
        if (hasta) where.fecha_emision.lte = new Date(hasta);
    }

    // Consulta final
    return prisma.compra.findMany({
        where,
        include: {
            proveedor: true,
            detalles: { include: { producto: true } },
            pagos: true
        },
        orderBy: { fecha_emision: "asc" }
    });
}



};

export default compraService;
