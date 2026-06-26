export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, var(--color-brand-100), transparent 70%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
          Now booking in San Francisco
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-bark-900 sm:text-6xl">
          Happy dogs. <span className="text-brand-600">Booked in seconds.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-bark-700">
          Find a trusted local walker, schedule a walk, and pay securely — all from your phone.
          Watch every walk live with GPS tracking.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#waitlist"
            className="rounded-full bg-brand-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
          >
            Get early access
          </a>
          <a
            href="#how"
            className="rounded-full border border-stone-300 px-7 py-3 text-base font-semibold text-bark-700 transition hover:border-brand-600 hover:text-brand-600"
          >
            See how it works
          </a>
        </div>
        <p className="mt-6 text-sm text-stone-500">⭐ 4.9 average walker rating · 🐕 2,400+ walks completed</p>
      </div>
    </section>
  );
}
