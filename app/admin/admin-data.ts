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
    invoices,
    prescriptions,
    attachments,
  ] = await Promise.all([
    // ==========================================================
    // PATIENTS
    // Clinical information is now stored directly on Patient.
    // ==========================================================
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

    // ==========================================================
    // APPOINTMENTS
    // ==========================================================
    prisma.appointment.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        date: "asc",
      },
    }),

    // ==========================================================
    // DOCTORS
    // ==========================================================
    prisma.doctor.findMany({
      where: {
        clinicId: clinic.id,
      },
    }),

    // ==========================================================
    // TREATMENTS
    // ==========================================================
    prisma.treatment.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        name: "asc",
      },
    }),

    // ==========================================================
    // TESTIMONIALS
    // ==========================================================
    prisma.testimonial.findMany({
      where: {
        clinicId: clinic.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    // ==========================================================
    // INVOICES
    // ==========================================================
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

    // ==========================================================
    // PRESCRIPTIONS
    // ==========================================================
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

    // ==========================================================
    // ATTACHMENTS
    // ==========================================================
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
    invoices,
    prescriptions,
    attachments,
  });
}
