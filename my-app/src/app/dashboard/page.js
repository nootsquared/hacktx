// /app/dashboard/page.tsx

import { MyChart } from "../components/chart.jsx";
import { InfoCard } from "../components/InfoCard.jsx";
import { SummaryCard } from "../components/SummaryCard.jsx";
import Navbar from "../components/navbar.jsx";
export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Your Financing Plan</h1>
        
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <SummaryCard />
          <InfoCard />
          <MyChart />
        </div>
      </main>
    </div>
  );
}