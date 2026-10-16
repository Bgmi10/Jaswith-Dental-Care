"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  addPayment,
  deleteAppointment,
  deleteAttachment,
  deletePatient,
  logout,
  saveAppointment,
  saveAttachment,
  saveBill,
  savePatient,
  savePrescription,
} from "./actions";

import Setting from "./Setting";

/* ============================================================
   TYPES
============================================================ */

type Patient = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string | null;
  age: number | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string;
  email: string | null;
  occupation: string | null;
  allergies: string | null;
  medicalAlerts: string | null;

  visitDate?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  clinicalNotes?: string | null;
  followUpDate?: string | null;
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

type Invoice = {
  id: string;
  patientId: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: string | number;
  status: string;
  notes: string | null;

  // Optional: only pre-filled in the edit form if your page
  // passes them down from the server.
  subtotal?: string | number | null;
  discount?: string | number | null;
  tax?: string | number | null;
  dueDate?: string | null;

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
  patientPrefix: string;
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

const money = (value: number | string | null | undefined) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  return parsed.toLocaleDateString("en-IN");
};

const fullName = (patient?: Patient) => {
  if (!patient) return "Unknown";

  return [patient.firstName, patient.lastName].filter(Boolean).join(" ");
};

const toPayload = (formData: FormData): Record<string, unknown> => {
  return Object.fromEntries(formData.entries());
};

const sumPayments = (payments: { amount: string | number }[]) =>
  payments.reduce((total, payment) => total + Number(payment.amount), 0);

/* ============================================================
   SEARCHABLE PATIENT PICKER
============================================================ */

type PatientPickerProps = {
  patients: Patient[];
  name?: string;
  value?: string | null;
  required?: boolean;
  placeholder?: string;
  onChange?: (patientId: string) => void;
};

function PatientPicker({
  patients,
  name = "patientId",
  value = "",
  required = false,
  placeholder = "Search patient by name, ID or phone...",
  onChange,
}: PatientPickerProps) {
  const pickerId = useId();

  const inputId = `${pickerId}-input`;
  const listId = `${pickerId}-list`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedId, setSelectedId] = useState(value || "");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedId),
    [patients, selectedId]
  );

  /*
   * Search across the fields that staff are most
   * likely to know when looking for a patient.
   */
  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return patients.slice(0, 50);
    }

    const matches = patients.filter((patient) => {
      const searchableText = [
        patient.patientNumber,
        patient.firstName,
        patient.lastName,
        fullName(patient),
        patient.phone,
        patient.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    /*
     * Render only the first 50 matches.
     * Search still runs against the entire patient
     * collection, but the browser does not have to
     * render thousands of option elements.
     */
    return matches.slice(0, 50);
  }, [patients, search]);

  useEffect(() => {
    setSelectedId(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
        setHighlightedIndex(0);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex >= filteredPatients.length) {
      setHighlightedIndex(Math.max(0, filteredPatients.length - 1));
    }
  }, [filteredPatients.length, highlightedIndex]);

  const selectPatient = (patient: Patient) => {
    setSelectedId(patient.id);
    setSearch("");
    setOpen(false);
    setHighlightedIndex(0);

    onChange?.(patient.id);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const clearPatient = () => {
    setSelectedId("");
    setSearch("");
    setOpen(false);
    setHighlightedIndex(0);

    onChange?.("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setOpen(true);

      setHighlightedIndex((current) =>
        filteredPatients.length === 0
          ? 0
          : Math.min(current + 1, filteredPatients.length - 1)
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setOpen(true);

      setHighlightedIndex((current) => Math.max(current - 1, 0));

      return;
    }

    if (event.key === "Enter") {
      if (open && filteredPatients[highlightedIndex]) {
        event.preventDefault();

        selectPatient(filteredPatients[highlightedIndex]);
      }

      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();

      setOpen(false);
      setSearch("");
      setHighlightedIndex(0);

      return;
    }

    if (event.key === "Backspace" && !search && selectedPatient) {
      clearPatient();
    }
  };

  return (
    <div ref={rootRef} className="patient-picker">
      {/*
       * This hidden field is the actual form value.
       * Existing server actions continue receiving:
       *
       * patientId = "..."
       */}
      <input type="hidden" name={name} value={selectedId} />

      <div className={`patient-picker-control ${open ? "open" : ""}`}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-label="Search patient"
          aria-activedescendant={
            open && filteredPatients[highlightedIndex]
              ? `${pickerId}-option-${filteredPatients[highlightedIndex].id}`
              : undefined
          }
          value={
            open
              ? search
              : selectedPatient
              ? `${selectedPatient.patientNumber} — ${fullName(
                  selectedPatient
                )}`
              : ""
          }
          placeholder={
            selectedPatient && !open
              ? `${selectedPatient.patientNumber} — ${fullName(
                  selectedPatient
                )}`
              : placeholder
          }
          onFocus={() => {
            setOpen(true);
            setSearch("");
            setHighlightedIndex(0);
          }}
          onClick={() => {
            setOpen(true);
            setSearch("");
            setHighlightedIndex(0);
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
            setHighlightedIndex(0);

            /*
             * If staff starts typing after a patient
             * was selected, clear the previous selection.
             */
            if (selectedId) {
              setSelectedId("");
              onChange?.("");
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="patient-picker-input"
        />

        {selectedPatient && (
          <button
            type="button"
            className="patient-picker-clear"
            aria-label="Clear patient"
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={clearPatient}
          >
            ×
          </button>
        )}

        <span
          className={`patient-picker-arrow ${open ? "up" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </div>

      {open && (
        <div id={listId} role="listbox" className="patient-picker-menu">
          <div className="patient-picker-summary">
            {search
              ? filteredPatients.length > 0
                ? `${filteredPatients.length}${
                    filteredPatients.length === 50 ? "+" : ""
                  } patient${filteredPatients.length === 1 ? "" : "s"} found`
                : "No patients found"
              : `${patients.length.toLocaleString("en-IN")} patients`}
          </div>

          {filteredPatients.length === 0 ? (
            <div className="patient-picker-empty">
              <strong>No patient found</strong>

              <span>Try the patient ID, name, phone number or email.</span>
            </div>
          ) : (
            filteredPatients.map((patient, index) => {
              const isSelected = patient.id === selectedId;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={patient.id}
                  id={`${pickerId}-option-${patient.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`patient-picker-option ${
                    isHighlighted ? "highlighted" : ""
                  } ${isSelected ? "selected" : ""}`}
                  onMouseDown={(event) => {
                    /*
                     * Prevent the input from blurring
                     * before selection is processed.
                     */
                    event.preventDefault();
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectPatient(patient)}
                >
                  <div className="patient-picker-option-main">
                    <strong>{fullName(patient)}</strong>

                    <span>{patient.patientNumber}</span>
                  </div>

                  <div className="patient-picker-option-meta">
                    <span>{patient.phone}</span>

                    {patient.email && <span>{patient.email}</span>}
                  </div>
                </button>
              );
            })
          )}

          {filteredPatients.length === 50 && (
            <div className="patient-picker-more">
              Showing first 50 matches. Keep typing to narrow the results.
            </div>
          )}
        </div>
      )}

      {required && (
        <span className="patient-picker-required" aria-hidden="true">
          {selectedId ? "" : "Patient selection required"}
        </span>
      )}
    </div>
  );
}

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
  invoices: initialInvoices,
  prescriptions: initialPrescriptions,
  attachments: initialAttachments,
}: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [appointments, setAppointments] = useState(initialAppointments);
  const [doctors, setDoctors] = useState(initialDoctors);
  const [treatments, setTreatments] = useState(initialTreatments);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [attachments, setAttachments] = useState(initialAttachments);

  const [page, setPage] = useState("dashboard");

  const [modal, setModal] = useState<{
    title: string;
    body: React.ReactNode;
  } | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [rxSearch, setRxSearch] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState("all");
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    setPatients(initialPatients);
    setAppointments(initialAppointments);
    setDoctors(initialDoctors);
    setTreatments(initialTreatments);
    setTestimonials(initialTestimonials);
    setInvoices(initialInvoices);
    setPrescriptions(initialPrescriptions);
    setAttachments(initialAttachments);
  }, [
    initialPatients,
    initialAppointments,
    initialDoctors,
    initialTreatments,
    initialTestimonials,
    initialInvoices,
    initialPrescriptions,
    initialAttachments,
  ]);

  /* ==========================================================
     S3 UPLOAD
  ========================================================== */

  const uploadImage = async (file: File, folder = "dental/attachments") => {
    if (!file || file.size === 0) {
      throw new Error("Please select an image");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPG, PNG and WebP images are allowed."
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error("File too large. Maximum size is 5 MB.");
    }

    const uploadData = new FormData();

    uploadData.append("file", file);
    uploadData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });

    let data: {
      url?: string;
      error?: string;
    } = {};

    try {
      data = await response.json();
    } catch {
      throw new Error("Upload server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to upload image.");
    }

    if (!data.url) {
      throw new Error("Upload succeeded but no image URL was returned.");
    }

    return data.url;
  };

  /* ==========================================================
     MODAL
  ========================================================== */

  const openModal = (title: string, body: React.ReactNode) => {
    setModal({ title, body });
  };

  const closeModal = () => {
    setModal(null);
  };

  /* ==========================================================
     PATIENT PICKER HELPER
  ========================================================== */

  const patientPicker = (value?: string | null, required = false) => {
    return (
      <PatientPicker
        patients={patients}
        name="patientId"
        value={value}
        required={required}
      />
    );
  };

  /* ==========================================================
     PATIENT
  ========================================================== */

  const newPatient = (patient?: Patient) => {
    const formAction = async (formData: FormData) => {
      try {
        const payload: Record<string, unknown> = {
          clinicId: clinic.id,
          ...toPayload(formData),
        };

        if (patient?.id) {
          payload.id = patient.id;
        }

        delete payload.patientNumber;

        const result = await savePatient(payload);

        if (!result.success) {
          throw new Error(result.error);
        }

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Unable to save patient"
        );
      }
    };

    openModal(
      patient ? "Edit patient" : "New patient & clinical entry",
      <form action={formAction} className="space-y-5">
        <div className="section-title">
          <h3>Patient details</h3>

          <span>Basic patient information</span>
        </div>

        <div className="grid">
          <div>
            <label>First name *</label>

            <input
              name="firstName"
              defaultValue={patient?.firstName || ""}
              required
            />
          </div>

          <div>
            <label>Last name</label>

            <input name="lastName" defaultValue={patient?.lastName || ""} />
          </div>

          <div>
            <label>Age</label>

            <input
              name="age"
              type="number"
              min="0"
              max="150"
              step="1"
              defaultValue={patient?.age ?? ""}
              placeholder="Age"
            />
          </div>

          <div>
            <label>Gender</label>

            <select name="gender" defaultValue={patient?.gender || ""}>
              <option value="">Select gender</option>

              <option value="Female">Female</option>

              <option value="Male">Male</option>

              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label>Phone *</label>

            <input name="phone" defaultValue={patient?.phone || ""} required />
          </div>

          <div>
            <label>Email</label>

            <input
              name="email"
              type="email"
              defaultValue={patient?.email || ""}
            />
          </div>

          <div>
            <label>Occupation</label>

            <input
              name="occupation"
              defaultValue={patient?.occupation || ""}
            />
          </div>
        </div>

        <div className="section-title">
          <h3>Medical alerts</h3>

          <span>Relevant medical information</span>
        </div>

        <div className="grid">
          <div>
            <label>Allergies</label>

            <textarea
              name="allergies"
              defaultValue={patient?.allergies || ""}
            />
          </div>

          <div>
            <label>Other medical alerts</label>

            <textarea
              name="medicalAlerts"
              defaultValue={patient?.medicalAlerts || ""}
            />
          </div>
        </div>

        <div className="section-title">
          <h3>Clinical entry</h3>

          <span>Diagnosis and treatment information</span>
        </div>

        <div className="grid">
          <div>
            <label>Visit date *</label>

            <input
              name="visitDate"
              type="date"
              defaultValue={
                patient?.visitDate ? patient.visitDate.slice(0, 10) : today()
              }
              required
            />
          </div>

          <div>
            <label>Follow-up date</label>

            <input
              name="followUpDate"
              type="date"
              defaultValue={
                patient?.followUpDate
                  ? patient.followUpDate.slice(0, 10)
                  : ""
              }
            />
          </div>

          <div>
            <label>Diagnosis</label>

            <input
              name="diagnosis"
              defaultValue={patient?.diagnosis || ""}
              placeholder="Enter diagnosis"
            />
          </div>
        </div>

        <div>
          <label>Treatment plan</label>

          <textarea
            name="treatmentPlan"
            defaultValue={patient?.treatmentPlan || ""}
            placeholder="Enter treatment plan"
          />
        </div>

        <div>
          <label>Clinical notes</label>

          <textarea
            name="clinicalNotes"
            defaultValue={patient?.clinicalNotes || ""}
            placeholder="Enter clinical notes for this visit"
          />
        </div>

        <div className="actions">
          <button type="submit">Save patient</button>

          <button type="button" className="secondary" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  /* ==========================================================
     APPOINTMENT
  ========================================================== */

  const newAppointment = (appointment?: Appointment) => {
    const formAction = async (formData: FormData) => {
      try {
        const patientId = formData.get("patientId")?.toString();

        const selectedPatient = patients.find((p) => p.id === patientId);

        const payload: Record<string, unknown> = {
          clinicId: clinic.id,
          ...toPayload(formData),
          patientName: selectedPatient
            ? fullName(selectedPatient)
            : appointment?.patientName || "",
          phone: selectedPatient?.phone || appointment?.phone || "",
        };

        if (appointment?.id) {
          payload.id = appointment.id;
        }

        const result = await saveAppointment(payload);

        if (!result.success) {
          throw new Error(result.error);
        }

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
      appointment ? "Edit appointment" : "New appointment",
      <form action={formAction} className="space-y-4">
        <div className="section-title">
          <h3>Patient visit</h3>

          <span>Schedule the patient's visit</span>
        </div>

        <div className="grid">
          <div>
            <label>Patient *</label>

            {patientPicker(appointment?.patientId, true)}
          </div>

          <div>
            <label>Visit date *</label>

            <input
              name="date"
              type="date"
              defaultValue={
                appointment?.date ? appointment.date.slice(0, 10) : today()
              }
              required
            />
          </div>

          <div>
            <label>Visit time</label>

            <input
              name="time"
              type="time"
              defaultValue={appointment?.time || ""}
            />
          </div>

          <div>
            <label>Reason</label>

            <input
              name="reason"
              defaultValue={appointment?.reason || ""}
              placeholder="Consultation / follow-up / emergency..."
            />
          </div>

          <div>
            <label>Treatment</label>

            <input
              name="treatment"
              defaultValue={appointment?.treatment || ""}
            />
          </div>

          <div>
            <label>Status</label>

            <select
              name="status"
              defaultValue={appointment?.status || "PENDING"}
            >
              <option value="PENDING">Pending</option>

              <option value="CONFIRMED">Confirmed</option>

              <option value="CHECKED_IN">Checked in</option>

              <option value="IN_PROGRESS">In progress</option>

              <option value="COMPLETED">Completed</option>

              <option value="CANCELLED">Cancelled</option>

              <option value="NO_SHOW">No-show</option>
            </select>
          </div>
        </div>

        <label>Notes</label>

        <textarea name="notes" defaultValue={appointment?.notes || ""} />

        <div className="actions">
          <button type="submit">Save appointment</button>

          <button type="button" className="secondary" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  /* ==========================================================
     BILL (CREATE + EDIT)
  ========================================================== */

  const newBill = (invoice?: Invoice) => {
    const isEdit = Boolean(invoice);

    const alreadyPaid = invoice ? sumPayments(invoice.payments) : 0;

    // "Procedure | Amount" lines for the items textarea
    const itemsDefault = invoice
      ? invoice.items
          .map((item) => `${item.description} | ${Number(item.amount)}`)
          .join("\n")
      : "";

    const formAction = async (formData: FormData) => {
      try {
        const raw = toPayload(formData);

        const itemsText = String(raw.items || "");

        const items = itemsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [description, amount] = line
              .split("|")
              .map((part) => part.trim());

            return {
              description: description || "Item",
              amount: Number(amount) || 0,
            };
          });

        const payload: Record<string, unknown> = {
          clinicId: clinic.id,
          patientId: raw.patientId,
          invoiceDate: raw.date,
          invoiceNumber: raw.invoiceNumber,
          items,
          discount: raw.discount,
          tax: raw.tax,
          total: raw.total,
          notes: raw.notes,
        };

        // Presence of an id switches saveBill into update mode
        if (invoice?.id) {
          payload.id = invoice.id;
        }

        const result = await saveBill(payload);

        if (!result.success) {
          throw new Error(result.error);
        }

        // On edit, "paid now" is an ADDITIONAL payment.
        // Existing payments are left untouched.
        const paidNow = Number(raw.paid || 0);

        const invoiceId = invoice?.id ?? result.invoice?.id;

        if (paidNow > 0 && invoiceId) {
          const paymentResult = await addPayment({
            invoiceId,
            amount: paidNow,
            method: raw.method,
          });

          if (!paymentResult.success) {
            throw new Error(paymentResult.error);
          }
        }

        closeModal();

        window.location.reload();
      } catch (error) {
        alert(
          error instanceof Error ? error.message : "Unable to save bill"
        );
      }
    };

    openModal(
      isEdit ? `Edit bill ${invoice?.invoiceNumber}` : "Bill / payment",
      <form action={formAction} className="space-y-4">
        <div className="grid">
          <div>
            <label>Patient *</label>

            {patientPicker(invoice?.patientId ?? "", true)}
          </div>

          <div>
            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={
                invoice?.invoiceDate
                  ? invoice.invoiceDate.slice(0, 10)
                  : today()
              }
            />
          </div>

          <div>
            <label>Bill number</label>

            <input
              name="invoiceNumber"
              defaultValue={invoice?.invoiceNumber || ""}
              placeholder="Leave blank to auto-generate"
            />
          </div>

          <div>
            <label>Payment method</label>

            <select name="method" defaultValue="CASH">
              <option value="CASH">Cash</option>

              <option value="UPI">UPI</option>

              <option value="CARD">Card</option>

              <option value="BANK_TRANSFER">Bank transfer</option>

              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <label>Items (one per line: Procedure | Amount)</label>

        <textarea
          name="items"
          defaultValue={itemsDefault}
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
              defaultValue={invoice ? Number(invoice.total) : "0"}
            />
          </div>

          <div>
            <label>Discount</label>

            <input
              name="discount"
              type="number"
              step="0.01"
              defaultValue={
                invoice?.discount != null ? Number(invoice.discount) : "0"
              }
            />
          </div>

          <div>
            <label>Tax</label>

            <input
              name="tax"
              type="number"
              step="0.01"
              defaultValue={
                invoice?.tax != null ? Number(invoice.tax) : "0"
              }
            />
          </div>

          <div>
            <label>{isEdit ? "Add payment now" : "Paid now"}</label>

            <input
              name="paid"
              type="number"
              step="0.01"
              defaultValue="0"
            />
          </div>
        </div>

        {isEdit && (
          <div className="info-box">
            <span>
              Already paid: <b>{money(alreadyPaid)}</b> • Balance after
              edit: <b>{money(Number(invoice?.total || 0) - alreadyPaid)}</b>
            </span>
          </div>
        )}

        <label>Notes</label>

        <textarea name="notes" defaultValue={invoice?.notes || ""} />

        <div className="actions">
          <button type="submit">{isEdit ? "Update bill" : "Save bill"}</button>

          <button type="button" className="secondary" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  /* ==========================================================
     PRESCRIPTION
  ========================================================== */

  const newPrescription = () => {
    const formAction = async (formData: FormData) => {
      try {
        const raw = toPayload(formData);

        const medicineLines = String(raw.text || "")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const items = medicineLines.map((medicine) => ({
          medicine,
          instructions: String(raw.instructions || ""),
        }));

        const payload: Record<string, unknown> = {
          patientId: raw.patientId,
          prescriptionDate: raw.date,
          notes: raw.instructions,
          items,
        };

        const result = await savePrescription(payload);

        if (!result.success) {
          throw new Error(result.error);
        }

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
      <form action={formAction} className="space-y-4">
        <div className="grid">
          <div>
            <label>Patient *</label>

            {patientPicker("", true)}
          </div>

          <div>
            <label>Date</label>

            <input name="date" type="date" defaultValue={today()} />
          </div>
        </div>

        <label>Prescription / medicines</label>

        <textarea
          name="text"
          placeholder={`Amoxicillin 500mg — 1-0-1 — 5 days
Paracetamol 500mg — SOS`}
        />

        <label>Instructions</label>

        <textarea name="instructions" />

        <div className="actions">
          <button type="submit">Save</button>

          <button
            type="button"
            className="secondary"
            onClick={() => window.print()}
          >
            Print
          </button>

          <button type="button" className="secondary" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    );
  };

  /* ==========================================================
     DASHBOARD DATA
  ========================================================== */

  const todayAppointments = appointments.filter(
    (appointment) =>
      appointment.date.slice(0, 10) === today() &&
      appointment.status !== "CANCELLED"
  ).length;

  const pendingPayments = invoices.reduce((sum, invoice) => {
    const paid = sumPayments(invoice.payments);

    return sum + Math.max(0, Number(invoice.total) - paid);
  }, 0);

  const currentMonth = today().slice(0, 7);

  const monthlyRevenue = invoices
    .filter((invoice) => invoice.invoiceDate.slice(0, 7) === currentMonth)
    .reduce((sum, invoice) => sum + sumPayments(invoice.payments), 0);

  const upcomingDashboardAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter(
        (appointment) =>
          new Date(appointment.date) >= now &&
          appointment.status !== "CANCELLED"
      )
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(0, 8);
  }, [appointments]);

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredPatients = patients.filter((patient) => {
    const query = patientSearch.toLowerCase();

    return `${fullName(patient)} ${patient.phone} ${patient.patientNumber}`
      .toLowerCase()
      .includes(query);
  });

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (appointmentFilter === "today") {
      result = result.filter(
        (appointment) => appointment.date.slice(0, 10) === today()
      );
    }

    if (appointmentFilter === "upcoming") {
      const now = new Date();

      result = result.filter(
        (appointment) =>
          new Date(appointment.date) >= now &&
          appointment.status !== "CANCELLED"
      );
    }

    if (appointmentFilter === "completed") {
      result = result.filter(
        (appointment) => appointment.status === "COMPLETED"
      );
    }

    return result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [appointments, appointmentFilter]);

  const filteredInvoices = invoices.filter((invoice) => {
    const patient = patients.find((p) => p.id === invoice.patientId);

    return fullName(patient)
      .toLowerCase()
      .includes(billSearch.toLowerCase());
  });

  const filteredRx = prescriptions.filter((rx) => {
    const patient = patients.find((p) => p.id === rx.patientId);

    return fullName(patient).toLowerCase().includes(rxSearch.toLowerCase());
  });

  /* ==========================================================
     PATIENT HELPERS
  ========================================================== */

  const patientName = (id: string | null) => {
    if (!id) return "Unknown";

    const patient = patients.find((p) => p.id === id);

    return fullName(patient);
  };

  const lastVisitDate = (patientId: string) => {
    const visits = appointments
      .filter(
        (appointment) =>
          appointment.patientId === patientId &&
          appointment.status === "COMPLETED"
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    return visits[0]?.date || null;
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
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
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
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
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

        .info-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 14px;
          border-radius: 8px;
          background: #eef7fa;
          border: 1px solid #cce4eb;
          color: #17495a;
        }

        .info-box span {
          font-weight: normal;
        }

        .section-title {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 8px;
        }

        .section-title h3 {
          margin: 0;
        }

        .section-title span {
          color: var(--muted);
          font-size: 12px;
        }

        .visit-date {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 6px;
          background: #eef7fa;
          color: #17495a;
          font-size: 12px;
          font-weight: bold;
        }

        .dashboard-visit {
          border-left: 4px solid var(--p);
        }

        /* ====================================================
           SEARCHABLE PATIENT PICKER
        ==================================================== */

        .patient-picker {
          position: relative;
          width: 100%;
        }

        .patient-picker-control {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .patient-picker-control.open {
          z-index: 1001;
        }

        .patient-picker-input {
          width: 100%;
          padding: 10px 70px 10px 11px;
          min-height: 40px;
          border: 1px solid #cbd5da;
          border-radius: 7px;
          background: #fff;
          color: var(--text);
          outline: none;
        }

        .patient-picker-input:focus {
          border-color: var(--p);
          box-shadow: 0 0 0 3px #176b8718;
        }

        .patient-picker-control.open .patient-picker-input {
          border-color: var(--p);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
        }

        .patient-picker-clear {
          position: absolute;
          right: 30px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          padding: 0;
          margin: 0;
          border-radius: 50%;
          background: #e8eef1;
          color: #43545c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
        }

        .patient-picker-clear:hover {
          background: #d9e2e6;
        }

        .patient-picker-arrow {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #687780;
          font-size: 14px;
          transition: transform 0.15s ease;
        }

        .patient-picker-arrow.up {
          transform: translateY(-50%) rotate(180deg);
        }

        .patient-picker-menu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% - 1px);
          z-index: 1000;
          max-height: 360px;
          overflow-y: auto;
          background: #fff;
          border: 1px solid var(--p);
          border-top: 0;
          border-radius: 0 0 8px 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .patient-picker-summary {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 8px 11px;
          background: #f7fafb;
          border-bottom: 1px solid var(--line);
          color: var(--muted);
          font-size: 11px;
        }

        .patient-picker-option {
          width: 100%;
          display: block;
          text-align: left;
          margin: 0;
          padding: 10px 12px;
          border-radius: 0;
          border-bottom: 1px solid #edf1f3;
          background: #fff;
          color: var(--text);
        }

        .patient-picker-option:hover,
        .patient-picker-option.highlighted {
          background: #eef7fa;
        }

        .patient-picker-option.selected {
          background: #e6f4f8;
        }

        .patient-picker-option-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .patient-picker-option-main strong {
          font-size: 14px;
          color: #17313c;
        }

        .patient-picker-option-main span {
          flex-shrink: 0;
          font-size: 11px;
          font-weight: bold;
          color: var(--p);
          background: #eef7fa;
          padding: 3px 6px;
          border-radius: 5px;
        }

        .patient-picker-option-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 4px;
          color: var(--muted);
          font-size: 11px;
        }

        .patient-picker-empty {
          padding: 18px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--muted);
        }

        .patient-picker-empty strong {
          color: var(--text);
        }

        .patient-picker-more {
          padding: 9px 11px;
          background: #fff9e8;
          color: #795c00;
          border-top: 1px solid #f1e1a7;
          font-size: 11px;
          text-align: center;
        }

        .patient-picker-required {
          display: none;
        }

        @media (max-width: 700px) {
          .admin-header {
            position: static;
          }

          nav {
            top: 0;
          }

          .section-title {
            display: block;
          }

          .section-title span {
            display: block;
            margin-top: 3px;
          }

          .patient-picker-menu {
            max-height: 300px;
          }

          .patient-picker-option-main {
            align-items: flex-start;
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="admin-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 15,
          }}
        >
          <div>
            <h1>{clinic.name || "Jaswith Dental Care"}</h1>

            <small>
              Dr. J. Sailakshmi, MDS • Prosthodontist & Implantologist • Clinic
              Management
            </small>
          </div>

          <form
            //@ts-ignore
            action={logout}
          >
            <button type="submit" className="secondary">
              Logout
            </button>
          </form>
        </div>
      </header>

      {/* ==================================================
          NAV
      ================================================== */}

      <nav>
        {[
          "dashboard",
          "patients",
          "appointments",
          "billing",
          "prescriptions",
          "files",
          "reports",
          "backup",
          "settings",
        ].map((item) => (
          <button
            key={item}
            className={page === item ? "active" : ""}
            onClick={() => setPage(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <main>
        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {page === "dashboard" && (
          <>
            <div className="statgrid">
              <div className="stat">
                Patients
                <b>{patients.length}</b>
              </div>

              <div className="stat">
                Today's appointments
                <b>{todayAppointments}</b>
              </div>

              <div className="stat">
                Pending payments
                <b>{money(pendingPayments)}</b>
              </div>

              <div className="stat">
                This month's revenue
                <b>{money(monthlyRevenue)}</b>
              </div>
            </div>

            <div className="card">
              <h2>Quick actions</h2>

              <div className="actions">
                <button onClick={() => newPatient()}>+ New patient</button>

                <button onClick={() => newAppointment()}>
                  + Appointment
                </button>

                <button onClick={() => newBill()}>+ Bill / Payment</button>
              </div>
            </div>

            <div className="card">
              <div className="section-title">
                <h2>Upcoming visits</h2>

                <span>Scheduled patient visit dates</span>
              </div>

              {upcomingDashboardAppointments.map((appointment) => (
                <div className="card dashboard-visit" key={appointment.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span className="visit-date">
                        Visit Date: {formatDate(appointment.date)}
                      </span>

                      {appointment.time && (
                        <span className="muted" style={{ marginLeft: 8 }}>
                          {appointment.time}
                        </span>
                      )}
                    </div>

                    <span
                      className={`badge ${
                        appointment.status === "COMPLETED"
                          ? "ok"
                          : appointment.status === "CANCELLED"
                          ? "warn"
                          : ""
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div style={{ marginTop: 9 }}>
                    <b>{patientName(appointment.patientId)}</b>

                    {appointment.reason && <>{" • "}{appointment.reason}</>}
                  </div>

                  {appointment.treatment && (
                    <div className="muted">
                      Treatment: {appointment.treatment}
                    </div>
                  )}
                </div>
              ))}

              {upcomingDashboardAppointments.length === 0 && (
                <p className="muted">No upcoming visits.</p>
              )}
            </div>
          </>
        )}

        {/* ==================================================
            PATIENTS
        ================================================== */}

        {page === "patients" && (
          <>
            <div className="card">
              <div className="actions">
                <button onClick={() => newPatient()}>+ New patient</button>

                <input
                  placeholder="Search name / phone / patient ID"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient</th>
                    <th>Contact</th>
                    <th>Last visit</th>
                    <th>Clinical</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <b>{patient.patientNumber}</b>
                      </td>

                      <td>
                        <b>{fullName(patient)}</b>

                        <br />

                        <span className="muted">
                          {patient.gender || "—"}

                          {patient.age != null ? ` • ${patient.age} yrs` : ""}
                        </span>
                      </td>

                      <td>
                        {patient.phone}

                        {patient.email && (
                          <>
                            <br />

                            <span className="muted">{patient.email}</span>
                          </>
                        )}
                      </td>

                      <td>{formatDate(lastVisitDate(patient.id))}</td>

                      <td>
                        {patient.diagnosis ? (
                          <>
                            <b>{patient.diagnosis}</b>

                            {patient.followUpDate && (
                              <>
                                <br />

                                <span className="muted">
                                  Follow-up: {formatDate(patient.followUpDate)}
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <span className="muted">No clinical entry</span>
                        )}
                      </td>

                      <td>
                        <button onClick={() => newPatient(patient)}>
                          Edit
                        </button>

                        <button onClick={() => newAppointment()}>
                          Appointment
                        </button>

                        <button
                          className="danger"
                          onClick={async () => {
                            if (!confirm("Delete this patient?")) {
                              return;
                            }

                            const result = await deletePatient(patient.id);

                            if (!result.success) {
                              alert(
                                result.error || "Unable to delete patient"
                              );
                              return;
                            }

                            window.location.reload();
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted">
                        No patients
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================================================
            APPOINTMENTS
        ================================================== */}

        {page === "appointments" && (
          <>
            <div className="card">
              <div className="actions">
                <button onClick={() => newAppointment()}>
                  + New appointment
                </button>

                <select
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                >
                  <option value="all">All</option>

                  <option value="today">Today</option>

                  <option value="upcoming">Upcoming</option>

                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Visit date/time</th>
                    <th>Patient</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <span className="visit-date">
                          {formatDate(appointment.date)}
                        </span>

                        {appointment.time && (
                          <div className="muted">{appointment.time}</div>
                        )}
                      </td>

                      <td>{patientName(appointment.patientId)}</td>

                      <td>{appointment.reason}</td>

                      <td>
                        <span
                          className={`badge ${
                            appointment.status === "COMPLETED"
                              ? "ok"
                              : appointment.status === "CANCELLED"
                              ? "warn"
                              : ""
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>

                      <td>
                        <button onClick={() => newAppointment(appointment)}>
                          Edit
                        </button>

                        <button
                          className="danger"
                          onClick={async () => {
                            if (!confirm("Delete appointment?")) return;

                            const result = await deleteAppointment(
                              appointment.id
                            );

                            if (!result.success) {
                              alert(
                                result.error ||
                                  "Unable to delete appointment"
                              );
                              return;
                            }

                            window.location.reload();
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================================================
            BILLING
        ================================================== */}

        {page === "billing" && (
          <>
            <div className="card">
              <div className="actions">
                <button onClick={() => newBill()}>+ New bill</button>

                <input
                  placeholder="Search patient"
                  value={billSearch}
                  onChange={(e) => setBillSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bill #</th>
                    <th>Patient</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const paid = sumPayments(invoice.payments);

                    return (
                      <tr key={invoice.id}>
                        <td>{formatDate(invoice.invoiceDate)}</td>

                        <td>{invoice.invoiceNumber}</td>

                        <td>{patientName(invoice.patientId)}</td>

                        <td>
                          {invoice.items.map((item, index) => (
                            <div key={`${item.description}-${index}`}>
                              {item.description} — {money(item.amount)}
                            </div>
                          ))}
                        </td>

                        <td>{money(invoice.total)}</td>

                        <td>{money(paid)}</td>

                        <td>{money(Number(invoice.total) - paid)}</td>

                        <td>
                          <button onClick={() => newBill(invoice)}>
                            Edit
                          </button>

                          <button
                            onClick={async () => {
                              const amount = prompt("Payment amount");

                              if (!amount) return;

                              const result = await addPayment({
                                invoiceId: invoice.id,
                                amount,
                                method: "CASH",
                              });

                              if (!result.success) {
                                alert(
                                  result.error || "Unable to add payment"
                                );
                                return;
                              }

                              window.location.reload();
                            }}
                          >
                            Payment
                          </button>

                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/invoices/${invoice.id}/pdf`
                                );

                                if (!res.ok) {
                                  throw new Error("Failed to generate PDF");
                                }

                                const blob = await res.blob();

                                const url = window.URL.createObjectURL(blob);

                                const a = document.createElement("a");

                                a.href = url;

                                const disposition = res.headers.get(
                                  "Content-Disposition"
                                );

                                const filename =
                                  disposition?.match(
                                    /filename="?([^"]+)"?/
                                  )?.[1] ||
                                  `invoice-${invoice.invoiceNumber}.pdf`;

                                a.download = filename;

                                document.body.appendChild(a);

                                a.click();

                                a.remove();

                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error(
                                  "PDF download failed:",
                                  error
                                );

                                alert("Failed to download invoice PDF");
                              }
                            }}
                          >
                            Download PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="muted">
                        No bills found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================================================
            PRESCRIPTIONS
        ================================================== */}

        {page === "prescriptions" && (
          <>
            <div className="card">
              <div className="actions">
                <button onClick={() => newPrescription()}>
                  + Prescription
                </button>

                <input
                  placeholder="Search patient"
                  value={rxSearch}
                  onChange={(e) => setRxSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
              </div>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Medicines / instructions</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRx.map((rx) => (
                    <tr key={rx.id}>
                      <td>{formatDate(rx.prescriptionDate)}</td>

                      <td>{patientName(rx.patientId)}</td>

                      <td>
                        {rx.items.map((item, index) => (
                          <div key={`${item.medicine}-${index}`}>
                            {item.medicine}

                            <br />

                            <span className="muted">{item.instructions}</span>
                          </div>
                        ))}
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            alert("Prescription editing can be added next.")
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRx.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        No prescriptions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================================================
            FILES
        ================================================== */}

        {page === "files" && (
          <>
            <div className="card">
              <h2>Patient documents</h2>

              <p className="muted">
                Attach X-rays, photographs, scans, reports and other patient
                documents. Maximum 5 MB per image.
              </p>

              <form
                action={async (formData) => {
                  try {
                    const file = formData.get("file");

                    if (!(file instanceof File) || file.size === 0) {
                      throw new Error("Please select an image.");
                    }

                    setUploadingFile(true);

                    const url = await uploadImage(file, "dental/attachments");

                    const patientId = String(formData.get("patientId") || "");

                    if (!patientId) {
                      throw new Error("Please select a patient.");
                    }

                    const result = await saveAttachment({
                      patientId,
                      name: file.name,
                      mimeType: file.type,
                      size: file.size,
                      url,
                    });

                    if (!result.success) {
                      throw new Error(result.error);
                    }

                    window.location.reload();
                  } catch (error) {
                    alert(
                      error instanceof Error
                        ? error.message
                        : "Unable to upload file"
                    );
                  } finally {
                    setUploadingFile(false);
                  }
                }}
              >
                <div className="actions">
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <label>Patient *</label>

                    {patientPicker("", true)}
                  </div>

                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple={false}
                    required
                  />

                  <button type="submit" disabled={uploadingFile}>
                    {uploadingFile ? "Uploading..." : "Attach"}
                  </button>
                </div>

                {uploadingFile && (
                  <p className="muted">Uploading image to secure storage...</p>
                )}
              </form>
            </div>

            <div className="card scroll">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>File</th>
                    <th>Added</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {attachments.map((file) => (
                    <tr key={file.id}>
                      <td>{patientName(file.patientId)}</td>

                      <td>
                        <div>{file.name}</div>

                        <span className="muted">
                          {file.mimeType} •{" "}
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </td>

                      <td>{formatDate(file.createdAt)}</td>

                      <td>
                        {file.url && (
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <button type="button">Open</button>
                          </a>
                        )}

                        <button
                          className="danger"
                          onClick={async () => {
                            if (!confirm("Delete file?")) return;

                            const result = await deleteAttachment(file.id);

                            if (!result.success) {
                              alert(result.error || "Unable to delete file");
                              return;
                            }

                            window.location.reload();
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {attachments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="muted">
                        No files uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ==================================================
            REPORTS
        ================================================== */}

        {page === "reports" && (
          <>
            <div className="card">
              <h2>Clinic reports</h2>

              <div className="statgrid">
                <div className="stat">
                  Total patients
                  <b>{patients.length}</b>
                </div>

                <div className="stat">
                  Completed visits
                  <b>
                    {appointments.filter((a) => a.status === "COMPLETED").length}
                  </b>
                </div>

                <div className="stat">
                  Total billed
                  <b>
                    {money(
                      invoices.reduce(
                        (sum, invoice) => sum + Number(invoice.total),
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
                        (sum, invoice) => sum + sumPayments(invoice.payments),
                        0
                      )
                    )}
                  </b>
                </div>

                <div className="stat">
                  Outstanding
                  <b>{money(pendingPayments)}</b>
                </div>
              </div>
            </div>

            <div className="card">
              <h3>Patient treatment plans</h3>

              {(() => {
                const treatmentMap: Record<string, number> = {};

                patients.forEach((patient) => {
                  const plan = patient.treatmentPlan?.trim();

                  if (!plan) return;

                  treatmentMap[plan] = (treatmentMap[plan] || 0) + 1;
                });

                const entries = Object.entries(treatmentMap).sort(
                  (a, b) => b[1] - a[1]
                );

                if (entries.length === 0) {
                  return (
                    <p className="muted">No treatment plans recorded.</p>
                  );
                }

                return entries.map(([name, count]) => (
                  <div className="card" key={name}>
                    <b>{name}</b> — {count}
                  </div>
                ));
              })()}
            </div>
          </>
        )}

        {/* ==================================================
            BACKUP
        ================================================== */}

        {page === "backup" && (
          <>
            <div className="card">
              <h2>Backup & restore</h2>

              <p>
                Export the clinic data from the database. This version exports
                the currently loaded records as JSON.
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
                    invoices,
                    prescriptions,
                    attachments,
                  };

                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });

                  const url = URL.createObjectURL(blob);

                  const a = document.createElement("a");

                  a.href = url;

                  a.download = `jaswith-dental-care-backup-${today()}.json`;

                  a.click();

                  URL.revokeObjectURL(url);
                }}
              >
                Download backup
              </button>
            </div>

            <div className="card">
              <h3>Privacy notice</h3>

              <p className="muted">
                Patient information is sensitive clinical data. Use
                authenticated accounts, encrypted storage, backups, role-based
                access, audit logging and secure hosting before production
                deployment.
              </p>
            </div>
          </>
        )}

        {/* ==================================================
            SETTINGS
        ================================================== */}

        {page === "settings" && (
          <Setting
            clinic={clinic}
            doctors={doctors}
            testimonials={testimonials}
            treatments={treatments}
          />
        )}
      </main>

      {/* ==================================================
          MODAL
      ================================================== */}

      {modal && (
        <div
          className="modal"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modalbox">
            <div
              className="actions"
              style={{ justifyContent: "space-between" }}
            >
              <h2>{modal.title}</h2>

              <button
                type="button"
                className="secondary"
                onClick={closeModal}
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