import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("Jaswith Dental Care - Production Seed");
  console.log("==========================================");

  // ============================================================
  // DATABASE CONNECTION
  // ============================================================

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  console.log("DATABASE_URL is configured.");
  console.log("Starting complete database flush...");

  // ============================================================
  // FLUSH ALL TABLES
  // ============================================================
  //
  // Delete child records first because of foreign-key constraints.
  // Everything will be removed before the new seed data is created.
  //
  // ============================================================

  await prisma.$transaction(async (tx) => {
    console.log("Deleting AuditLog...");
    await tx.auditLog.deleteMany();

    console.log("Deleting Payment...");
    await tx.payment.deleteMany();

    console.log("Deleting InvoiceItem...");
    await tx.invoiceItem.deleteMany();

    console.log("Deleting Invoice...");
    await tx.invoice.deleteMany();

    console.log("Deleting Attachment...");
    await tx.attachment.deleteMany();

    console.log("Deleting PrescriptionItem...");
    await tx.prescriptionItem.deleteMany();

    console.log("Deleting Prescription...");
    await tx.prescription.deleteMany();

    console.log("Deleting TreatmentRecord...");
    await tx.treatmentRecord.deleteMany();

    console.log("Deleting ToothRecord...");
    await tx.toothRecord.deleteMany();

    console.log("Deleting ClinicalRecord...");
    await tx.clinicalRecord.deleteMany();

    console.log("Deleting Appointment...");
    await tx.appointment.deleteMany();

    console.log("Deleting DentalHistory...");
    await tx.dentalHistory.deleteMany();

    console.log("Deleting MedicalHistory...");
    await tx.medicalHistory.deleteMany();

    console.log("Deleting Patient...");
    await tx.patient.deleteMany();

    console.log("Deleting Testimonial...");
    await tx.testimonial.deleteMany();

    console.log("Deleting Treatment...");
    await tx.treatment.deleteMany();

    console.log("Deleting Doctor...");
    await tx.doctor.deleteMany();

    console.log("Deleting AdminUser...");
    await tx.adminUser.deleteMany();

    console.log("Deleting Clinic...");
    await tx.clinic.deleteMany();
  });

  console.log("");
  console.log("==========================================");
  console.log("DATABASE FLUSH COMPLETED");
  console.log("==========================================");
  console.log("");

  // ============================================================
  // ADMIN USER
  // ============================================================

  const email = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: "Jaswith Admin",
      role: "ADMIN",
      active: true,
    },
  });

  console.log(`Admin created: ${admin.email}`);

  // ============================================================
  // CLINIC
  // ============================================================

  const clinic = await prisma.clinic.create({
    data: {
      name: "Jaswith Dental Care",

      tagline:
        "Advanced dental implants and complete smile care in Chennai",

      phone: "+91 8525033648",

      whatsapp: "+91 8525033648",

      email: "",

      address:
        "48/58, Mangailakshmi Building, Vadamalai Street, Purasaiwakkam, Chennai - 600007",

      mapsUrl:
        "https://www.google.com/maps/place/Jaswith+Dental+Care",

      openingHours:
        "Mon–Sat: 10:00 AM–1:00 PM & 4:30 PM–8:30 PM · Sundays by appointment",

      invoicePrefix: "INV",

      patientPrefix: "JDC",
    },
  });

  console.log(`Clinic created: ${clinic.name}`);
  console.log(`Clinic ID: ${clinic.id}`);

  // ============================================================
  // DOCTOR
  // ============================================================

  const doctor = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,

      name: "Dr. Sailakshmi J.",

      qualification: "BDS, MDS",

      specialization: "Prosthodontist & Implantologist",

      bio:
        "Specialises in advanced dental implants, full mouth rehabilitation, and smile design.",

      active: true,
    },
  });

  console.log(`Doctor created: ${doctor.name}`);

  // ============================================================
  // TREATMENTS
  // ============================================================

  const treatments = [
    {
      name: "Dental Implants",
      description:
        "Advanced, long-lasting replacement for missing teeth.",
    },
    {
      name: "Complete & Partial Dentures",
      description:
        "Custom-fitted dentures restoring function and appearance.",
    },
    {
      name: "Smile Designing & Cosmetics",
      description:
        "Cosmetic treatments tailored to enhance your smile.",
    },
    {
      name: "Root Canal & Full Mouth Rehab",
      description:
        "Comprehensive root canal therapy and full mouth restoration.",
    },
  ];

  for (const treatment of treatments) {
    const createdTreatment = await prisma.treatment.create({
      data: {
        clinicId: clinic.id,
        name: treatment.name,
        description: treatment.description,
        active: true,
      },
    });

    console.log(`Treatment created: ${createdTreatment.name}`);
  }

  // ============================================================
  // VERIFY DATABASE IS CLEAN
  // ============================================================

  console.log("");
  console.log("==========================================");
  console.log("VERIFYING DATABASE");
  console.log("==========================================");

  const counts = await Promise.all([
    prisma.adminUser.count(),
    prisma.clinic.count(),
    prisma.doctor.count(),
    prisma.treatment.count(),
    prisma.testimonial.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.clinicalRecord.count(),
    prisma.toothRecord.count(),
    prisma.treatmentRecord.count(),
    prisma.prescription.count(),
    prisma.attachment.count(),
    prisma.invoice.count(),
    prisma.invoiceItem.count(),
    prisma.payment.count(),
    prisma.auditLog.count(),
    prisma.medicalHistory.count(),
    prisma.dentalHistory.count(),
    prisma.prescriptionItem.count(),
  ]);

  console.log("");
  console.log(`AdminUser:          ${counts[0]}`);
  console.log(`Clinic:             ${counts[1]}`);
  console.log(`Doctor:             ${counts[2]}`);
  console.log(`Treatment:          ${counts[3]}`);
  console.log(`Testimonial:        ${counts[4]}`);
  console.log(`Patient:            ${counts[5]}`);
  console.log(`Appointment:        ${counts[6]}`);
  console.log(`ClinicalRecord:     ${counts[7]}`);
  console.log(`ToothRecord:        ${counts[8]}`);
  console.log(`TreatmentRecord:    ${counts[9]}`);
  console.log(`Prescription:       ${counts[10]}`);
  console.log(`Attachment:         ${counts[11]}`);
  console.log(`Invoice:            ${counts[12]}`);
  console.log(`InvoiceItem:        ${counts[13]}`);
  console.log(`Payment:            ${counts[14]}`);
  console.log(`AuditLog:           ${counts[15]}`);
  console.log(`MedicalHistory:     ${counts[16]}`);
  console.log(`DentalHistory:      ${counts[17]}`);
  console.log(`PrescriptionItem:   ${counts[18]}`);

  console.log("");
  console.log("==========================================");
  console.log("SEED COMPLETED");
  console.log("==========================================");
  console.log("");

  console.log(`Admin:      ${admin.email}`);
  console.log(`Clinic:     ${clinic.name}`);
  console.log(`Doctor:     ${doctor.name}`);
  console.log(`Treatments: ${treatments.length}`);
  console.log("");

  console.log("Expected database state:");
  console.log("- 1 AdminUser");
  console.log("- 1 Clinic");
  console.log("- 1 Doctor");
  console.log("- 4 Treatments");
  console.log("- 0 Patients");
  console.log("- 0 Appointments");
  console.log("- 0 Invoices");
  console.log("- 0 Payments");
  console.log("- 0 Clinical Records");
  console.log("- 0 Testimonials");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==========================================");
    console.error("SEED FAILED");
    console.error("==========================================");
    console.error("");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });