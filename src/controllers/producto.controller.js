import prisma from "../lib/prisma.js";
import PDFDocument from "pdfkit";

const productoController = {

    // ============================
    // CREAR PRODUCTO
    // ============================
    crearProducto: async (req, res) => {
        try {
            const {
                nombre,
                descripcion,
                precio_compra,
                precio_venta,
                stock,
                estado,
                proveedorId
            } = req.body;

            const nuevo = await prisma.producto.create({
                data: {
                    nombre,
                    descripcion,
                    precio_compra: Number(precio_compra),
                    precio_venta: Number(precio_venta),
                    stock: Number(stock),
                    estado,
                    proveedorId: proveedorId ? Number(proveedorId) : null
                }
            });

            return res.json({ ok: true, msg: "Producto registrado", data: nuevo });

        } catch (error) {
            console.error("Error creando producto:", error);
            return res.status(500).json({
                ok: false,
                msg: "Error creando producto",
            });
        }
    },

    // ============================
    // OBTENER TODOS
    // ============================
    obtenerProductos: async (req, res) => {
        try {
            const productos = await prisma.producto.findMany({
                include: { proveedor: true }
            });

            return res.json({ ok: true, data: productos });

        } catch (error) {
            console.error(error);
            res.status(500).json({ ok: false, msg: "Error al obtener productos" });
        }
    },

    // ============================
    // OBTENER UNO
    // ============================
    obtenerProductoPorId: async (req, res) => {
        try {
            const id = Number(req.params.id);

            const producto = await prisma.producto.findUnique({
                where: { id }
            });

            if (!producto) {
                return res.status(404).json({ ok: false, msg: "Producto no encontrado" });
            }

            res.json({ ok: true, data: producto });

        } catch (error) {
            res.status(500).json({ ok: false, msg: "Error interno" });
        }
    },

    // ============================
    // ACTUALIZAR PRODUCTO
    // ============================
    actualizarProducto: async (req, res) => {
        try {
            const id = Number(req.params.id);
            const data = req.body;

            const actualizado = await prisma.producto.update({
                where: { id },
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio_compra: Number(data.precio_compra),
                    precio_venta: Number(data.precio_venta),
                    stock: Number(data.stock),
                    estado: data.estado,
                    proveedorId: data.proveedorId ? Number(data.proveedorId) : null
                }
            });

            res.json({ ok: true, msg: "Producto actualizado", data: actualizado });

        } catch (error) {
            console.error(error);
            res.status(500).json({ ok: false, msg: "Error al actualizar producto" });
        }
    },

    // ============================
    // ELIMINAR PRODUCTO
    // ============================
    eliminarProducto: async (req, res) => {
        try {
            const id = Number(req.params.id);

            await prisma.producto.delete({ where: { id } });

            res.json({ ok: true, msg: "Producto eliminado correctamente" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ ok: false, msg: "Error al eliminar producto" });
        }
    },

    // ======================================
    // 📄 GENERAR PDF - VERSIÓN CORREGIDA
    // ======================================
    generarPDF: async (req, res) => {
        try {
            console.log("📄 Iniciando generación de PDF del inventario...");

            // Obtener productos
            const productos = await prisma.producto.findMany({ 
                include: { proveedor: true } 
            });

            console.log(`✅ ${productos.length} productos encontrados`);

            // Crear documento PDF
            const doc = new PDFDocument({ 
                margin: 40, 
                size: "A4",
                bufferPages: true
            });

            // Configurar headers ANTES de pipe
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", 'attachment; filename="reporte_inventario.pdf"');

            // Conectar el PDF con la respuesta
            doc.pipe(res);

            // =======================
            //  ENCABEZADO
            // =======================
            doc.font("Helvetica-Bold")
                .fontSize(20)
                .fillColor("#111")
                .text("REPORTE GENERAL DE INVENTARIO", { align: "center" });

            doc.moveDown(0.5);

            doc.font("Helvetica")
                .fontSize(11)
                .fillColor("#555")
                .text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, { align: "center" });

            doc.moveDown(1.5);

            // =======================
            //  TABLA
            // =======================
            const columnas = [50, 220, 350, 450];
            const anchoTotal = 515;
            const alturaEncabezado = 25;
            let y = doc.y;

            // Encabezado tabla
            doc.rect(40, y, anchoTotal, alturaEncabezado).fill("#1b1b1b");
            
            doc.fillColor("#fff")
                .font("Helvetica-Bold")
                .fontSize(11)
                .text("Producto", columnas[0], y + 7)
                .text("Proveedor", columnas[1], y + 7)
                .text("Precio Venta", columnas[2], y + 7)
                .text("Stock", columnas[3], y + 7);

            y += alturaEncabezado;

            // Filas de productos
            productos.forEach((p, i) => {
                const alturaFila = 22;

                // Fondo alternado
                const colorFondo = i % 2 === 0 ? "#f0f0f0" : "#ffffff";
                doc.fillColor(colorFondo)
                    .rect(40, y, anchoTotal, alturaFila)
                    .fill();

                // Contenido con validación
                const nombre = p.nombre || "Sin nombre";
                const proveedor = p.proveedor?.nombre || "Sin proveedor";
                const precio = Number(p.precio_venta || 0).toFixed(2);
                const stock = String(p.stock || 0);

                doc.fillColor("#000")
                    .font("Helvetica")
                    .fontSize(10)
                    .text(nombre, columnas[0], y + 6, { width: 160, ellipsis: true })
                    .text(proveedor, columnas[1], y + 6, { width: 120, ellipsis: true })
                    .text(`$${precio}`, columnas[2], y + 6)
                    .text(stock, columnas[3], y + 6);

                y += alturaFila;

                // Nueva página si es necesario
                if (y > 720) {
                    doc.addPage();
                    y = 50;
                }
            });

            // =======================
            //  PIE
            // =======================
            doc.moveDown(2);
            doc.font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#111")
                .text(`Total productos: ${productos.length}`, { align: "right" });

            // Finalizar
            doc.end();

            console.log("✅ PDF generado y enviado correctamente");

        } catch (error) {
            console.error("❌ ERROR generando PDF:", error);
            console.error("Stack:", error.stack);
            
            // Solo enviar JSON si no se enviaron headers
            if (!res.headersSent) {
                return res.status(500).json({ 
                    ok: false, 
                    msg: "Error al generar PDF",
                    error: error.message 
                });
            }
        }
    }

};

export default productoController;