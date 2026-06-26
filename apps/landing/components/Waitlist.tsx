"use client";

import { useState } from "react";

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Phase 2: POST this to the backend (/waitlist). For now, just confirm locally.
    if (email.includes("@")) setSubmitted(true);
  }

  return (
    <section id="waitlist" className="bg-bark-900 py-24 text-white">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Be first in line</h2>
        <p className="mt-4 text-stone-300">
          Join the waitlist and get a free first walk when we launch in your neighborhood.
        </p>
        {submitted ? (
          <p className="mt-8 rounded-xl bg-brand-600/20 px-6 py-4 text-brand-200">
            🎉 You&apos;re on the list! We&apos;ll be in touch soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 rounded-full border border-stone-700 bg-bark-700/40 px-5 py-3 text-white placeholder-stone-400 focus:border-brand-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-7 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Join waitlist
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
