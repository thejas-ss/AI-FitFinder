import { LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormAlert } from "@/components/Form/Field";
import { GlassCard } from "@/components/GlassCard/GlassCard";
import { PageHeader, PageTransition } from "@/components/PageTransition/PageTransition";
import { useMe, useMeasurements, usePurchases, useRecommendations } from "@/hooks/useApi";
import { authService } from "@/services/authService";
import { fitService } from "@/services/fitService";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";
import { errorMessage, formatDate, formatPrice, initials } from "@/utils/format";

type Tab = "details" | "measurements" | "recommendations" | "purchases";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "measurements", label: "Measurements" },
  { id: "recommendations", label: "Saved sizes" },
  { id: "purchases", label: "Shopping history" },
];

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("details");
  const { data: me } = useMe();
  const logout = useAuthStore((s) => s.logout);
  const resetFlow = useFitStore((s) => s.reset);
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    resetFlow();
    navigate("/login", { replace: true });
  };

  return (
    <PageTransition className="pb-16">
      <PageHeader title="Your profile" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <GlassCard className="flex flex-col items-center gap-3 p-6 text-center">
          {me?.avatar_url ? (
            <img src={me.avatar_url} alt="" className="size-20 rounded-full object-cover" />
          ) : (
            <span className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold">
              {me ? initials(me.name) : ""}
            </span>
          )}
          <div>
            <p className="text-lg font-semibold">{me?.name}</p>
            <p className="text-sm text-white/60">{me?.email}</p>
          </div>
          <nav aria-label="Profile sections" className="mt-2 flex w-full flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? "page" : undefined}
                onClick={() => setTab(t.id)}
                className={`rounded-2xl px-4 py-2 text-left text-sm transition ${tab === t.id ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button type="button" className="btn-ghost mt-2 w-full" onClick={signOut}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </GlassCard>

        <GlassCard className="p-6">
          {tab === "details" && <DetailsTab />}
          {tab === "measurements" && <MeasurementsTab />}
          {tab === "recommendations" && <RecommendationsTab />}
          {tab === "purchases" && <PurchasesTab />}
        </GlassCard>
      </div>
    </PageTransition>
  );
}

function DetailsTab() {
  const { data: me, mutate } = useMe();
  const setUser = useAuthStore((s) => s.setUser);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [saving, setSaving] = useState(false);
  if (!me) return <p className="text-white/60">Loading…</p>;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const height = Number(form.get("height_cm"));
    const weight = Number(form.get("weight_kg"));
    if (height < 50 || height > 260 || weight < 10 || weight > 300) {
      return setMessage({ text: "Height must be 50–260 cm and weight 10–300 kg.", tone: "error" });
    }
    setSaving(true);
    try {
      const user = await authService.updateProfile({ name: String(form.get("name")).trim(), phone: String(form.get("phone")).trim(), height_cm: height, weight_kg: weight });
      setUser(user);
      await mutate(user, { revalidate: false });
      setMessage({ text: "Profile updated.", tone: "success" });
    } catch (err) {
      setMessage({ text: errorMessage(err), tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Personal details</h2>
      <div className="sm:col-span-2">
        <FormAlert message={message?.text ?? null} tone={message?.tone} />
      </div>
      <LabeledInput label="Name" name="name" defaultValue={me.name} required minLength={2} />
      <LabeledInput label="Phone" name="phone" type="tel" defaultValue={me.phone ?? ""} />
      <LabeledInput label="Height (cm)" name="height_cm" type="number" defaultValue={me.height_cm ?? ""} />
      <LabeledInput label="Weight (kg)" name="weight_kg" type="number" defaultValue={me.weight_kg ?? ""} />
      <button type="submit" className="btn-primary sm:col-span-2 sm:justify-self-start" disabled={saving}>
        Save changes
      </button>
    </form>
  );
}

function LabeledInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = `profile-${props.name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-white/70">
        {label}
      </label>
      <input id={id} className="input-glass" {...props} />
    </div>
  );
}

function MeasurementsTab() {
  const { data, isLoading } = useMeasurements();
  if (isLoading) return <p className="text-white/60">Loading…</p>;
  if (!data?.length) return <p className="text-white/60">No body scans yet.</p>;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Body measurement history</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-white/60">
            <tr>
              {["Date", "Chest", "Waist", "Hip", "Shoulder", "Quality"].map((h) => (
                <th key={h} scope="col" className="py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.map((m) => (
              <tr key={m.id}>
                <td className="py-3">{formatDate(m.created_at)}</td>
                <td>{Math.round(m.measurements.chest)} cm</td>
                <td>{Math.round(m.measurements.waist)} cm</td>
                <td>{Math.round(m.measurements.hip)} cm</td>
                <td>{Math.round(m.measurements.shoulder)} cm</td>
                <td>{Math.round(m.quality * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecommendationsTab() {
  const { data, isLoading, mutate } = useRecommendations();
  if (isLoading) return <p className="text-white/60">Loading…</p>;
  if (!data?.length) return <p className="text-white/60">No saved recommendations yet.</p>;

  const remove = (id: string) =>
    mutate(
      async () => {
        await fitService.deleteRecommendation(id);
        return data.filter((r) => r.id !== id);
      },
      { optimisticData: data.filter((r) => r.id !== id), rollbackOnError: true, revalidate: false },
    );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Saved recommendations</h2>
      <ul className="divide-y divide-white/10">
        {data.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="font-semibold">
                {r.brand_name} · {r.category.replace(/-/g, " ")}
              </p>
              <p className="text-xs text-white/60">
                {formatDate(r.created_at)} · {r.confidence}% confidence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">{r.recommended_size}</span>
              <button type="button" onClick={() => void remove(r.id)} aria-label={`Delete ${r.brand_name} recommendation`} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-pink">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PurchasesTab() {
  const { data, isLoading } = usePurchases();
  if (isLoading) return <p className="text-white/60">Loading…</p>;
  if (!data?.length) return <p className="text-white/60">No shopping history yet.</p>;
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Shopping history</h2>
      <ul className="divide-y divide-white/10">
        {data.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                {p.product_name}
              </a>
              <p className="text-xs capitalize text-white/60">
                {formatDate(p.created_at)} · {p.store} · size {p.size}
              </p>
            </div>
            <span className="font-semibold">{formatPrice(p.price)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
