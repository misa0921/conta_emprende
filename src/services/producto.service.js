import prisma from "../lib/prisma.js";

const productoService = {
    crearProducto: async (data) => {
        return await prisma.producto.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                precio_compra: Number(data.precio_compra),
                precio_venta: Number(data.precio_venta),
                stock: 0,
                estado: data.estado,
                proveedorId: Number(data.proveedorId)
            }
        });
    },
        obtenerProductos: async () => {
            return await prisma.producto.findMany({
                include: { proveedor: true }
            });
        }

};

export default productoService;
