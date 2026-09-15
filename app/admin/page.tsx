// import Link from "next/link";
// import prisma from "@/prisma";
// export const dynamic = "force-dynamic";
// import { getClinic } from "@/src/lib/clinic";
// import { ImageUploadField } from "@/src/components/admin/ImageUploadField";
// import {
//   updateClinic,
//   addDoctor, deleteDoctor,
//   addTreatment, deleteTreatment,
//   addTestimonial, deleteTestimonial,
//   updateAppointmentStatus, deleteAppointment,
//   logout,
// } from "./actions";

// const TABS = [
//   { key: "clinic", label: "Clinic Info" },
//   { key: "doctors", label: "Doctors" },
//   { key: "treatments", label: "Treatments" },
//   { key: "testimonials", label: "Testimonials" },
//   { key: "appointments", label: "Appointments" },
// ] as const;

// type TabKey = (typeof TABS)[number]["key"];

// export default async function AdminPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ tab?: string }>;
// }) {
//   const clinic = await getClinic();
//   const { tab } = await searchParams;
//   const activeTab: TabKey = (TABS.find((t) => t.key === tab)?.key ?? "clinic");

//   const [doctors, treatments, testimonials, appointments] = await Promise.all([
//     prisma.doctor.findMany({ where: { clinicId: clinic.id } }),
//     prisma.treatment.findMany({ where: { clinicId: clinic.id } }),
//     prisma.testimonial.findMany({ where: { clinicId: clinic.id } }),
//     prisma.appointment.findMany({
//       where: { clinicId: clinic.id },
//       orderBy: { date: "asc" },
//     }),
//   ]);

//   return (
//     <div className="flex min-h-screen">
//       {/* ---------- SIDEBAR ---------- */}
//       <aside className="w-56 shrink-0 border-r bg-gray-50 p-4 flex flex-col justify-between">
//         <div>
//           <h1 className="mb-6 px-2 text-lg font-bold">{clinic.name ?? "Admin"}</h1>
//           <nav className="flex flex-col gap-1">
//             {TABS.map((t) => (
//               <Link
//                 key={t.key}
//                 href={`/admin?tab=${t.key}`}
//                 className={`rounded-lg px-3 py-2 text-sm font-medium ${
//                   activeTab === t.key
//                     ? "bg-black text-white"
//                     : "text-gray-600 hover:bg-gray-200"
//                 }`}
//               >
//                 {t.label}
//               </Link>
//             ))}
//           </nav>
//         </div>

//         <form action={logout}>
//           <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-200">
//             Logout
//           </button>
//         </form>
//       </aside>

//       {/* ---------- MAIN CONTENT ---------- */}
//       <main className="flex-1 p-8 max-w-3xl">
//         {/* ---------- CLINIC INFO ---------- */}
//         {activeTab === "clinic" && (
//           <section>
//             <h2 className="mb-4 text-xl font-semibold">Clinic Information</h2>
//             <form action={updateClinic} className="grid grid-cols-2 gap-3">
//               <input name="name" defaultValue={clinic.name ?? ""} placeholder="Name" className="border p-2 rounded" />
//               <input name="tagline" defaultValue={clinic.tagline ?? ""} placeholder="Tagline" className="border p-2 rounded" />
//               <input name="phone" defaultValue={clinic.phone ?? ""} placeholder="Phone" className="border p-2 rounded" />
//               <input name="whatsapp" defaultValue={clinic.whatsapp ?? ""} placeholder="WhatsApp" className="border p-2 rounded" />
//               <input name="email" defaultValue={clinic.email ?? ""} placeholder="Email" className="border p-2 rounded" />
//               <input name="mapsUrl" defaultValue={clinic.mapsUrl ?? ""} placeholder="Google Maps URL" className="border p-2 rounded" />
//               <input name="address" defaultValue={clinic.address ?? ""} placeholder="Address" className="col-span-2 border p-2 rounded" />
//               <input name="openingHours" defaultValue={clinic.openingHours ?? ""} placeholder="Opening Hours" className="col-span-2 border p-2 rounded" />
//               <button className="col-span-2 rounded bg-black text-white py-2">Save Clinic Info</button>
//             </form>
//           </section>
//         )}

//         {/* ---------- DOCTORS ---------- */}
//         {activeTab === "doctors" && (
//           <section>
//             <h2 className="mb-4 text-xl font-semibold">Doctors</h2>
//             <form action={addDoctor} className="grid grid-cols-2 gap-3 mb-6">
//               <input name="name" placeholder="Name" required className="border p-2 rounded" />
//               <input name="qualification" placeholder="Qualification" className="border p-2 rounded" />
//               <input name="specialization" placeholder="Specialization" className="border p-2 rounded" />
//               <div className="col-span-2">
//                 <ImageUploadField name="image" folder="doctors" />
//               </div>
//               <textarea name="bio" placeholder="Bio" className="col-span-2 border p-2 rounded" />
//               <button className="col-span-2 rounded bg-black text-white py-2">Add Doctor</button>
//             </form>
//             <ul className="space-y-2">
//               {doctors.map((d) => (
//                 <li key={d.id} className="flex justify-between items-center border p-2 rounded">
//                   <div className="flex items-center gap-3">
//                     {d.image && (
//                       // eslint-disable-next-line @next/next/no-img-element
//                       <img src={d.image} alt={d.name} className="h-10 w-10 rounded-full object-cover" />
//                     )}
//                     <span>{d.name} — {d.specialization}</span>
//                   </div>
//                   <form action={deleteDoctor}>
//                     <input type="hidden" name="id" value={d.id} />
//                     <button className="text-red-600 text-sm">Delete</button>
//                   </form>
//                 </li>
//               ))}
//               {doctors.length === 0 && (
//                 <li className="text-sm text-gray-400">No doctors added yet.</li>
//               )}
//             </ul>
//           </section>
//         )}

//         {/* ---------- TREATMENTS ---------- */}
//         {activeTab === "treatments" && (
//           <section>
//             <h2 className="mb-4 text-xl font-semibold">Treatments</h2>
//             <form action={addTreatment} className="grid grid-cols-2 gap-3 mb-6">
//               <input name="name" placeholder="Name" required className="border p-2 rounded" />
//               <div className="col-span-2">
//                 <ImageUploadField name="image" folder="treatments" />
//               </div>
//               <textarea name="description" placeholder="Description" className="col-span-2 border p-2 rounded" />
//               <button className="col-span-2 rounded bg-black text-white py-2">Add Treatment</button>
//             </form>
//             <ul className="space-y-2">
//               {treatments.map((t) => (
//                 <li key={t.id} className="flex justify-between items-center border p-2 rounded">
//                   <div className="flex items-center gap-3">
//                     {t.image && (
//                       // eslint-disable-next-line @next/next/no-img-element
//                       <img src={t.image} alt={t.name} className="h-10 w-10 rounded object-cover" />
//                     )}
//                     <span>{t.name}</span>
//                   </div>
//                   <form action={deleteTreatment}>
//                     <input type="hidden" name="id" value={t.id} />
//                     <button className="text-red-600 text-sm">Delete</button>
//                   </form>
//                 </li>
//               ))}
//               {treatments.length === 0 && (
//                 <li className="text-sm text-gray-400">No treatments added yet.</li>
//               )}
//             </ul>
//           </section>
//         )}

//         {/* ---------- TESTIMONIALS ---------- */}
//         {activeTab === "testimonials" && (
//           <section>
//             <h2 className="mb-4 text-xl font-semibold">Testimonials</h2>
//             <form action={addTestimonial} className="grid grid-cols-2 gap-3 mb-6">
//               <input name="name" placeholder="Patient name" required className="border p-2 rounded" />
//               <input name="rating" type="number" min="1" max="5" placeholder="Rating (1-5)" className="border p-2 rounded" />
//               <textarea name="review" placeholder="Review" required className="col-span-2 border p-2 rounded" />
//               <button className="col-span-2 rounded bg-black text-white py-2">Add Testimonial</button>
//             </form>
//             <ul className="space-y-2">
//               {testimonials.map((t) => (
//                 <li key={t.id} className="flex justify-between items-center border p-2 rounded">
//                   <span>{t.name} — {t.rating ?? "-"}★: {t.review.slice(0, 40)}...</span>
//                   <form action={deleteTestimonial}>
//                     <input type="hidden" name="id" value={t.id} />
//                     <button className="text-red-600 text-sm">Delete</button>
//                   </form>
//                 </li>
//               ))}
//               {testimonials.length === 0 && (
//                 <li className="text-sm text-gray-400">No testimonials added yet.</li>
//               )}
//             </ul>
//           </section>
//         )}

//         {/* ---------- APPOINTMENTS ---------- */}
//         {activeTab === "appointments" && (
//           <section>
//             <h2 className="mb-4 text-xl font-semibold">Appointments</h2>
//             <table className="w-full border-collapse text-sm">
//               <thead>
//                 <tr className="border-b text-left">
//                   <th className="p-2">Patient</th>
//                   <th className="p-2">Phone</th>
//                   <th className="p-2">Date</th>
//                   <th className="p-2">Treatment</th>
//                   <th className="p-2">Status</th>
//                   <th className="p-2"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {appointments.map((a) => (
//                   <tr key={a.id} className="border-b">
//                     <td className="p-2">{a.patientName}</td>
//                     <td className="p-2">{a.phone}</td>
//                     <td className="p-2">{a.date.toLocaleDateString()} {a.time ?? ""}</td>
//                     <td className="p-2">{a.treatment ?? "-"}</td>
//                     <td className="p-2">
//                       <form action={updateAppointmentStatus} className="flex gap-2">
//                         <input type="hidden" name="id" value={a.id} />
//                         <select name="status" defaultValue={a.status} className="border rounded p-1">
//                           <option value="PENDING">Pending</option>
//                           <option value="CONFIRMED">Confirmed</option>
//                           <option value="COMPLETED">Completed</option>
//                           <option value="CANCELLED">Cancelled</option>
//                         </select>
//                         <button className="text-blue-600 text-xs">Update</button>
//                       </form>
//                     </td>
//                     <td className="p-2">
//                       <form action={deleteAppointment}>
//                         <input type="hidden" name="id" value={a.id} />
//                         <button className="text-red-600 text-xs">Delete</button>
//                       </form>
//                     </td>
//                   </tr>
//                 ))}
//                 {appointments.length === 0 && (
//                   <tr>
//                     <td colSpan={6} className="p-2 text-sm text-gray-400">No appointments yet.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </section>
//         )}
//       </main>
//     </div>
//   );
// }



import { getAdminData } from "./admin-data";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const data = await getAdminData();

  return <AdminDashboard {...data} />;
}