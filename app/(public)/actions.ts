"use server";

import prisma from "@/prisma";
import { getClinic } from "@/src/lib/clinic";
import { redirect } from "next/navigation";

export async function submitAppointment(formData: FormData) {
  const clinic = await getClinic();

  const patientName = formData.get("patientName") as string;
  const phone = formData.get("phone") as string;
  const dateStr = formData.get("date") as string;
  const slot = formData.get("slot") as string; // "Morning" | "Evening"
  const treatment = formData.get("treatment") as string;
  const message = formData.get("message") as string;

  if (!patientName || !phone || !dateStr || !slot) {
    redirect("/?error=missing#appointment");
  }

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      patientName,
      phone,
      date: new Date(dateStr),
      time: slot === "Morning" ? "10:00 AM – 1:00 PM" : "4:30 PM – 8:30 PM",
      treatment,
      message,
      status: "PENDING",
    },
  });

  redirect("/?success=1#appointment");
}