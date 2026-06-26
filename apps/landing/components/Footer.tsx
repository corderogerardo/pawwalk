export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <p className="flex items-center gap-2 font-bold text-bark-900">
          <span>🐾</span> PawWalk
        </p>
        <p className="text-sm text-stone-500">© 2026 PawWalk. Made for good dogs.</p>
        <div className="flex gap-6 text-sm text-bark-700">
          <a href="#" className="hover:text-brand-600">Privacy</a>
          <a href="#" className="hover:text-brand-600">Terms</a>
          <a href="#" className="hover:text-brand-600">Contact</a>
        </div>
      </div>
    </footer>
  );
}
