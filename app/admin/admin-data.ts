import prisma from "@/prisma";
import { getClinic } from "@/src/lib/clinic";

function serializeData<T>(value: T): any {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeData);
  }

  if (value && typeof value === "object") {
    // Convert Prisma Decimal values to numbers
    if (
      "toNumber" in value &&
      typeof (value as any).toNumber === "function"
    ) {
      return (value as any).toNumber();
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        serializeData(val),
      ])
    );
  }

  return value;
}

export async function getAdminData() {
  const clinic = await getClinic();

  const [
    patients,
    appointments,
    doctors,
    treatments,
    testimonials,
    clinical,
    invoices,
    prescriptions,
    attachments,
  ] = await Promise.all([
    prisma.patient.findMany({
      where: {
        clinicId: clinic.id,
      },
      include: {
        medicalHistory: true,
        dentalHistory: true,
      },
      orderBy: {
        registeredAt: "desc",
      },
    }),

    prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        date: "asc",
      },
    }),

    prisma.doctor.findMany({
      where: {
        clinicId: clinic.id,
      },
    }),

    prisma.treatment.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.testimonial.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.clinicalRecord.findMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
      },
      include: {
        treatmentRecords: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.invoice.findMany({
      where: {
        clinicId: clinic.id,
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        invoiceDate: "desc",
      },
    }),

    prisma.prescription.findMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        prescriptionDate: "desc",
      },
    }),

    prisma.attachment.findMany({
      where: {
        patient: {
          clinicId: clinic.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return serializeData({
    clinic,
    patients,
    appointments,
    doctors,
    treatments,
    testimonials,
    clinical,
    invoices,
    prescriptions,
    attachments,
  });
}