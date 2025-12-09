import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Proveedores
  const proveedoresData = [
    { cedula: "0991111111", nombre: "Proveedor Alfa S.A." },
    { cedula: "0992222222", nombre: "Grupo Industrial Solaris" },
    { cedula: "0993333333", nombre: "Comercial Deltatech" },
    { cedula: "0994444444", nombre: "Importadora Andina" },
    { cedula: "0995555555", nombre: "TecnoParts Ecuador" },
    { cedula: "0996666666", nombre: "Distribuidora Pacífico" },
    { cedula: "0997777777", nombre: "Mayorista NovaSupplies" }
  ];

  const proveedores = [];

  for (let p of proveedoresData) {
    const proveedor = await prisma.persona.upsert({
      where: { cedula: p.cedula },
      update: {},
      create: {
        cedula: p.cedula,
        nombre: p.nombre,
        celular: "0990000000",
        tipo: "PROVEEDOR"
      }
    });
    proveedores.push(proveedor);
  }

  console.log("🏢 Proveedores ingresados:", proveedores.length);

  // Productos
  const productosData = [
    { nombre: "Resma de Papel A4", precio_compra: 3.50, precio_venta: 5.00 },
    { nombre: "Impresora HP LaserJet Pro", precio_compra: 180.00, precio_venta: 235.00 },
    { nombre: "Mouse inalámbrico Logitech", precio_compra: 9.50, precio_venta: 15.00 },
    { nombre: "Monitor Samsung 24\"", precio_compra: 95.00, precio_venta: 135.00 },
    { nombre: "Teclado mecánico RGB", precio_compra: 18.00, precio_venta: 28.00 },
    { nombre: "Silla ergonómica", precio_compra: 55.00, precio_venta: 85.00 },
    { nombre: "Escritorio madera", precio_compra: 65.00, precio_venta: 105.00 }
  ];

  for (let i = 0; i < productosData.length; i++) {
    await prisma.producto.create({
      data: {
        ...productosData[i],
        stock: 10,
        proveedorId: proveedores[i].id
      }
    });
  }

  console.log("📦 Productos ingresados correctamente!");
}

main()
  .catch(e => {
    console.error("❌ Error en seed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
