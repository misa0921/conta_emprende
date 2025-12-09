import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const loginService = async (correo, password) => {
    const usuario = await prisma.usuario.findUnique({
        where: { correo }
    });

    if (!usuario) return null;

    const valid = await bcrypt.compare(password, usuario.password);

    if (!valid) return null;

    return usuario;
};
