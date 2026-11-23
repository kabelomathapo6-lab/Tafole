export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-16 md:px-8">
      <p className="font-display text-sm font-semibold tracking-wide text-terracotta">
        Tafole
      </p>
      <h1 className="font-display text-[26px] leading-8 font-bold md:text-[32px] md:leading-[38px]">
        Remove the waiting, not the waiter.
      </h1>
      <p className="max-w-prose text-base text-olive">
        Guests order and call for service from a QR code at the table. The
        kitchen sees orders live and the waiter stays in charge.
      </p>
    </main>
  );
}
