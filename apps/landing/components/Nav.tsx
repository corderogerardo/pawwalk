export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2 text-xl font-bold text-bark-900">
          <span className="text-2xl">🐾</span> PawWalk
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-bark-700 md:flex">
          <a href="#features" className="hover:text-brand-600">Features</a>
          <a href="#how" className="hover:text-brand-600">How it works</a>
          <a href="#pricing" className="hover:text-brand-600">Pricing</a>
        </nav>
        <a
          href="#waitlist"
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Join waitlist
        </a>
      </div>
    </header>
  );
}
