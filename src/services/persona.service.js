import prisma from "../lib/prisma.js";

const personaService = {

    crearPersona: async (data) => {
        const { cedula, nombre, sexo, celular, correo, tipo } = data;

        return await prisma.persona.create({
            data: {
                cedula,
                nombre,
                sexo,
                celular,
                correo,
                tipo
            },
        });
    },

    obtenerPersonas: async () => {
        return await prisma.persona.findMany();
    },

    // SOLO provee proveedores
    obtenerProveedores: async () => {
        return prisma.persona.findMany({
            where: { tipo: "PROVEEDOR" }
        });

    },

    obtenerClientes: async () => {
    return await prisma.persona.findMany({
        where: { tipo: "CLIENTE" } // asumiendo que 'tipo' distingue clientes/proveedores
    });
}


};

export default personaService;
