"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addDoctor,
  addPayment,
  addTestimonial,
  addTreatment,
  deleteAppointment,
  deleteAttachment,
  deleteDoctor,
  deletePatient,
  deletePrescription,
  deleteTestimonial,
  deleteTreatment,
  logout,
  saveAppointment,
  saveBill,
  saveClinical,
  savePatient,
  savePrescription,
  saveSettings,
  updateClinic,
  updateDoctor,
  updateTestimonial,
  updateTreatment,
} from "./actions";

/* ============================================================
   TYPES
============================================================ */

type Patient = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string;
  email: string | null;
  occupation: string | null;
  allergies: string | null;
  notes: string | null;
  medicalHistory?: any;
  dentalHistory?: any;
};

type Appointment = {
  id: string;
  patientId: string | null;
  patientName: string;
  phone: string;
  date: string;
  time: string | null;
  reason: string | null;
  treatment: string | null;
  status: string;
  notes: string | null;
};

type Doctor = {
  id: string;
  name: string;
  qualification: string | null;
  specialization: string | null;
  bio: string | null;
  image: string | null;
};

type Treatment = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: string | number | null;
};

type Testimonial = {
  id: string;
  name: string;
  review: string;
  rating: number | null;
};

type ClinicalRecord = {
  id: string;
  patientId: string;
  date: string;
  diagnosis: string | null;
  clinicalNotes: string | null;
  followUpDate: string | null;
  treatmentRecords?: {
    treatmentName: string;
  }[];
};

type Invoice = {
  id: string;
  patientId: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: string | number;
  status: string;
  notes: string | null;
  items: {
    description: string;
    amount: string | number;
  }[];
  payments: {
    amount: string | number;
  }[];
};

type Prescription = {
  id: string;
  patientId: string;
  prescriptionDate: string;
  notes: string | null;
  items: {
    medicine: string;
    instructions: string | null;
  }[];
};

type Attachment = {
  id: string;
  patientId: string;
  name: string;
  mimeType: string;
  size: number;
  url: string | null;
  createdAt: string;
};

type Clinic = {
  id: string;
  name: string;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  mapsUrl: string | null;
  openingHours: string | null;
};

/* ============================================================
   PROPS
============================================================ */

type Props = {
  clinic: Clinic;
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  treatments: Treatment[];
  testimonials: Testimonial[];
  clinical: ClinicalRecord[];
  invoices: Invoice[];
  prescriptions: Prescription[];
  attachments: Attachment[];
};

/* ============================================================
   HELPERS
============================================================ */

const today = () => {
  return new Date().toISOString().slice(0, 10);
};

const money = (
  value: number | string | null | undefined
) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
};

const formatDate = (
  value?: string | null
) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN");
};

const formatDateTime = (
  date?: string | null,
  time?: string | null
) => {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return date;
  }

  return (
    d.toLocaleDateString("en-IN") +
    (time ? ` ${time}` : "")
  );
};

const fullName = (
  patient?: Patient
) => {
  if (!patient) return "Unknown";

  return [
    patient.firstName,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

/* ============================================================
   PAGE
============================================================ */

export default function AdminPage({
  clinic,
  patients: initialPatients,
  appointments: initialAppointments,
  doctors: initialDoctors,
  treatments: initialTreatments,
  testimonials: initialTestimonials,
  clinical: initialClinical,
  invoices: initialInvoices,
  prescriptions: initialPrescriptions,
  attachments: initialAttachments,
}: Props) {
  const [patients, setPatients] =
    useState(initialPatients);

  const [appointments, setAppointments] =
    useState(initialAppointments);

  const [doctors, setDoctors] =
    useState(initialDoctors);

  const [treatments, setTreatments] =
    useState(initialTreatments);

  const [testimonials, setTestimonials] =
    useState(initialTestimonials);

  const [clinical, setClinical] =
    useState(initialClinical);

  const [invoices, setInvoices] =
    useState(initialInvoices);

  const [prescriptions, setPrescriptions] =
    useState(initialPrescriptions);

  const [attachments, setAttachments] =
    useState(initialAttachments);

  const [page, setPage] =
    useState("dashboard");

  const [modal, setModal] =
    useState<{
      title: string;
      body: React.ReactNode;
    } | null>(null);

  const [patientSearch, setPatientSearch] =
    useState("");

  const [clinicalSearch, setClinicalSearch] =
    useState("");

  const [billSearch, setBillSearch] =
    useState("");

  const [rxSearch, setRxSearch] =
    useState("");

  const [appointmentFilter, setAppointmentFilter] =
    useState("all");

  const [uploadingFile, setUploadingFile] =
    useState(false);

  const [settings, setSettings] =
    useState({
      clinicName: clinic.name,
      doctor: "Dr. J. Sailakshmi, MDS",
      currency: "₹",
    });

  useEffect(() => {
    setPatients(initialPatients);
    setAppointments(initialAppointments);
    setDoctors(initialDoctors);
    setTreatments(initialTreatments);
    setTestimonials(initialTestimonials);
    setClinical(initialClinical);
    setInvoices(initialInvoices);
    setPrescriptions(initialPrescriptions);
    setAttachments(initialAttachments);
  }, [
    initialPatients,
    initialAppointments,
    initialDoctors,
    initialTreatments,
    initialTestimonials,
    initialClinical,
    initialInvoices,
    initialPrescriptions,
    initialAttachments,
  ]);

  /* ==========================================================
     S3 UPLOAD
  ========================================================== */

  const uploadImage = async (
    file: File,
    folder = "dental/attachments"
  ) => {
    if (!file || file.size === 0) {
      throw new Error(
        "Please select an image"
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPG, PNG and WebP images are allowed."
      );
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        "File too large. Maximum size is 5 MB."
      );
    }

    const uploadData = new FormData();

    uploadData.append(
      "file",
      file
    );

    uploadData.append(
      "folder",
      folder
    );

    const response = await fetch(
      "/api/upload",
      {
        method: "POST",
        body: uploadData,
      }
    );

    let data: {
      url?: string;
      error?: string;
    } = {};

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Upload server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Unable to upload image."
      );
    }

    if (!data.url) {
      throw new Error(
        "Upload succeeded but no image URL was returned."
      );
    }

    return data.url;
  };

  /* ==========================================================
     MODAL
  ========================================================== */

  const openModal = (
    title: string,
    body: React.ReactNode
  ) => {
    setModal({
      title,
      body,
    });
  };

  const closeModal = () => {
    setModal(null);
  };

  /* ==========================================================
     PATIENT OPTIONS
  ========================================================== */

  const patientOptions = (
    selected?: string | null
  ) => {
    return (
      <>
        <option value="">
          Select patient
        </option>

        {patients.map((patient) => (
          <option
            key={patient.id}
            value={patient.id}
            selected={
              patient.id === selected
            }
          >
            {patient.patientNumber} —{" "}
            {fullName(patient)}
          </option>
        ))}
      </>
    );
  };

  /* ==========================================================
     NEW PATIENT
  ========================================================== */

  const newPatient = (
    patient?: Patient
  ) => {
    const formAction = async (
      formData: FormData
    ) => {
      try {
        if (patient?.id) {
          formData.set(
            "id",
            patient.id
          );
        }

        await savePatient(
          formData
        );

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to save patient"
        );
      }
    };

    openModal(
      patient
        ? "Edit patient"
        : "New patient",
      <form
        action={formAction}
        className="space-y-5"
      >
        <div className="grid">
          <div>
            <label>
              Patient ID
            </label>

            <input
              name="patientNumber"
              defaultValue={
                patient?.patientNumber ||
                ""
              }
              required
            />
          </div>

          <div>
            <label>
              First name *
            </label>

            <input
              name="firstName"
              defaultValue={
                patient?.firstName || ""
              }
              required
            />
          </div>

          <div>
            <label>
              Last name
            </label>

            <input
              name="lastName"
              defaultValue={
                patient?.lastName || ""
              }
            />
          </div>

          <div>
            <label>DOB</label>

            <input
              name="dateOfBirth"
              type="date"
              defaultValue={
                patient?.dateOfBirth
                  ? patient.dateOfBirth.slice(
                      0,
                      10
                    )
                  : ""
              }
            />
          </div>

          <div>
            <label>
              Gender
            </label>

            <select
              name="gender"
              defaultValue={
                patient?.gender || ""
              }
            >
              <option value=""></option>

              <option value="Female">
                Female
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div>
            <label>
              Phone
            </label>

            <input
              name="phone"
              defaultValue={
                patient?.phone || ""
              }
            />
          </div>

          <div>
            <label>
              Email
            </label>

            <input
              name="email"
              type="email"
              defaultValue={
                patient?.email || ""
              }
            />
          </div>

          <div>
            <label>
              Occupation
            </label>

            <input
              name="occupation"
              defaultValue={
                patient?.occupation ||
                ""
              }
            />
          </div>
        </div>

        <h3>
          Medical history
        </h3>

        <div className="grid">
          <div>
            <label>
              Allergies
            </label>

            <textarea
              name="allergies"
              defaultValue={
                patient?.allergies ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Medical alerts
            </label>

            <textarea
              name="medicalAlerts"
              defaultValue={
                patient
                  ?.medicalHistory
                  ?.otherConditions ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Current medications
            </label>

            <textarea
              name="currentMedications"
              defaultValue={
                patient
                  ?.medicalHistory
                  ?.currentMedications ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Previous surgeries
            </label>

            <textarea
              name="previousSurgeries"
              defaultValue={
                patient
                  ?.medicalHistory
                  ?.previousSurgeries ||
                ""
              }
            />
          </div>
        </div>

        <h3>
          Dental history
        </h3>

        <textarea
          name="dentalNotes"
          defaultValue={
            patient
              ?.dentalHistory
              ?.dentalNotes || ""
          }
        />

        <h3>
          Consent / notes
        </h3>

        <textarea
          name="notes"
          defaultValue={
            patient?.notes || ""
          }
        />

        <div className="actions">
          <button type="submit">
            Save patient
          </button>
        </div>
      </form>
    );
  };

  /* ==========================================================
     APPOINTMENT
  ========================================================== */

  const newAppointment = (
    appointment?: Appointment
  ) => {
    const formAction = async (
      formData: FormData
    ) => {
      try {
        if (appointment?.id) {
          formData.set(
            "id",
            appointment.id
          );
        }

        const patientId =
          formData
            .get("patientId")
            ?.toString();

        const selectedPatient =
          patients.find(
            (p) =>
              p.id === patientId
          );

        formData.set(
          "patientName",
          selectedPatient
            ? fullName(
                selectedPatient
              )
            : appointment?.patientName ||
                ""
        );

        formData.set(
          "phone",
          selectedPatient?.phone ||
            appointment?.phone ||
            ""
        );

        await saveAppointment(
          formData
        );

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to save appointment"
        );
      }
    };

    openModal(
      "Appointment",
      <form
        action={formAction}
        className="space-y-4"
      >
        <div className="grid">
          <div>
            <label>
              Patient
            </label>

            <select
              name="patientId"
              defaultValue={
                appointment?.patientId ||
                ""
              }
              required
            >
              {patientOptions(
                appointment?.patientId
              )}
            </select>
          </div>

          <div>
            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={
                appointment?.date
                  ? appointment.date.slice(
                      0,
                      10
                    )
                  : today()
              }
              required
            />
          </div>

          <div>
            <label>Time</label>

            <input
              name="time"
              type="time"
              defaultValue={
                appointment?.time ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Reason
            </label>

            <input
              name="reason"
              defaultValue={
                appointment?.reason ||
                ""
              }
              placeholder="Consultation / RCT / crown / denture..."
            />
          </div>

          <div>
            <label>
              Treatment
            </label>

            <input
              name="treatment"
              defaultValue={
                appointment?.treatment ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Status
            </label>

            <select
              name="status"
              defaultValue={
                appointment?.status ||
                "PENDING"
              }
            >
              <option value="PENDING">
                Pending
              </option>

              <option value="CONFIRMED">
                Confirmed
              </option>

              <option value="CHECKED_IN">
                Checked in
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>

              <option value="NO_SHOW">
                No-show
              </option>
            </select>
          </div>
        </div>

        <label>Notes</label>

        <textarea
          name="notes"
          defaultValue={
            appointment?.notes ||
            ""
          }
        />

        <button type="submit">
          Save
        </button>
      </form>
    );
  };

  /* ==========================================================
     CLINICAL
  ========================================================== */

  const newClinical = (
    record?: ClinicalRecord
  ) => {
    const formAction = async (
      formData: FormData
    ) => {
      try {
        if (record?.id) {
          formData.set(
            "id",
            record.id
          );
        }

        await saveClinical(
          formData
        );

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to save clinical record"
        );
      }
    };

    const existingProcedure =
      record
        ?.treatmentRecords?.[0]
        ?.treatmentName || "";

    openModal(
      "Clinical entry",
      <form
        action={formAction}
        className="space-y-4"
      >
        <div className="grid">
          <div>
            <label>
              Patient
            </label>

            <select
              name="patientId"
              defaultValue={
                record?.patientId ||
                ""
              }
              required
            >
              {patientOptions(
                record?.patientId
              )}
            </select>
          </div>

          <div>
            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={
                record?.date
                  ? record.date.slice(
                      0,
                      10
                    )
                  : today()
              }
            />
          </div>

          <div>
            <label>
              Tooth / region
            </label>

            <input
              name="tooth"
              placeholder="e.g. 46, 11–21, full arch"
            />
          </div>

          <div>
            <label>
              Procedure
            </label>

            <input
              name="procedure"
              defaultValue={
                existingProcedure
              }
              placeholder="RCT / crown / denture / implant..."
            />
          </div>

          <div>
            <label>
              Diagnosis
            </label>

            <input
              name="diagnosis"
              defaultValue={
                record?.diagnosis ||
                ""
              }
            />
          </div>

          <div>
            <label>
              Next visit
            </label>

            <input
              name="nextVisit"
              type="date"
              defaultValue={
                record?.followUpDate
                  ? record.followUpDate.slice(
                      0,
                      10
                    )
                  : ""
              }
            />
          </div>
        </div>

        <label>
          Clinical notes
        </label>

        <textarea
          name="notes"
          defaultValue={
            record?.clinicalNotes ||
            ""
          }
        />

        <label>
          Materials / lab details
        </label>

        <textarea name="lab" />

        <button type="submit">
          Save
        </button>
      </form>
    );
  };

  /* ==========================================================
     BILL
  ========================================================== */

  const newBill = () => {
    const formAction = async (
      formData: FormData
    ) => {
      try {
        await saveBill(
          formData
        );

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to save bill"
        );
      }
    };

    openModal(
      "Bill / payment",
      <form
        action={formAction}
        className="space-y-4"
      >
        <div className="grid">
          <div>
            <label>
              Patient
            </label>

            <select
              name="patientId"
              required
            >
              {patientOptions()}
            </select>
          </div>

          <div>
            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={today()}
            />
          </div>

          <div>
            <label>
              Bill number
            </label>

            <input
              name="invoiceNumber"
              defaultValue={`INV-${String(
                invoices.length + 1
              ).padStart(4, "0")}`}
            />
          </div>

          <div>
            <label>
              Payment method
            </label>

            <select
              name="method"
              defaultValue="CASH"
            >
              <option value="CASH">
                Cash
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK_TRANSFER">
                Bank transfer
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>
        </div>

        <label>
          Items (one per line: Procedure | Amount)
        </label>

        <textarea
          name="items"
          placeholder={`Consultation | 500
RCT | 5000`}
        />

        <div className="grid">
          <div>
            <label>Total</label>

            <input
              name="total"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>

          <div>
            <label>
              Discount
            </label>

            <input
              name="discount"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>

          <div>
            <label>Tax</label>

            <input
              name="tax"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>

          <div>
            <label>
              Paid now
            </label>

            <input
              name="paid"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>
        </div>

        <label>Notes</label>

        <textarea name="notes" />

        <button type="submit">
          Save
        </button>
      </form>
    );
  };

  /* ==========================================================
     PRESCRIPTION
  ========================================================== */

  const newPrescription = () => {
    const formAction = async (
      formData: FormData
    ) => {
      try {
        await savePrescription(
          formData
        );

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Unable to save prescription"
        );
      }
    };

    openModal(
      "Prescription",
      <form
        action={formAction}
        className="space-y-4"
      >
        <div className="grid">
          <div>
            <label>
              Patient
            </label>

            <select
              name="patientId"
              required
            >
              {patientOptions()}
            </select>
          </div>

          <div>
            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={today()}
            />
          </div>
        </div>

        <label>
          Prescription / medicines
        </label>

        <textarea
          name="text"
          placeholder={`Amoxicillin 500mg — 1-0-1 — 5 days
Paracetamol 500mg — SOS`}
        />

        <label>
          Instructions
        </label>

        <textarea name="instructions" />

        <button type="submit">
          Save
        </button>

        <button
          type="button"
          className="secondary"
          onClick={() =>
            window.print()
          }
        >
          Print
        </button>
      </form>
    );
  };

  /* ==========================================================
     DASHBOARD DATA
  ========================================================== */

  const todayAppointments =
    appointments.filter(
      (appointment) =>
        appointment.date.slice(
          0,
          10
        ) === today() &&
        appointment.status !==
          "CANCELLED"
    ).length;

  const pendingPayments =
    invoices.reduce(
      (sum, invoice) => {
        const paid =
          invoice.payments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount
              ),
            0
          );

        return (
          sum +
          Math.max(
            0,
            Number(
              invoice.total
            ) - paid
          )
        );
      },
      0
    );

  const currentMonth =
    today().slice(0, 7);

  const monthlyRevenue =
    invoices
      .filter((invoice) =>
        invoice.invoiceDate
          .slice(0, 7)
          .startsWith(
            currentMonth
          )
      )
      .reduce(
        (sum, invoice) =>
          sum +
          invoice.payments.reduce(
            (
              total,
              payment
            ) =>
              total +
              Number(
                payment.amount
              ),
            0
          ),
        0
      );

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredPatients =
    patients.filter((patient) => {
      const query =
        patientSearch.toLowerCase();

      return `${fullName(
        patient
      )} ${
        patient.phone
      } ${
        patient.patientNumber
      }`
        .toLowerCase()
        .includes(query);
    });

  const filteredAppointments =
    useMemo(() => {
      let result = [
        ...appointments,
      ];

      if (
        appointmentFilter ===
        "today"
      ) {
        result =
          result.filter(
            (appointment) =>
              appointment.date.slice(
                0,
                10
              ) === today()
          );
      }

      if (
        appointmentFilter ===
        "upcoming"
      ) {
        const now =
          new Date();

        result =
          result.filter(
            (appointment) =>
              new Date(
                appointment.date
              ) >= now &&
              appointment.status !==
                "CANCELLED"
          );
      }

      if (
        appointmentFilter ===
        "completed"
      ) {
        result =
          result.filter(
            (appointment) =>
              appointment.status ===
              "COMPLETED"
          );
      }

      return result.sort(
        (a, b) =>
          new Date(
            a.date
          ).getTime() -
          new Date(
            b.date
          ).getTime()
      );
    }, [
      appointments,
      appointmentFilter,
    ]);

  const filteredClinical =
    clinical.filter((record) => {
      const patient =
        patients.find(
          (p) =>
            p.id ===
            record.patientId
        );

      return fullName(patient)
        .toLowerCase()
        .includes(
          clinicalSearch.toLowerCase()
        );
    });

  const filteredInvoices =
    invoices.filter((invoice) => {
      const patient =
        patients.find(
          (p) =>
            p.id ===
            invoice.patientId
        );

      return fullName(patient)
        .toLowerCase()
        .includes(
          billSearch.toLowerCase()
        );
    });

  const filteredRx =
    prescriptions.filter(
      (rx) => {
        const patient =
          patients.find(
            (p) =>
              p.id ===
              rx.patientId
          );

        return fullName(patient)
          .toLowerCase()
          .includes(
            rxSearch.toLowerCase()
          );
      }
    );

  /* ==========================================================
     PATIENT NAME
  ========================================================== */

  const patientName = (
    id: string | null
  ) => {
    if (!id) return "Unknown";

    const patient =
      patients.find(
        (p) => p.id === id
      );

    return fullName(patient);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <style jsx global>{`
        :root {
          --p: #176b87;
          --bg: #f3f6f8;
          --card: #fff;
          --text: #17202a;
          --muted: #687780;
          --line: #dbe2e6;
          --danger: #b42318;
          --ok: #16794a;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font: 14px Arial, sans-serif;
          background: var(--bg);
          color: var(--text);
        }

        .admin-header {
          background: var(--p);
          color: #fff;
          padding: 16px 20px;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 21px;
        }

        .admin-header small {
          opacity: 0.9;
        }

        nav {
          display: flex;
          gap: 6px;
          overflow: auto;
          background: #fff;
          border-bottom: 1px solid var(--line);
          padding: 8px 12px;
          position: sticky;
          top: 69px;
          z-index: 4;
        }

        nav button {
          background: #eef3f5;
          color: #17313c;
          border: 0;
          border-radius: 8px;
          padding: 9px 13px;
          white-space: nowrap;
        }

        nav button.active {
          background: var(--p);
          color: #fff;
        }

        main {
          max-width: 1250px;
          margin: 18px auto;
          padding: 0 14px;
        }

        .card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px #00000009;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(210px, 1fr)
          );
          gap: 12px;
        }

        label {
          display: block;
          font-weight: bold;
          font-size: 12px;
          color: #3d4b52;
          margin-bottom: 5px;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 9px;
          border: 1px solid #cbd5da;
          border-radius: 7px;
          background: #fff;
        }

        textarea {
          min-height: 85px;
          resize: vertical;
        }

        button {
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          background: var(--p);
          color: #fff;
          cursor: pointer;
          margin: 3px;
        }

        button.secondary {
          background: #687780;
        }

        button.danger {
          background: var(--danger);
        }

        button.ok {
          background: var(--ok);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .muted {
          color: var(--muted);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          text-align: left;
          padding: 9px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }

        .scroll {
          overflow: auto;
        }

        .statgrid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(170px, 1fr)
          );
          gap: 12px;
        }

        .stat {
          padding: 15px;
          border-radius: 10px;
          background: #fff;
          border: 1px solid var(--line);
        }

        .stat b {
          font-size: 25px;
          display: block;
          margin-top: 5px;
        }

        .badge {
          display: inline-block;
          border-radius: 20px;
          padding: 4px 8px;
          background: #eef3f5;
          font-size: 12px;
        }

        .badge.ok {
          background: #e8f6ef;
          color: #16794a;
        }

        .badge.warn {
          background: #fff3d6;
          color: #815900;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: #0007;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 14px;
          z-index: 10;
        }

        .modalbox {
          background: #fff;
          max-width: 1000px;
          width: 100%;
          max-height: 92vh;
          overflow: auto;
          border-radius: 12px;
          padding: 18px;
        }

        @media (max-width: 700px) {
          .admin-header {
            position: static;
          }

          nav {
            top: 0;
          }
        }
      `}</style>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="admin-header">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div>
            <h1>
              Jaswith Dental Care
            </h1>

            <small>
              Dr. J. Sailakshmi, MDS •
              Prosthodontist &
              Implantologist • Clinic
              Management
            </small>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="secondary"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* ======================================================
          NAV
      ====================================================== */}

      <nav>
        {[
          "dashboard",
          "patients",
          "appointments",
          "clinical",
          "billing",
          "prescriptions",
          "files",
          "reports",
          "backup",
        ].map((item) => (
          <button
            key={item}
            className={
              page === item
                ? "active"
                : ""
            }
            onClick={() =>
              setPage(item)
            }
          >
            {item
              .charAt(0)
              .toUpperCase() +
              item.slice(1)}
          </button>
        ))}
      </nav>

      <main>
        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        {page === "dashboard" && (
          <>
            <div className="statgrid">
              <div className="stat">
                Patients

                <b>
                  {patients.length}
                </b>
              </div>

              <div className="stat">
                Today's
                appointments

                <b>
                  {todayAppointments}
                </b>
              </div>

              <div className="stat">
                Pending payments

                <b>
                  {money(
                    pendingPayments
                  )}
                </b>
              </div>

              <div className="stat">
                This month's
                revenue

                <b>
                  {money(
                    monthlyRevenue
                  )}
                </b>
              </div>
            </div>

            <div className="card">
              <h2>
                Quick actions
              </h2>

              <div className="actions">
                <button
                  onClick={() =>
                    newPatient()
                  }
                >
                  + New patient
                </button>

                <button
                  onClick={() =>
                    newAppointment()
                  }
                >
                  + Appointment
                </button>

                <button
                  onClick={() =>
                    newBill()
                  }
                >
                  + Bill / Payment
                </button>

                <button
                  onClick={() =>
                    newClinical()
                  }
                >
                  + Clinical entry
                </button>
              </div>
            </div>

            <div className="card">
              <h2>
                Upcoming appointments
              </h2>

              {appointments
                .filter(
                  (a) =>
                    new Date(
                      a.date
                    ) >=
                      new Date() &&
                    a.status !==
                      "CANCELLED"
                )
                .sort(
                  (a, b) =>
                    new Date(
                      a.date
                    ).getTime() -
                    new Date(
                      b.date
                    ).getTime()
                )
                .slice(0, 8)
                .map(
                  (appointment) => (
                    <div
                      className="card"
                      key={
                        appointment.id
                      }
                    >
                      <b>
                        {formatDateTime(
                          appointment.date,
                          appointment.time
                        )}
                      </b>

                      {" • "}

                      {patientName(
                        appointment.patientId
                      )}

                      <br />

                      {appointment.reason}

                      {" "}

                      <span className="badge">
                        {
                          appointment.status
                        }
                      </span>
                    </div>
                  )
                )}

              {appointments.length ===
                0 && (
                <p className="muted">
                  No upcoming
                  appointments.
                </p>
              )}
            </div>
          </>
        )}

        {/* ====================================================
            PATIENTS
        ==================================================== */}

        {page === "patients" && (
          <>
            <div className="card">
              <div className="actions">
                <button
                  onClick={() =>
                    newPatient()
                  }
                >
                  + New patient
                </button>

                <input
                  placeholder="Search name / phone / patient ID"
                  value={
                    patientSearch
                  }
                  onChange={(e) =>
                    setPatientSearch(
                      e.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 220,
                  }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Last visit
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map(
                    (patient) => (
                      <tr
                        key={
                          patient.id
                        }
                      >
                        <td>
                          {
                            patient.patientNumber
                          }
                        </td>

                        <td>
                          <b>
                            {fullName(
                              patient
                            )}
                          </b>

                          <br />

                          <span className="muted">
                            {
                              patient.gender
                            }{" "}
                            {formatDate(
                              patient.dateOfBirth
                            )}
                          </span>
                        </td>

                        <td>
                          {
                            patient.phone
                          }

                          <br />

                          {
                            patient.email
                          }
                        </td>

                        <td>
                          {formatDate(
                            clinical.find(
                              (c) =>
                                c.patientId ===
                                patient.id
                            )?.date
                          )}
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              newPatient(
                                patient
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              alert(
                                "Patient chart is available from the patient records."
                              )
                            }
                          >
                            Chart
                          </button>

                          <button
                            className="danger"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Delete this patient?"
                                )
                              )
                                return;

                              const fd =
                                new FormData();

                              fd.set(
                                "id",
                                patient.id
                              );

                              await deletePatient(
                                fd
                              );

                              window.location.reload();
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {filteredPatients.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="muted"
                      >
                        No patients
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            APPOINTMENTS
        ==================================================== */}

        {page ===
          "appointments" && (
          <>
            <div className="card">
              <div className="actions">
                <button
                  onClick={() =>
                    newAppointment()
                  }
                >
                  + New appointment
                </button>

                <select
                  value={
                    appointmentFilter
                  }
                  onChange={(e) =>
                    setAppointmentFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="all">
                    All
                  </option>

                  <option value="today">
                    Today
                  </option>

                  <option value="upcoming">
                    Upcoming
                  </option>

                  <option value="completed">
                    Completed
                  </option>
                </select>
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      Date/time
                    </th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Reason
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map(
                    (appointment) => (
                      <tr
                        key={
                          appointment.id
                        }
                      >
                        <td>
                          {formatDateTime(
                            appointment.date,
                            appointment.time
                          )}
                        </td>

                        <td>
                          {patientName(
                            appointment.patientId
                          )}
                        </td>

                        <td>
                          {
                            appointment.reason
                          }
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              appointment.status ===
                              "COMPLETED"
                                ? "ok"
                                : appointment.status ===
                                  "CANCELLED"
                                ? "warn"
                                : ""
                            }`}
                          >
                            {
                              appointment.status
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              newAppointment(
                                appointment
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="danger"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Delete appointment?"
                                )
                              )
                                return;

                              const fd =
                                new FormData();

                              fd.set(
                                "id",
                                appointment.id
                              );

                              await deleteAppointment(
                                fd
                              );

                              window.location.reload();
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            CLINICAL
        ==================================================== */}

        {page === "clinical" && (
          <>
            <div className="card">
              <div className="actions">
                <button
                  onClick={() =>
                    newClinical()
                  }
                >
                  + Clinical entry
                </button>

                <input
                  placeholder="Search patient"
                  value={
                    clinicalSearch
                  }
                  onChange={(e) =>
                    setClinicalSearch(
                      e.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 220,
                  }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Tooth
                    </th>

                    <th>
                      Procedure /
                      diagnosis
                    </th>

                    <th>
                      Notes
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredClinical.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td>
                          {formatDate(
                            record.date
                          )}
                        </td>

                        <td>
                          {patientName(
                            record.patientId
                          )}
                        </td>

                        <td>
                          —
                        </td>

                        <td>
                          {
                            record
                              .treatmentRecords?.[0]
                              ?.treatmentName
                          }

                          <br />

                          <span className="muted">
                            {
                              record.diagnosis
                            }
                          </span>
                        </td>

                        <td>
                          {
                            record.clinicalNotes
                          }
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              newClinical(
                                record
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            BILLING
        ==================================================== */}

        {page === "billing" && (
          <>
            <div className="card">
              <div className="actions">
                <button
                  onClick={() =>
                    newBill()
                  }
                >
                  + New bill
                </button>

                <input
                  placeholder="Search patient"
                  value={billSearch}
                  onChange={(e) =>
                    setBillSearch(
                      e.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 220,
                  }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>

                    <th>
                      Bill #
                    </th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Items
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Paid
                    </th>

                    <th>
                      Balance
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map(
                    (invoice) => {
                      const paid =
                        invoice.payments.reduce(
                          (
                            sum,
                            payment
                          ) =>
                            sum +
                            Number(
                              payment.amount
                            ),
                          0
                        );

                      return (
                        <tr
                          key={
                            invoice.id
                          }
                        >
                          <td>
                            {formatDate(
                              invoice.invoiceDate
                            )}
                          </td>

                          <td>
                            {
                              invoice.invoiceNumber
                            }
                          </td>

                          <td>
                            {patientName(
                              invoice.patientId
                            )}
                          </td>

                          <td>
                            {invoice.items.map(
                              (
                                item
                              ) => (
                                <div
                                  key={
                                    item.description
                                  }
                                >
                                  {
                                    item.description
                                  }{" "}
                                  —{" "}
                                  {money(
                                    item.amount
                                  )}
                                </div>
                              )
                            )}
                          </td>

                          <td>
                            {money(
                              invoice.total
                            )}
                          </td>

                          <td>
                            {money(
                              paid
                            )}
                          </td>

                          <td>
                            {money(
                              Number(
                                invoice.total
                              ) -
                                paid
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() => {
                                const fd =
                                  new FormData();

                                fd.set(
                                  "invoiceId",
                                  invoice.id
                                );

                                const amount =
                                  prompt(
                                    "Payment amount"
                                  );

                                if (
                                  amount
                                ) {
                                  fd.set(
                                    "amount",
                                    amount
                                  );

                                  fd.set(
                                    "method",
                                    "CASH"
                                  );

                                  addPayment(
                                    fd
                                  ).then(
                                    () =>
                                      window.location.reload()
                                  );
                                }
                              }}
                            >
                              Payment
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            PRESCRIPTIONS
        ==================================================== */}

        {page ===
          "prescriptions" && (
          <>
            <div className="card">
              <div className="actions">
                <button
                  onClick={() =>
                    newPrescription()
                  }
                >
                  + Prescription
                </button>

                <input
                  placeholder="Search patient"
                  value={rxSearch}
                  onChange={(e) =>
                    setRxSearch(
                      e.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: 220,
                  }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>

                    <th>
                      Patient
                    </th>

                    <th>
                      Medicines /
                      instructions
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRx.map(
                    (rx) => (
                      <tr
                        key={
                          rx.id
                        }
                      >
                        <td>
                          {formatDate(
                            rx.prescriptionDate
                          )}
                        </td>

                        <td>
                          {patientName(
                            rx.patientId
                          )}
                        </td>

                        <td>
                          {rx.items.map(
                            (
                              item
                            ) => (
                              <div
                                key={
                                  item.medicine
                                }
                              >
                                {
                                  item.medicine
                                }

                                <br />

                                <span className="muted">
                                  {
                                    item.instructions
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              alert(
                                "Prescription editing can be added next."
                              )
                            }
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            FILES
        ==================================================== */}

        {page === "files" && (
          <>
            <div className="card">
              <h2>
                Patient documents
              </h2>

              <p className="muted">
                Attach X-rays,
                photographs, scans,
                consent forms and
                reports to a patient.
                Maximum 5 MB per
                image.
              </p>

              <form
                action={async (
                  formData
                ) => {
                  try {
                    const file =
                      formData.get(
                        "file"
                      );

                    if (
                      !(
                        file instanceof
                        File
                      ) ||
                      file.size === 0
                    ) {
                      throw new Error(
                        "Please select an image."
                      );
                    }

                    setUploadingFile(
                      true
                    );

                    /*
                     * 1. Upload image to S3
                     *    through /api/upload
                     */
                    const url =
                      await uploadImage(
                        file,
                        "dental/attachments"
                      );

                    /*
                     * 2. Create database
                     *    Attachment record
                     */
                    const attachmentData =
                      new FormData();

                    attachmentData.set(
                      "patientId",
                      String(
                        formData.get(
                          "patientId"
                        ) || ""
                      )
                    );

                    attachmentData.set(
                      "name",
                      file.name
                    );

                    attachmentData.set(
                      "mimeType",
                      file.type
                    );

                    attachmentData.set(
                      "size",
                      String(
                        file.size
                      )
                    );

                    attachmentData.set(
                      "url",
                      url
                    );

                    const {
                      saveAttachment,
                    } =
                      await import(
                        "./actions"
                      );

                    await saveAttachment(
                      attachmentData
                    );

                    window.location.reload();
                  } catch (error) {
                    alert(
                      error instanceof
                        Error
                        ? error.message
                        : "Unable to upload file"
                    );
                  } finally {
                    setUploadingFile(
                      false
                    );
                  }
                }}
              >
                <div className="actions">
                  <select
                    name="patientId"
                    required
                  >
                    {patientOptions()}
                  </select>

                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple={false}
                    required
                  />

                  <button
                    type="submit"
                    disabled={
                      uploadingFile
                    }
                  >
                    {uploadingFile
                      ? "Uploading..."
                      : "Attach"}
                  </button>
                </div>

                {uploadingFile && (
                  <p className="muted">
                    Uploading image to
                    secure storage...
                  </p>
                )}
              </form>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      Patient
                    </th>

                    <th>
                      File
                    </th>

                    <th>
                      Added
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {attachments.map(
                    (file) => (
                      <tr
                        key={
                          file.id
                        }
                      >
                        <td>
                          {patientName(
                            file.patientId
                          )}
                        </td>

                        <td>
                          <div>
                            {
                              file.name
                            }
                          </div>

                          <span className="muted">
                            {
                              file.mimeType
                            }{" "}
                            •{" "}
                            {(
                              file.size /
                              1024 /
                              1024
                            ).toFixed(
                              2
                            )}{" "}
                            MB
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            file.createdAt
                          )}
                        </td>

                        <td>
                          {file.url && (
                            <a
                              href={
                                file.url
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              <button type="button">
                                Open
                              </button>
                            </a>
                          )}

                          <button
                            className="danger"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Delete file?"
                                )
                              )
                                return;

                              const fd =
                                new FormData();

                              fd.set(
                                "id",
                                file.id
                              );

                              await deleteAttachment(
                                fd
                              );

                              window.location.reload();
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}

                  {attachments.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="muted"
                      >
                        No files uploaded
                        yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ====================================================
            REPORTS
        ==================================================== */}

        {page === "reports" && (
          <>
            <div className="card">
              <h2>
                Clinic reports
              </h2>

              <div className="statgrid">
                <div className="stat">
                  Total patients

                  <b>
                    {
                      patients.length
                    }
                  </b>
                </div>

                <div className="stat">
                  Completed visits

                  <b>
                    {
                      appointments.filter(
                        (a) =>
                          a.status ===
                          "COMPLETED"
                      ).length
                    }
                  </b>
                </div>

                <div className="stat">
                  Total billed

                  <b>
                    {money(
                      invoices.reduce(
                        (
                          sum,
                          invoice
                        ) =>
                          sum +
                          Number(
                            invoice.total
                          ),
                        0
                      )
                    )}
                  </b>
                </div>

                <div className="stat">
                  Total collected

                  <b>
                    {money(
                      invoices.reduce(
                        (
                          sum,
                          invoice
                        ) =>
                          sum +
                          invoice.payments.reduce(
                            (
                              pSum,
                              payment
                            ) =>
                              pSum +
                              Number(
                                payment.amount
                              ),
                            0
                          ),
                        0
                      )
                    )}
                  </b>
                </div>

                <div className="stat">
                  Outstanding

                  <b>
                    {money(
                      pendingPayments
                    )}
                  </b>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>
                Procedure summary
              </h3>

              {(() => {
                const procedureMap: Record<
                  string,
                  number
                > = {};

                clinical.forEach(
                  (record) => {
                    const procedure =
                      record
                        .treatmentRecords?.[0]
                        ?.treatmentName ||
                      "Unspecified";

                    procedureMap[
                      procedure
                    ] =
                      (procedureMap[
                        procedure
                      ] || 0) + 1;
                  }
                );

                return Object.entries(
                  procedureMap
                )
                  .sort(
                    (a, b) =>
                      b[1] - a[1]
                  )
                  .map(
                    ([
                      name,
                      count,
                    ]) => (
                      <div
                        className="card"
                        key={name}
                      >
                        <b>
                          {name}
                        </b>{" "}
                        — {count}
                      </div>
                    )
                  );
              })()}
            </div>
          </>
        )}

        {/* ====================================================
            BACKUP
        ==================================================== */}

        {page === "backup" && (
          <>
            <div className="card">
              <h2>
                Backup & restore
              </h2>

              <p>
                Export the clinic
                data from the
                database. This
                version exports
                the currently loaded
                records as JSON.
              </p>

              <button
                onClick={() => {
                  const data = {
                    clinic,
                    patients,
                    appointments,
                    doctors,
                    treatments,
                    testimonials,
                    clinical,
                    invoices,
                    prescriptions,
                    attachments,
                  };

                  const blob =
                    new Blob(
                      [
                        JSON.stringify(
                          data,
                          null,
                          2
                        ),
                      ],
                      {
                        type: "application/json",
                      }
                    );

                  const url =
                    URL.createObjectURL(
                      blob
                    );

                  const a =
                    document.createElement(
                      "a"
                    );

                  a.href = url;

                  a.download = `jaswith-dental-care-backup-${today()}.json`;

                  a.click();

                  URL.revokeObjectURL(
                    url
                  );
                }}
              >
                Download backup
              </button>
            </div>

            <div className="card">
              <h3>
                Clinic setup
              </h3>

              <form
                action={async (
                  formData
                ) => {
                  await updateClinic(
                    formData
                  );

                  setSettings(
                    (current) => ({
                      ...current,
                      clinicName:
                        String(
                          formData.get(
                            "name"
                          ) || ""
                        ),
                    })
                  );

                  alert(
                    "Settings saved."
                  );
                }}
              >
                <div className="grid">
                  <div>
                    <label>
                      Clinic name
                    </label>

                    <input
                      name="name"
                      defaultValue={
                        clinic.name
                      }
                    />
                  </div>

                  <div>
                    <label>
                      Doctor
                    </label>

                    <input
                      value={
                        settings.doctor
                      }
                      readOnly
                    />
                  </div>

                  <div>
                    <label>
                      Default
                      currency
                    </label>

                    <input
                      value={
                        settings.currency
                      }
                      readOnly
                    />
                  </div>
                </div>

                <button type="submit">
                  Save settings
                </button>
              </form>
            </div>

            <div className="card">
              <h3>
                Privacy notice
              </h3>

              <p className="muted">
                Patient information
                is sensitive clinical
                data. Use authenticated
                accounts, encrypted
                storage, backups,
                role-based access,
                audit logging and
                secure hosting before
                production deployment.
              </p>
            </div>
          </>
        )}
      </main>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {modal && (
        <div
          className="modal"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="modalbox">
            <div
              className="actions"
              style={{
                justifyContent:
                  "space-between",
              }}
            >
              <h2>
                {modal.title}
              </h2>

              <button
                className="secondary"
                onClick={
                  closeModal
                }
              > 
                Close
              </button>
            </div>

            {modal.body}
          </div>
        </div>
      )}
    </>
  );
}