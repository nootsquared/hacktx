'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentSimulation from '@/app/components/PaymentSimulation.jsx';

// Fully self‑contained Finance Dashboard, light theme with frosted cards + red hue.
export default function DashboardPage() {
  const params = useSearchParams();

  // Vehicle params from Finance gate (fallbacks if someone lands directly)
  const vehicleData = useMemo(() => {
    const msrp = Number(params.get('msrp')) || 28400;
    const modelName = params.get('name') || 'Toyota GR86';
    return { model: modelName, msrp };
  }, [params]);

  // Three best plan outputs (mocked from model)
  const plans = useMemo(
    () => [
      { id: 1, name: 'Best Value', term: 60, apr: 5.5, price: vehicleData.msrp, downPayment: 4000 },
      { id: 2, name: 'Low Payment', term: 72, apr: 6.5, price: vehicleData.msrp, downPayment: 2500 },
      { id: 3, name: 'Own It Faster', term: 48, apr: 4.9, price: vehicleData.msrp, downPayment: 5000 },
    ],
    [vehicleData.msrp]
  );

  const [mode, setMode] = useState('summary'); // 'summary' | 'advanced'
  const [selected, setSelected] = useState(plans[0]);
  const creditScore = Number(params.get('credit')) || 720;

  // Try to hydrate from intake if present
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('finance:intake');
      if (raw) {
        const data = JSON.parse(raw);
        if (data?.vehicle?.msrp && data?.vehicle?.name) {
          // refresh plans with this MSRP
          const msrp = Number(data.vehicle.msrp);
          plans[0].price = plans[1].price = plans[2].price = msrp;
        }
      }
    } catch {}
  }, []);

  const toAdvanced = (plan) => {
    setSelected(plan);
    setMode('advanced');
  };

  // Helpers
  const monthlyPayment = (plan) => {
    const principal = Math.max(0, plan.price - plan.downPayment);
    const r = plan.apr / 100 / 12;
    const n = plan.term;
    if (r === 0) return principal / n;
    return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  };

  const taxRate = 8.25; // %
  const derivedFor = (p) => {
    const taxes = Math.round(p.price * (taxRate / 100));
    const principal = Math.max(0, p.price + taxes - p.downPayment);
    const r = p.apr / 100 / 12;
    const n = p.term;
    const monthly = r === 0 ? principal / n : (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    const totalPaid = monthly * n + p.downPayment;
    const totalInterest = Math.max(0, totalPaid - p.price - taxes);
    return { taxes, principal, monthly, totalPaid, totalInterest };
  };

  const AdvancedToggle = (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center gap-4 rounded-full border border-red-200/60 bg-white/70 px-4 py-2 backdrop-blur-xl shadow-[0_8px_24px_-10px_rgba(239,68,68,0.25)]">
        <span className="text-sm text-neutral-700">Advanced view</span>
        <label htmlFor="advanced-toggle" className="relative inline-flex cursor-pointer select-none items-center">
          <input
            id="advanced-toggle"
            type="checkbox"
            className="peer sr-only"
            checked={mode === 'advanced'}
            onChange={(e) => setMode(e.target.checked ? 'advanced' : 'summary')}
          />
          <span className="block h-6 w-12 rounded-full bg-neutral-300 transition-colors peer-checked:bg-red-600" />
          <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-6" />
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Finance Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">{vehicleData.model} · MSRP ${vehicleData.msrp.toLocaleString()}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 shadow-sm backdrop-blur-md">
            <span className="font-medium">Credit Score</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600">{creditScore}</span>

          </div>
        </header>
        {AdvancedToggle}

        {/* Summary: three long tight cards */}
        {mode === 'summary' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((p) => {
              const { monthly, principal, taxes, totalPaid, totalInterest } = derivedFor(p);
              return (
                <div
                  key={p.id}
                  className="flex flex-col rounded-2xl border border-red-200/50 bg-white/80 p-5 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.25)] transition duration-300 hover:shadow-[0_18px_50px_-12px_rgba(239,68,68,0.35)] min-h-[60vh]"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{p.name}</h3>
                      <p className="text-xs text-neutral-600">APR {p.apr}% • {p.term} mo • Down ${p.downPayment.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-500">Est. Monthly</div>
                      <div className="text-2xl font-bold">${monthly.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">APR</div><div className="font-medium">{p.apr}%</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Term</div><div className="font-medium">{p.term} months</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Down Payment</div><div className="font-medium">${p.downPayment.toLocaleString()}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Vehicle Price</div><div className="font-medium">${p.price.toLocaleString()}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Estimated Tax ({taxRate}%)</div><div className="font-medium">${taxes.toLocaleString()}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Principal</div><div className="font-medium">${principal.toLocaleString()}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Assumed Credit Score</div><div className="font-medium">{creditScore}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Total Interest</div><div className="font-medium">${Math.round(totalInterest).toLocaleString()}</div></div>
                    <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Total Paid (incl. down)</div><div className="font-medium">${Math.round(totalPaid).toLocaleString()}</div></div>
                  </div>

                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <button
                      className="text-sm font-semibold text-red-600 transition hover:text-red-700"
                      onClick={() => toAdvanced(p)}
                    >
                      View Advanced View
                    </button>
                    <button
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      onClick={() => {/* no-op continue for now */}}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Advanced: cards shrink to top + charts/simulations appear */}
        {mode === 'advanced' && (
          <div className="space-y-6">
            {/* Centered mini selectors under toggle */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    selected.id === p.id
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-red-200/60 bg-white/70 text-neutral-800 hover:border-red-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Clean horizontal simulation: sliders left, graph right */}
            <div>
              <h3 className="mb-3 text-center text-lg font-semibold">Simulation</h3>
              <PaymentSimulation
                plans={plans}
                readOnly
                initialPlanId={selected.id}
                light
                hidePlanButtons
                orientation="horizontal"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
