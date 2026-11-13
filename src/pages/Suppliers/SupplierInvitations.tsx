import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

type Recipient = { supplierId: string; companyName: string; email: string; eligible: boolean; reason: string | null };
type Preview = { total: number; eligible: number; excluded: number; page: number; rows: Recipient[] };
type Metrics = { queued: number; sent: number; claimed: number; suppressed: number; approved: number; hourlyCap: number; dispatchEnabled: boolean };

export default function SupplierInvitations() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [page, setPage] = useState(1);
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([
        api.get<Preview>("/supplier-invitations/preview", { params: { page, limit: 25 } }),
        api.get<Metrics>("/supplier-invitations/metrics"),
      ]);
      setPreview(p.data);
      setMetrics(m.data);
      setError("");
    } catch { setError("Unable to load campaign data. Check your permissions and backend deployment."); }
  }, [page]);
  useEffect(() => { void refresh(); }, [refresh]);
  const suppress = async () => {
    setBusy(true);
    try {
      await api.post("/supplier-invitations/suppress", { email });
      setEmail("");
      setNotice("Address suppressed from invitations.");
      await refresh();
    } catch { setError("Could not suppress this address."); } finally { setBusy(false); }
  };
  const approve = async () => {
    if (confirm !== "APPROVE SUPPLIER INVITATIONS") return;
    setBusy(true);
    try {
      const response = await api.post<{ queued: number }>("/supplier-invitations/approve", { confirmation: confirm });
      setNotice(response.data.queued + " invitations queued. Email dispatch remains disabled.");
      setConfirm("");
      await refresh();
    } catch { setError("Approval failed; review server logs before retrying."); } finally { setBusy(false); }
  };
  return <main className="p-6 space-y-5">
    <h1 className="text-2xl font-semibold">Supplier invitation campaign</h1>
    <p className="text-sm text-gray-500">Approval queues eligible supplier contacts; it does not send email. Hourly limit: 100 after dispatch is separately enabled.</p>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    {notice && <p role="status" className="text-green-700">{notice}</p>}
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        ["Total", preview?.total], ["Eligible", preview?.eligible], ["Excluded", preview?.excluded],
        ["Queued", metrics?.queued], ["Sent", metrics?.sent], ["Claimed", metrics?.claimed],
        ["Suppressed", metrics?.suppressed], ["Approved campaigns", metrics?.approved],
      ].map(([label, value]) => <div key={String(label)} className="rounded border p-4"><div className="text-xs text-gray-500">{label}</div><strong>{value ?? "—"}</strong></div>)}
    </section>
    <section className="rounded border p-4 space-y-2">
      <h2 className="font-semibold">Suppress recipient</h2>
      <input aria-label="Email to suppress" className="border rounded p-2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="supplier@example.com" />
      <button className="rounded bg-gray-800 text-white p-2 ml-2 disabled:opacity-50" disabled={busy || !email.includes("@")} onClick={suppress}>Suppress</button>
    </section>
    <section className="rounded border p-4 space-y-2">
      <h2 className="font-semibold">Review and approve</h2>
      <p className="text-sm">Type APPROVE SUPPLIER INVITATIONS to queue eligible contacts. Dispatch stays off until a separate, reviewed worker is enabled.</p>
      <input aria-label="Approval phrase" className="border rounded p-2 w-full max-w-md" value={confirm} onChange={e => setConfirm(e.target.value)} />
      <button className="block rounded bg-indigo-700 text-white p-2 disabled:opacity-50" disabled={busy || confirm !== "APPROVE SUPPLIER INVITATIONS"} onClick={approve}>Approve queue (no emails sent)</button>
    </section>
    <section className="overflow-x-auto rounded border"><table className="w-full text-sm"><thead><tr>{["Company", "Email", "Eligible", "Reason"].map(x => <th key={x} className="p-3 text-left">{x}</th>)}</tr></thead>
      <tbody>{preview?.rows.map(x => <tr key={x.supplierId} className="border-t"><td className="p-3">{x.companyName}</td><td className="p-3">{x.email || "—"}</td><td className="p-3">{x.eligible ? "Yes" : "No"}</td><td className="p-3">{x.reason || "—"}</td></tr>)}</tbody></table></section>
    <div className="flex gap-3 items-center"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page}</span><button disabled={!preview || preview.rows.length < 25} onClick={() => setPage(p => p + 1)}>Next</button></div>
  </main>;
}
