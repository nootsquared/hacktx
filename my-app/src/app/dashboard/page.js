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

  
}
