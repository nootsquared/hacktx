'use client';
import { useState } from "react";
import Navbar from "@/app/components/navbar.jsx";
import { PlanSelectionView } from "@/app/components/PlanSelectionView.jsx";
import { JourneyMapView } from "@/app/components/JourneyMapView.jsx";

// This is the main page that manages the two primary states of the app.
export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('selection'); // 'selection' or 'journey'
  const [selectedPlan, setSelectedPlan] = useState(null);

  // --- Mock data for the vehicle and financing plans ---
  const vehicleData = {
    model: "Toyota GR86",
    msrp: 28400,
  };

  const initialPlans = [
    { id: 1, name: "Best Value", term: 60, apr: 5.5, price: vehicleData.msrp, downPayment: 4000 },
    { id: 2, name: "Low Payment", term: 72, apr: 6.5, price: vehicleData.msrp, downPayment: 2500 },
    { id: 3, name: "Own It Faster", term: 48, apr: 4.9, price: vehicleData.msrp, downPayment: 5000 },
  ];

  // This function is called from the PlanSelectionView when a user finalizes a plan.
  const handlePlanSelect = (planData) => {
    setSelectedPlan(planData);
    setViewMode('journey'); // Transition to the journey map view
  };

  // This function is called from the JourneyMapView to switch which plan is displayed
  // or to go back to the main selection screen.
  const handleViewChange = (newPlan) => {
    if (newPlan) {
      setSelectedPlan(newPlan);
    } else {
      // If no new plan is provided, go back to the selection view
      setViewMode('selection');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-white font-sans">
      <Navbar />
      <main className="flex-1 p-4 md:p-8">
        {viewMode === 'selection' ? (
          <PlanSelectionView
            initialPlans={initialPlans}
            onPlanSelect={handlePlanSelect}
          />
        ) : (
          <JourneyMapView
            allPlans={initialPlans}
            activePlan={selectedPlan}
            onViewChange={handleViewChange}
          />
        )}
      </main>
    </div>
  );
}