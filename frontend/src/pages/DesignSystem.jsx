const colors = [
  ["bg", "#F4EFE6", "Page background — warm paper, not cool gray"],
  ["surface", "#FBF7F1", "Nav / secondary surfaces"],
  ["paper", "#FFFCF7", "Cards"],
  ["border", "#E4D8C8", "Hairline rules"],
  ["ink", "#1C1712", "Primary text"],
  ["muted", "#74685C", "Secondary text"],
  ["accent", "#B44A28", "Single action color — terracotta, not SaaS blue"],
];

const type = [
  ["Display", "Fraunces 3.5rem", "Hero and greetings"],
  ["H1", "Fraunces 2.25rem", "Screen titles"],
  ["H2", "Fraunces 1.5rem", "Section titles"],
  ["H3", "Figtree 1.125rem semibold", "Card titles"],
  ["Body", "Figtree 1rem / 1.65", "Reading text"],
  ["Caption", "Figtree 0.75rem uppercase tracked", "Labels and metadata"],
];

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-bg px-6 py-16 md:px-16">
      <p className="type-caption">TalentHunt design tokens</p>
      <h1 className="type-display mt-3 max-w-3xl">A boutique recruiting OS, not another dashboard template.</h1>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        Warm paper, editorial serif, one terracotta accent. Generous whitespace. Thin borders. This page exists so every
        later screen can be judged against the same tokens.
      </p>

      <section className="mt-16">
        <h2 className="type-h2">Color</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colors.map(([name, hex, note]) => (
            <div key={name} className="surface-card overflow-hidden">
              <div className="h-24" style={{ background: hex }} />
              <div className="px-4 py-4">
                <p className="type-caption">{name}</p>
                <p className="mt-1 font-medium">{hex}</p>
                <p className="mt-2 text-sm text-muted">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="type-h2">Type</h2>
        <div className="mt-6 space-y-8">
          <p className="type-display">Your recruiting team, operationalized.</p>
          <p className="type-h1">Good morning, Ramanathan.</p>
          <p className="type-h2">Attention needed</p>
          <p className="type-h3">Stripe — Senior Backend Engineer</p>
          <p className="max-w-xl">
            Body copy sits in Figtree at a readable 1.65 line-height. It should feel like a partner memo, not an admin
            console.
          </p>
          <p className="type-caption">Caption · Role opened · Day 5 / Target Day 7</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {type.map(([name, spec, use]) => (
            <div key={name} className="flex items-baseline justify-between gap-4 border-b border-border py-3">
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted">{use}</p>
              </div>
              <p className="text-sm text-muted">{spec}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-3">
        <div className="surface-card p-6">
          <p className="type-caption">Radius</p>
          <p className="mt-2 text-h3">16px cards · full pills for actions</p>
        </div>
        <div className="surface-card p-6 shadow-lift">
          <p className="type-caption">Shadow</p>
          <p className="mt-2 text-h3">Soft, warm, barely there</p>
        </div>
        <div className="surface-card p-6">
          <p className="type-caption">Spacing</p>
          <p className="mt-2 text-h3">8 / 16 / 24 / 40 / 64</p>
        </div>
      </section>
    </div>
  );
}
