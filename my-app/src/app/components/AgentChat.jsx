'use client';

import { useState } from 'react';

export function AgentChat({ modelDataContext }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hello! How can I help you with the financing plan shown?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setPrompt('');
    setAudioSrc(null);

    try {
      // We now send both the user's prompt and the context from the dashboard
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: prompt,
            context: `The user is viewing a dashboard with the following information: 
            - Summary: ${modelDataContext.summary.text}
            - Recommendation: ${modelDataContext.recommendation.description}`
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const agentMessage = { role: 'agent', text: data.message };
      setMessages((prev) => [...prev, agentMessage]);

      if (data.audioData) {
        const audioBlob = new Blob([Buffer.from(data.audioData, 'base64')], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioSrc(url);
      }

    } catch (error) {
      console.error(error);
      const errorMessage = { role: 'agent', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg flex flex-col h-[85vh] max-h-[800px]">
      <header className="bg-gray-100 dark:bg-gray-700 p-4 rounded-t-lg">
        <h1 className="text-xl font-bold text-center">AI Personal Assistant</h1>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
           {isLoading && (
               <div className="flex justify-start">
                  <div className="px-4 py-2 rounded-2xl bg-gray-200 dark:bg-gray-600">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
              </div>
          )}
        </div>
      </main>

      {audioSrc && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <audio controls autoPlay src={audioSrc} className="w-full h-10">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <footer className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask about this plan..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-full p-2.5 hover:bg-blue-700 disabled:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
