'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaymentSimulation from '@/app/components/PaymentSimulation.jsx';
import { AgentChat } from '@/app/components/AgentChat.jsx';

// --- NEW: This metadata would likely live in a separate config file ---
const PLAN_METADATA = {
  PlanA: { APR: 3.2, Term_Months: 24, Type: "lease", downPayment: 2000 },
  PlanB: { APR: 3.8, Term_Months: 36, Type: "lease", downPayment: 2500 },
  PlanC: { APR: 4.5, Term_Months: 48, Type: "retail", downPayment: 4000 },
  PlanD: { APR: 5.2, Term_Months: 60, Type: "retail", downPayment: 5000 },
  PlanE: { APR: 6.0, Term_Months: 72, Type: "retail", downPayment: 6000 },
  PlanF: { APR: 7.0, Term_Months: 84, Type: "retail", downPayment: 7000 },
};

// A simple loading component
const LoadingState = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-white text-center">
    <h2 className="text-2xl font-bold text-neutral-800">Analyzing Your Financial Profile...</h2>
    <p className="text-neutral-600">Generating personalized plans just for you.</p>
  </div>
);

export default function DashboardPage() {
  const params = useSearchParams();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const creditScore = Number(params.get('credit')) || 720;

  // --- MODIFIED: State for plans, selected plan, and loading ---
  const [isLoading, setIsLoading] = useState(true);
  const [displayPlans, setDisplayPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const vehicleData = useMemo(() => {
    const msrp = Number(params.get('msrp')) || 28400;
    const modelName = params.get('name') || 'Toyota GR86';
    return { model: modelName, msrp };
  }, [params]);

  const [mode, setMode] = useState('summary'); // 'summary' | 'advanced'

  // --- NEW: Fetch and process model data when the component mounts ---
  useEffect(() => {
    const fetchAndBuildPlans = async () => {
      setIsLoading(true);
      try {
        // This would be your actual fetch call to the model endpoint.
        // For this example, we'll simulate the output you provided.
        await new Promise(res => setTimeout(res, 1500)); // Simulate network delay
        const modelOutput = [
          { plan: 'PlanC', probability: 0.913 },
          { plan: 'PlanB', probability: 0.044 },
          { plan: 'PlanD', probability: 0.041 },
        ];

        // Transform the model output into the structure the UI expects
        const newPlans = modelOutput.map((rec, index) => {
          const planDetails = PLAN_METADATA[rec.plan];
          return {
            id: index + 1,
            name: rec.plan,
            term: planDetails.Term_Months,
            apr: planDetails.APR,
            downPayment: planDetails.downPayment,
            price: vehicleData.msrp,
            type: planDetails.Type,
          };
        });

        setDisplayPlans(newPlans);
        setSelected(newPlans[0]); // Default to selecting the first plan
        
      } catch (error) {
        console.error("Failed to fetch model plans:", error);
        // Handle error state, maybe show a message
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndBuildPlans();
  }, [vehicleData.msrp]); // Re-run if the vehicle changes

  const toAdvanced = (plan) => {
    setSelected(plan);
    setMode('advanced');
  };

  // Helpers (no changes needed here)
  const derivedFor = (p) => {
    const taxRate = 8.25;
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
  
  // --- NEW: Render loading state ---
  if (isLoading || !selected) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 pt-32 pb-24">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Your Personalized Finance Plans</h1>
          <p className="mt-1 text-sm text-neutral-600">{vehicleData.model} · MSRP ${vehicleData.msrp.toLocaleString()}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200/60 bg-white/80 px-3 py-1.5 text-xs text-neutral-700 shadow-sm backdrop-blur-md">
            <span className="font-medium">Credit Score</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600">{creditScore}</span>
          </div>
        </header>
        {AdvancedToggle}

        {mode === 'summary' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* MODIFIED: Using `displayPlans` state */}
            {displayPlans.map((p) => {
              const { monthly, ...derived } = derivedFor(p);
              return (
                <div key={p.id} className="flex flex-col rounded-2xl border border-red-200/50 bg-white/80 p-5 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.25)] transition duration-300 hover:shadow-[0_18px_50px_-12px_rgba(239,68,68,0.35)] min-h-[60vh]">
                  {/* Card content remains the same */}
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
                  {/* ... other details */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                     <div className="rounded-lg border border-red-200/40 bg-white/70 p-2"><div className="text-[11px] text-neutral-500">Term</div><div className="font-medium">{p.term} months ({p.type})</div></div>
                     {/* ... and so on */}
                  </div>
                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <button className="text-sm font-semibold text-red-600 transition hover:text-red-700" onClick={() => toAdvanced(p)}>View Advanced View</button>
                    <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">Continue</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mode === 'advanced' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* MODIFIED: Using `displayPlans` state */}
              {displayPlans.map((p) => (
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
            <div>
              <h3 className="mb-3 text-center text-lg font-semibold">Simulation</h3>
              <PaymentSimulation
                plans={displayPlans}
                initialPlanId={selected.id}
                light
                hidePlanButtons
                orientation="horizontal"
              />
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-8 right-8 z-50 bg-red-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" aria-label="Open AI Assistant">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="relative h-full">
          <button onClick={() => setIsChatOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {/* MODIFIED: Dynamic context for the AI agent */}
          <AgentChat modelDataContext={{ summary: { text: `Currently viewing ${selected.name} for the ${vehicleData.model}. The plan details are: ${selected.term} months at ${selected.apr}% APR with a $${selected.downPayment} down payment.` }}} />
        </div>
      </div>
      {isChatOpen && <div onClick={() => setIsChatOpen(false)} className="fixed inset-0 bg-black/30 z-40"></div>}
    </div>
  );
}