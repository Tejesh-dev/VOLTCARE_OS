import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare } from "@/store/voltcare";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Voltcare OS" },
      { name: "description", content: "Company profile, tax defaults, terms and conditions and user settings." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <SettingsPage />
      </ClientGate>
    </AppShell>
  ),
});

function SettingsPage() {
  const settings = useVoltcare((s) => s.settings);
  const update = useVoltcare((s) => s.updateSettings);
  const [form, setForm] = useState(settings);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[900px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Company details flow into every quotation, invoice and PDF.</p>
      </div>

      <div className="card-surface p-6 space-y-4">
        <div className="font-bold text-lg">Company Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name"><Input value={form.company.name} onChange={(e) => setForm({ ...form, company: { ...form.company, name: e.target.value } })} /></Field>
          <Field label="Tagline"><Input value={form.company.tagline} onChange={(e) => setForm({ ...form, company: { ...form.company, tagline: e.target.value } })} /></Field>
          <Field label="Phone"><Input value={form.company.phone} onChange={(e) => setForm({ ...form, company: { ...form.company, phone: e.target.value } })} /></Field>
          <Field label="Email"><Input value={form.company.email} onChange={(e) => setForm({ ...form, company: { ...form.company, email: e.target.value } })} /></Field>
          <Field label="Website"><Input value={form.company.website} onChange={(e) => setForm({ ...form, company: { ...form.company, website: e.target.value } })} /></Field>
          <Field label="GSTIN"><Input value={form.company.gstin} onChange={(e) => setForm({ ...form, company: { ...form.company, gstin: e.target.value } })} /></Field>
          <Field label="Address"><Input value={form.company.address} onChange={(e) => setForm({ ...form, company: { ...form.company, address: e.target.value } })} /></Field>
          <Field label="City"><Input value={form.company.city} onChange={(e) => setForm({ ...form, company: { ...form.company, city: e.target.value } })} /></Field>
        </div>
      </div>

      <div className="card-surface p-6 space-y-4">
        <div className="font-bold text-lg">Defaults</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="GST Rate (%)"><Input type="number" value={form.defaults.gstRate} onChange={(e) => setForm({ ...form, defaults: { ...form.defaults, gstRate: parseFloat(e.target.value) || 0 } })} /></Field>
          <Field label="Labour Default (₹)"><Input type="number" value={form.defaults.labour} onChange={(e) => setForm({ ...form, defaults: { ...form.defaults, labour: parseFloat(e.target.value) || 0 } })} /></Field>
          <Field label="Transport Default (₹)"><Input type="number" value={form.defaults.transport} onChange={(e) => setForm({ ...form, defaults: { ...form.defaults, transport: parseFloat(e.target.value) || 0 } })} /></Field>
        </div>
        <Field label="Payment Terms"><Input value={form.defaults.paymentTerms} onChange={(e) => setForm({ ...form, defaults: { ...form.defaults, paymentTerms: e.target.value } })} /></Field>
        <div>
          <Label className="mb-2 block">Terms &amp; Conditions</Label>
          <textarea
            className="w-full min-h-32 rounded-md border border-border p-3 text-sm"
            value={form.defaults.terms.join("\n")}
            onChange={(e) => setForm({ ...form, defaults: { ...form.defaults, terms: e.target.value.split("\n").filter(Boolean) } })}
          />
        </div>
      </div>

      <div className="card-surface p-6 space-y-4">
        <div className="font-bold text-lg">User</div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name"><Input value={form.user.name} onChange={(e) => setForm({ ...form, user: { ...form.user, name: e.target.value } })} /></Field>
          <Field label="Role"><Input value={form.user.role} onChange={(e) => setForm({ ...form, user: { ...form.user, role: e.target.value } })} /></Field>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setForm(settings)}>Reset</Button>
        <Button onClick={() => { update(form); toast.success("Settings saved"); }}>Save Settings</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</Label>{children}</div>;
}
