/*
  Warnings:

  - The `bancoTipo` column on the `Cuenta` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BancoTipo" AS ENUM ('AHORRO', 'CORRIENTE');

-- AlterTable
ALTER TABLE "Cuenta" DROP COLUMN "bancoTipo",
ADD COLUMN     "bancoTipo" "BancoTipo";
