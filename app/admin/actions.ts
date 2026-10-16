"use server";

import prisma from "@/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

/* ============================================================
   TYPES
============================================================ */

/* ============================================================
   HELPERS
============================================================ */

function str(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const result = String(value).trim();

  return result === "" ? null : result;
}

function requiredStr(
  value: unknown,
  field: string
): string {
  const result = str(value);

  if (!result) {
    throw new Error(`${field} is required`);
  }

  return result;
}

function int(value: unknown): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const result = Number(value);

  if (!Number.isFinite(result)) {
    return null;
  }

  return Math.trunc(result);
}

function bool(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === "true" ||
    value === "1" ||
    value === 1 ||
    value === "on"
  ) {
    return true;
  }

  return false;
}

function date(value: unknown): Date | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const result = new Date(String(value));

  if (Number.isNaN(result.getTime())) {
    return null;
  }

  return result;
}

function decimal(
  value: unknown
): Prisma.Decimal | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  try {
    return new Prisma.Decimal(String(value));
  } catch {
    return null;
  }
}

function decimalZero(value: unknown) {
  return (
    decimal(value) ??
    new Prisma.Decimal(0)
  );
}

/* ============================================================
   PATIENT NUMBER SORTING
============================================================ */

/**
 * Extract the numeric portion from a patient number.
 *
 * Examples:
 *
 * JASWITH-00001 -> 1
 * JASWITH-00002 -> 2
 * JASWITH-00010 -> 10
 * JASWITH-00123 -> 123
 * JASWITH-00132 -> 132
 *
 * The prefix is ignored when sorting.
 */
function getPatientNumberValue(
  patientNumber: unknown
): number {
  if (
    patientNumber === undefined ||
    patientNumber === null
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const value =
    String(patientNumber).trim();

  const match =
    value.match(/(\d+)$/);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  const number =
    Number(match[1]);

  if (
    !Number.isSafeInteger(number)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return number;
}

/**
 * Sort patients by the numeric suffix of patientNumber.
 *
 * Example:
 *
 * Input:
 *
 * JASWITH-00010
 * JASWITH-00002
 * JASWITH-00132
 * JASWITH-00001
 * JASWITH-00123
 *
 * Output:
 *
 * JASWITH-00001
 * JASWITH-00002
 * JASWITH-00010
 * JASWITH-00123
 * JASWITH-00132
 */
function sortPatientsByNumber<
  T extends {
    patientNumber?: string | null;
  }
>(
  patients: T[],
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...patients].sort(
    (a, b) => {
      const aNumber =
        getPatientNumberValue(
          a.patientNumber
        );

      const bNumber =
        getPatientNumberValue(
          b.patientNumber
        );

      if (
        aNumber === bNumber
      ) {
        const aValue =
          a.patientNumber ?? "";

        const bValue =
          b.patientNumber ?? "";

        return aValue.localeCompare(
          bValue,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }

      return direction === "asc"
        ? aNumber - bNumber
        : bNumber - aNumber;
    }
  );
}

/* ============================================================
   PATIENT NUMBER GENERATION
============================================================ */

/**
 * Generate the first available patient number.
 *
 * Examples:
 *
 * JASWITH-00001
 * JASWITH-00002
 * JASWITH-00003
 *
 * If JASWITH-00003 is deleted:
 *
 * next patient => JASWITH-00003
 *
 * If JASWITH-00001 is deleted:
 *
 * next patient => JASWITH-00001
 *
 * PostgreSQL advisory lock is used so that two simultaneous
 * patient creations for the same clinic cannot generate
 * the same patient number.
 */
async function generatePatientNumber(
  clinicId: string
): Promise<string> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`
          SELECT pg_advisory_xact_lock(
            hashtext(${clinicId})
          )
        `
      );

      const clinic =
        await tx.clinic.findUnique({
          where: {
            id: clinicId,
          },
          select: {
            patientPrefix: true,
          },
        });

      if (!clinic) {
        throw new Error(
          "Clinic not found"
        );
      }

      const prefix =
        clinic.patientPrefix ||
        "JASWITH";

      const patients =
        await tx.patient.findMany({
          where: {
            clinicId,
          },
          select: {
            patientNumber: true,
          },
        });

      const usedNumbers =
        new Set<number>();

      for (const patient of patients) {
        const match =
          patient.patientNumber.match(
            /(\d+)$/
          );

        if (match) {
          const number =
            Number(match[1]);

          if (
            Number.isSafeInteger(
              number
            ) &&
            number > 0
          ) {
            usedNumbers.add(
              number
            );
          }
        }
      }

      let nextNumber = 1;

      while (
        usedNumbers.has(nextNumber)
      ) {
        nextNumber++;
      }

      return `${prefix}-${String(
        nextNumber
      ).padStart(5, "0")}`;
    }
  );
}

/* ============================================================
   REVALIDATION
============================================================ */

function revalidatePatient(
  patientId?: string | null
) {
  revalidatePath("/patients");

  if (patientId) {
    revalidatePath(
      `/patients/${patientId}`
    );
  }

  revalidatePath("/dashboard");
}

function revalidateAppointments() {
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
}

function revalidateBilling() {
  revalidatePath("/billing");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

/* ============================================================
   DASHBOARD
============================================================ */

export async function getDashboardData(
  clinicId: string
) {
  try {
    if (!clinicId) {
      throw new Error(
        "Clinic ID is required"
      );
    }

    const now = new Date();

    const startOfToday =
      new Date(now);

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );

    const endOfToday =
      new Date(now);

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const endOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

    const [
      patientCount,
      todayAppointments,
      pendingAppointments,
      completedTreatments,
      unpaidInvoices,
      todayPayments,
      monthPayments,
      recentPatients,
      upcomingAppointments,
      recentPayments,
    ] = await Promise.all([
      prisma.patient.count({
        where: {
          clinicId,
        },
      }),

      prisma.appointment.count({
        where: {
          clinicId,
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          clinicId,
          status: "PENDING",
        },
      }),

      prisma.treatmentRecord.count({
        where: {
          patient: {
            clinicId,
          },
          status: "COMPLETED",
        },
      }),

      prisma.invoice.aggregate({
        where: {
          clinicId,
          status: {
            in: [
              "UNPAID",
              "PARTIAL",
            ],
          },
        },
        _sum: {
          total: true,
        },
        _count: {
          id: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          invoice: {
            clinicId,
          },
          paymentDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.payment.aggregate({
        where: {
          invoice: {
            clinicId,
          },
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      prisma.patient.findMany({
        where: {
          clinicId,
        },

        /*
         * Keep dashboard "recent patients"
         * sorted by registration date.
         */
        orderBy: {
          registeredAt: "desc",
        },

        take: 10,

        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          registeredAt: true,
        },
      }),

      prisma.appointment.findMany({
        where: {
          clinicId,
          date: {
            gte: startOfToday,
          },
          status: {
            notIn: [
              "CANCELLED",
              "COMPLETED",
            ],
          },
        },

        orderBy: [
          {
            date: "asc",
          },
          {
            time: "asc",
          },
        ],

        take: 10,

        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },

          doctor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.payment.findMany({
        where: {
          invoice: {
            clinicId,
          },
        },

        orderBy: {
          paymentDate: "desc",
        },

        take: 10,

        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,

              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  patientNumber: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,

      stats: {
        patients: patientCount,
        todayAppointments,
        pendingAppointments,
        completedTreatments,

        unpaidInvoices:
          unpaidInvoices._count.id,

        outstandingAmount:
          unpaidInvoices._sum.total ??
          new Prisma.Decimal(0),

        todayRevenue:
          todayPayments._sum.amount ??
          new Prisma.Decimal(0),

        monthRevenue:
          monthPayments._sum.amount ??
          new Prisma.Decimal(0),
      },

      recentPatients,
      upcomingAppointments,
      recentPayments,
    };
  } catch (error) {
    console.error(
      "getDashboardData error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load dashboard",
    };
  }
}

/* ============================================================
   DASHBOARD APPOINTMENTS
============================================================ */

export async function getDashboardAppointments(
  clinicId: string
) {
  try {
    const appointments =
      await prisma.appointment.findMany({
        where: {
          clinicId,
        },

        orderBy: [
          {
            date: "asc",
          },
          {
            time: "asc",
          },
        ],

        take: 50,

        include: {
          patient: true,
          doctor: true,
        },
      });

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error(
      "getDashboardAppointments error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load appointments",
    };
  }
}

/* ============================================================
   PATIENT
============================================================ */

/* ============================================================
   PATIENT
============================================================ */

export async function getPatients(
  clinicId: string
) {
  try {
    if (!clinicId) {
      throw new Error(
        "Clinic ID is required"
      );
    }

    const patients =
      await prisma.patient.findMany({
        where: {
          clinicId,
        },

        /*
         * We intentionally do not depend on Prisma's
         * string ordering for patientNumber.
         *
         * The final array is sorted numerically below.
         */
        orderBy: {
          registeredAt: "desc",
        },

        include: {
          medicalHistory: true,

          dentalHistory: true,

          appointments: {
            orderBy: {
              date: "desc",
            },
            take: 5,
          },

          treatmentRecords: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },

          invoices: {
            orderBy: {
              invoiceDate: "desc",
            },
            take: 5,
          },
        },
      });

    /*
     * IMPORTANT:
     *
     * Always sort the COMPLETE patient array here.
     *
     * This changes:
     *
     * JDC-00002
     * JDC-00003
     * JDC-00001
     *
     * into:
     *
     * JDC-00001
     * JDC-00002
     * JDC-00003
     */
    const sortedPatients =
      [...patients].sort(
        (a, b) => {
          const aNumber =
            getPatientNumberValue(
              a.patientNumber
            );

          const bNumber =
            getPatientNumberValue(
              b.patientNumber
            );

          /*
           * Primary sort:
           * numeric patient number.
           */
          if (
            aNumber !== bNumber
          ) {
            return (
              bNumber - aNumber
            );
          }

          /*
           * Secondary sort:
           * patientNumber itself.
           *
           * This gives deterministic ordering
           * if two records somehow have the
           * same numeric suffix.
           */
          return (
            String(
              a.patientNumber ?? ""
            ).localeCompare(
              String(
                b.patientNumber ?? ""
              ),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              }
            )
          );
        }
      );

    return {
      success: true,

      /*
       * THIS is the array the Patients page
       * receives.
       *
       * It is guaranteed to be:
       *
       * JDC-00001
       * JDC-00002
       * JDC-00003
       * JDC-00004
       * ...
       */
      patients:
        sortedPatients,
    };
  } catch (error) {
    console.error(
      "getPatients error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load patients",
    };
  }
}


export async function getPatient(
  patientId: string
) {
  try {
    if (!patientId) {
      throw new Error(
        "Patient ID is required"
      );
    }

    const patient =
      await prisma.patient.findUnique({
        where: {
          id: patientId,
        },

        include: {
          medicalHistory: true,

          dentalHistory: true,

          appointments: {
            orderBy: {
              date: "desc",
            },

            include: {
              doctor: true,
            },
          },

          treatmentRecords: {
            orderBy: {
              createdAt: "desc",
            },

            include: {
              doctor: true,
              treatment: true,
              toothRecord: true,
            },
          },

          toothRecords: {
            orderBy: {
              toothNumber: "asc",
            },
          },

          prescriptions: {
            orderBy: {
              prescriptionDate:
                "desc",
            },

            include: {
              doctor: true,
              items: true,
            },
          },

          attachments: {
            orderBy: {
              createdAt: "desc",
            },
          },

          invoices: {
            orderBy: {
              invoiceDate: "desc",
            },

            include: {
              items: true,
              payments: true,
            },
          },
        },
      });

    if (!patient) {
      throw new Error(
        "Patient not found"
      );
    }

    return {
      success: true,
      patient,
    };
  } catch (error) {
    console.error(
      "getPatient error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load patient",
    };
  }
}

export async function searchPatients(
  clinicId: string,
  search: string
) {
  try {
    if (!clinicId) {
      throw new Error(
        "Clinic ID is required"
      );
    }

    const value =
      search.trim();

    if (!value) {
      return {
        success: true,
        patients: [],
      };
    }

    const patients =
      await prisma.patient.findMany({
        where: {
          clinicId,

          OR: [
            {
              firstName: {
                contains: value,
                mode: "insensitive",
              },
            },

            {
              lastName: {
                contains: value,
                mode: "insensitive",
              },
            },

            {
              patientNumber: {
                contains: value,
                mode: "insensitive",
              },
            },

            {
              phone: {
                contains: value,
              },
            },
          ],
        },

        /*
         * Do not order by patientNumber in Prisma
         * because it is a string field.
         */
        take: 25,
      });

    /*
     * Sort search results numerically.
     */
    const sortedPatients =
      sortPatientsByNumber(
        patients,
        "asc"
      );

    return {
      success: true,
      patients:
        sortedPatients,
    };
  } catch (error) {
    console.error(
      "searchPatients error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search patients",
    };
  }
}

/* ============================================================
   SAVE PATIENT
============================================================ */

export async function savePatient(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const firstName =
      requiredStr(
        data.firstName,
        "First name"
      );

    const phone =
      requiredStr(
        data.phone,
        "Phone"
      );

    const patientData = {
      clinicId,

      firstName,

      lastName:
        str(data.lastName),

      dateOfBirth:
        date(data.dateOfBirth),

      age:
        int(data.age),

      gender:
        str(data.gender),

      phone,

      alternatePhone:
        str(data.alternatePhone),

      email:
        str(data.email),

      address:
        str(data.address),

      occupation:
        str(data.occupation),

      bloodGroup:
        str(data.bloodGroup),

      emergencyName:
        str(data.emergencyName),

      emergencyPhone:
        str(data.emergencyPhone),

      emergencyRelation:
        str(data.emergencyRelation),

      allergies:
        str(data.allergies),

      medicalAlerts:
        str(data.medicalAlerts),

      currentMedications:
        str(data.currentMedications),

      previousSurgeries:
        str(data.previousSurgeries),

      dentalHistoryNotes:
        str(
          data.dentalHistoryNotes
        ),

      visitDate:
        date(data.visitDate),

      chiefComplaint:
        str(data.chiefComplaint),

      examination:
        str(data.examination),

      diagnosis:
        str(data.diagnosis),

      clinicalNotes:
        str(data.clinicalNotes),

      treatmentPlan:
        str(data.treatmentPlan),

      followUpDate:
        date(data.followUpDate),
    };

    /* ========================================================
       UPDATE EXISTING PATIENT
    ======================================================== */

    if (id) {
      const patient =
        await prisma.patient.update({
          where: {
            id,
          },

          data:
            patientData,
        });

      revalidatePatient(
        patient.id
      );

      return {
        success: true,
        patient,
      };
    }

    /* ========================================================
       CREATE NEW PATIENT
    ======================================================== */

    const patient =
      await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw(
            Prisma.sql`
              SELECT pg_advisory_xact_lock(
                hashtext(${clinicId})
              )
            `
          );

          const clinic =
            await tx.clinic.findUnique({
              where: {
                id: clinicId,
              },

              select: {
                patientPrefix: true,
              },
            });

          if (!clinic) {
            throw new Error(
              "Clinic not found"
            );
          }

          const prefix =
            clinic.patientPrefix ||
            "JASWITH";

          const patients =
            await tx.patient.findMany({
              where: {
                clinicId,
              },

              select: {
                patientNumber: true,
              },
            });

          const usedNumbers =
            new Set<number>();

          for (const patient of patients) {
            const match =
              patient.patientNumber.match(
                /(\d+)$/
              );

            if (match) {
              const number =
                Number(match[1]);

              if (
                Number.isSafeInteger(
                  number
                ) &&
                number > 0
              ) {
                usedNumbers.add(
                  number
                );
              }
            }
          }

          let nextNumber = 1;

          while (
            usedNumbers.has(
              nextNumber
            )
          ) {
            nextNumber++;
          }

          const patientNumber =
            `${prefix}-${String(
              nextNumber
            ).padStart(5, "0")}`;

          return tx.patient.create({
            data: {
              ...patientData,
              patientNumber,
            },
          });
        }
      );

    revalidatePatient(
      patient.id
    );

    return {
      success: true,
      patient,
    };
  } catch (error) {
    console.error(
      "savePatient error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save patient",
    };
  }
}

/* ============================================================
   DELETE PATIENT
============================================================ */

export async function deletePatient(
  id: string
) {
  try {
    if (!id) {
      throw new Error(
        "Patient ID is required"
      );
    }

    await prisma.patient.delete({
      where: {
        id,
      },
    });

    revalidatePatient();

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deletePatient error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete patient",
    };
  }
}

/* ============================================================
   CLINIC
============================================================ */

export async function updateClinic(
  data: Record<string, unknown>
) {
  try {
    const id =
      requiredStr(
        data.id,
        "Clinic ID"
      );

    const clinicData = {
      name:
        requiredStr(
          data.name,
          "Clinic name"
        ),

      tagline:
        str(data.tagline),

      phone:
        str(data.phone),

      whatsapp:
        str(data.whatsapp),

      email:
        str(data.email),

      address:
        str(data.address),

      mapsUrl:
        str(data.mapsUrl),

      openingHours:
        str(data.openingHours),

      logo:
        str(data.logo),

      invoicePrefix:
        str(data.invoicePrefix) ??
        "INV",

      patientPrefix:
        str(data.patientPrefix) ??
        "JASWITH",
    };

    const clinic =
      await prisma.clinic.update({
        where: {
          id,
        },

        data: clinicData,
      });

    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      clinic,
    };
  } catch (error) {
    console.error(
      "updateClinic error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update clinic",
    };
  }
}

/* ============================================================
   DOCTOR
============================================================ */

export async function addDoctor(
  data: Record<string, unknown>
) {
  try {
    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Doctor name"
      );

    const doctor =
      await prisma.doctor.create({
        data: {
          clinicId,

          name,

          qualification:
            str(data.qualification),

          specialization:
            str(data.specialization),

          bio:
            str(data.bio),

          image:
            str(data.image),

          active:
            data.active === undefined
              ? true
              : bool(data.active),
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/doctors");
    revalidatePath("/settings");

    return {
      success: true,
      doctor,
    };
  } catch (error) {
    console.error(
      "addDoctor error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add doctor",
    };
  }
}

export async function updateDoctor(
  data: Record<string, unknown>
) {
  try {
    const id =
      requiredStr(
        data.id,
        "Doctor ID"
      );

    const name =
      requiredStr(
        data.name,
        "Doctor name"
      );

    const doctor =
      await prisma.doctor.update({
        where: {
          id,
        },

        data: {
          name,

          qualification:
            str(data.qualification),

          specialization:
            str(data.specialization),

          bio:
            str(data.bio),

          image:
            str(data.image),

          active:
            data.active === undefined
              ? true
              : bool(data.active),
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/doctors");
    revalidatePath("/settings");

    return {
      success: true,
      doctor,
    };
  } catch (error) {
    console.error(
      "updateDoctor error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update doctor",
    };
  }
}

/* ============================================================
   TESTIMONIAL
============================================================ */

export async function addTestimonial(
  data: Record<string, unknown>
) {
  try {
    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Patient name"
      );

    const review =
      requiredStr(
        data.review,
        "Review"
      );

    const ratingValue =
      int(data.rating);

    let rating:
      | number
      | null = null;

    if (
      ratingValue !== null
    ) {
      if (
        ratingValue < 1 ||
        ratingValue > 5
      ) {
        throw new Error(
          "Rating must be between 1 and 5"
        );
      }

      rating =
        ratingValue;
    }

    const testimonial =
      await prisma.testimonial.create({
        data: {
          clinicId,

          name,
          review,
          rating,
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/testimonials");
    revalidatePath("/settings");

    return {
      success: true,
      testimonial,
    };
  } catch (error) {
    console.error(
      "addTestimonial error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add testimonial",
    };
  }
}

export async function updateTestimonial(
  data: Record<string, unknown>
) {
  try {
    const id =
      requiredStr(
        data.id,
        "Testimonial ID"
      );

    const name =
      requiredStr(
        data.name,
        "Patient name"
      );

    const review =
      requiredStr(
        data.review,
        "Review"
      );

    const ratingValue =
      int(data.rating);

    let rating:
      | number
      | null = null;

    if (
      ratingValue !== null
    ) {
      if (
        ratingValue < 1 ||
        ratingValue > 5
      ) {
        throw new Error(
          "Rating must be between 1 and 5"
        );
      }

      rating =
        ratingValue;
    }

    const testimonial =
      await prisma.testimonial.update({
        where: {
          id,
        },

        data: {
          name,
          review,
          rating,
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/testimonials");
    revalidatePath("/settings");

    return {
      success: true,
      testimonial,
    };
  } catch (error) {
    console.error(
      "updateTestimonial error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update testimonial",
    };
  }
}

/* ============================================================
   TREATMENT
============================================================ */

export async function addTreatment(
  data: Record<string, unknown>
) {
  try {
    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Treatment name"
      );

    const price =
      decimal(data.price);

    const treatment =
      await prisma.treatment.create({
        data: {
          clinicId,

          name,

          description:
            str(data.description),

          image:
            str(data.image),

          price,

          active:
            data.active === undefined
              ? true
              : bool(data.active),
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/treatments");
    revalidatePath("/settings");

    return {
      success: true,
      treatment,
    };
  } catch (error) {
    console.error(
      "addTreatment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add treatment",
    };
  }
}

export async function updateTreatment(
  data: Record<string, unknown>
) {
  try {
    const id =
      requiredStr(
        data.id,
        "Treatment ID"
      );

    const name =
      requiredStr(
        data.name,
        "Treatment name"
      );

    const price =
      decimal(data.price);

    const treatment =
      await prisma.treatment.update({
        where: {
          id,
        },

        data: {
          name,

          description:
            str(data.description),

          image:
            str(data.image),

          price,

          active:
            data.active === undefined
              ? true
              : bool(data.active),
        },
      });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/treatments");
    revalidatePath("/settings");

    return {
      success: true,
      treatment,
    };
  } catch (error) {
    console.error(
      "updateTreatment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update treatment",
    };
  }
}

/* ============================================================
   APPOINTMENTS
============================================================ */

export async function getAppointments(
  clinicId: string
) {
  try {
    const appointments =
      await prisma.appointment.findMany({
        where: {
          clinicId,
        },

        orderBy: [
          {
            date: "desc",
          },
          {
            time: "desc",
          },
        ],

        include: {
          patient: true,
          doctor: true,
          createdBy: true,
        },
      });

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error(
      "getAppointments error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load appointments",
    };
  }
}

export async function saveAppointment(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const patientName =
      requiredStr(
        data.patientName,
        "Patient name"
      );

    const phone =
      requiredStr(
        data.phone,
        "Phone"
      );

    const appointmentDate =
      date(data.date);

    if (!appointmentDate) {
      throw new Error(
        "Appointment date is required"
      );
    }

    const appointmentData = {
      clinicId,

      patientId:
        str(data.patientId),

      doctorId:
        str(data.doctorId),

      createdById:
        str(data.createdById),

      patientName,
      phone,

      date:
        appointmentDate,

      time:
        str(data.time),

      duration:
        int(data.duration),

      treatment:
        str(data.treatment),

      reason:
        str(data.reason),

      message:
        str(data.message),

      status:
        (str(data.status) as any) ??
        "PENDING",

      notes:
        str(data.notes),
    };

    let appointment;

    if (id) {
      appointment =
        await prisma.appointment.update({
          where: {
            id,
          },

          data:
            appointmentData,
        });
    } else {
      appointment =
        await prisma.appointment.create({
          data:
            appointmentData,
        });
    }

    revalidateAppointments();

    return {
      success: true,
      appointment,
    };
  } catch (error) {
    console.error(
      "saveAppointment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save appointment",
    };
  }
}

export async function deleteAppointment(
  id: string
) {
  try {
    if (!id) {
      throw new Error(
        "Appointment ID is required"
      );
    }

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    revalidateAppointments();

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteAppointment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete appointment",
    };
  }
}

/* ============================================================
   DOCTORS
============================================================ */

export async function getDoctors(
  clinicId: string
) {
  try {
    const doctors =
      await prisma.doctor.findMany({
        where: {
          clinicId,
        },

        orderBy: {
          name: "asc",
        },

        include: {
          _count: {
            select: {
              appointments: true,
              treatments: true,
              prescriptions: true,
            },
          },
        },
      });

    return {
      success: true,
      doctors,
    };
  } catch (error) {
    console.error(
      "getDoctors error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load doctors",
    };
  }
}

export async function saveDoctor(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Doctor name"
      );

    const doctorData = {
      clinicId,
      name,

      qualification:
        str(data.qualification),

      specialization:
        str(data.specialization),

      bio:
        str(data.bio),

      image:
        str(data.image),

      active:
        data.active === undefined
          ? true
          : bool(data.active),
    };

    let doctor;

    if (id) {
      doctor =
        await prisma.doctor.update({
          where: {
            id,
          },

          data:
            doctorData,
        });
    } else {
      doctor =
        await prisma.doctor.create({
          data:
            doctorData,
        });
    }

    revalidatePath("/doctors");
    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      doctor,
    };
  } catch (error) {
    console.error(
      "saveDoctor error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save doctor",
    };
  }
}

export async function deleteDoctor(
  id: string
) {
  try {
    await prisma.doctor.delete({
      where: {
        id,
      },
    });

    revalidatePath("/doctors");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteDoctor error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete doctor",
    };
  }
}

/* ============================================================
   TREATMENT CATALOG
============================================================ */

export async function getTreatments(
  clinicId: string
) {
  try {
    const treatments =
      await prisma.treatment.findMany({
        where: {
          clinicId,
        },

        orderBy: {
          name: "asc",
        },

        include: {
          _count: {
            select: {
              treatmentRecords: true,
              invoiceItems: true,
            },
          },
        },
      });

    return {
      success: true,
      treatments,
    };
  } catch (error) {
    console.error(
      "getTreatments error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load treatments",
    };
  }
}

export async function saveTreatmentCatalog(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Treatment name"
      );

    const treatmentData = {
      clinicId,
      name,

      description:
        str(data.description),

      image:
        str(data.image),

      price:
        decimal(data.price),

      active:
        data.active === undefined
          ? true
          : bool(data.active),
    };

    let treatment;

    if (id) {
      treatment =
        await prisma.treatment.update({
          where: {
            id,
          },

          data:
            treatmentData,
        });
    } else {
      treatment =
        await prisma.treatment.create({
          data:
            treatmentData,
        });
    }

    revalidatePath(
      "/treatments"
    );

    revalidatePath(
      "/dashboard"
    );

    return {
      success: true,
      treatment,
    };
  } catch (error) {
    console.error(
      "saveTreatmentCatalog error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save treatment",
    };
  }
}

export async function deleteTreatmentCatalog(
  id: string
) {
  try {
    await prisma.treatment.delete({
      where: {
        id,
      },
    });

    revalidatePath(
      "/treatments"
    );

    revalidatePath(
      "/dashboard"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteTreatmentCatalog error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete treatment",
    };
  }
}

/* ============================================================
   TREATMENT RECORD
============================================================ */

export async function getPatientTreatments(
  patientId: string
) {
  try {
    const treatments =
      await prisma.treatmentRecord.findMany({
        where: {
          patientId,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          doctor: true,
          treatment: true,
          toothRecord: true,
          invoiceItems: true,
        },
      });

    return {
      success: true,
      treatments,
    };
  } catch (error) {
    console.error(
      "getPatientTreatments error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load treatments",
    };
  }
}

export async function saveTreatment(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const treatmentName =
      requiredStr(
        data.treatmentName,
        "Treatment name"
      );

    const treatmentData = {
      patientId,

      doctorId:
        str(data.doctorId),

      treatmentId:
        str(data.treatmentId),

      toothRecordId:
        str(data.toothRecordId),

      treatmentName,

      diagnosis:
        str(data.diagnosis),

      notes:
        str(data.notes),

      status:
        (str(data.status) as any) ??
        "PLANNED",

      scheduledDate:
        date(data.scheduledDate),

      completedDate:
        date(data.completedDate),

      cost:
        decimal(data.cost),
    };

    let treatment;

    if (id) {
      treatment =
        await prisma.treatmentRecord.update({
          where: {
            id,
          },

          data:
            treatmentData,
        });
    } else {
      treatment =
        await prisma.treatmentRecord.create({
          data:
            treatmentData,
        });
    }

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      treatment,
    };
  } catch (error) {
    console.error(
      "saveTreatment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save treatment",
    };
  }
}

export async function deleteTreatment(
  id: string
) {
  try {
    const record =
      await prisma.treatmentRecord.findUnique({
        where: {
          id,
        },

        select: {
          patientId: true,
        },
      });

    if (!record) {
      throw new Error(
        "Treatment record not found"
      );
    }

    await prisma.treatmentRecord.delete({
      where: {
        id,
      },
    });

    revalidatePatient(
      record.patientId
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteTreatment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete treatment",
    };
  }
}

/* ============================================================
   TOOTH RECORD
============================================================ */

export async function saveToothRecord(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const toothNumber =
      requiredStr(
        data.toothNumber,
        "Tooth number"
      );

    const toothData = {
      patientId,
      toothNumber,

      condition:
        str(data.condition),

      diagnosis:
        str(data.diagnosis),

      notes:
        str(data.notes),

      surfaceMesial:
        bool(data.surfaceMesial),

      surfaceDistal:
        bool(data.surfaceDistal),

      surfaceOcclusal:
        bool(data.surfaceOcclusal),

      surfaceBuccal:
        bool(data.surfaceBuccal),

      surfaceLingual:
        bool(data.surfaceLingual),
    };

    let tooth;

    if (id) {
      tooth =
        await prisma.toothRecord.update({
          where: {
            id,
          },

          data:
            toothData,
        });
    } else {
      tooth =
        await prisma.toothRecord.create({
          data:
            toothData,
        });
    }

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      tooth,
    };
  } catch (error) {
    console.error(
      "saveToothRecord error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save tooth record",
    };
  }
}

export async function deleteToothRecord(
  id: string
) {
  try {
    const tooth =
      await prisma.toothRecord.findUnique({
        where: {
          id,
        },

        select: {
          patientId: true,
        },
      });

    if (!tooth) {
      throw new Error(
        "Tooth record not found"
      );
    }

    await prisma.toothRecord.delete({
      where: {
        id,
      },
    });

    revalidatePatient(
      tooth.patientId
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteToothRecord error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete tooth record",
    };
  }
}

/* ============================================================
   PRESCRIPTIONS
============================================================ */

export async function getPatientPrescriptions(
  patientId: string
) {
  try {
    const prescriptions =
      await prisma.prescription.findMany({
        where: {
          patientId,
        },

        orderBy: {
          prescriptionDate:
            "desc",
        },

        include: {
          doctor: true,
          items: true,
        },
      });

    return {
      success: true,
      prescriptions,
    };
  } catch (error) {
    console.error(
      "getPatientPrescriptions error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load prescriptions",
    };
  }
}

export async function savePrescription(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const prescriptionDate =
      date(
        data.prescriptionDate
      ) ?? new Date();

    const items =
      Array.isArray(data.items)
        ? data.items
        : [];

    const prescriptionData = {
      patientId,

      doctorId:
        str(data.doctorId),

      prescriptionDate,

      notes:
        str(data.notes),
    };

    const itemData =
      items.map(
        (item: any) => ({
          medicine:
            requiredStr(
              item.medicine,
              "Medicine"
            ),

          dosage:
            str(item.dosage),

          frequency:
            str(item.frequency),

          duration:
            str(item.duration),

          instructions:
            str(
              item.instructions
            ),
        })
      );

    let prescription;

    if (id) {
      prescription =
        await prisma.$transaction(
          async (tx) => {
            await tx.prescriptionItem.deleteMany(
              {
                where: {
                  prescriptionId:
                    id,
                },
              }
            );

            return tx.prescription.update({
              where: {
                id,
              },

              data: {
                ...prescriptionData,

                items: {
                  create:
                    itemData,
                },
              },

              include: {
                items: true,
                doctor: true,
              },
            });
          }
        );
    } else {
      prescription =
        await prisma.prescription.create({
          data: {
            ...prescriptionData,

            items: {
              create:
                itemData,
            },
          },

          include: {
            items: true,
            doctor: true,
          },
        });
    }

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      prescription,
    };
  } catch (error) {
    console.error(
      "savePrescription error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save prescription",
    };
  }
}

export async function deletePrescription(
  id: string
) {
  try {
    const prescription =
      await prisma.prescription.findUnique({
        where: {
          id,
        },

        select: {
          patientId: true,
        },
      });

    if (!prescription) {
      throw new Error(
        "Prescription not found"
      );
    }

    await prisma.prescription.delete({
      where: {
        id,
      },
    });

    revalidatePatient(
      prescription.patientId
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deletePrescription error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete prescription",
    };
  }
}

/* ============================================================
   ATTACHMENTS
============================================================ */

export async function saveAttachment(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const name =
      requiredStr(
        data.name,
        "Attachment name"
      );

    const mimeType =
      requiredStr(
        data.mimeType,
        "MIME type"
      );

    const size =
      int(data.size) ?? 0;

    const attachmentData = {
      patientId,

      name,

      type:
        (str(data.type) as any) ??
        "OTHER",

      mimeType,

      size,

      url:
        str(data.url),

      storageKey:
        str(data.storageKey),

      description:
        str(data.description),
    };

    let attachment;

    if (id) {
      attachment =
        await prisma.attachment.update({
          where: {
            id,
          },

          data:
            attachmentData,
        });
    } else {
      attachment =
        await prisma.attachment.create({
          data:
            attachmentData,
        });
    }

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      attachment,
    };
  } catch (error) {
    console.error(
      "saveAttachment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save attachment",
    };
  }
}

export async function deleteAttachment(
  id: string
) {
  try {
    if (!id) {
      throw new Error(
        "Attachment ID is required"
      );
    }

    const attachment =
      await prisma.attachment.findUnique({
        where: {
          id,
        },

        select: {
          patientId: true,
        },
      });

    if (!attachment) {
      throw new Error(
        "Attachment not found"
      );
    }

    await prisma.attachment.delete({
      where: {
        id,
      },
    });

    revalidatePatient(
      attachment.patientId
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteAttachment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete attachment",
    };
  }
}

/* ============================================================
   MEDICAL HISTORY
============================================================ */

export async function saveMedicalHistory(
  data: Record<string, unknown>
) {
  try {
    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const historyData = {
      diabetes:
        bool(data.diabetes),

      hypertension:
        bool(data.hypertension),

      heartDisease:
        bool(data.heartDisease),

      asthma:
        bool(data.asthma),

      bleedingDisorder:
        bool(
          data.bleedingDisorder
        ),

      kidneyDisease:
        bool(data.kidneyDisease),

      liverDisease:
        bool(data.liverDisease),

      thyroidDisease:
        bool(
          data.thyroidDisease
        ),

      epilepsy:
        bool(data.epilepsy),

      pregnancy:
        bool(data.pregnancy),

      smoker:
        bool(data.smoker),

      tobaccoUse:
        bool(data.tobaccoUse),

      alcoholUse:
        bool(data.alcoholUse),

      currentMedications:
        str(
          data.currentMedications
        ),

      previousSurgeries:
        str(
          data.previousSurgeries
        ),

      otherConditions:
        str(
          data.otherConditions
        ),

      familyHistory:
        str(data.familyHistory),
    };

    const history =
      await prisma.medicalHistory.upsert({
        where: {
          patientId,
        },

        create: {
          patientId,
          ...historyData,
        },

        update:
          historyData,
      });

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      history,
    };
  } catch (error) {
    console.error(
      "saveMedicalHistory error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save medical history",
    };
  }
}

/* ============================================================
   DENTAL HISTORY
============================================================ */

export async function saveDentalHistory(
  data: Record<string, unknown>
) {
  try {
    const patientId =
      requiredStr(
        data.patientId,
        "Patient"
      );

    const historyData = {
      previousDentist:
        str(
          data.previousDentist
        ),

      lastDentalVisit:
        date(
          data.lastDentalVisit
        ),

      brushingFrequency:
        str(
          data.brushingFrequency
        ),

      flossingFrequency:
        str(
          data.flossingFrequency
        ),

      sensitivity:
        bool(data.sensitivity),

      gumBleeding:
        bool(data.gumBleeding),

      toothPain:
        bool(data.toothPain),

      previousRootCanal:
        bool(
          data.previousRootCanal
        ),

      previousExtraction:
        bool(
          data.previousExtraction
        ),

      dentures:
        bool(data.dentures),

      implants:
        bool(data.implants),

      braces:
        bool(data.braces),

      previousTreatments:
        str(
          data.previousTreatments
        ),

      dentalNotes:
        str(data.dentalNotes),
    };

    const history =
      await prisma.dentalHistory.upsert({
        where: {
          patientId,
        },

        create: {
          patientId,
          ...historyData,
        },

        update:
          historyData,
      });

    revalidatePatient(
      patientId
    );

    return {
      success: true,
      history,
    };
  } catch (error) {
    console.error(
      "saveDentalHistory error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save dental history",
    };
  }
}

/* ============================================================
   BILLING
============================================================ */

export async function getInvoices(
  clinicId: string
) {
  try {
    const invoices =
      await prisma.invoice.findMany({
        where: {
          clinicId,
        },

        orderBy: {
          invoiceDate: "desc",
        },

        include: {
          patient: true,
          items: true,
          payments: true,
        },
      });

    return {
      success: true,
      invoices,
    };
  } catch (error) {
    console.error(
      "getInvoices error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load invoices",
    };
  }
}

export async function getInvoice(
  id: string
) {
  try {
    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },

        include: {
          clinic: true,
          patient: true,

          items: {
            include: {
              treatment: true,
              treatmentRecord: true,
            },
          },

          payments: {
            orderBy: {
              paymentDate: "desc",
            },
          },
        },
      });

    if (!invoice) {
      throw new Error(
        "Invoice not found"
      );
    }

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    console.error(
      "getInvoice error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load invoice",
    };
  }
}

/* ============================================================
   INVOICE NUMBER
============================================================ */

async function generateInvoiceNumber(
  clinicId: string
): Promise<string> {
  return prisma.$transaction(
    async (tx) => {
      const clinic =
        await tx.clinic.findUnique({
          where: {
            id: clinicId,
          },

          select: {
            invoicePrefix: true,
          },
        });

      if (!clinic) {
        throw new Error(
          "Clinic not found"
        );
      }

      const prefix =
        clinic.invoicePrefix ||
        "INV";

      const latest =
        await tx.invoice.findFirst({
          where: {
            clinicId,

            invoiceNumber: {
              startsWith:
                `${prefix}-`,
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            invoiceNumber: true,
          },
        });

      let nextNumber = 1;

      if (
        latest?.invoiceNumber
      ) {
        const match =
          latest.invoiceNumber.match(
            /(\d+)$/
          );

        if (match) {
          nextNumber =
            Number(match[1]) + 1;
        }
      }

      return `${prefix}-${String(
        nextNumber
      ).padStart(5, "0")}`;
    }
  );
}

/* ============================================================
   SAVE BILL
============================================================ */

export async function saveBill(data: Record<string, unknown>) {
  try {
    const id = str(data.id);

    const clinicId = requiredStr(data.clinicId, "Clinic");

    const patientId = requiredStr(data.patientId, "Patient");

    const items = Array.isArray(data.items) ? data.items : [];

    const itemData = items.map((item: any) => {
      const quantity = int(item.quantity) ?? 1;

      const unitPrice = decimal(item.unitPrice) ?? new Prisma.Decimal(0);

      const amount = decimal(item.amount) ?? unitPrice.mul(quantity);

      return {
        treatmentId: str(item.treatmentId),

        treatmentRecordId: str(item.treatmentRecordId),

        description: requiredStr(
          item.description,
          "Invoice item description"
        ),

        quantity,

        unitPrice,

        amount,
      };
    });

    const subtotal =
      decimal(data.subtotal) ??
      itemData.reduce(
        (total, item) => total.add(item.amount),
        new Prisma.Decimal(0)
      );

    const discount = decimalZero(data.discount);

    const tax = decimalZero(data.tax);

    const total = decimal(data.total) ?? subtotal.sub(discount).add(tax);

    const suppliedStatus = str(data.status) as any;

    const suppliedNumber = str(data.invoiceNumber);

    let invoice;

    if (id) {
      /* ======================================================
         UPDATE EXISTING BILL
      ====================================================== */

      invoice = await prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({
          where: {
            invoiceId: id,
          },
        });

        return tx.invoice.update({
          where: {
            id,
          },

          data: {
            clinicId,
            patientId,

            // Only change the number if one was supplied
            ...(suppliedNumber ? { invoiceNumber: suppliedNumber } : {}),

            // Only override status if explicitly supplied.
            // Otherwise it is recalculated below.
            ...(suppliedStatus ? { status: suppliedStatus } : {}),

            subtotal,
            discount,
            tax,
            total,

            notes: str(data.notes),

            invoiceDate: date(data.invoiceDate) ?? new Date(),

            dueDate: date(data.dueDate),

            items: {
              create: itemData,
            },
          },

          include: {
            items: true,
            payments: true,
          },
        });
      });

      // Total may have changed: recompute UNPAID / PARTIAL / PAID
      // from the existing payments (skipped if CANCELLED).
      if (!suppliedStatus) {
        await refreshInvoiceStatus(id);
      }
    } else {
      /* ======================================================
         CREATE NEW BILL
      ====================================================== */

      const invoiceNumber =
        suppliedNumber ?? (await generateInvoiceNumber(clinicId));

      invoice = await prisma.invoice.create({
        data: {
          clinicId,
          patientId,

          invoiceNumber,

          status: suppliedStatus ?? "UNPAID",

          subtotal,
          discount,
          tax,
          total,

          notes: str(data.notes),

          invoiceDate: date(data.invoiceDate) ?? new Date(),

          dueDate: date(data.dueDate),

          items: {
            create: itemData,
          },
        },

        include: {
          items: true,
          payments: true,
        },
      });
    }

    revalidatePatient(patientId);

    revalidateBilling();

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    console.error("saveBill error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save bill",
    };
  }
}

/* ============================================================
   PAYMENT STATUS
============================================================ */

async function refreshInvoiceStatus(
  invoiceId: string
) {
  const invoice =
    await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },

      select: {
        id: true,
        total: true,
        patientId: true,
        status: true,
      },
    });

  if (!invoice) {
    return null;
  }

  if (
    invoice.status ===
    "CANCELLED"
  ) {
    return invoice;
  }

  const aggregate =
    await prisma.payment.aggregate({
      where: {
        invoiceId,
      },

      _sum: {
        amount: true,
      },
    });

  const paid =
    aggregate._sum.amount ??
    new Prisma.Decimal(0);

  let status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID" =
    "UNPAID";

  if (
    paid.greaterThanOrEqualTo(
      invoice.total
    )
  ) {
    status = "PAID";
  } else if (
    paid.greaterThan(0)
  ) {
    status = "PARTIAL";
  }

  return prisma.invoice.update({
    where: {
      id: invoiceId,
    },

    data: {
      status,
    },
  });
}

/* ============================================================
   PAYMENT
============================================================ */

export async function addPayment(
  data: Record<string, unknown>
) {
  try {
    const invoiceId =
      requiredStr(
        data.invoiceId,
        "Invoice"
      );

    const amount =
      decimal(data.amount);

    if (
      !amount ||
      amount.lessThanOrEqualTo(
        0
      )
    ) {
      throw new Error(
        "Payment amount must be greater than zero"
      );
    }

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },

        select: {
          id: true,
          total: true,
          status: true,
          patientId: true,
        },
      });

    if (!invoice) {
      throw new Error(
        "Invoice not found"
      );
    }

    if (
      invoice.status ===
      "CANCELLED"
    ) {
      throw new Error(
        "Cannot pay a cancelled invoice"
      );
    }

    const payment =
      await prisma.payment.create({
        data: {
          invoiceId,

          amount,

          method:
            (str(data.method) as any) ??
            "CASH",

          reference:
            str(data.reference),

          notes:
            str(data.notes),

          paymentDate:
            date(
              data.paymentDate
            ) ??
            new Date(),
        },
      });

    await refreshInvoiceStatus(
      invoiceId
    );

    revalidatePatient(
      invoice.patientId
    );

    revalidateBilling();

    return {
      success: true,
      payment,
    };
  } catch (error) {
    console.error(
      "addPayment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add payment",
    };
  }
}

export async function deletePayment(
  id: string
) {
  try {
    if (!id) {
      throw new Error(
        "Payment ID is required"
      );
    }

    const payment =
      await prisma.payment.findUnique({
        where: {
          id,
        },

        include: {
          invoice: {
            select: {
              patientId: true,
            },
          },
        },
      });

    if (!payment) {
      throw new Error(
        "Payment not found"
      );
    }

    await prisma.payment.delete({
      where: {
        id,
      },
    });

    await refreshInvoiceStatus(
      payment.invoiceId
    );

    revalidatePatient(
      payment.invoice.patientId
    );

    revalidateBilling();

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deletePayment error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete payment",
    };
  }
}

/* ============================================================
   TESTIMONIALS
============================================================ */

export async function getTestimonials(
  clinicId: string
) {
  try {
    const testimonials =
      await prisma.testimonial.findMany({
        where: {
          clinicId,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return {
      success: true,
      testimonials,
    };
  } catch (error) {
    console.error(
      "getTestimonials error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load testimonials",
    };
  }
}

export async function saveTestimonial(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicId =
      requiredStr(
        data.clinicId,
        "Clinic"
      );

    const name =
      requiredStr(
        data.name,
        "Name"
      );

    const review =
      requiredStr(
        data.review,
        "Review"
      );

    const rating =
      int(data.rating);

    const testimonialData = {
      clinicId,
      name,
      review,
      rating,
    };

    let testimonial;

    if (id) {
      testimonial =
        await prisma.testimonial.update({
          where: {
            id,
          },

          data:
            testimonialData,
        });
    } else {
      testimonial =
        await prisma.testimonial.create({
          data:
            testimonialData,
        });
    }

    revalidatePath("/");
    revalidatePath(
      "/testimonials"
    );

    return {
      success: true,
      testimonial,
    };
  } catch (error) {
    console.error(
      "saveTestimonial error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save testimonial",
    };
  }
}

export async function deleteTestimonial(
  id: string
) {
  try {
    await prisma.testimonial.delete({
      where: {
        id,
      },
    });

    revalidatePath("/");
    revalidatePath(
      "/testimonials"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteTestimonial error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete testimonial",
    };
  }
}

/* ============================================================
   CLINIC
============================================================ */

export async function getClinic(
  clinicId: string
) {
  try {
    const clinic =
      await prisma.clinic.findUnique({
        where: {
          id: clinicId,
        },

        include: {
          doctors: {
            where: {
              active: true,
            },

            orderBy: {
              name: "asc",
            },
          },

          treatments: {
            where: {
              active: true,
            },

            orderBy: {
              name: "asc",
            },
          },
        },
      });

    if (!clinic) {
      throw new Error(
        "Clinic not found"
      );
    }

    return {
      success: true,
      clinic,
    };
  } catch (error) {
    console.error(
      "getClinic error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load clinic",
    };
  }
}

export async function saveClinic(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const clinicData = {
      name:
        requiredStr(
          data.name,
          "Clinic name"
        ),

      tagline:
        str(data.tagline),

      phone:
        str(data.phone),

      whatsapp:
        str(data.whatsapp),

      email:
        str(data.email),

      address:
        str(data.address),

      mapsUrl:
        str(data.mapsUrl),

      openingHours:
        str(data.openingHours),

      logo:
        str(data.logo),

      invoicePrefix:
        str(data.invoicePrefix) ??
        "INV",

      patientPrefix:
        str(data.patientPrefix) ??
        "JASWITH",
    };

    let clinic;

    if (id) {
      clinic =
        await prisma.clinic.update({
          where: {
            id,
          },

          data:
            clinicData,
        });
    } else {
      clinic =
        await prisma.clinic.create({
          data:
            clinicData,
        });
    }

    revalidatePath("/");
    revalidatePath(
      "/settings"
    );
    revalidatePath(
      "/dashboard"
    );

    return {
      success: true,
      clinic,
    };
  } catch (error) {
    console.error(
      "saveClinic error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save clinic",
    };
  }
}

/* ============================================================
   ADMIN USERS
============================================================ */

export async function getAdminUsers() {
  try {
    const users =
      await prisma.adminUser.findMany({
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error(
      "getAdminUsers error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load admin users",
    };
  }
}

export async function saveAdminUser(
  data: Record<string, unknown>
) {
  try {
    const id =
      str(data.id);

    const email =
      requiredStr(
        data.email,
        "Email"
      );

    const passwordHash =
      str(data.passwordHash);

    const userData = {
      email,

      name:
        str(data.name),

      role:
        (str(data.role) as any) ??
        "STAFF",

      active:
        data.active === undefined
          ? true
          : bool(data.active),
    };

    let user;

    if (id) {
      const updateData: any = {
        ...userData,
      };

      if (passwordHash) {
        updateData.passwordHash =
          passwordHash;
      }

      user =
        await prisma.adminUser.update({
          where: {
            id,
          },

          data:
            updateData,

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        });
    } else {
      if (!passwordHash) {
        throw new Error(
          "Password hash is required"
        );
      }

      user =
        await prisma.adminUser.create({
          data: {
            ...userData,
            passwordHash,
          },

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            active: true,
            createdAt: true,
            updatedAt: true,
          },
        });
    }

    revalidatePath(
      "/settings"
    );

    revalidatePath(
      "/dashboard"
    );

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error(
      "saveAdminUser error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save admin user",
    };
  }
}

export async function deleteAdminUser(
  id: string
) {
  try {
    await prisma.adminUser.delete({
      where: {
        id,
      },
    });

    revalidatePath(
      "/settings"
    );

    revalidatePath(
      "/dashboard"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "deleteAdminUser error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete admin user",
    };
  }
}

/* ============================================================
   AUDIT LOG
============================================================ */

export async function createAuditLog(
  data: Record<string, unknown>
) {
  try {
    const action =
      requiredStr(
        data.action,
        "Action"
      );

    const entityType =
      requiredStr(
        data.entityType,
        "Entity type"
      );

    const log =
      await prisma.auditLog.create({
        data: {
          userId:
            str(data.userId),

          action,

          entityType,

          entityId:
            str(data.entityId),

          metadata:
            data.metadata !==
            undefined
              ? (
                  data.metadata as
                    Prisma.InputJsonValue
                )
              : undefined,

          ipAddress:
            str(data.ipAddress),
        },
      });

    return {
      success: true,
      log,
    };
  } catch (error) {
    console.error(
      "createAuditLog error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create audit log",
    };
  }
}

export async function getAuditLogs(
  limit = 100
) {
  try {
    const logs =
      await prisma.auditLog.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: Math.min(
          Math.max(
            limit,
            1
          ),
          500
        ),

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    return {
      success: true,
      logs,
    };
  } catch (error) {
    console.error(
      "getAuditLogs error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load audit logs",
    };
  }
}

/* ============================================================
   LOGOUT
============================================================ */

export async function logout() {
  try {
    /*
     * If you use NextAuth/Auth.js, Supabase,
     * Clerk, or another authentication provider,
     * replace this with that provider's logout.
     */

    const {
      cookies,
    } = await import(
      "next/headers"
    );

    const cookieStore =
      await cookies();

    cookieStore.delete(
      "session"
    );

    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "logout error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to logout",
    };
  }
}
