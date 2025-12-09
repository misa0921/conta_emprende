import { loginService } from "../services/usuario.service.js";

export const loginUsuario = async (req, res) => {
    try {
        const { correo, password } = req.body;
        const usuario = await loginService(correo, password);

        if (!usuario) {
            return res.status(400).json({ message: "Credenciales incorrectas" });
        }

        res.json({ usuario });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
