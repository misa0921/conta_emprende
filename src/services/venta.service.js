  // src/services/venta.service.js
  import prisma from "../lib/prisma.js";

  /**
   * Servicio para manejar ventas.
   *
   * Funcionalidades:
   * - crearVenta(payload)
   * - cobrarVenta({ ventaId, cuentaId, nuevaCuenta, usuarioId, permitirSaldoNegativo })
   * - obtenerVentasPorMes(year, month)
   * - obtenerVentaPorId(id)
   * - obtenerTodas()
   * - actualizarVenta(ventaId, payload)
   * - reporteVentas(filtros)
   */

    const validateFactura = (numFactura, isFacturaGenerada) => {
      if (!numFactura) return "Número de factura es obligatorio";
      
      // Solo validar longitud si no es una factura generada automáticamente
      if (!isFacturaGenerada && String(numFactura).length !== 15) {
        return "Número de factura debe tener 15 caracteres";
      }
      
      return null;
    };



  const validateAutorizacion = (numAut) => {
    if (!numAut) return "Número de autorización es obligatorio";
    if (String(numAut).length !== 20) return "Número de autorización debe tener 20 caracteres";
    return null;
  };

  const validateDetalles = (detalles) => {
    if (!Array.isArray(detalles) || detalles.length === 0) return "Detalles de venta obligatorios";
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

  const ventaService = {
    crearVenta: async (payload) => {
      const {
        clienteId,
        usuarioId,
        num_factura,
        num_autorizacion,
        fecha_emision,
        base,
        iva_tipo,
        forma_pago,
        detalles
      } = payload;

      if (!clienteId) throw new Error("clienteId es obligatorio");
      if (!usuarioId) throw new Error("usuarioId es obligatorio");

      const vFac = validateFactura(num_factura);
      if (vFac) throw new Error(vFac);

      const vAut = validateAutorizacion(num_autorizacion);
      if (vAut) throw new Error(vAut);

      const vDet = validateDetalles(detalles);
      if (vDet) throw new Error(vDet);

      const { base: baseNum, iva, total } = calcularIvaYTotal(base, iva_tipo);

      // Prepara detalles para create (usamos campos simples y manejar stock en la transacción)
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
        // Crear cabecera de venta
        const venta = await tx.venta.create({
          data: {
            clienteId: Number(clienteId),
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

        // Por cada detalle: validar stock, decrementar stock y crear movimiento inventario (SALIDA)
        for (const d of detalles) {
          const productoId = Number(d.productoId);
          const cantidad = Number(d.cantidad);

          const producto = await tx.producto.findUnique({ where: { id: productoId } });
          if (!producto) throw new Error(`Producto ID ${productoId} no encontrado`);
          if (producto.stock < cantidad) throw new Error(`Stock insuficiente para el producto ${producto.nombre} (ID ${productoId})`);

          const stockAntes = producto.stock;
          const stockDespues = stockAntes - cantidad;

          await tx.producto.update({
            where: { id: productoId },
            data: { stock: { decrement: cantidad } }
          });

          await tx.movimientoInventario.create({
            data: {
              productoId,
              tipo: "SALIDA",
              cantidad,
              costo_unitario: Number(d.precio_unit),
              costo_total: Number((cantidad * Number(d.precio_unit)).toFixed(2)),
              stock_antes: stockAntes,
              stock_despues: stockDespues,
              referenciaTipo: "VENTA",
              referenciaId: venta.id
            }
          });
        }

        // devolver venta completa
        const ventaFull = await tx.venta.findUnique({
          where: { id: venta.id },
          include: { detalles: { include: { producto: true } }, cliente: true, cobros: true }
        });

        return ventaFull;
      });

      return result;
    },

    cobrarVenta: async ({ ventaId, cuentaId = null, nuevaCuenta = null, usuarioId, permitirSaldoNegativo = false }) => {
      if (!ventaId) throw new Error("ventaId es obligatorio");
      if (!usuarioId) throw new Error("usuarioId es obligatorio");

      return await prisma.$transaction(async (tx) => {
        // Obtener venta
        const venta = await tx.venta.findUnique({ where: { id: Number(ventaId) } });
        if (!venta) throw new Error("Venta no encontrada");
        if (venta.estado === "COBRADA") throw new Error("La venta ya está cobrada");

        let usedCuentaId = null;

        // ✅ Si la forma de pago NO es CAJA_CHICA, entonces SÍ necesitamos cuenta
        if (venta.forma_pago !== "CAJA_CHICA") {
          // Manejo de cuenta (crear si viene nueva)
          usedCuentaId = cuentaId ? Number(cuentaId) : null;
          if (!usedCuentaId && nuevaCuenta) {
            const c = await tx.cuenta.create({
              data: {
                nombre: nuevaCuenta.nombre,
                tipo: nuevaCuenta.tipo, // BANCO | CAJA_CHICA
                saldo: Number(nuevaCuenta.saldo ?? 0)
              }
            });
            usedCuentaId = c.id;
          }

          if (!usedCuentaId) throw new Error("Cuenta no proporcionada ni creada");

          const cuenta = await tx.cuenta.findUnique({ where: { id: Number(usedCuentaId) } });
          if (!cuenta) throw new Error("Cuenta no encontrada");

          // Registrar movimiento de cuenta (COBRO)
          await tx.movimientoCuenta.create({
            data: {
              cuentaId: Number(usedCuentaId),
              tipo: "COBRO",
              monto: Number(venta.total),
              referencia: `Cobro venta #${venta.id}`,
              ventaId: venta.id,
              usuarioId: Number(usuarioId)
            }
          });

          // Actualizar saldo de la cuenta (incrementar)
          await tx.cuenta.update({
            where: { id: Number(usedCuentaId) },
            data: { saldo: { increment: Number(venta.total) } }
          });
        }

        // Marcar venta como COBRADA (siempre, independiente del método de pago)
        await tx.venta.update({
          where: { id: venta.id },
          data: { estado: "COBRADA" }
        });

        return { ok: true, cuentaId: usedCuentaId, metodoPago: venta.forma_pago };
      });
    },

    obtenerVentasPorMes: async (year, month) => {
      const inicio = new Date(year, month - 1, 1);
      const fin = new Date(year, month, 1);
      return prisma.venta.findMany({
        where: { fecha_emision: { gte: inicio, lt: fin } },
        include: { cliente: true, detalles: { include: { producto: true } }, cobros: true }
      });
    },

    obtenerVentaPorId: async (id) => {
      return prisma.venta.findUnique({
        where: { id: Number(id) },
        include: { cliente: true, detalles: { include: { producto: true } }, cobros: true }
      });
    },

    obtenerTodas: async () => {
      return prisma.venta.findMany({
        include: {
          cliente: true,
          detalles: { include: { producto: true } },
          cobros: true
        },
        orderBy: { fecha_emision: "desc" }
      });
    },

    actualizarVenta: async (ventaId, payload) => {
      const {
        clienteId,
        num_factura,
        num_autorizacion,
        fecha_emision,
        iva_tipo,
        forma_pago,
        detalles
      } = payload;

      if (!clienteId) throw new Error("Cliente obligatorio");
        if (num_factura && num_factura.length !== 15 && !num_factura.startsWith("AUTO")) {
          throw new Error("Número de factura debe tener 15 dígitos");
        }
      if (!num_autorizacion || String(num_autorizacion).length !== 20)
        throw new Error("Número de autorización debe tener 20 caracteres");
      if (!Array.isArray(detalles) || detalles.length === 0)
        throw new Error("La venta debe tener detalles");

      const ventaOriginal = await prisma.venta.findUnique({
        where: { id: Number(ventaId) },
        include: { detalles: true }
      });

      if (!ventaOriginal) throw new Error("Venta no encontrada");
      if (ventaOriginal.estado === "COBRADA") throw new Error("No se puede editar una venta COBRADA");

      // Calcular nuevos totales
      let base = 0;
      detalles.forEach(d => {
        d.subtotal = Number(d.cantidad) * Number(d.precio_unit);
        base += d.subtotal;
      });

      let iva = iva_tipo === "QUINCE" ? Number((base * 0.15).toFixed(2)) : 0;
      let total = base + iva;

      return await prisma.$transaction(async (tx) => {
        // 1) Revertir stock por los detalles originales (sumar cantidades previo decremento)
        for (const d of ventaOriginal.detalles) {
          await tx.producto.update({
            where: { id: d.productoId },
            data: { stock: { increment: d.cantidad } }
          });

          // Opcional: registrar movimiento inverso en kardex? (Podemos dejar registro de edición fuera del kardex para simplicidad)
          // Si quieres auditar ediciones, podemos crear un movimiento tipo "AJUSTE" aquí.
        }

        // 2) Eliminar detalles antiguos
        await tx.ventaDetalle.deleteMany({ where: { ventaId: Number(ventaId) } });

        // 3) Crear detalles nuevos y decrementar stock (validar disponibilidad)
        for (const d of detalles) {
          const productoId = Number(d.productoId);
          const cantidad = Number(d.cantidad);
          const precio_unit = Number(d.precio_unit);

          const prod = await tx.producto.findUnique({ where: { id: productoId } });
          if (!prod) throw new Error(`Producto con ID ${productoId} no encontrado`);

          if (prod.stock < cantidad) throw new Error(`Stock insuficiente para el producto ${prod.nombre} (ID ${productoId})`);

          await tx.ventaDetalle.create({
            data: {
              ventaId: Number(ventaId),
              productoId,
              cantidad,
              precio_unit,
              subtotal: Number((cantidad * precio_unit).toFixed(2))
            }
          });

          const stockAntes = prod.stock;
          const stockDespues = stockAntes - cantidad;

          await tx.producto.update({
            where: { id: productoId },
            data: { stock: { decrement: cantidad } }
          });

          await tx.movimientoInventario.create({
            data: {
              productoId,
              tipo: "SALIDA",
              cantidad,
              costo_unitario: precio_unit,
              costo_total: Number((cantidad * precio_unit).toFixed(2)),
              stock_antes: stockAntes,
              stock_despues: stockDespues,
              referenciaTipo: "VENTA",
              referenciaId: Number(ventaId)
            }
          });
        }

        // 4) Actualizar cabecera
        await tx.venta.update({
          where: { id: Number(ventaId) },
          data: {
            cliente: { connect: { id: Number(clienteId) } },
            num_factura,
            num_autorizacion,
            fecha_emision: new Date(fecha_emision),
            iva_tipo,
            forma_pago,
            base,
            iva,
            total
          }
        });

        // 5) Devolver venta actualizada
        return await tx.venta.findUnique({
          where: { id: Number(ventaId) },
          include: { cliente: true, detalles: { include: { producto: true } } }
        });
      });
    },

    reporteVentas: async (filtros) => {
      const { year, month, clienteId, estado, desde, hasta } = filtros;
      const where = {};

      if (clienteId) where.clienteId = Number(clienteId);
      if (estado) where.estado = estado;

      if (year && month) {
        where.fecha_emision = {
          gte: new Date(Number(year), Number(month) - 1, 1),
          lt: new Date(Number(year), Number(month), 1)
        };
      }

      if (desde || hasta) {
        where.fecha_emision = {};
        if (desde) where.fecha_emision.gte = new Date(desde);
        if (hasta) where.fecha_emision.lte = new Date(hasta);
      }

      return prisma.venta.findMany({
        where,
        include: {
          cliente: true,
          detalles: { include: { producto: true } },
          cobros: true
        },
        orderBy: { fecha_emision: "asc" }
      });
    }

  };

  export default ventaService;
