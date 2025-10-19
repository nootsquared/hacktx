// components/JourneyMapView.jsx

import React from 'react';

// The visual component for the journey map.
// In a real app, calculations for crossover point would be more complex.
const FinancialJourneyMap = ({ plan }) => {
  // Placeholder for crossover calculation logic
  const equityCrossoverMonth = Math.round(plan.term * (0.3 + (5000 / (plan.downPayment + 1)))); // Simplified logic for demo

  return (
    <div className="relative w-full h-[60vh] flex items-center justify-center">
      {/* This would be an SVG component in a real application */}
      <img src="/financial-journey-map.svg" alt="Financial Journey Map" className="absolute inset-0 w-full h-full object-contain" />
      <div className="relative z-10 text-center">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-neutral-800 p-3 rounded-lg border border-neutral-700 shadow-lg">
          <p className="text-sm text-neutral-400">Equity Crossover</p>
          <p className="text-lg font-bold">Month {equityCrossoverMonth}</p>
        </div>
         <div className="absolute top-40 left-1/2 -translate-x-1/2 bg-neutral-800 p-3 rounded-lg border border-neutral-700 shadow-lg">
          <p className="text-sm text-neutral-400">Loan Paid Off</p>
          <p className="text-lg font-bold">Month {plan.term}</p>
        </div>
      </div>
    </div>
  );
};


// The main component for the "journey" state.
export function JourneyMapView({ allPlans, activePlan, onViewChange }) {
  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center">
        
      {/* Mini Plan Selectors (shrunken cards) */}
      <div className="flex gap-4 mb-8">
            <button 
          onClick={() => onViewChange(null)}
          className="p-4 rounded-lg border-2 border-dashed border-neutral-600 hover:border-white transition "
          style = {{textAlign: 'left'}}
            >
          <p className="font-bold"  style = {{textAlign: 'left'}}>Go Back</p>
            </button>
            <div className='items-center'>
            {allPlans.map(plan => (
          <button
            key={plan.id}
            onClick={() => onViewChange(plan)}
            className={`p-4 rounded-lg border-2 transition ${
              activePlan.id === plan.id ? 'bg-red-600 border-red-500' : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
            }`}
          >
            <p className="font-bold">{plan.name}</p>
          </button>
                ))}
                </div>
        
        </div>

      <h1 className="text-4xl font-bold text-center mb-4">Your Financial Journey Map</h1>
      <p className="text-lg text-neutral-400 text-center mb-8">
        Viewing the <span className="text-red-500 font-semibold">{activePlan.name}</span> plan.
      </p>

      {/* The main graphic */}
      <FinancialJourneyMap plan={activePlan} />
    </div>
  );
}