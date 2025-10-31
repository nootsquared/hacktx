"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import catalog from "../finance/catalog.json";

const creditColor = (score) => {
  const pct = Math.min(1, Math.max(0, (score - 300) / 550));
  const hue = 0 + 120 * pct;
  return `hsl(${hue}deg 80% 50%)`;
};

export default function FinanceIntakePage() {
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
    
    // 5. (Optional but good practice) Update the original data structure.
    // This combines the parsed data and credit score into one object.
    setModelIn(data);
    // data.credit_score = credit;
    // setModelIn(data);
    // console.log(data);
    console.log("Parsed Data:", data); // Parsed JSON from Gemini
      setProgress(100);
    setTimeout(() => {
      setProcessing(false); // Hide the modal
        // Navigate to the dashboard, passing vehicle info as query params
        router.push(`/dashboard?name=${selected.name}&msrp=${selected.msrp}&credit=${credit}`);
      }, 1000); // 1-second delay so the user can see 100%
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  
}
