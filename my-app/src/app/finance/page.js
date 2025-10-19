"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import catalog from "./catalog.json";

// Simple color scale from red->yellow->green for credit ring
const creditColor = (score) => {
  const pct = Math.min(1, Math.max(0, (score - 300) / 550));
  const hue = 0 + (120 * pct); // 0:red -> 120:green
  return `hsl(${hue}deg 80% 50%)`;
};

export default function FinancePage() {
  const router = useRouter();
  const categories = Object.keys(catalog);
  const [credit, setCredit] = useState(720);
  const [file, setFile] = useState(null);
  const [cat, setCat] = useState(categories[0]);
  const [modelId, setModelId] = useState(catalog[categories[0]][0].id);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const models = useMemo(() => catalog[cat] || [], [cat]);
  const selected = useMemo(() => models.find((m) => m.id === modelId) || models[0], [models, modelId]);

  const canContinue = credit >= 300 && !!file && !!selected;

  const start = async () => {
    if (!canContinue) return;
    // Placeholder: parse pay stub using a model — to be integrated later.
    // TODO: integrate backend ML (pth) and replace with API call.
    const payStubMeta = file ? { name: file.name, size: file.size, type: file.type } : null;
    const intake = {
      creditScore: credit,
      payStub: payStubMeta,
      vehicle: { id: selected.id, name: selected.name, msrp: selected.msrp, category: cat },
      createdAt: Date.now(),
    };
    try {
      sessionStorage.setItem("finance:intake", JSON.stringify(intake));
    } catch {}

    // Simulate processing and navigate
    setProcessing(true);
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + Math.floor(6 + Math.random() * 12));
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => {
          router.push(`/dashboard?model=${encodeURIComponent(selected.id)}&name=${encodeURIComponent(selected.name)}&msrp=${selected.msrp}&credit=${credit}`);
        }, 300);
      }
    }, 280);
  };

  // Always show the gate on this page
  useEffect(() => {}, []);

  return (
    <div className="relative min-h-screen">
      {/* Frosted overlay gate */}
      <div className="fixed inset-0 z-[100] grid place-items-center backdrop-blur-xl bg-black/30">
        <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-2xl">
          <h2 className="text-xl font-semibold">Finance Pre‑Check</h2>
          <p className="text-sm text-foreground/70 mb-4">We’ll use this information to generate tailored plans.</p>

          {/* Credit score */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-1 flex items-center justify-center">
              <div className="relative h-28 w-28">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(${creditColor(credit)} ${(credit - 300) / 550 * 360}deg, rgba(255,255,255,0.2) 0deg)`
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-white/70 backdrop-blur" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-xs text-foreground/60">Credit</div>
                    <div className="text-lg font-bold" style={{ color: creditColor(credit) }}>{credit}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <label className="flex items-center justify-between text-sm mb-1">
                <span>Credit Score</span>
                <span className="text-foreground/60">{credit}</span>
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCredit((c) => Math.max(300, c - 1))} className="rounded-md border border-white/20 bg-white/10 px-3 py-2">-</button>
                <input type="number" min={300} max={850} value={credit} onChange={(e)=>setCredit(Number(e.target.value))} className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none" />
                <button onClick={() => setCredit((c) => Math.min(850, c + 1))} className="rounded-md border border-white/20 bg-white/10 px-3 py-2">+</button>
              </div>
            </div>
          </div>

          {/* Pay stub file */}
          <div className="mb-5">
            <label className="block text-sm mb-1">Upload Pay Stub (PDF/Image)</label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-foreground hover:file:bg-white/20"
            />
            {file && <p className="mt-1 text-xs text-foreground/60">{file.name}</p>}
          </div>

          {/* Category + model */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Vehicle Category</label>
              <select value={cat} onChange={(e)=>{ setCat(e.target.value); setModelId(catalog[e.target.value][0].id); }} className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm">
                {categories.map((k) => (
                  <option key={k} value={k} className="bg-neutral-900">{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Model</label>
              <select value={modelId} onChange={(e)=>setModelId(e.target.value)} className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm">
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-neutral-900">{m.name} — ${m.msrp.toLocaleString()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-foreground/60">MSRP: <span className="font-medium text-foreground/80">${selected?.msrp?.toLocaleString?.()}</span></div>
            <button
              disabled={!canContinue}
              onClick={start}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-red-600/40 hover:bg-red-700"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-6 text-center shadow-xl backdrop-blur-2xl">
            <p className="mb-3 text-sm text-foreground/70">Processing financial data…</p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-white/60 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-foreground/60">{progress}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
