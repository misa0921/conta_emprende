import prisma from "./src/lib/prisma.js";
import bcrypt from "bcrypt";

const run = async () => {
    const password = await bcrypt.hash("1234", 10);

    const admin = await prisma.usuario.create({
        data: {
            nombre: "Empresario",
            correo: "Empresario@gmail.com",
            password: password
        }
    });

    console.log("Usuario creado:", admin);
};

run();
