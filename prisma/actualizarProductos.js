import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function actualizarPersonas() {
  try {
    const cambios = [
      {
        id: 10,
        nombre: "Cristhian Prieto",
        correo: "Prieto.C@gmail.com",
      },

    ];

    for (const persona of cambios) {
      const updated = await prisma.persona.update({
        where: { id: persona.id },
        data: {
          nombre: persona.nombre,
          correo: persona.correo,
        },
      });

      console.log(`✔ Persona ID ${persona.id} actualizada:`, updated);
    }

    console.log("\n🎉 Actualización completada correctamente.");
  } catch (error) {
    console.error("❌ Error al actualizar personas:", error);
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPersonas();
