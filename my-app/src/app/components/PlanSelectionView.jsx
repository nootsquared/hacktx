// components/PlanSelectionView.jsx

import React, { useState } from 'react';

// This is a single interactive card. It manages its own state for sliders.
const PlanCard = ({ plan, onSelect }) => {
  const [term, setTerm] = useState(plan.term);
  const [apr, setApr] = useState(plan.apr);
  const [downPayment, setDownPayment] = useState(plan.downPayment);

  // Simple monthly payment calculation
  const calculatePayment = () => {
    const principal = plan.price - downPayment;
    if (principal <= 0) return 0;
    const monthlyInterestRate = apr / 100 / 12;
    const numberOfPayments = term;
    if (monthlyInterestRate === 0) return principal / numberOfPayments;
    const payment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    return payment.toFixed(2);
  };

  const currentPlanState = { ...plan, term, apr, downPayment };

  return (
    <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700 flex flex-col gap-4">
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <div className="space-y-4">
        <div>
          <label className="flex justify-between text-sm"><span>Down Payment</span><span>${downPayment.toLocaleString()}</span></label>
          <input type="range" min="0" max="15000" step="500" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="flex justify-between text-sm"><span>Loan Term</span><span>{term} Months</span></label>
          <input type="range" min="24" max="84" step="12" value={term} onChange={(e) => setTerm(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="flex justify-between text-sm"><span>APR</span><span>{apr.toFixed(1)}%</span></label>
          <input type="range" min="0.9" max="12.9" step="0.1" value={apr} onChange={(e) => setApr(Number(e.target.value))} className="w-full" />
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-neutral-700">
        <p className="text-sm text-neutral-400">Estimated Monthly Payment</p>
        <p className="text-3xl font-bold">${calculatePayment()}</p>
        <button
          onClick={() => onSelect(currentPlanState)}
          className="mt-4 w-full bg-red-600 text-white py-3 rounded-lg font-semibold transition hover:bg-red-700"
        >
          Visualize This Plan
        </button>
      </div>
    </div>
  );
};

// This is the main component for the "selection" state.
export function PlanSelectionView({ initialPlans, onPlanSelect }) {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-2">Choose Your Path</h1>
      <p className="text-lg text-neutral-400 text-center mb-8">Select a preset plan or customize the values to fit your budget.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {initialPlans.map(plan => (
          <PlanCard key={plan.id} plan={plan} onSelect={onPlanSelect} />
        ))}
      </div>
    </div>
  );
}