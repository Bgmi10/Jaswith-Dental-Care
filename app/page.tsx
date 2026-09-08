import prisma from "@/prisma";
import { getClinic } from "@/src/lib/clinic";
import { submitAppointment } from "./(public)/actions";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const clinic = await getClinic();
  const { success, error } = await searchParams;

  const [doctors, treatments, testimonials] = await Promise.all([
    prisma.doctor.findMany({
      where: { clinicId: clinic.id },
    }),
    prisma.treatment.findMany({
      where: { clinicId: clinic.id },
    }),
    prisma.testimonial.findMany({
      where: { clinicId: clinic.id },
    }),
  ]);

  const whatsappLink = clinic.whatsapp
    ? `https://wa.me/${clinic.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <main className="bg-ivory text-ink">
      {/* ---------- HEADER ---------- */}
      <header className="sticky top-0 z-10 border-b border-line bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt={clinic.name}
              className="h-9 w-9"
            />

            <span className="font-[var(--font-display)] text-lg tracking-tight">
              {clinic.name}
            </span>
          </a>

          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#treatments" className="hover:text-pine">
              Treatments
            </a>

            <a href="#doctors" className="hover:text-pine">
              Doctors
            </a>

            <a href="#reviews" className="hover:text-pine">
              Reviews
            </a>

            <a href="#contact" className="hover:text-pine">
              Contact
            </a>
          </nav>

          {clinic.phone && (
            <a
              href={`tel:${clinic.phone}`}
              className="rounded-full bg-pine px-4 py-2 text-sm text-ivory"
            >
              Call {clinic.phone}
            </a>
          )}
        </div>
      </header>

      {/* ---------- PROMO STRIP ---------- */}
      <div className="bg-brass px-6 py-2 text-center text-sm text-ivory">
        New patients: Free consultation &amp; X-ray · 30% off dentures for
        senior citizens
      </div>

      {/* ---------- HERO ---------- */}
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-[3fr_2fr] md:items-center">
        <div>
          <h1 className="font-[var(--font-display)] text-4xl leading-[1.1] md:text-5xl">
            {clinic.tagline ||
              "Careful, modern dental care for your whole family"}
          </h1>

          <p className="mt-5 max-w-md text-base text-ink/70">
            {clinic.name} offers gentle, thorough dental treatment in a calm
            setting — from routine checkups to complete smile care.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#appointment"
              className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-ivory"
            >
              Book an appointment
            </a>

            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-6 py-3 text-sm font-medium"
              >
                Message on WhatsApp
              </a>
            )}
          </div>
        </div>

        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface">
          {doctors[0]?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctors[0].image}
              alt={doctors[0].name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sage">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2C9 2 7 4.5 7 7.5c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5.5 0 1.5.5 2 1 2s1-1 1-3c0-1.5.5-1.5 1-1.5s1 0 1 1.5c0 2 .5 3 1 3s1-.5 1-2c0-2.5.5-4 1-5.5.5-1.5 1-3 1-5C17 4.5 15 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* ---------- TRUST BAR ---------- */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-8 text-sm md:grid-cols-4">
          <Stat
            label="Doctors"
            value={String(doctors.length || "—")}
          />

          <Stat
            label="Treatments offered"
            value={String(treatments.length || "—")}
          />

          <Stat
            label="Patient reviews"
            value={String(testimonials.length || "—")}
          />

          <Stat
            label="Opening hours"
            value={clinic.openingHours ?? "By appointment"}
          />
        </div>
      </section>

      {/* ---------- TREATMENTS ---------- */}
      {treatments.length > 0 && (
        <section
          id="treatments"
          className="mx-auto max-w-5xl px-6 py-20"
        >
          <h2 className="font-[var(--font-display)] text-3xl">
            Treatments
          </h2>

          <p className="mt-2 max-w-md text-ink/70">
            Care for every stage — from prevention to restoration.
          </p>

          <div className="mt-10 divide-y divide-line border-t border-line">
            {treatments.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:gap-8"
              >
                {t.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.image}
                    alt={t.name}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                )}

                <div>
                  <h3 className="text-lg font-medium">{t.name}</h3>

                  {t.description && (
                    <p className="mt-1 max-w-lg text-sm text-ink/70">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- DOCTORS ---------- */}
      {doctors.length > 0 && (
        <section
          id="doctors"
          className="border-t border-line bg-surface"
        >
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="font-[var(--font-display)] text-3xl">
              Meet the team
            </h2>

            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {doctors.map((d) => (
                <div key={d.id}>
                  <div className="aspect-square overflow-hidden rounded-xl bg-ivory">
                    {d.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.image}
                        alt={d.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sage">
                        {d.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="mt-4 font-medium">{d.name}</h3>

                  {d.qualification && (
                    <p className="text-sm text-ink/60">
                      {d.qualification}
                    </p>
                  )}

                  {d.specialization && (
                    <p className="text-sm text-brass">
                      {d.specialization}
                    </p>
                  )}

                  {d.bio && (
                    <p className="mt-2 text-sm text-ink/70">
                      {d.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- TESTIMONIALS ---------- */}
      {testimonials.length > 0 && (
        <section
          id="reviews"
          className="mx-auto max-w-5xl px-6 py-20"
        >
          <h2 className="font-[var(--font-display)] text-3xl">
            What patients say
          </h2>

          <div className="mt-10 space-y-10">
            {testimonials.map((t) => (
              <blockquote key={t.id} className="max-w-2xl">
                <p className="font-[var(--font-display)] text-xl leading-snug text-ink/90">
                  &quot;{t.review}&quot;
                </p>

                <footer className="mt-3 text-sm text-ink/60">
                  {t.name}
                  {t.rating ? ` — ${t.rating}/5` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* ---------- APPOINTMENT + CONTACT ---------- */}
      <section
        id="appointment"
        className="border-t border-line bg-pine text-ivory"
      >
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <h2 className="font-[var(--font-display)] text-3xl">
              Book an appointment
            </h2>

            <p className="mt-2 text-ivory/70">
              Tell us a little about what you need and we&apos;ll confirm
              your slot.
            </p>

            {success && (
              <p className="mt-4 rounded-lg bg-ivory/10 px-4 py-3 text-sm">
                Thanks — your request has been sent. We&apos;ll call you to
                confirm.
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-500/20 px-4 py-3 text-sm">
                Please fill in your name, phone, date, and preferred slot.
              </p>
            )}

            <form action={submitAppointment} className="mt-6 space-y-4">
              <input
                name="patientName"
                placeholder="Your name"
                required
                className="w-full rounded-lg border border-ivory/30 bg-transparent px-4 py-3 placeholder:text-ivory/50"
              />

              <input
                name="phone"
                placeholder="Phone number"
                required
                className="w-full rounded-lg border border-ivory/30 bg-transparent px-4 py-3 placeholder:text-ivory/50"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full rounded-lg border border-ivory/30 bg-transparent px-4 py-3 [color-scheme:dark]"
                />

                <select
                  name="slot"
                  required
                  className="w-full rounded-lg border border-ivory/30 bg-pine px-4 py-3"
                >
                  <option value="">Preferred time</option>
                  <option value="Morning">
                    Morning · 10:00 AM–1:00 PM
                  </option>
                  <option value="Evening">
                    Evening · 4:30 PM–8:30 PM
                  </option>
                </select>
              </div>

              {treatments.length > 0 && (
                <select
                  name="treatment"
                  className="w-full rounded-lg border border-ivory/30 bg-pine px-4 py-3"
                >
                  <option value="">
                    Select a treatment (optional)
                  </option>

                  {treatments.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}

              <textarea
                name="message"
                placeholder="Anything else we should know?"
                rows={3}
                className="w-full rounded-lg border border-ivory/30 bg-transparent px-4 py-3 placeholder:text-ivory/50"
              />

              <button
                type="submit"
                className="rounded-full bg-brass px-6 py-3 text-sm font-medium text-ivory"
              >
                Request appointment
              </button>
            </form>
          </div>

          <div
            id="contact"
            className="space-y-3 text-sm text-ivory/80"
          >
            {clinic.address && <p>{clinic.address}</p>}

            {clinic.phone && <p>Phone: {clinic.phone}</p>}

            {clinic.email && <p>Email: {clinic.email}</p>}

            {clinic.openingHours && (
              <p>Hours: {clinic.openingHours}</p>
            )}

            {clinic.mapsUrl && (
              <a
                href={clinic.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block underline"
              >
                Get directions
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {clinic.name}
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-[var(--font-display)] text-2xl text-pine">
        {value}
      </p>

      <p className="mt-1 text-ink/60">{label}</p>
    </div>
  );
}
