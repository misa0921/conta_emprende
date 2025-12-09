import { Router } from "express";
import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

const router = Router();

router.post("/login", async (req, res) => {
  const { correo, password } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { correo },
    });

    if (!usuario) {
      return res.json({ ok: false, msg: "Usuario no encontrado" });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      return res.json({ ok: false, msg: "Contraseña incorrecta" });
    }

    return res.json({ ok: true, msg: "Login correcto" });
  } catch (error) {
    console.error(error);
    return res.json({ ok: false, msg: "Error interno del servidor" });
  }
});

export default router;
