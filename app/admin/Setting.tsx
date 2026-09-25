"use client";

import { useState } from "react";

import {
  addDoctor,
  addTestimonial,
  addTreatment,
  deleteDoctor,
  deleteTestimonial,
  deleteTreatment,
  updateClinic,
  updateDoctor,
  updateTestimonial,
  updateTreatment,
} from "./actions";

/* ============================================================
   TYPES
============================================================ */

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

type Props = {
  clinic: Clinic;
  doctors: Doctor[];
  treatments: Treatment[];
  testimonials: Testimonial[];
};

/* ============================================================
   HELPERS
============================================================ */

const uploadImage = async (
  file: File,
  folder: string
): Promise<string> => {
  if (!file || file.size === 0) {
    throw new Error("Please select an image.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid image type. Only JPG, PNG and WebP are allowed."
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

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
      data.error || "Unable to upload image."
    );
  }

  if (!data.url) {
    throw new Error(
      "Upload succeeded but no image URL was returned."
    );
  }

  return data.url;
};

const reloadAdmin = () => {
  window.location.reload();
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Setting({
  clinic,
  doctors,
  treatments,
  testimonials,
}: Props) {
  const [tab, setTab] = useState<
    "clinic" | "doctors" | "treatments" | "testimonials"
  >("clinic");

  const [doctorModal, setDoctorModal] =
    useState<Doctor | null | "new">(null);

  const [treatmentModal, setTreatmentModal] =
    useState<Treatment | null | "new">(null);

  const [testimonialModal, setTestimonialModal] =
    useState<Testimonial | null | "new">(null);

  const [saving, setSaving] = useState(false);

  /* ==========================================================
     CLINIC
  ========================================================== */

  const handleClinicSubmit = async (
    formData: FormData
  ) => {
    try {
      setSaving(true);

      await updateClinic(formData);

      alert("Clinic details updated successfully.");

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update clinic."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DOCTOR
  ========================================================== */

  const handleDoctorSubmit = async (
    formData: FormData
  ) => {
    try {
      setSaving(true);

      const file = formData.get("imageFile");

      if (
        file instanceof File &&
        file.size > 0
      ) {
        const imageUrl = await uploadImage(
          file,
          "dental/doctors"
        );

        formData.set(
          "image",
          imageUrl
        );
      } else {
        /*
         * When editing, preserve the
         * existing image.
         */
        const existingImage =
          formData.get("existingImage");

        formData.set(
          "image",
          typeof existingImage === "string"
            ? existingImage
            : ""
        );
      }

      formData.delete("imageFile");
      formData.delete("existingImage");

      const id = formData.get("id");

      if (typeof id === "string" && id) {
        await updateDoctor(formData);
      } else {
        await addDoctor(formData);
      }

      setDoctorModal(null);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save doctor."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = async (
    doctor: Doctor
  ) => {
    if (
      !confirm(
        `Delete doctor "${doctor.name}"?`
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();

      formData.set("id", doctor.id);

      await deleteDoctor(formData);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete doctor."
      );
    }
  };

  /* ==========================================================
     TREATMENT
  ========================================================== */

  const handleTreatmentSubmit = async (
    formData: FormData
  ) => {
    try {
      setSaving(true);

      const file = formData.get("imageFile");

      if (
        file instanceof File &&
        file.size > 0
      ) {
        const imageUrl = await uploadImage(
          file,
          "dental/treatments"
        );

        formData.set(
          "image",
          imageUrl
        );
      } else {
        const existingImage =
          formData.get("existingImage");

        formData.set(
          "image",
          typeof existingImage === "string"
            ? existingImage
            : ""
        );
      }

      formData.delete("imageFile");
      formData.delete("existingImage");

      const id = formData.get("id");

      if (typeof id === "string" && id) {
        await updateTreatment(formData);
      } else {
        await addTreatment(formData);
      }

      setTreatmentModal(null);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save treatment."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTreatment = async (
    treatment: Treatment
  ) => {
    if (
      !confirm(
        `Delete treatment "${treatment.name}"?`
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();

      formData.set(
        "id",
        treatment.id
      );

      await deleteTreatment(formData);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete treatment."
      );
    }
  };

  /* ==========================================================
     TESTIMONIAL
  ========================================================== */

  const handleTestimonialSubmit = async (
    formData: FormData
  ) => {
    try {
      setSaving(true);

      const id = formData.get("id");

      if (typeof id === "string" && id) {
        await updateTestimonial(formData);
      } else {
        await addTestimonial(formData);
      }

      setTestimonialModal(null);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save testimonial."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTestimonial = async (
    testimonial: Testimonial
  ) => {
    if (
      !confirm(
        `Delete testimonial from "${testimonial.name}"?`
      )
    ) {
      return;
    }

    try {
      const formData = new FormData();

      formData.set(
        "id",
        testimonial.id
      );

      await deleteTestimonial(formData);

      reloadAdmin();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete testimonial."
      );
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="settings-page">
      <style jsx>{`
        .settings-page {
          width: 100%;
        }

        .settings-tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          padding-bottom: 15px;
          margin-bottom: 2px;
        }

        .settings-tab {
          border: 1px solid #dbe2e6;
          background: #fff;
          color: #34454d;
          border-radius: 8px;
          padding: 10px 15px;
          white-space: nowrap;
          cursor: pointer;
          margin: 0;
        }

        .settings-tab.active {
          background: #176b87;
          border-color: #176b87;
          color: #fff;
        }

        .settings-card {
          background: #fff;
          border: 1px solid #dbe2e6;
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px #00000009;
        }

        .settings-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .settings-header h2 {
          margin: 0 0 4px;
          font-size: 20px;
        }

        .settings-header p {
          margin: 0;
          color: #687780;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(220px, 1fr)
          );
          gap: 14px;
        }

        .field {
          margin-bottom: 14px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #3d4b52;
          margin-bottom: 6px;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #cbd5da;
          border-radius: 7px;
          background: #fff;
          color: #17202a;
          outline: none;
        }

        .field textarea {
          min-height: 100px;
          resize: vertical;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #176b87;
          box-shadow: 0 0 0 2px #176b8718;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .primary {
          background: #176b87;
          color: #fff;
        }

        .secondary {
          background: #687780;
          color: #fff;
        }

        .danger {
          background: #b42318;
          color: #fff;
        }

        .button {
          border: 0;
          border-radius: 7px;
          padding: 9px 13px;
          cursor: pointer;
          margin: 0;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty {
          padding: 35px 15px;
          text-align: center;
          color: #687780;
          border: 1px dashed #cbd5da;
          border-radius: 9px;
        }

        .doctor-grid,
        .treatment-grid,
        .testimonial-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fill,
            minmax(280px, 1fr)
          );
          gap: 14px;
        }

        .item-card {
          border: 1px solid #dbe2e6;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
        }

        .item-image {
          width: 100%;
          height: 190px;
          object-fit: cover;
          display: block;
          background: #eef3f5;
        }

        .placeholder-image {
          width: 100%;
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef3f5;
          color: #687780;
          font-size: 13px;
        }

        .item-content {
          padding: 14px;
        }

        .item-content h3 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .item-content p {
          margin: 5px 0;
          color: #687780;
          line-height: 1.5;
        }

        .price {
          font-weight: 700;
          color: #176b87 !important;
          font-size: 15px;
        }

        .rating {
          margin: 7px 0;
          font-weight: 700;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: #0007;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
        }

        .modal-box {
          width: 100%;
          max-width: 760px;
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          border-radius: 12px;
          padding: 20px;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 18px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .image-preview {
          width: 110px;
          height: 110px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #dbe2e6;
          margin-top: 8px;
        }

        @media (max-width: 600px) {
          .settings-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .doctor-grid,
          .treatment-grid,
          .testimonial-grid {
            grid-template-columns: 1fr;
          }

          .modal-box {
            max-height: 95vh;
          }
        }
      `}</style>

      {/* ======================================================
          SETTINGS SUB NAV
      ====================================================== */}

      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab ${
            tab === "clinic"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setTab("clinic")
          }
        >
          Clinic
        </button>

        <button
          type="button"
          className={`settings-tab ${
            tab === "doctors"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setTab("doctors")
          }
        >
          Doctors
        </button>

        <button
          type="button"
          className={`settings-tab ${
            tab === "treatments"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setTab("treatments")
          }
        >
          Treatments
        </button>

        <button
          type="button"
          className={`settings-tab ${
            tab === "testimonials"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setTab("testimonials")
          }
        >
          Testimonials
        </button>
      </div>

      {/* ======================================================
          CLINIC
      ====================================================== */}

      {tab === "clinic" && (
        <div className="settings-card">
          <div className="settings-header">
            <div>
              <h2>Clinic settings</h2>

              <p>
                Manage the clinic information
                displayed across the website.
              </p>
            </div>
          </div>

          <form
            action={handleClinicSubmit}
          >
            <div className="form-grid">
              <div className="field">
                <label>
                  Clinic name
                </label>

                <input
                  name="name"
                  defaultValue={
                    clinic.name
                  }
                  required
                />
              </div>

              <div className="field">
                <label>
                  Tagline
                </label>

                <input
                  name="tagline"
                  defaultValue={
                    clinic.tagline ||
                    ""
                  }
                  placeholder="Your clinic tagline"
                />
              </div>

              <div className="field">
                <label>
                  Phone
                </label>

                <input
                  name="phone"
                  defaultValue={
                    clinic.phone ||
                    ""
                  }
                />
              </div>

              <div className="field">
                <label>
                  WhatsApp
                </label>

                <input
                  name="whatsapp"
                  defaultValue={
                    clinic.whatsapp ||
                    ""
                  }
                />
              </div>

              <div className="field">
                <label>
                  Email
                </label>

                <input
                  name="email"
                  type="email"
                  defaultValue={
                    clinic.email ||
                    ""
                  }
                />
              </div>

              <div className="field">
                <label>
                  Google Maps URL
                </label>

                <input
                  name="mapsUrl"
                  defaultValue={
                    clinic.mapsUrl ||
                    ""
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="field full">
                <label>
                  Address
                </label>

                <textarea
                  name="address"
                  defaultValue={
                    clinic.address ||
                    ""
                  }
                />
              </div>

              <div className="field full">
                <label>
                  Opening hours
                </label>

                <textarea
                  name="openingHours"
                  defaultValue={
                    clinic.openingHours ||
                    ""
                  }
                  placeholder={`Monday - Saturday: 9:00 AM - 8:00 PM
Sunday: Closed`}
                />
              </div>
            </div>

            <div className="actions">
              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save clinic"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================
          DOCTORS
      ====================================================== */}

      {tab === "doctors" && (
        <>
          <div className="settings-card">
            <div className="settings-header">
              <div>
                <h2>
                  Doctor management
                </h2>

                <p>
                  Add, edit or remove
                  doctors from the clinic.
                </p>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setDoctorModal(
                    "new"
                  )
                }
              >
                + Add doctor
              </button>
            </div>

            {doctors.length === 0 ? (
              <div className="empty">
                No doctors added yet.
              </div>
            ) : (
              <div className="doctor-grid">
                {doctors.map(
                  (doctor) => (
                    <div
                      className="item-card"
                      key={doctor.id}
                    >
                      {doctor.image ? (
                        <img
                          src={
                            doctor.image
                          }
                          alt={
                            doctor.name
                          }
                          className="item-image"
                        />
                      ) : (
                        <div className="placeholder-image">
                          No image
                        </div>
                      )}

                      <div className="item-content">
                        <h3>
                          {doctor.name}
                        </h3>

                        {doctor.qualification && (
                          <p>
                            {
                              doctor.qualification
                            }
                          </p>
                        )}

                        {doctor.specialization && (
                          <p>
                            {
                              doctor.specialization
                            }
                          </p>
                        )}

                        {doctor.bio && (
                          <p>
                            {doctor.bio}
                          </p>
                        )}

                        <div className="actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() =>
                              setDoctorModal(
                                doctor
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              handleDeleteDoctor(
                                doctor
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================
          TREATMENTS
      ====================================================== */}

      {tab === "treatments" && (
        <>
          <div className="settings-card">
            <div className="settings-header">
              <div>
                <h2>
                  Treatment management
                </h2>

                <p>
                  Manage the treatments and
                  services offered by the clinic.
                </p>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setTreatmentModal(
                    "new"
                  )
                }
              >
                + Add treatment
              </button>
            </div>

            {treatments.length === 0 ? (
              <div className="empty">
                No treatments added yet.
              </div>
            ) : (
              <div className="treatment-grid">
                {treatments.map(
                  (treatment) => (
                    <div
                      className="item-card"
                      key={
                        treatment.id
                      }
                    >
                      {treatment.image ? (
                        <img
                          src={
                            treatment.image
                          }
                          alt={
                            treatment.name
                          }
                          className="item-image"
                        />
                      ) : (
                        <div className="placeholder-image">
                          No image
                        </div>
                      )}

                      <div className="item-content">
                        <h3>
                          {
                            treatment.name
                          }
                        </h3>

                        {treatment.price !==
                          null && (
                          <p className="price">
                            ₹
                            {Number(
                              treatment.price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        )}

                        {treatment.description && (
                          <p>
                            {
                              treatment.description
                            }
                          </p>
                        )}

                        <div className="actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() =>
                              setTreatmentModal(
                                treatment
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              handleDeleteTreatment(
                                treatment
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================
          TESTIMONIALS
      ====================================================== */}

      {tab === "testimonials" && (
        <>
          <div className="settings-card">
            <div className="settings-header">
              <div>
                <h2>
                  Testimonial management
                </h2>

                <p>
                  Manage patient testimonials
                  displayed on the website.
                </p>
              </div>

              <button
                type="button"
                className="button primary"
                onClick={() =>
                  setTestimonialModal(
                    "new"
                  )
                }
              >
                + Add testimonial
              </button>
            </div>

            {testimonials.length ===
            0 ? (
              <div className="empty">
                No testimonials added yet.
              </div>
            ) : (
              <div className="testimonial-grid">
                {testimonials.map(
                  (testimonial) => (
                    <div
                      className="item-card"
                      key={
                        testimonial.id
                      }
                    >
                      <div className="item-content">
                        <h3>
                          {
                            testimonial.name
                          }
                        </h3>

                        {testimonial.rating !==
                          null && (
                          <div className="rating">
                            {"★".repeat(
                              testimonial.rating
                            )}
                            {"☆".repeat(
                              5 -
                                testimonial.rating
                            )}
                            {" "}
                            (
                            {
                              testimonial.rating
                            }
                            /5)
                          </div>
                        )}

                        <p>
                          "
                          {
                            testimonial.review
                          }
                          "
                        </p>

                        <div className="actions">
                          <button
                            type="button"
                            className="button primary"
                            onClick={() =>
                              setTestimonialModal(
                                testimonial
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="button danger"
                            onClick={() =>
                              handleDeleteTestimonial(
                                testimonial
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ======================================================
          DOCTOR MODAL
      ====================================================== */}

      {doctorModal && (
        <div
          className="modal"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDoctorModal(null);
            }
          }}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2>
                {doctorModal ===
                "new"
                  ? "Add doctor"
                  : "Edit doctor"}
              </h2>

              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setDoctorModal(null)
                }
              >
                Close
              </button>
            </div>

            <form
              action={
                handleDoctorSubmit
              }
            >
              {doctorModal !==
                "new" && (
                <input
                  type="hidden"
                  name="id"
                  value={
                    doctorModal.id
                  }
                />
              )}

              <input
                type="hidden"
                name="existingImage"
                value={
                  doctorModal !==
                  "new"
                    ? doctorModal.image ||
                      ""
                    : ""
                }
              />

              <div className="form-grid">
                <div className="field">
                  <label>
                    Doctor name *
                  </label>

                  <input
                    name="name"
                    defaultValue={
                      doctorModal !==
                      "new"
                        ? doctorModal.name
                        : ""
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Qualification
                  </label>

                  <input
                    name="qualification"
                    defaultValue={
                      doctorModal !==
                      "new"
                        ? doctorModal.qualification ||
                          ""
                        : ""
                    }
                    placeholder="BDS, MDS..."
                  />
                </div>

                <div className="field">
                  <label>
                    Specialization
                  </label>

                  <input
                    name="specialization"
                    defaultValue={
                      doctorModal !==
                      "new"
                        ? doctorModal.specialization ||
                          ""
                        : ""
                    }
                    placeholder="Prosthodontist & Implantologist"
                  />
                </div>

                <div className="field full">
                  <label>
                    Bio
                  </label>

                  <textarea
                    name="bio"
                    defaultValue={
                      doctorModal !==
                      "new"
                        ? doctorModal.bio ||
                          ""
                        : ""
                    }
                  />
                </div>

                <div className="field full">
                  <label>
                    Doctor image
                  </label>

                  <input
                    name="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />

                  {doctorModal !==
                    "new" &&
                    doctorModal.image && (
                      <img
                        src={
                          doctorModal.image
                        }
                        alt={
                          doctorModal.name
                        }
                        className="image-preview"
                      />
                    )}

                  <p
                    style={{
                      color:
                        "#687780",
                      fontSize:
                        12,
                      margin:
                        "6px 0 0",
                    }}
                  >
                    JPG, PNG or WebP.
                    Maximum 5 MB.
                  </p>
                </div>
              </div>

              <div className="actions">
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save doctor"}
                </button>

                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setDoctorModal(
                      null
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          TREATMENT MODAL
      ====================================================== */}

      {treatmentModal && (
        <div
          className="modal"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setTreatmentModal(null);
            }
          }}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2>
                {treatmentModal ===
                "new"
                  ? "Add treatment"
                  : "Edit treatment"}
              </h2>

              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setTreatmentModal(
                    null
                  )
                }
              >
                Close
              </button>
            </div>

            <form
              action={
                handleTreatmentSubmit
              }
            >
              {treatmentModal !==
                "new" && (
                <input
                  type="hidden"
                  name="id"
                  value={
                    treatmentModal.id
                  }
                />
              )}

              <input
                type="hidden"
                name="existingImage"
                value={
                  treatmentModal !==
                  "new"
                    ? treatmentModal.image ||
                      ""
                    : ""
                }
              />

              <div className="form-grid">
                <div className="field">
                  <label>
                    Treatment name *
                  </label>

                  <input
                    name="name"
                    defaultValue={
                      treatmentModal !==
                      "new"
                        ? treatmentModal.name
                        : ""
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Price
                  </label>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      treatmentModal !==
                      "new"
                        ? treatmentModal.price ??
                          ""
                        : ""
                    }
                  />
                </div>

                <div className="field full">
                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    defaultValue={
                      treatmentModal !==
                      "new"
                        ? treatmentModal.description ||
                          ""
                        : ""
                    }
                  />
                </div>

                <div className="field full">
                  <label>
                    Treatment image
                  </label>

                  <input
                    name="imageFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />

                  {treatmentModal !==
                    "new" &&
                    treatmentModal.image && (
                      <img
                        src={
                          treatmentModal.image
                        }
                        alt={
                          treatmentModal.name
                        }
                        className="image-preview"
                      />
                    )}

                  <p
                    style={{
                      color:
                        "#687780",
                      fontSize:
                        12,
                      margin:
                        "6px 0 0",
                    }}
                  >
                    JPG, PNG or WebP.
                    Maximum 5 MB.
                  </p>
                </div>
              </div>

              <div className="actions">
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save treatment"}
                </button>

                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setTreatmentModal(
                      null
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          TESTIMONIAL MODAL
      ====================================================== */}

      {testimonialModal && (
        <div
          className="modal"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setTestimonialModal(
                null
              );
            }
          }}
        >
          <div className="modal-box">
            <div className="modal-header">
              <h2>
                {testimonialModal ===
                "new"
                  ? "Add testimonial"
                  : "Edit testimonial"}
              </h2>

              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  setTestimonialModal(
                    null
                  )
                }
              >
                Close
              </button>
            </div>

            <form
              action={
                handleTestimonialSubmit
              }
            >
              {testimonialModal !==
                "new" && (
                <input
                  type="hidden"
                  name="id"
                  value={
                    testimonialModal.id
                  }
                />
              )}

              <div className="form-grid">
                <div className="field">
                  <label>
                    Patient name *
                  </label>

                  <input
                    name="name"
                    defaultValue={
                      testimonialModal !==
                      "new"
                        ? testimonialModal.name
                        : ""
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Rating
                  </label>

                  <select
                    name="rating"
                    defaultValue={
                      testimonialModal !==
                      "new" &&
                      testimonialModal.rating
                        ? String(
                            testimonialModal.rating
                          )
                        : ""
                    }
                  >
                    <option value="">
                      No rating
                    </option>

                    <option value="5">
                      5 / 5
                    </option>

                    <option value="4">
                      4 / 5
                    </option>

                    <option value="3">
                      3 / 5
                    </option>

                    <option value="2">
                      2 / 5
                    </option>

                    <option value="1">
                      1 / 5
                    </option>
                  </select>
                </div>

                <div className="field full">
                  <label>
                    Review *
                  </label>

                  <textarea
                    name="review"
                    defaultValue={
                      testimonialModal !==
                      "new"
                        ? testimonialModal.review
                        : ""
                    }
                    required
                  />
                </div>
              </div>

              <div className="actions">
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save testimonial"}
                </button>

                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setTestimonialModal(
                      null
                    )
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}