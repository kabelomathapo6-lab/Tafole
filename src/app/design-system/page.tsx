import {
  Button,
  Card,
  Chip,
  Input,
  StatusPill,
  TableBadge,
  type Status,
} from "@/components/ui";

const statuses: Status[] = [
  "empty",
  "ordered",
  "waiting",
  "bill",
  "ready",
  "error",
];

const swatches = [
  ["canvas", "bg-canvas"],
  ["porcelain", "bg-porcelain"],
  ["oat", "bg-oat"],
  ["stone", "bg-stone"],
  ["forest", "bg-forest"],
  ["terracotta", "bg-terracotta"],
  ["pine", "bg-pine"],
  ["olive", "bg-olive"],
] as const;

export default function DesignSystem() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 md:px-8">
      <header className="flex items-center gap-3">
        <h1 className="font-display text-[26px] font-bold">
          Tafole design system
        </h1>
        <TableBadge>Table 7</TableBadge>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Colours</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, cls]) => (
            <Card key={name} className="overflow-hidden">
              <div className={`h-14 ${cls}`} />
              <p className="px-3 py-2 text-sm">{name}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Add to cart</Button>
          <Button variant="urgent">Call waiter</Button>
          <Button variant="secondary">Cancel</Button>
          <Button size="lg" pill>
            Mark ready
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Chips and status</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active>All day</Chip>
          <Chip>Starters</Chip>
          <Chip>Mains</Chip>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </div>
      </section>

      <section className="flex max-w-sm flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Inputs</h2>
        <Input label="Email" type="email" placeholder="you@restaurant.co.za" />
        <Input label="Password" type="password" error="Enter your password" />
      </section>
    </main>
  );
}
