const features = [
  { icon: "📍", title: "Live GPS tracking", body: "Follow every walk in real time and get a route map when it's done." },
  { icon: "🗓️", title: "Book in seconds", body: "Pick a walker, choose 30/45/60 minutes, and you're set — recurring walks too." },
  { icon: "🔒", title: "Secure payments", body: "Pay in-app with saved cards. No cash, no awkward handoffs." },
  { icon: "✅", title: "Vetted walkers", body: "Every walker is background-checked and rated by your neighbors." },
  { icon: "🤖", title: "AI booking assistant", body: "Just say what you need — 'a walker in the Mission tomorrow at 3' — and we'll find it." },
  { icon: "📸", title: "Photo updates", body: "Get pics and a report card after every walk." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-bark-900 sm:text-4xl">Everything your dog needs</h2>
        <p className="mt-4 text-bark-700">A full-service walking experience, designed around trust and transparency.</p>
      </div>
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-stone-200 p-6 transition hover:border-brand-200 hover:shadow-md">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-bark-900">{f.title}</h3>
            <p className="mt-2 text-sm text-bark-700">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
