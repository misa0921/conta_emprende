-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "proveedorId" INTEGER;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;
