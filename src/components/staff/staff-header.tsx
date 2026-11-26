import { SignOutButton } from "@/components/auth/sign-out-button";

export function StaffHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-display text-sm font-semibold tracking-wide text-terracotta">
          Tafole
        </p>
        <h1 className="font-display text-[26px] leading-8 font-bold">
          {title}
        </h1>
        {subtitle ? <p className="text-olive">{subtitle}</p> : null}
      </div>
      <SignOutButton />
    </header>
  );
}
