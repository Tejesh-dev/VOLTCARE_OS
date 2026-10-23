import { VoltcareLogoLight } from "./logo";
import { useVoltcare } from "@/store/voltcare";
import { shortDate } from "@/lib/format";

type DocMeta = { label: string; value: string }[];

export function DocumentHeader({
  title,
  customerId,
  meta,
}: {
  title: string;
  customerId?: string;
  meta: DocMeta;
}) {
  const settings = useVoltcare((s) => s.settings);
  const customer = useVoltcare((s) => customerId ? s.customers.find((c) => c.id === customerId) : undefined);
  return (
    <>
      <div className="flex items-start justify-between border-b border-border pb-6 gap-4">
        <VoltcareLogoLight />
        <div className="text-right text-[13px] text-muted-foreground">
          <div className="font-semibold text-foreground">{settings.company.name}</div>
          <div>{settings.company.address}, {settings.company.city}</div>
          <div>{settings.company.phone} · {settings.company.email}</div>
          <div>GSTIN: {settings.company.gstin}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6">
        <div>
          <div className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">Prepared For</div>
          <div className="mt-2 font-bold text-lg">{customer?.name ?? "—"}</div>
          {customer?.phone && <div className="text-muted-foreground text-sm">{customer.phone}</div>}
          {customer?.email && <div className="text-muted-foreground text-sm">{customer.email}</div>}
          {customer?.address && <div className="text-muted-foreground text-sm">{customer.address}</div>}
          {customer?.city && <div className="text-muted-foreground text-sm">{customer.city}</div>}
        </div>
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">{title}</div>
          {meta.map((m, i) => (
            <div key={i}><span className="text-muted-foreground text-sm">{m.label}: </span><span className="font-semibold">{m.value}</span></div>
          ))}
          <div><span className="text-muted-foreground text-sm">Date: </span><span className="font-semibold">{shortDate(new Date().toISOString())}</span></div>
        </div>
      </div>
    </>
  );
}

export function DocumentFooter() {
  const settings = useVoltcare((s) => s.settings);
  return (
    <div className="mt-12 pt-6 border-t border-border text-center text-muted-foreground text-[12px]">
      <div className="italic">"{settings.company.tagline}"</div>
      <div className="mt-2 font-semibold tracking-widest text-[11px]">VOLTCARE ELECTRICAL SOLUTIONS · {settings.company.city.toUpperCase()}</div>
    </div>
  );
}
