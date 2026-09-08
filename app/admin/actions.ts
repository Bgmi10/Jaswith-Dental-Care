"use server";

import prisma from "@/prisma";
import { getClinic } from "@/src/lib/clinic";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

// ---------- CLINIC ----------
export async function updateClinic(formData: FormData) {
  const clinic = await getClinic();

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      name: formData.get("name") as string,
      tagline: formData.get("tagline") as string,
      phone: formData.get("phone") as string,
      whatsapp: formData.get("whatsapp") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      mapsUrl: formData.get("mapsUrl") as string,
      openingHours: formData.get("openingHours") as string,
    },
  });

  revalidatePath("/admin");
}

// ---------- DOCTORS ----------
export async function addDoctor(formData: FormData) {
  const clinic = await getClinic();

  await prisma.doctor.create({
    data: {
      clinicId: clinic.id,
      name: formData.get("name") as string,
      qualification: formData.get("qualification") as string,
      specialization: formData.get("specialization") as string,
      bio: formData.get("bio") as string,
      image: formData.get("image") as string,
    },
  });

  revalidatePath("/admin");
}

export async function deleteDoctor(formData: FormData) {
  await prisma.doctor.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

// ---------- TREATMENTS ----------
export async function addTreatment(formData: FormData) {
  const clinic = await getClinic();

  await prisma.treatment.create({
    data: {
      clinicId: clinic.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      image: formData.get("image") as string,
    },
  });

  revalidatePath("/admin");
}

export async function deleteTreatment(formData: FormData) {
  await prisma.treatment.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

// ---------- TESTIMONIALS ----------
export async function addTestimonial(formData: FormData) {
  const clinic = await getClinic();

  await prisma.testimonial.create({
    data: {
      clinicId: clinic.id,
      name: formData.get("name") as string,
      review: formData.get("review") as string,
      rating: Number(formData.get("rating")) || null,
    },
  });

  revalidatePath("/admin");
}

export async function deleteTestimonial(formData: FormData) {
  await prisma.testimonial.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

// ---------- APPOINTMENTS ----------
export async function updateAppointmentStatus(formData: FormData) {
  await prisma.appointment.update({
    where: { id: formData.get("id") as string },
    data: { status: formData.get("status") as string },
  });

  revalidatePath("/admin");
}

export async function deleteAppointment(formData: FormData) {
  await prisma.appointment.delete({ where: { id: formData.get("id") as string } });
  revalidatePath("/admin");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/admin/login");
  }