/*
  Warnings:

  - You are about to drop the column `clinicalRecordId` on the `Attachment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `ToothRecord` table. All the data in the column will be lost.
  - You are about to drop the column `clinicalRecordId` on the `TreatmentRecord` table. All the data in the column will be lost.
  - You are about to drop the `ClinicalRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_clinicalRecordId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalRecord" DROP CONSTRAINT "ClinicalRecord_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalRecord" DROP CONSTRAINT "ClinicalRecord_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalRecord" DROP CONSTRAINT "ClinicalRecord_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalRecord" DROP CONSTRAINT "ClinicalRecord_patientId_fkey";

-- DropForeignKey
ALTER TABLE "TreatmentRecord" DROP CONSTRAINT "TreatmentRecord_clinicalRecordId_fkey";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "clinicalRecordId";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "notes",
ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "clinicalNotes" TEXT,
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "examination" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "visitDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ToothRecord" DROP COLUMN "region";

-- AlterTable
ALTER TABLE "TreatmentRecord" DROP COLUMN "clinicalRecordId";

-- DropTable
DROP TABLE "ClinicalRecord";

-- DropEnum
DROP TYPE "ClinicalRecordType";

-- CreateIndex
CREATE INDEX "Patient_visitDate_idx" ON "Patient"("visitDate");
