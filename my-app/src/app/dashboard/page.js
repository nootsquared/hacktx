'use client';
import { useState, useEffect } from "react";
import { MyChart } from "@/app/components/chart.jsx";
import { InfoCard } from "@/app/components/InfoCard.jsx";
import { SummaryCard } from "@/app/components/SummaryCard.jsx";
import { ResizeNavbar } from "@/app/components/navbar.jsx";
import { AgentChat } from "@/app/components/AgentChat.jsx";

// This is the main page that combines the dashboard and the AI agent.
export default function DashboardPage() {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Simulate fetching data from your ML model backend ---
  useEffect(() => {
    // In a real application, you would fetch this data from an API endpoint
    // that communicates with your Python/ML backend.
    const fetchModelData = () => {
      setLoading(true);
      setTimeout(() => {
        setModelData({
          summary: {
            title: "Model Summary",
            text: "The model analyzed 15,000 data points related to consumer behavior and vehicle performance. Key indicators suggest a 25% increase in demand for electric vehicles with a range over 300 miles. The primary contributing factors include rising fuel costs and improved charging infrastructure. The confidence score for this prediction is 92%.",
          },
          recommendation: {
            src: "https://placehold.co/600x400/000000/FFFFFF?text=Vehicle+Match",
            alt: "A modern electric car",
            title: "Predicted Best Match",
            description: "Based on current market trends, the model suggests this vehicle profile as the optimal choice.",
          },
          performance: [
            { month: "January", value: 186 },
            { month: "February", value: 305 },
            { month: "March", value: 237 },
            { month: "April", value: 273 },
            { month: "May", value: 209 },
            { month: "June", value: 214 },
          ],
        });
        setLoading(false);
      }, 1500); // Simulate network delay
    };

    fetchModelData();
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            <ResizeNavbar />
            <main className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Model Data...</p>
                </div>
            </main>
        </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <ResizeNavbar />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
          {/* Column 1: Dashboard Components */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Your Financing Plan</h1>
            <SummaryCard data={modelData.summary} />
            <InfoCard data={modelData.recommendation} />
            <MyChart data={modelData.performance} />
          </div>

          {/* Column 2: AI Agent Chat */}
          <div className="lg:col-span-1">
             <AgentChat modelDataContext={modelData} />
          </div>
        </div>
      </main>
    </div>
  );
}

