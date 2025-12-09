/*
  Warnings:

  - You are about to drop the column `fecha` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `proveedor_id` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `compra_id` on the `CompraDetalle` table. All the data in the column will be lost.
  - You are about to drop the column `producto_id` on the `CompraDetalle` table. All the data in the column will be lost.
  - You are about to drop the column `producto_id` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `referencia_id` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `referencia_tipo` on the `MovimientoInventario` table. All the data in the column will be lost.
  - You are about to drop the column `contraseña` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_creacion` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `cliente_id` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `Venta` table. All the data in the column will be lost.
  - You are about to drop the column `producto_id` on the `VentaDetalle` table. All the data in the column will be lost.
  - You are about to drop the column `venta_id` on the `VentaDetalle` table. All the data in the column will be lost.
  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proveedor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `base` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forma_pago` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iva` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iva_tipo` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `num_autorizacion` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proveedorId` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Compra` table without a default value. This is not possible if the table is not empty.
  - Added the required column `compraId` to the `CompraDetalle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productoId` to the `CompraDetalle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productoId` to the `MovimientoInventario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `base` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forma_pago` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iva` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iva_tipo` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `num_autorizacion` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Venta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productoId` to the `VentaDetalle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ventaId` to the `VentaDetalle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('CLIENTE', 'PROVEEDOR');

-- CreateEnum
CREATE TYPE "IvaTipo" AS ENUM ('CERO', 'QUINCE', 'NO_OBJETO');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('CAJA_CHICA', 'BANCO');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('PAGADA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COBRADA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EstadoInventario" AS ENUM ('EN_USO', 'DANADO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('BANCO', 'CAJA_CHICA');

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_proveedor_id_fkey";

-- DropForeignKey
ALTER TABLE "Compra" DROP CONSTRAINT "Compra_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "CompraDetalle" DROP CONSTRAINT "CompraDetalle_compra_id_fkey";

-- DropForeignKey
ALTER TABLE "CompraDetalle" DROP CONSTRAINT "CompraDetalle_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "VentaDetalle" DROP CONSTRAINT "VentaDetalle_producto_id_fkey";

-- DropForeignKey
ALTER TABLE "VentaDetalle" DROP CONSTRAINT "VentaDetalle_venta_id_fkey";

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "fecha",
DROP COLUMN "proveedor_id",
DROP COLUMN "usuario_id",
ADD COLUMN     "base" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estado" "EstadoCompra" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "forma_pago" "FormaPago" NOT NULL,
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "iva_tipo" "IvaTipo" NOT NULL,
ADD COLUMN     "num_autorizacion" TEXT NOT NULL,
ADD COLUMN     "proveedorId" INTEGER NOT NULL,
ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "CompraDetalle" DROP COLUMN "compra_id",
DROP COLUMN "producto_id",
ADD COLUMN     "compraId" INTEGER NOT NULL,
ADD COLUMN     "productoId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MovimientoInventario" DROP COLUMN "producto_id",
DROP COLUMN "referencia_id",
DROP COLUMN "referencia_tipo",
ADD COLUMN     "productoId" INTEGER NOT NULL,
ADD COLUMN     "referenciaId" INTEGER,
ADD COLUMN     "referenciaTipo" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "estado" "EstadoInventario" NOT NULL DEFAULT 'EN_USO';

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "contraseña",
DROP COLUMN "fecha_creacion",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "cliente_id",
DROP COLUMN "fecha",
DROP COLUMN "usuario_id",
ADD COLUMN     "base" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "clienteId" INTEGER NOT NULL,
ADD COLUMN     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "estado" "EstadoVenta" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "forma_pago" "FormaPago" NOT NULL,
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "iva_tipo" "IvaTipo" NOT NULL,
ADD COLUMN     "num_autorizacion" TEXT NOT NULL,
ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "VentaDetalle" DROP COLUMN "producto_id",
DROP COLUMN "venta_id",
ADD COLUMN     "productoId" INTEGER NOT NULL,
ADD COLUMN     "ventaId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "Proveedor";

-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sexo" TEXT,
    "celular" TEXT,
    "correo" TEXT,
    "tipo" "TipoPersona" NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCuenta" (
    "id" SERIAL NOT NULL,
    "cuentaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" TEXT,
    "compraId" INTEGER,
    "ventaId" INTEGER,
    "usuarioId" INTEGER,

    CONSTRAINT "MovimientoCuenta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_cedula_key" ON "Persona"("cedula");

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraDetalle" ADD CONSTRAINT "CompraDetalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaDetalle" ADD CONSTRAINT "VentaDetalle_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCuenta" ADD CONSTRAINT "MovimientoCuenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
