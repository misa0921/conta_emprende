import prisma from "../lib/prisma.js";
import PDFDocument from "pdfkit"; // ← Necesario para generar PDF

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
    // 📄 NUEVO 🚀 — Exportar inventario a PDF
    // ======================================
generarPDF: async (req, res) => {
    try {
        const productos = await prisma.producto.findMany({ include: { proveedor: true } });

        const doc = new PDFDocument({ margin: 40, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=reporte_inventario.pdf");

        doc.pipe(res);

        // =======================
        //  ENCABEZADO PRINCIPAL
        // =======================
        doc.font("Helvetica-Bold").fontSize(20).fillColor("#111")
            .text("REPORTE GENERAL DE INVENTARIO", { align: "center" });

        doc.moveDown(0.5);

        doc.font("Helvetica").fontSize(11).fillColor("#555")
            .text(`Fecha de generación: ${new Date().toLocaleDateString()}`, { align: "center" });

        doc.moveDown(1.5);

        // =======================
        //  TABLA
        // =======================
        const columna = [50, 220, 350, 450];
        const anchoTotal = 515;
        const encabezadoAltura = 25;
        let y = doc.y;

        // Fila encabezado
        doc.rect(40, y, anchoTotal, encabezadoAltura).fill("#1b1b1b");
        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(12)
            .text("Producto", columna[0], y + 7)
            .text("Proveedor", columna[1], y + 7)
            .text("Precio Venta", columna[2], y + 7)
            .text("Stock", columna[3], y + 7);

        y += encabezadoAltura;

        // Filas dinámicas
        productos.forEach((p, i) => {
            const altura = 22;

            doc.fillColor(i % 2 === 0 ? "#eeeeee" : "#ffffff")
                .rect(40, y, anchoTotal, altura).fill();

            doc.fillColor("#000").font("Helvetica").fontSize(11)
                .text(p.nombre, columna[0], y + 6)
                .text(p.proveedor?.nombre || "Sin proveedor", columna[1], y + 6)
                .text(`$${p.precio_venta}`, columna[2], y + 6)
                .text(String(p.stock), columna[3], y + 6);

            y += altura;
        });

        // =======================
        //  PIE DEL INFORME
        // =======================
        doc.moveDown(2);
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#111")
            .text(`Productos registrados: ${productos.length}`, { align: "right" });

        doc.end();

    } catch (error) {
        res.status(500).json({ ok: false, msg: "Error al generar PDF" });
    }
}


};

export default productoController;
