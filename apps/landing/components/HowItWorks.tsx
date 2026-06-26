const steps = [
  { n: "1", title: "Tell us about your dog", body: "Create a quick profile — breed, energy level, and any quirks." },
  { n: "2", title: "Pick a walker & time", body: "Browse vetted walkers near you, or let the AI assistant find one." },
  { n: "3", title: "Track & relax", body: "Follow the walk live, then get photos and a recap. Pay automatically." },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-brand-50/50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-bark-900 sm:text-4xl">Three taps to a happy pup</h2>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-bark-900">{s.title}</h3>
              <p className="mt-2 text-sm text-bark-700">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
