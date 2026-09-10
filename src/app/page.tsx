export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={72} height={72} aria-hidden="true" />
      <h1 className="font-display text-5xl tracking-tight text-cream-50">Hæstore</h1>
      <p className="max-w-md text-balance text-cream-300">
        An artisanal general store. Coffee and tea, ceramics, botanicals, textiles, pantry and hand
        tools.
      </p>
      <p className="rounded-full border border-bark-400 px-4 py-1.5 text-xs uppercase tracking-widest text-cream-300">
        Phase 0 · foundations
      </p>
    </main>
  );
}
