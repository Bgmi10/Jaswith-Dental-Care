import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addDays = (days: number, hour = 10, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  console.log("==========================================");
  console.log("JASWITH DENTAL CARE - TEST DATABASE SEED");
  console.log("==========================================");

  /**
   * IMPORTANT:
   * This seed contains ONLY synthetic/demo data.
   * Do not use real patient information here.
   */

  // ============================================================
  // FLUSH DATABASE
  // ============================================================

  console.log("Flushing existing database...");

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.payment.deleteMany();
    await tx.invoiceItem.deleteMany();
    await tx.invoice.deleteMany();

    await tx.attachment.deleteMany();

    await tx.prescriptionItem.deleteMany();
    await tx.prescription.deleteMany();

    await tx.treatmentRecord.deleteMany();
    await tx.toothRecord.deleteMany();

    await tx.appointment.deleteMany();

    await tx.dentalHistory.deleteMany();
    await tx.medicalHistory.deleteMany();

    await tx.patient.deleteMany();

    await tx.testimonial.deleteMany();
    await tx.treatment.deleteMany();
    await tx.doctor.deleteMany();
    await tx.adminUser.deleteMany();
    await tx.clinic.deleteMany();
  });

  console.log("Database flushed.");

  // ============================================================
  // ADMIN
  // ============================================================

  const passwordHash = await argon2.hash("demo123456", {
    type: argon2.argon2id,
  });

  const admin = await prisma.adminUser.create({
    data: {
      email: "demo@jaswithdental.test",
      passwordHash,
      name: "Demo Admin",
      role: "ADMIN",
      active: true,
    },
  });

  // ============================================================
  // CLINIC
  // ============================================================

  const clinic = await prisma.clinic.create({
    data: {
      name: "Jaswith Dental Care - Demo",
      tagline: "Dental Care Management Demo",
      phone: "9000000000",
      whatsapp: "9000000000",
      email: "demo@jaswithdental.test",
      address: "Demo Dental Street, Chennai",
      mapsUrl: null,
      openingHours:
        "Mon–Sat: 10:00 AM–1:00 PM & 4:30 PM–8:30 PM",
      logo: null,
      invoicePrefix: "INV",
      patientPrefix: "JDC",
      patientSequence: 0,
    },
  });

  // ============================================================
  // DOCTOR
  // ============================================================

  const doctor = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Demo Doctor",
      qualification: "BDS, MDS",
      specialization: "Prosthodontics & Implantology",
      bio: "Demo doctor profile for development and testing.",
      image: null,
      active: true,
    },
  });

  // ============================================================
  // TREATMENTS
  // ============================================================

  const treatmentData = [
    {
      name: "Consultation",
      description: "General dental consultation",
      price: 500,
    },
    {
      name: "Scaling",
      description: "Professional dental cleaning",
      price: 1500,
    },
    {
      name: "Filling",
      description: "Dental filling procedure",
      price: 1200,
    },
    {
      name: "Root Canal Treatment",
      description: "Root canal treatment",
      price: 5000,
    },
    {
      name: "Crown / Bridge",
      description: "Dental crown and bridge treatment",
      price: 6000,
    },
    {
      name: "Extraction",
      description: "Dental extraction",
      price: 1000,
    },
  ];

  const treatments = [];

  for (const treatment of treatmentData) {
    const created = await prisma.treatment.create({
      data: {
        clinicId: clinic.id,
        name: treatment.name,
        description: treatment.description,
        image: null,
        price: treatment.price,
        active: true,
      },
    });

    treatments.push(created);
  }

  // ============================================================
  // PATIENTS
  // ============================================================

  const patients = [];

  const patientData = [
    {
      firstName: "Arun",
      phone: "9000000001",
      gender: "MALE",
    },
    {
      firstName: "Priya",
      phone: "9000000002",
      gender: "FEMALE",
    },
    {
      firstName: "Rahul",
      phone: "9000000003",
      gender: "MALE",
    },
    {
      firstName: "Kavya",
      phone: "9000000004",
      gender: "FEMALE",
    },
    {
      firstName: "Vikram",
      phone: "9000000005",
      gender: "MALE",
    },
    {
      firstName: "Meera",
      phone: "9000000006",
      gender: "FEMALE",
    },
  ];

  for (let i = 0; i < patientData.length; i++) {
    const data = patientData[i];

    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,

        // Explicitly sequential for demo/testing.
        patientNumber: `JDC-${String(i + 1).padStart(3, "0")}`,

        firstName: data.firstName,
        phone: data.phone,

        gender: data.gender,

        visitDate: addDays(-i),

        chiefComplaint:
          i % 2 === 0
            ? "Routine dental consultation"
            : "Tooth pain and sensitivity",

        examination:
          "Demo examination data for development testing.",

        diagnosis:
          i % 2 === 0
            ? "Routine dental evaluation"
            : "Dental caries",

        clinicalNotes:
          "Synthetic clinical data. Not a real patient.",

        treatmentPlan:
          i % 2 === 0
            ? "Routine follow-up"
            : "Treatment and follow-up required",

        followUpDate: addDays(7 + i),
      },
    });

    patients.push(patient);
  }

  // ============================================================
  // APPOINTMENTS
  // ============================================================

  /**
   * Multiple appointments for the SAME patient.
   *
   * This is important for testing your new requirement:
   *
   * Patient JDC-001
   *   Appointment 1 -> Consultation
   *   Appointment 2 -> Root Canal
   *   Appointment 3 -> Follow-up
   */

  await prisma.appointment.createMany({
    data: [
      {
        clinicId: clinic.id,
        patientName: patients[0].firstName,
        phone: patients[0].phone,
        date: addDays(-5, 10, 0),
      },
      {
        clinicId: clinic.id,
        patientName: patients[0].firstName,
        phone: patients[0].phone,
        date: addDays(-2, 11, 0),
      },
      {
        clinicId: clinic.id,
        patientName: patients[0].firstName,
        phone: patients[0].phone,
        date: addDays(5, 10, 30),
      },

      {
        clinicId: clinic.id,
        patientName: patients[1].firstName,
        phone: patients[1].phone,
        date: addDays(-3, 16, 0),
      },
      {
        clinicId: clinic.id,
        patientName: patients[1].firstName,
        phone: patients[1].phone,
        date: addDays(4, 16, 30),
      },

      {
        clinicId: clinic.id,
        patientName: patients[2].firstName,
        phone: patients[2].phone,
        date: addDays(0, 10, 0),
      },

      {
        clinicId: clinic.id,
        patientName: patients[3].firstName,
        phone: patients[3].phone,
        date: addDays(2, 11, 30),
      },

      {
        clinicId: clinic.id,
        patientName: patients[4].firstName,
        phone: patients[4].phone,
        date: addDays(7, 17, 0),
      },

      {
        clinicId: clinic.id,
        patientName: patients[5].firstName,
        phone: patients[5].phone,
        date: addDays(10, 18, 0),
      },
    ],
  });

  // ============================================================
  // INVOICES
  // ============================================================

  const invoice1 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patients[0].id,
      invoiceNumber: "INV-0001",
      subtotal: 500,
      total: 500,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice1.id,
      description: "Consultation",
      quantity: 1,
      unitPrice: 500,
      amount: 500,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patients[1].id,
      invoiceNumber: "INV-0002",
      subtotal: 1500,
      total: 1500,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice2.id,
      description: "Scaling",
      quantity: 1,
      unitPrice: 1500,
      amount: 1500,
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patients[2].id,
      invoiceNumber: "INV-0003",
      subtotal: 5000,
      total: 5000,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice3.id,
      description: "Root Canal Treatment",
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
    },
  });

  // ============================================================
  // PAYMENTS
  // ============================================================

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 500,
      method: "CASH",
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 1500,
      method: "UPI",
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice3.id,
      amount: 3000,
      method: "CARD",
    },
  });

  // ============================================================
  // VERIFY
  // ============================================================

  console.log("");
  console.log("==========================================");
  console.log("TEST DATABASE CREATED");
  console.log("==========================================");

  console.log(`Admin:       ${admin.email}`);
  console.log(`Clinic:      ${clinic.name}`);
  console.log(`Doctor:      ${doctor.name}`);
  console.log(`Patients:    ${patients.length}`);
  console.log(`Treatments:  ${treatments.length}`);

  console.log("");
  console.log("Demo Patient IDs:");

  for (const patient of patients) {
    console.log(
      `${patient.patientNumber} -> ${patient.firstName}`
    );
  }

  console.log("");
  console.log("Multiple appointment test:");
  console.log("JDC-001 -> 3 appointments");
  console.log("JDC-002 -> 2 appointments");

  console.log("");
  console.log("==========================================");
  console.log("SEED COMPLETED");
  console.log("==========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==========================================");
    console.error("TEST SEED FAILED");
    console.error("==========================================");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });