"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import catalog from "../finance/catalog.json";

const creditColor = (score) => {
  const pct = Math.min(1, Math.max(0, (score - 300) / 550));
  const hue = 0 + 120 * pct;
  return `hsl(${hue}deg 80% 50%)`;
};

export default function FinanceIntakeClient() {
  const router = useRouter();
  const params = useSearchParams();
  const categories = Object.keys(catalog);
  const [credit, setCredit] = useState(720);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [cat, setCat] = useState(categories[0]);
  const [modelId, setModelId] = useState(catalog[categories[0]][0].id);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelIn, setModelIn] = useState(null);

  const models = useMemo(() => catalog[cat] || [], [cat]);
  const selected = useMemo(() => models.find((m) => m.id === modelId) || models[0], [models, modelId]);

  const canContinue = credit >= 300 && !!file && !!selected;

  const start = async (e) => {
    if (!canContinue) return;
    const payStubMeta = file ? { name: file.name, size: file.size, type: file.type } : null;
    const intake = {
      creditScore: credit,
      payStub: payStubMeta,
      vehicle: { id: selected.id, name: selected.name, msrp: selected.msrp, category: cat },
      createdAt: Date.now(),
    };
    try { sessionStorage.setItem("finance:intake", JSON.stringify(intake)); } catch {}
    const formData = new FormData();
    
    formData.append("file", file);
    setProcessing(true);
    let p = 0;
    try{
      p = Math.min(100, p + Math.floor(6 + Math.random() * 12));
      setProgress(p);
      const res = await fetch("https://hacktx25helper-1.onrender.com/parse-document", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    
    setModelIn(data);
    console.log("Parsed Data:", data);
      setProgress(100);
    setTimeout(() => {
      setProcessing(false);
        router.push(`/dashboard?name=${selected.name}&msrp=${selected.msrp}&credit=${credit}`);
      }, 1000);
  
    }
    catch(err){
      console.error(err);
      setProgress(0);
    }
  };

  // Prefill model/category from query params if provided
  useEffect(() => {
    try {
      const qModel = params.get("model");
      const qName = params.get("name");
      // Attempt exact id match first
      if (qModel) {
        for (const c of categories) {
          const found = (catalog[c] || []).find((m) => m.id === qModel);
          if (found) {
            setCat(c);
            setModelId(found.id);
            return;
          }
        }
      }
      // Fallback: try name match (case-insensitive)
      if (qName) {
        const norm = String(qName).trim().toLowerCase();
        for (const c of categories) {
          const found = (catalog[c] || []).find((m) => m.name.trim().toLowerCase() === norm);
          if (found) {
            setCat(c);
            setModelId(found.id);
            return;
          }
        }
      }
    } catch {}
  }, [params]);

  const validateAndSetFile = (f) => {
    setFileError("");
    if (!f) { setFile(null); return; }
    const okType = /pdf|image\//.test(f.type);
    const okSize = f.size <= 10 * 1024 * 1024; // 10MB
    if (!okType) {
      setFile(null);
      setFileError("Unsupported format. Please upload a PDF or image.");
      return;
    }
    if (!okSize) {
      setFile(null);
      setFileError("File too large. Max size is 10 MB.");
      return;
    }
    setFile(f);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    validateAndSetFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) validateAndSetFile(f);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-[100] grid place-items-center backdrop-blur-xl bg-black/30">
        <div className="w-full max-w-2xl rounded-2xl border border-red-200/50 bg-white/95 p-7 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.45)] text-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:border-red-300 hover:text-neutral-900"
              aria-label="Back to Browse"
            >
              <span aria-hidden>←</span> Back to Browse
            </button>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Finance Pre‑Check</h2>
          <p className="text-sm text-neutral-700 mb-6">We’ll use this information to generate tailored plans.</p>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="col-span-1 flex items-center justify-center">
              <div className="relative h-28 w-28">
                <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${creditColor(credit)} ${(credit - 300) / 550 * 360}deg, rgba(255,255,255,0.2) 0deg)` }} />
                <div className="absolute inset-2 rounded-full bg-white" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-xs text-foreground/60">Credit</div>
                    <div className="text-lg font-bold" style={{ color: creditColor(credit) }}>{credit}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <label className="flex items-center justify-between text-sm font-semibold mb-1"><span>Credit Score</span><span className="text-neutral-700">{credit}</span></label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCredit((c) => Math.max(300, c - 1))} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-lg leading-none">−</button>
                <input
                  type="number"
                  min={300}
                  max={850}
                  value={credit}
                  onChange={(e)=>setCredit(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-xl font-semibold tracking-wide outline-none focus:border-red-400"
                />
                <button onClick={() => setCredit((c) => Math.min(850, c + 1))} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-lg leading-none">+</button>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">Pay Stub</label>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
                isDragging ? 'border-red-400 bg-red-50' : 'border-neutral-300 bg-white'
              }`}
            >
              <p className="text-sm font-medium">Drag & Drop your pay stub here</p>
              <p className="text-xs text-neutral-500">PDF, JPG or PNG — up to 10 MB</p>
              <div className="mt-1 flex items-center gap-3">
                <button type="button" onClick={()=>fileInputRef.current?.click()} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold hover:border-red-300">Browse</button>
                {file && !fileError && <span className="text-sm font-medium text-green-700">{file.name} • Uploaded ✓</span>}
              </div>
              {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={onFileChange} className="hidden" />
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm mb-1">Vehicle Category</label>
              <select value={cat} onChange={(e)=>{ setCat(e.target.value); setModelId(catalog[e.target.value][0].id); }} className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
                {categories.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Model</label>
              <select value={modelId} onChange={(e)=>setModelId(e.target.value)} className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
                {models.map((m) => (<option key={m.id} value={m.id}>{m.name} — ${m.msrp.toLocaleString()}</option>))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-neutral-700 font-semibold">MSRP: <span className="font-bold text-neutral-900">${selected?.msrp?.toLocaleString?.()}</span></div>
            <button
              aria-disabled={!canContinue}
              disabled={!canContinue}
              onClick={start}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(239,68,68,0.6)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>

      {processing && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-red-200/50 bg-white/90 p-6 text-center shadow-xl">
            <p className="mb-3 text-sm text-neutral-700">Processing financial data…</p>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-neutral-600">{progress}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

