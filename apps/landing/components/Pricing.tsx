const tiers = [
  { name: "30 min", price: "$18", blurb: "A brisk neighborhood walk.", popular: false },
  { name: "45 min", price: "$25", blurb: "Extra sniffs and playtime.", popular: true },
  { name: "60 min", price: "$32", blurb: "A proper adventure.", popular: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-bark-900 sm:text-4xl">Simple, per-walk pricing</h2>
        <p className="mt-4 text-bark-700">No subscriptions. Pay only for the walks you book.</p>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={
              "relative rounded-2xl border p-8 text-center " +
              (t.popular ? "border-brand-600 shadow-xl shadow-brand-600/10" : "border-stone-200")
            }
          >
            {t.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-bark-900">{t.name}</h3>
            <p className="mt-4 text-4xl font-extrabold text-bark-900">{t.price}</p>
            <p className="mt-3 text-sm text-bark-700">{t.blurb}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
