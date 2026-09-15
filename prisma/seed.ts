import {
  PrismaClient,
  UserRole,
  AppointmentStatus,
  ClinicalRecordType,
  TreatmentStatus,
  InvoiceStatus,
  PaymentMethod,
  AttachmentType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Jaswith Dental Care...");

  // ------------------------------------------------------------
  // CLEAN EXISTING DEMO DATA
  // ------------------------------------------------------------
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.treatmentRecord.deleteMany();
  await prisma.toothRecord.deleteMany();
  await prisma.clinicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.dentalHistory.deleteMany();
  await prisma.medicalHistory.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.clinic.deleteMany();

  // ------------------------------------------------------------
  // CLINIC
  // ------------------------------------------------------------
  const clinic = await prisma.clinic.create({
    data: {
      name: "Jaswith Dental Care",
      tagline: "Complete Dental Care for Every Smile",
      phone: "+91 98765 43210",
      whatsapp: "+91 98765 43210",
      email: "hello@jaswithdentalcare.com",
      address: "Chennai, Tamil Nadu, India",
      mapsUrl: "https://maps.google.com/",
      openingHours: "Mon-Sat: 9:00 AM - 8:00 PM",
      invoicePrefix: "JDC",
      patientPrefix: "JDC",
    },
  });

  // ------------------------------------------------------------
  // ADMIN USERS
  // NOTE: passwordHash is intentionally a placeholder.
  // Replace with your real bcrypt hash if login testing is required.
  // ------------------------------------------------------------
  await prisma.adminUser.create({
    data: {
      email: "admin@jaswithdentalcare.com",
      passwordHash: "REPLACE_WITH_BCRYPT_HASH",
      name: "Jaswith Admin",
      role: UserRole.ADMIN,
      active: true,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Priya Sharma",
      qualification: "BDS, MDS",
      specialization: "Prosthodontics & Cosmetic Dentistry",
      bio: "Experienced dentist focused on restorative, cosmetic and preventive dental care.",
      image: "/images/doctor-1.jpg",
      active: true,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: "Dr. Arun Kumar",
      qualification: "BDS",
      specialization: "General & Restorative Dentistry",
      bio: "Providing comfortable and comprehensive dental treatment for patients of all ages.",
      image: "/images/doctor-2.jpg",
      active: true,
    },
  });

  // ------------------------------------------------------------
  // TREATMENTS
  // ------------------------------------------------------------
  const dentalImplants = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Dental Implants",
      description: "Advanced, long-lasting replacement for missing teeth.",
      image: "/images/dental-implants.jpg",
      price: 35000,
      active: true,
    },
  });

  const dentures = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Complete & Partial Dentures",
      description: "Comfortable and natural-looking tooth replacement solutions.",
      image: "/images/dentures.jpg",
      price: 18000,
      active: true,
    },
  });

  const smileDesign = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Smile Designing & Cosmetics",
      description: "Cosmetic treatments designed to create a confident, natural smile.",
      image: "/images/smile-designing.jpg",
      price: 25000,
      active: true,
    },
  });

  const rootCanal = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Root Canal & Full Mouth Rehab",
      description: "Comprehensive restorative care for damaged or infected teeth.",
      image: "/images/root-canal.jpg",
      price: 6500,
      active: true,
    },
  });

  const cleaning = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Teeth Cleaning & Polishing",
      description: "Professional cleaning to maintain healthy teeth and gums.",
      image: "/images/cleaning.jpg",
      price: 1500,
      active: true,
    },
  });

  const braces = await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: "Braces & Orthodontics",
      description: "Orthodontic treatment for improved alignment and bite.",
      image: "/images/braces.jpg",
      price: 45000,
      active: true,
    },
  });

  // ------------------------------------------------------------
  // TESTIMONIALS
  // ------------------------------------------------------------
  await prisma.testimonial.createMany({
    data: [
      {
        clinicId: clinic.id,
        name: "Rahul",
        review: "Very professional and friendly team. The treatment was explained clearly and the experience was excellent.",
        rating: 5,
      },
      {
        clinicId: clinic.id,
        name: "Sneha",
        review: "The clinic is clean and modern. Dr. Priya made me feel comfortable throughout my treatment.",
        rating: 5,
      },
      {
        clinicId: clinic.id,
        name: "Vignesh",
        review: "I had my root canal treatment here and the entire process was smooth and comfortable.",
        rating: 4,
      },
      {
        clinicId: clinic.id,
        name: "Meena",
        review: "Excellent service and very caring staff. Highly recommended for families.",
        rating: 5,
      },
    ],
  });

  // ------------------------------------------------------------
  // PATIENTS
  // ------------------------------------------------------------
  const patient1 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      patientNumber: "JDC001",
      firstName: "Rahul",
      lastName: "Krishnan",
      dateOfBirth: new Date("1994-05-14"),
      gender: "Male",
      phone: "+91 90000 10001",
      alternatePhone: "+91 90000 10011",
      email: "rahul@example.com",
      address: "Anna Nagar, Chennai",
      occupation: "Software Developer",
      bloodGroup: "O+",
      emergencyName: "Lakshmi Krishnan",
      emergencyPhone: "+91 90000 10012",
      emergencyRelation: "Mother",
      allergies: "Penicillin",
      medicalAlerts: "No major medical alerts",
      notes: "Prefers evening appointments.",
      medicalHistory: {
        create: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          asthma: false,
          bleedingDisorder: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          epilepsy: false,
          pregnancy: false,
          smoker: false,
          tobaccoUse: false,
          alcoholUse: true,
          currentMedications: null,
          previousSurgeries: null,
          otherConditions: null,
          familyHistory: "Mother has a history of gum disease.",
        },
      },
      dentalHistory: {
        create: {
          previousDentist: "City Dental Clinic",
          lastDentalVisit: new Date("2025-12-10"),
          brushingFrequency: "Twice daily",
          flossingFrequency: "Occasionally",
          sensitivity: true,
          gumBleeding: false,
          toothPain: true,
          previousRootCanal: false,
          previousExtraction: false,
          dentures: false,
          implants: false,
          braces: false,
          previousTreatments: "Dental cleaning",
          dentalNotes: "Sensitive to cold drinks.",
        },
      },
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      patientNumber: "JDC002",
      firstName: "Sneha",
      lastName: "Ramesh",
      dateOfBirth: new Date("1998-09-21"),
      gender: "Female",
      phone: "+91 90000 10002",
      email: "sneha@example.com",
      address: "Velachery, Chennai",
      occupation: "Designer",
      bloodGroup: "A+",
      emergencyName: "Ramesh Kumar",
      emergencyPhone: "+91 90000 10022",
      emergencyRelation: "Father",
      allergies: "None known",
      medicalAlerts: null,
      notes: "Interested in cosmetic dentistry.",
      medicalHistory: {
        create: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          asthma: false,
          bleedingDisorder: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          epilepsy: false,
          pregnancy: false,
          smoker: false,
          tobaccoUse: false,
          alcoholUse: false,
          currentMedications: null,
          previousSurgeries: null,
          otherConditions: null,
          familyHistory: null,
        },
      },
      dentalHistory: {
        create: {
          previousDentist: null,
          lastDentalVisit: new Date("2025-08-15"),
          brushingFrequency: "Twice daily",
          flossingFrequency: "Daily",
          sensitivity: false,
          gumBleeding: true,
          toothPain: false,
          previousRootCanal: false,
          previousExtraction: false,
          dentures: false,
          implants: false,
          braces: true,
          previousTreatments: "Orthodontic treatment",
          dentalNotes: "Interested in smile designing.",
        },
      },
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      patientNumber: "JDC003",
      firstName: "Aravind",
      lastName: "Mohan",
      dateOfBirth: new Date("1987-02-03"),
      gender: "Male",
      phone: "+91 90000 10003",
      email: "aravind@example.com",
      address: "Porur, Chennai",
      occupation: "Business Owner",
      bloodGroup: "B+",
      emergencyName: "Divya Mohan",
      emergencyPhone: "+91 90000 10033",
      emergencyRelation: "Wife",
      allergies: null,
      medicalAlerts: "Hypertension",
      notes: "Requires morning appointments.",
      medicalHistory: {
        create: {
          diabetes: false,
          hypertension: true,
          heartDisease: false,
          asthma: false,
          bleedingDisorder: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          epilepsy: false,
          pregnancy: false,
          smoker: true,
          tobaccoUse: true,
          alcoholUse: true,
          currentMedications: "Amlodipine",
          previousSurgeries: null,
          otherConditions: null,
          familyHistory: "Father had hypertension.",
        },
      },
      dentalHistory: {
        create: {
          previousDentist: "Smile Care",
          lastDentalVisit: new Date("2024-11-20"),
          brushingFrequency: "Once daily",
          flossingFrequency: "Rarely",
          sensitivity: false,
          gumBleeding: true,
          toothPain: true,
          previousRootCanal: true,
          previousExtraction: true,
          dentures: false,
          implants: false,
          braces: false,
          previousTreatments: "Root canal treatment",
          dentalNotes: "Needs periodontal evaluation.",
        },
      },
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      clinicId: clinic.id,
      patientNumber: "JDC004",
      firstName: "Meena",
      lastName: "Suresh",
      dateOfBirth: new Date("2001-12-11"),
      gender: "Female",
      phone: "+91 90000 10004",
      email: "meena@example.com",
      address: "Adyar, Chennai",
      occupation: "Student",
      bloodGroup: "AB+",
      emergencyName: "Suresh Kumar",
      emergencyPhone: "+91 90000 10044",
      emergencyRelation: "Father",
      allergies: "None known",
      medicalAlerts: null,
      notes: "First dental consultation.",
      medicalHistory: {
        create: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          asthma: true,
          bleedingDisorder: false,
          kidneyDisease: false,
          liverDisease: false,
          thyroidDisease: false,
          epilepsy: false,
          pregnancy: false,
          smoker: false,
          tobaccoUse: false,
          alcoholUse: false,
          currentMedications: "Salbutamol inhaler when required",
          previousSurgeries: null,
          otherConditions: null,
          familyHistory: null,
        },
      },
      dentalHistory: {
        create: {
          previousDentist: null,
          lastDentalVisit: null,
          brushingFrequency: "Twice daily",
          flossingFrequency: "Daily",
          sensitivity: false,
          gumBleeding: false,
          toothPain: false,
          previousRootCanal: false,
          previousExtraction: false,
          dentures: false,
          implants: false,
          braces: false,
          previousTreatments: null,
          dentalNotes: "Routine consultation.",
        },
      },
    },
  });

  // ------------------------------------------------------------
  // APPOINTMENTS
  // ------------------------------------------------------------
  const today = new Date();
  const day = (offset: number, hour: number, minute = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const appointment1 = await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      patientName: "Rahul Krishnan",
      phone: patient1.phone,
      date: day(0, 10, 30),
      time: "10:30 AM",
      duration: 45,
      treatment: "Root Canal & Full Mouth Rehab",
      reason: "Tooth pain",
      message: "Pain in upper right tooth for the last few days.",
      status: AppointmentStatus.CONFIRMED,
      notes: "Patient has penicillin allergy.",
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient2.id,
      doctorId: doctor1.id,
      patientName: "Sneha Ramesh",
      phone: patient2.phone,
      date: day(0, 12, 0),
      time: "12:00 PM",
      duration: 60,
      treatment: "Smile Designing & Cosmetics",
      reason: "Cosmetic consultation",
      message: "Wants to discuss smile improvement options.",
      status: AppointmentStatus.PENDING,
      notes: "Initial cosmetic consultation.",
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient3.id,
      doctorId: doctor2.id,
      patientName: "Aravind Mohan",
      phone: patient3.phone,
      date: day(1, 9, 30),
      time: "09:30 AM",
      duration: 45,
      treatment: "Teeth Cleaning & Polishing",
      reason: "Gum bleeding",
      message: "Experiencing occasional gum bleeding.",
      status: AppointmentStatus.CONFIRMED,
      notes: "Check blood pressure before procedure.",
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient4.id,
      doctorId: doctor2.id,
      patientName: "Meena Suresh",
      phone: patient4.phone,
      date: day(2, 16, 0),
      time: "04:00 PM",
      duration: 30,
      treatment: "Dental Consultation",
      reason: "Routine check-up",
      message: "First dental visit.",
      status: AppointmentStatus.PENDING,
      notes: "Asthma history.",
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      doctorId: doctor1.id,
      patientName: "Rahul Krishnan",
      phone: patient1.phone,
      date: day(-5, 11, 0),
      time: "11:00 AM",
      duration: 60,
      treatment: "Dental Cleaning",
      reason: "Routine cleaning",
      status: AppointmentStatus.COMPLETED,
      notes: "Cleaning completed successfully.",
    },
  });

  // ------------------------------------------------------------
  // TOOTH RECORDS
  // ------------------------------------------------------------
  const tooth1 = await prisma.toothRecord.create({
    data: {
      patientId: patient1.id,
      toothNumber: "16",
      region: "Upper Right",
      condition: "Caries",
      diagnosis: "Deep dental caries",
      notes: "Root canal recommended.",
      surfaceMesial: true,
      surfaceOcclusal: true,
      surfaceDistal: false,
      surfaceBuccal: true,
      surfaceLingual: false,
    },
  });

  await prisma.toothRecord.create({
    data: {
      patientId: patient1.id,
      toothNumber: "17",
      region: "Upper Right",
      condition: "Caries",
      diagnosis: "Moderate caries",
      notes: "Monitor after treatment of 16.",
      surfaceOcclusal: true,
    },
  });

  await prisma.toothRecord.create({
    data: {
      patientId: patient3.id,
      toothNumber: "36",
      region: "Lower Left",
      condition: "Missing",
      diagnosis: "Previously extracted",
      notes: "Consider implant consultation.",
    },
  });

  // ------------------------------------------------------------
  // CLINICAL RECORDS
  // ------------------------------------------------------------
  const clinical1 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      appointmentId: appointment1.id,
      type: ClinicalRecordType.CONSULTATION,
      chiefComplaint: "Pain in upper right molar.",
      examination: "Deep caries noted on tooth 16. Tenderness on percussion.",
      diagnosis: "Irreversible pulpitis with deep caries.",
      clinicalNotes: "Discussed root canal treatment and alternatives.",
      followUpDate: day(7, 10, 0),
    },
  });

  const clinical2 = await prisma.clinicalRecord.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      type: ClinicalRecordType.CONSULTATION,
      chiefComplaint: "Dissatisfaction with smile appearance.",
      examination: "Mild discoloration and uneven anterior tooth appearance.",
      diagnosis: "Cosmetic concerns; suitable for smile design consultation.",
      clinicalNotes: "Discussed whitening and cosmetic options.",
      followUpDate: day(14, 12, 0),
    },
  });

  await prisma.clinicalRecord.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor2.id,
      type: ClinicalRecordType.DIAGNOSIS,
      chiefComplaint: "Bleeding gums.",
      examination: "Generalized plaque and gingival inflammation.",
      diagnosis: "Gingivitis.",
      clinicalNotes: "Recommended scaling, improved brushing and tobacco cessation.",
      followUpDate: day(21, 9, 30),
    },
  });

  // ------------------------------------------------------------
  // TREATMENT RECORDS
  // ------------------------------------------------------------
  await prisma.treatmentRecord.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicalRecordId: clinical1.id,
      treatmentId: rootCanal.id,
      toothRecordId: tooth1.id,
      treatmentName: "Root Canal Treatment",
      diagnosis: "Irreversible pulpitis",
      notes: "First stage completed.",
      status: TreatmentStatus.IN_PROGRESS,
      scheduledDate: day(0, 10, 30),
      cost: 6500,
    },
  });

  await prisma.treatmentRecord.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      clinicalRecordId: clinical2.id,
      treatmentId: smileDesign.id,
      treatmentName: "Smile Designing Consultation",
      diagnosis: "Cosmetic dental concerns",
      notes: "Treatment plan discussed.",
      status: TreatmentStatus.PLANNED,
      scheduledDate: day(14, 12, 0),
      cost: 25000,
    },
  });

  await prisma.treatmentRecord.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor2.id,
      treatmentId: cleaning.id,
      treatmentName: "Teeth Cleaning & Polishing",
      diagnosis: "Gingivitis",
      notes: "Scaling completed.",
      status: TreatmentStatus.COMPLETED,
      scheduledDate: day(-5, 11, 0),
      completedDate: day(-5, 11, 45),
      cost: 1500,
    },
  });

  // ------------------------------------------------------------
  // PRESCRIPTIONS
  // ------------------------------------------------------------
  const prescription = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      prescriptionDate: day(0, 11, 30),
      notes: "Take medication after food. Complete prescribed course.",
      items: {
        create: [
          {
            medicine: "Ibuprofen 400mg",
            dosage: "400mg",
            frequency: "Twice daily",
            duration: "3 days",
            instructions: "After food",
          },
          {
            medicine: "Chlorhexidine Mouthwash",
            dosage: "10ml",
            frequency: "Twice daily",
            duration: "7 days",
            instructions: "Rinse for 30 seconds and do not swallow",
          },
        ],
      },
    },
  });

  // ------------------------------------------------------------
  // INVOICES
  // ------------------------------------------------------------
  const invoice1 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patient1.id,
      invoiceNumber: "JDC-0001",
      status: InvoiceStatus.PARTIAL,
      subtotal: 6500,
      discount: 500,
      tax: 0,
      total: 6000,
      notes: "Root canal treatment - first stage.",
      invoiceDate: day(0, 11, 0),
      items: {
        create: [
          {
            treatmentId: rootCanal.id,
            treatmentRecordId: (
              await prisma.treatmentRecord.findFirstOrThrow({
                where: {
                  patientId: patient1.id,
                  treatmentId: rootCanal.id,
                },
              })
            ).id,
            description: "Root Canal Treatment",
            quantity: 1,
            unitPrice: 6500,
            amount: 6500,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 3000,
            method: PaymentMethod.UPI,
            reference: "UPI-JDC-10001",
            notes: "Advance payment",
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patient3.id,
      invoiceNumber: "JDC-0002",
      status: InvoiceStatus.PAID,
      subtotal: 1500,
      discount: 0,
      tax: 0,
      total: 1500,
      notes: "Cleaning completed.",
      invoiceDate: day(-5, 12, 0),
      items: {
        create: [
          {
            treatmentId: cleaning.id,
            description: "Teeth Cleaning & Polishing",
            quantity: 1,
            unitPrice: 1500,
            amount: 1500,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 1500,
            method: PaymentMethod.CASH,
            reference: null,
            notes: "Paid at clinic",
          },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      clinicId: clinic.id,
      patientId: patient2.id,
      invoiceNumber: "JDC-0003",
      status: InvoiceStatus.UNPAID,
      subtotal: 25000,
      discount: 1000,
      tax: 0,
      total: 24000,
      notes: "Smile designing treatment plan.",
      invoiceDate: day(0, 13, 0),
      items: {
        create: [
          {
            treatmentId: smileDesign.id,
            description: "Smile Designing & Cosmetics",
            quantity: 1,
            unitPrice: 25000,
            amount: 25000,
          },
        ],
      },
    },
  });

  // ------------------------------------------------------------
  // ATTACHMENTS
  // Use small data URLs so the seed is self-contained.
  // ------------------------------------------------------------
  const demoPdf =
    "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrpO0K";

  await prisma.attachment.create({
    data: {
      patientId: patient1.id,
      clinicalRecordId: clinical1.id,
      name: "Dental Report.pdf",
      type: AttachmentType.DOCUMENT,
      mimeType: "application/pdf",
      size: Buffer.byteLength(demoPdf),
      url: demoPdf,
      storageKey: null,
      description: "Demo dental report attachment.",
    },
  });

  await prisma.attachment.create({
    data: {
      patientId: patient2.id,
      clinicalRecordId: clinical2.id,
      name: "Smile Consultation.jpg",
      type: AttachmentType.PHOTO,
      mimeType: "image/jpeg",
      size: 1024,
      url: "https://placehold.co/800x600.jpg",
      storageKey: null,
      description: "Demo cosmetic consultation image.",
    },
  });

  console.log("Seed completed successfully.");
  console.log("");
  console.log("Clinic:", clinic.name);
  console.log("Patients: 4");
  console.log("Doctors: 2");
  console.log("Treatments: 6");
  console.log("Appointments: 5");
  console.log("Clinical records: 3");
  console.log("Invoices: 3");
  console.log("Prescription:", prescription.id);
  console.log("Invoice IDs:", invoice1.id, invoice2.id, invoice3.id);
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
