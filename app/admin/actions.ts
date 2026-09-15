"use server";

import prisma from "@/prisma";
import { getClinic } from "@/src/lib/clinic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/* ============================================================
   HELPERS
============================================================ */

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value || null;
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : 0;
}

function dateValue(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function revalidateAdmin() {
  revalidatePath("/admin");
}

/* ============================================================
   CLINIC
============================================================ */

export async function updateClinic(formData: FormData) {
  const clinic = await getClinic();

  await prisma.clinic.update({
    where: {
      id: clinic.id,
    },
    data: {
      name: text(formData, "name"),
      tagline: optionalText(formData, "tagline"),
      phone: optionalText(formData, "phone"),
      whatsapp: optionalText(formData, "whatsapp"),
      email: optionalText(formData, "email"),
      address: optionalText(formData, "address"),
      mapsUrl: optionalText(formData, "mapsUrl"),
      openingHours: optionalText(formData, "openingHours"),
    },
  });

  revalidateAdmin();
}

/* ============================================================
   DOCTORS
============================================================ */

export async function addDoctor(formData: FormData) {
  const clinic = await getClinic();

  await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: text(formData, "name"),
      qualification: optionalText(formData, "qualification"),
      specialization: optionalText(formData, "specialization"),
      bio: optionalText(formData, "bio"),
      image: optionalText(formData, "image"),
    },
  });

  revalidateAdmin();
}

export async function updateDoctor(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Doctor ID is required");

  await prisma.doctor.update({
    where: { id },
    data: {
      name: text(formData, "name"),
      qualification: optionalText(formData, "qualification"),
      specialization: optionalText(formData, "specialization"),
      bio: optionalText(formData, "bio"),
      image: optionalText(formData, "image"),
    },
  });

  revalidateAdmin();
}

export async function deleteDoctor(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Doctor ID is required");

  await prisma.doctor.delete({
    where: { id },
  });

  revalidateAdmin();
}

/* ============================================================
   TREATMENTS
============================================================ */

export async function addTreatment(formData: FormData) {
  const clinic = await getClinic();

  const priceValue = formData.get("price");

  await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: text(formData, "name"),
      description: optionalText(formData, "description"),
      image: optionalText(formData, "image"),
      price:
        priceValue !== null && String(priceValue).trim() !== ""
          ? numberValue(formData, "price")
          : null,
    },
  });

  revalidateAdmin();
}

export async function updateTreatment(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Treatment ID is required");

  const priceValue = formData.get("price");

  await prisma.treatment.update({
    where: { id },
    data: {
      name: text(formData, "name"),
      description: optionalText(formData, "description"),
      image: optionalText(formData, "image"),
      price:
        priceValue !== null && String(priceValue).trim() !== ""
          ? numberValue(formData, "price")
          : null,
    },
  });

  revalidateAdmin();
}

export async function deleteTreatment(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Treatment ID is required");

  await prisma.treatment.delete({
    where: { id },
  });

  revalidateAdmin();
}

/* ============================================================
   TESTIMONIALS
============================================================ */

export async function addTestimonial(formData: FormData) {
  const clinic = await getClinic();

  const rating = Number(formData.get("rating"));

  await prisma.testimonial.create({
    data: {
      clinicId: clinic.id,
      name: text(formData, "name"),
      review: text(formData, "review"),
      rating:
        Number.isFinite(rating) && rating > 0
          ? Math.min(5, Math.max(1, rating))
          : null,
    },
  });

  revalidateAdmin();
}

export async function updateTestimonial(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Testimonial ID is required");

  const rating = Number(formData.get("rating"));

  await prisma.testimonial.update({
    where: { id },
    data: {
      name: text(formData, "name"),
      review: text(formData, "review"),
      rating:
        Number.isFinite(rating) && rating > 0
          ? Math.min(5, Math.max(1, rating))
          : null,
    },
  });

  revalidateAdmin();
}

export async function deleteTestimonial(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Testimonial ID is required");

  await prisma.testimonial.delete({
    where: { id },
  });

  revalidateAdmin();
}

/* ============================================================
   PATIENTS
============================================================ */

export async function savePatient(formData: FormData) {
  const clinic = await getClinic();

  const id = optionalText(formData, "id");

  const patientNumber = text(formData, "patientNumber");
  const firstName = text(formData, "firstName");

  if (!firstName) {
    throw new Error("Patient first name is required");
  }

  if (!patientNumber) {
    throw new Error("Patient number is required");
  }

  const patientData = {
    patientNumber,
    firstName,
    lastName: optionalText(formData, "lastName"),
    dateOfBirth: dateValue(text(formData, "dateOfBirth") || ""),
    gender: optionalText(formData, "gender"),
    phone: text(formData, "phone"),
    alternatePhone: optionalText(formData, "alternatePhone"),
    email: optionalText(formData, "email"),
    address: optionalText(formData, "address"),
    occupation: optionalText(formData, "occupation"),
    bloodGroup: optionalText(formData, "bloodGroup"),
    emergencyName: optionalText(formData, "emergencyName"),
    emergencyPhone: optionalText(formData, "emergencyPhone"),
    emergencyRelation: optionalText(formData, "emergencyRelation"),
    allergies: optionalText(formData, "allergies"),
    medicalAlerts: optionalText(formData, "medicalAlerts"),
    notes: optionalText(formData, "notes"),
  };

  let patient;

  if (id) {
    patient = await prisma.patient.update({
      where: {
        id,
      },
      data: patientData,
    });
  } else {
    patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        ...patientData,
      },
    });
  }

  /* Medical history */

  const medicalData = {
    diabetes: formData.get("diabetes") === "true",
    hypertension: formData.get("hypertension") === "true",
    heartDisease: formData.get("heartDisease") === "true",
    asthma: formData.get("asthma") === "true",
    bleedingDisorder: formData.get("bleedingDisorder") === "true",
    kidneyDisease: formData.get("kidneyDisease") === "true",
    liverDisease: formData.get("liverDisease") === "true",
    thyroidDisease: formData.get("thyroidDisease") === "true",
    epilepsy: formData.get("epilepsy") === "true",
    pregnancy: formData.get("pregnancy") === "true",
    smoker: formData.get("smoker") === "true",
    tobaccoUse: formData.get("tobaccoUse") === "true",
    alcoholUse: formData.get("alcoholUse") === "true",
    currentMedications: optionalText(formData, "currentMedications"),
    previousSurgeries: optionalText(formData, "previousSurgeries"),
    otherConditions: optionalText(formData, "otherConditions"),
    familyHistory: optionalText(formData, "familyHistory"),
  };

  await prisma.medicalHistory.upsert({
    where: {
      patientId: patient.id,
    },
    create: {
      patientId: patient.id,
      ...medicalData,
    },
    update: medicalData,
  });

  /* Dental history */

  const dentalData = {
    previousDentist: optionalText(formData, "previousDentist"),
    lastDentalVisit: dateValue(text(formData, "lastDentalVisit") || ""),
    brushingFrequency: optionalText(formData, "brushingFrequency"),
    flossingFrequency: optionalText(formData, "flossingFrequency"),
    sensitivity: formData.get("sensitivity") === "true",
    gumBleeding: formData.get("gumBleeding") === "true",
    toothPain: formData.get("toothPain") === "true",
    previousRootCanal: formData.get("previousRootCanal") === "true",
    previousExtraction: formData.get("previousExtraction") === "true",
    dentures: formData.get("dentures") === "true",
    implants: formData.get("implants") === "true",
    braces: formData.get("braces") === "true",
    previousTreatments: optionalText(formData, "previousTreatments"),
    dentalNotes: optionalText(formData, "dentalNotes"),
  };

  await prisma.dentalHistory.upsert({
    where: {
      patientId: patient.id,
    },
    create: {
      patientId: patient.id,
      ...dentalData,
    },
    update: dentalData,
  });

  revalidateAdmin();

  return patient.id;
}

export async function deletePatient(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Patient ID is required");

  await prisma.patient.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   APPOINTMENTS
============================================================ */

const appointmentStatusMap = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export async function saveAppointment(formData: FormData) {
  const clinic = await getClinic();

  const id = optionalText(formData, "id");
  const patientId = optionalText(formData, "patientId");
  const doctorId = optionalText(formData, "doctorId");

  const date = dateValue(text(formData, "date"));

  if (!date) {
    throw new Error("Appointment date is required");
  }

  const statusInput = text(formData, "status") || "PENDING";

  const status =
    appointmentStatusMap[
      statusInput as keyof typeof appointmentStatusMap
    ] || "PENDING";

  const data = {
    patientId,
    doctorId,
    patientName: text(formData, "patientName"),
    phone: text(formData, "phone"),
    date,
    time: optionalText(formData, "time"),
    duration: Number(formData.get("duration")) || null,
    treatment: optionalText(formData, "treatment"),
    reason: optionalText(formData, "reason"),
    message: optionalText(formData, "message"),
    status,
    notes: optionalText(formData, "notes"),
  };

  if (id) {
    await prisma.appointment.update({
      where: { id },
      data,
    });
  } else {
    await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        ...data,
      },
    });
  }

  revalidateAdmin();
}

export async function updateAppointmentStatus(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Appointment ID is required");

  const statusInput = text(formData, "status");

  if (!(statusInput in appointmentStatusMap)) {
    throw new Error("Invalid appointment status");
  }

  await prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status:
        appointmentStatusMap[
          statusInput as keyof typeof appointmentStatusMap
        ],
    },
  });

  revalidateAdmin();
}

export async function deleteAppointment(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Appointment ID is required");

  await prisma.appointment.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   CLINICAL RECORDS
============================================================ */

export async function saveClinical(formData: FormData) {
  const clinic = await getClinic();

  const id = optionalText(formData, "id");
  const patientId = text(formData, "patientId");
  const doctorId = optionalText(formData, "doctorId");

  if (!patientId) {
    throw new Error("Patient is required");
  }

  const date = dateValue(text(formData, "date")) || new Date();

  const clinicalData = {
    patientId,
    doctorId,
    type: "TREATMENT" as const,
    chiefComplaint: optionalText(formData, "chiefComplaint"),
    examination: optionalText(formData, "examination"),
    diagnosis: optionalText(formData, "diagnosis"),
    clinicalNotes: optionalText(formData, "notes"),
    followUpDate: dateValue(text(formData, "nextVisit") || ""),
  };

  if (id) {
    await prisma.clinicalRecord.update({
      where: {
        id,
      },
      data: clinicalData,
    });
  } else {
    const record = await prisma.clinicalRecord.create({
      data: {
        ...clinicalData,
        createdAt: date,
      },
    });

    const procedure = optionalText(formData, "procedure");

    if (procedure) {
      await prisma.treatmentRecord.create({
        data: {
          patientId,
          doctorId,
          clinicalRecordId: record.id,
          treatmentName: procedure,
          diagnosis: optionalText(formData, "diagnosis"),
          notes: optionalText(formData, "notes"),
          status: "COMPLETED",
          completedDate: date,
          cost: formData.get("cost")
            ? numberValue(formData, "cost")
            : null,
        },
      });
    }
  }

  revalidateAdmin();
}

export async function deleteClinical(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Clinical record ID is required");

  await prisma.clinicalRecord.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   TREATMENT RECORDS
============================================================ */

export async function saveTreatmentRecord(formData: FormData) {
  const patientId = text(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient is required");
  }

  const id = optionalText(formData, "id");

  const data = {
    patientId,
    doctorId: optionalText(formData, "doctorId"),
    treatmentId: optionalText(formData, "treatmentId"),
    toothRecordId: optionalText(formData, "toothRecordId"),
    treatmentName: text(formData, "treatmentName"),
    diagnosis: optionalText(formData, "diagnosis"),
    notes: optionalText(formData, "notes"),
    status: (text(formData, "status") || "PLANNED") as
      | "PLANNED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED",
    scheduledDate: dateValue(text(formData, "scheduledDate") || ""),
    completedDate: dateValue(text(formData, "completedDate") || ""),
    cost: formData.get("cost")
      ? numberValue(formData, "cost")
      : null,
  };

  if (id) {
    await prisma.treatmentRecord.update({
      where: { id },
      data,
    });
  } else {
    await prisma.treatmentRecord.create({
      data,
    });
  }

  revalidateAdmin();
}

/* ============================================================
   PRESCRIPTIONS
============================================================ */

export async function savePrescription(formData: FormData) {
  const patientId = text(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient is required");
  }

  const doctorId = optionalText(formData, "doctorId");
  const date =
    dateValue(text(formData, "date") || "") || new Date();

  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      prescriptionDate: date,
      notes: optionalText(formData, "notes"),
      items: {
        create: [],
      },
    },
  });

  const medicines = text(formData, "text");

  if (medicines) {
    const lines = medicines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          medicine: line,
          instructions: optionalText(formData, "instructions"),
        },
      });
    }
  }

  revalidateAdmin();

  return prescription.id;
}

export async function deletePrescription(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Prescription ID is required");

  await prisma.prescription.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   FILES / ATTACHMENTS
============================================================ */

export async function saveAttachment(formData: FormData) {
  const patientId = text(formData, "patientId");
  const url = text(formData, "url");
  const name = text(formData, "name");
  const mimeType = text(formData, "mimeType");
  const size = Number(formData.get("size")) || 0;

  if (!patientId) {
    throw new Error("Patient is required");
  }

  if (!url) {
    throw new Error("Uploaded file URL is required");
  }

  if (!name) {
    throw new Error("File name is required");
  }

  if (size > 5 * 1024 * 1024) {
    throw new Error("File exceeds 5 MB");
  }

  let type:
    | "XRAY"
    | "PHOTO"
    | "DOCUMENT"
    | "OTHER" = "OTHER";

  if (mimeType.startsWith("image/")) {
    type = "PHOTO";
  } else if (mimeType === "application/pdf") {
    type = "DOCUMENT";
  }

  await prisma.attachment.create({
    data: {
      patientId,
      name,
      type,
      mimeType: mimeType || "application/octet-stream",
      size,
      url,
      storageKey: null,
    },
  });

  revalidateAdmin();
}

export async function deleteAttachment(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Attachment ID is required");

  await prisma.attachment.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   BILLING
============================================================ */

function invoiceStatus(total: number, paid: number) {
  if (paid <= 0) return "UNPAID";
  if (paid >= total) return "PAID";
  return "PARTIAL";
}

export async function saveBill(formData: FormData) {
  const clinic = await getClinic();

  const patientId = text(formData, "patientId");

  if (!patientId) {
    throw new Error("Patient is required");
  }

  const invoiceNumber =
    text(formData, "invoiceNumber") ||
    `INV-${Date.now()}`;

  const total = numberValue(formData, "total");
  const paid = numberValue(formData, "paid");
  const discount = numberValue(formData, "discount");
  const tax = numberValue(formData, "tax");

  const subtotal = Math.max(0, total + discount - tax);

  const invoice = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId,
      invoiceNumber,
      status: invoiceStatus(total, paid),
      subtotal,
      discount,
      tax,
      total,
      notes: optionalText(formData, "notes"),
      invoiceDate:
        dateValue(text(formData, "date") || "") || new Date(),
      items: {
        create: [],
      },
    },
  });

  const itemsText = text(formData, "items");

  if (itemsText) {
    const lines = itemsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const [description, amountString] = line.split("|");

      const amount = Number(amountString?.trim()) || 0;

      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: description?.trim() || line,
          quantity: 1,
          unitPrice: amount,
          amount,
        },
      });
    }
  }

  if (paid > 0) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: paid,
        method:
          (text(formData, "method") || "CASH") as
            | "CASH"
            | "UPI"
            | "CARD"
            | "BANK_TRANSFER"
            | "OTHER",
        reference: optionalText(formData, "reference"),
        notes: optionalText(formData, "paymentNotes"),
      },
    });
  }

  revalidateAdmin();

  return invoice.id;
}

export async function addPayment(formData: FormData) {
  const invoiceId = text(formData, "invoiceId");
  const amount = numberValue(formData, "amount");

  if (!invoiceId) {
    throw new Error("Invoice is required");
  }

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method:
        (text(formData, "method") || "CASH") as
          | "CASH"
          | "UPI"
          | "CARD"
          | "BANK_TRANSFER"
          | "OTHER",
      reference: optionalText(formData, "reference"),
      notes: optionalText(formData, "notes"),
    },
  });

  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
      payments: true,
    },
  });

  if (invoice) {
    const paid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: invoiceStatus(
          Number(invoice.total),
          paid
        ),
      },
    });
  }

  revalidateAdmin();
}

export async function deleteInvoice(formData: FormData) {
  const id = text(formData, "id");

  if (!id) throw new Error("Invoice ID is required");

  await prisma.invoice.delete({
    where: {
      id,
    },
  });

  revalidateAdmin();
}

/* ============================================================
   CLINIC SETTINGS
============================================================ */

export async function saveSettings(formData: FormData) {
  const clinic = await getClinic();

  await prisma.clinic.update({
    where: {
      id: clinic.id,
    },
    data: {
      name: text(formData, "clinicName"),
    },
  });

  revalidateAdmin();
}

/* ============================================================
   LOGOUT
============================================================ */

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("session");

  redirect("/admin/login");
}