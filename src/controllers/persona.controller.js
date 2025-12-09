import personaService from "../services/persona.service.js";

const personaController = {

    crearPersona: async (req, res) => {
        try {
            const nuevaPersona = await personaService.crearPersona(req.body);
            res.json({ ok: true, data: nuevaPersona });

        } catch (error) {
            console.log(error);

            // Si la cedula ya existe, devuelve un mensaje limpio
            if (error.code === "P2002") {
                return res.status(400).json({
                    ok: false,
                    msg: "La cédula ya está registrada. Intenta con otra."
                });
            }

            res.status(500).json({ ok: false, msg: "Error al crear persona" });
        }
    },

    obtenerPersonas: async (req, res) => {
        try {
            const personas = await personaService.obtenerPersonas();
            res.json({ ok: true, data: personas });
        } catch (error) {
            console.log(error);
            res.status(500).json({ ok: false, msg: "Error al obtener personas" });
        }
    },

    obtenerProveedores: async (req, res) => {
        try {
            const proveedores = await personaService.obtenerProveedores();
            res.json({ ok: true, data: proveedores });
        } catch (error) {
            console.log(error);
            res.status(500).json({ ok: false, msg: "Error al obtener proveedores" });
        }
    },

    // =========================
    // NUEVA FUNCIÓN PARA CLIENTES
    // =========================
    obtenerClientes: async (req, res) => {
        try {
            const clientes = await personaService.obtenerClientes(); // asegúrate de tener esta función en el service
            res.json({ ok: true, data: clientes });
        } catch (error) {
            console.log(error);
            res.status(500).json({ ok: false, msg: "Error al obtener clientes" });
        }
    }

};

export default personaController;
