import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---------- ADMIN USER ----------
  const email = process.env.ADMIN_EMAIL ?? "admin@gmail.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Admin seeded: ${email}`);

  // ---------- CLINIC ----------
  let clinic = await prisma.clinic.findFirst();

  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: "Jaswith Dental Care",
        tagline: "Advanced dental implants and complete smile care in Chennai",
        phone: "+91 8525033648",
        whatsapp: "+91 8525033648",
        email: "",
        address: "48/58, Mangailakshmi Building, Vadamalai Street, Purasaiwakkam, Chennai - 600007",
        mapsUrl: "https://www.google.com/maps/place/Jaswith+Dental+Care",
        openingHours: "Mon–Sat: 10:00 AM–1:00 PM & 4:30 PM–8:30 PM · Sundays by appointment",
      },
    });

    console.log(`Clinic seeded: ${clinic.name} (${clinic.id})`);
  } else {
    console.log(`Clinic already exists: ${clinic.name} (${clinic.id})`);
  }

  // ---------- DOCTOR ----------
  const existingDoctor = await prisma.doctor.findFirst({
    where: { clinicId: clinic.id, name: "Dr. Sailakshmi J." },
  });

  if (!existingDoctor) {
    await prisma.doctor.create({
      data: {
        clinicId: clinic.id,
        name: "Dr. Sailakshmi J.",
        qualification: "BDS, MDS",
        specialization: "Prosthodontist & Implantologist",
        bio: "Specialises in advanced dental implants, full mouth rehabilitation, and smile design.",
      },
    });
    console.log("Doctor seeded: Dr. Sailakshmi J.");
  }

  // ---------- TREATMENTS ----------
  const treatments = [
    {
      name: "Dental Implants",
      description: "Advanced, long-lasting replacement for missing teeth.",
    },
    {
      name: "Complete & Partial Dentures",
      description: "Custom-fitted dentures restoring function and appearance.",
    },
    {
      name: "Smile Designing & Cosmetics",
      description: "Cosmetic treatments tailored to enhance your smile.",
    },
    {
      name: "Root Canal & Full Mouth Rehab",
      description: "Comprehensive root canal therapy and full mouth restoration.",
    },
  ];

  for (const t of treatments) {
    const exists = await prisma.treatment.findFirst({
      where: { clinicId: clinic.id, name: t.name },
    });

    if (!exists) {
      await prisma.treatment.create({
        data: { clinicId: clinic.id, ...t },
      });
      console.log(`Treatment seeded: ${t.name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());