// src/lib/clinic.ts
import prisma from "@/prisma";

export async function getClinic() {
  const clinic = await prisma.clinic.findFirst();

  if (!clinic) {
    throw new Error("Clinic not seeded yet");
  }

  return clinic;
}