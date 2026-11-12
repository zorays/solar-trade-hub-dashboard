import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

type Sale = {
  _id: string;
  title: string;
  description: string;
  city: string;
  category: string;
  imageUrl: string;
  amount: number;
  quantity: number;
  soldAt: string;
  internalReference: string;
  confirmed: boolean;
  status: "draft" | "published";
};
type FormValues = Omit<Sale, "_id" | "status" | "amount" | "quantity"> & {
  amount: string;
  quantity: string;
  status: "draft" | "published";
};
type ApiList = { success: boolean; items: Sale[]; message?: string };

const localDateTime = (value: Date) =>
  new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);

const emptyForm = (): FormValues => ({
  title: "",
  description: "",
  city: "",
  category: "Battery",
  imageUrl: "",
  amount: "",
  quantity: "1",
  soldAt: localDateTime(new Date()),
  internalReference: "",
  confirmed: false,
  status: "draft",
});

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#6d36ff] dark:border-gray-700 dark:bg-gray-900 dark:text-white";
const labelClass = "block text-xs font-semibold text-gray-700 dark:text-gray-300";

export default function MarketplaceSales() {
  const [items, setItems] = useState<Sale[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<ApiList>("/content/sales");
      setItems(Array.isArray(response.data.items) ? response.data.items : []);
    } catch {
      setError("Could not load sales. Check dashboard access or backend deployment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const field = (key: keyof FormValues, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  };

  const edit = (sale: Sale) => {
    setEditingId(sale._id);
    setForm({
      title: sale.title,
      description: sale.description || "",
      city: sale.city || "",
      category: sale.category || "Battery",
      imageUrl: sale.imageUrl || "",
      amount: String(sale.amount),
      quantity: String(sale.quantity),
      soldAt: localDateTime(new Date(sale.soldAt)),
      internalReference: sale.internalReference || "",
      confirmed: sale.confirmed,
      status: sale.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPayload = (status: "draft" | "published") => {
    const amount = Number(form.amount);
    const quantity = Number(form.quantity);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 ||
        !Number.isSafeInteger(quantity) || quantity < 1 ||
        !form.soldAt || Number.isNaN(new Date(form.soldAt).getTime())) {
      throw new Error("Enter product, positive sale price, quantity and valid sale date/time.");
    }
    if (status === "published" && !form.confirmed) {
      throw new Error("Please verify the transaction before publishing.");
    }
    return {
      ...form,
      title: form.title.trim(),
      amount,
      quantity,
      soldAt: new Date(form.soldAt).toISOString(),
      status,
    };
  };

  const save = async (status: "draft" | "published") => {
    setError("");
    setNotice("");
    let payload;
    try { payload = getPayload(status); }
    catch (err) { setError(err instanceof Error ? err.message : "Invalid sale."); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.patch("/content/sales/" + encodeURIComponent(editingId), payload);
      } else {
        await api.post("/content/sales", payload);
      }
      setNotice(status === "published"
        ? "Confirmed sale published. It will appear in the homepage rotation."
        : "Sale saved as draft.");
      reset();
      await load();
    } catch (err: unknown) {
      const response = err as { response?: { data?: { message?: string } } };
      setError(response.response?.data?.message || "Could not save sale.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (sale: Sale, status: "draft" | "published") => {
    if (status === "published" && !sale.confirmed) {
      setError("Edit and confirm this transaction before publishing.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch("/content/sales/" + encodeURIComponent(sale._id), { status });
      setNotice(status === "published" ? "Sale published." : "Sale removed from public feed.");
      await load();
    } catch {
      setError("Could not change sale visibility.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-5 sm:p-7">
      <PageMeta title="Marketplace Sales | Solar Trade Hub" description="Manage verified sales on homepage" />
      <PageBreadcrumb pageTitle="Marketplace Sales" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Sales & Marketplace Activity</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Record confirmed sales for the public homepage carousel. Customer and invoice information is never published.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">{editingId ? "Edit sale" : "Add a confirmed sale"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>Product name *
            <input className={inputClass} maxLength={140} value={form.title} onChange={(e) => field("title", e.target.value)} placeholder="e.g., SES 16.07 kWh lithium battery" />
          </label>
          <label className={labelClass}>Total sale value (PKR) *
            <input className={inputClass} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => field("amount", e.target.value)} placeholder="Actual transaction amount" />
          </label>
          <label className={labelClass}>Quantity *
            <input className={inputClass} type="number" min="1" step="1" value={form.quantity} onChange={(e) => field("quantity", e.target.value)} />
          </label>
          <label className={labelClass}>Date and time of sale (Pakistan local time) *
            <input className={inputClass} type="datetime-local" value={form.soldAt} onChange={(e) => field("soldAt", e.target.value)} />
          </label>
          <label className={labelClass}>City (optional)
            <input className={inputClass} maxLength={80} value={form.city} onChange={(e) => field("city", e.target.value)} placeholder="Lahore" />
          </label>
          <label className={labelClass}>Category
            <input className={inputClass} maxLength={70} value={form.category} onChange={(e) => field("category", e.target.value)} />
          </label>
          <label className={labelClass}>Image URL (optional, HTTPS)
            <input className={inputClass} maxLength={500} value={form.imageUrl} onChange={(e) => field("imageUrl", e.target.value)} placeholder="https://..." />
          </label>
          <label className={labelClass}>Internal invoice/order reference (private)
            <input className={inputClass} maxLength={100} value={form.internalReference} onChange={(e) => field("internalReference", e.target.value)} />
          </label>
          <label className={labelClass + " sm:col-span-2"}>Public description (optional, no buyer details)
            <textarea className={inputClass} maxLength={240} rows={2} value={form.description} onChange={(e) => field("description", e.target.value)} placeholder="One verified battery sale completed" />
          </label>
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={form.confirmed} onChange={(e) => field("confirmed", e.target.checked)} />
          I have verified this transaction against an actual sale record and approve publishing its amount.
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={saving} type="button" onClick={() => void save("draft")} className="rounded-lg border border-gray-300 px-5 py-2 text-sm dark:text-white">Save draft</button>
          <button disabled={saving || !form.confirmed} type="button" onClick={() => void save("published")} className="rounded-lg bg-[#6d36ff] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">Publish confirmed sale</button>
          {editingId && <button type="button" onClick={reset} className="rounded-lg px-4 py-2 text-sm dark:text-white">Cancel edit</button>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold dark:text-white">Recent recorded sales</h2>
          <button type="button" onClick={() => void load()} className="text-sm font-semibold text-[#6d36ff]">Refresh</button>
        </div>
        {loading ? <p className="text-sm dark:text-white">Loading sales…</p> : items.length === 0
          ? <p className="text-sm text-gray-600 dark:text-gray-400">No records yet. Add your SES sale above.</p>
          : <div className="space-y-3">
              {items.map((sale) => (
                <div key={sale._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                  <div>
                    <strong className="text-sm text-gray-900 dark:text-white">{sale.title}</strong>
                    <p className="mt-1 text-xs text-gray-500">Rs {new Intl.NumberFormat("en-PK").format(sale.amount)} · Qty {sale.quantity} · {new Date(sale.soldAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</p>
                    <span className="mt-1 inline-block text-xs font-semibold text-[#6d36ff]">{sale.status === "published" ? "Published" : "Draft"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={saving} onClick={() => edit(sale)} className="rounded-lg border px-3 py-2 text-xs dark:text-white">Edit</button>
                    <button disabled={saving || (sale.status === "draft" && !sale.confirmed)}
                      onClick={() => void updateStatus(sale, sale.status === "published" ? "draft" : "published")}
                      className="rounded-lg border px-3 py-2 text-xs dark:text-white disabled:opacity-40">
                      {sale.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </div>
              ))}
            </div>}
      </section>
    </div>
  );
}
