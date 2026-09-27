-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "patientSequence" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "patientPrefix" SET DEFAULT 'JASWITH';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "treatmentPlan" TEXT;
