'use client'
import { useState, useRef, useEffect } from 'react';

// Speaker Icon Component
const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-volume-up-fill" viewBox="0 0 16 16">
        <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
        <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
        <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
    </svg>
);

export function AgentChat({ modelDataContext }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hello! How can I help you with the financing plan shown?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setPrompt('');
    setAudioSrc(null); // Clear previous audio

    try {
      // Construct the context string from the passed-in dashboard data
      const context = `The user is viewing a dashboard with the following information: 
- Summary: ${modelDataContext?.summary?.text || 'Not available'}
- Recommendation: ${modelDataContext?.info?.description || 'Not available'}`;

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            prompt: prompt,
            context: context
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let agentMessage = { role: 'agent', text: 'An action was completed.' };
      let audioData = null;

      // Handle the structured API response
      if (data.type === 'tool') {
        agentMessage.text = data.result.message || `Action completed successfully.`;
        if (data.result.audio) {
            audioData = data.result.audio;
        }
      } else if (data.type === 'text_and_audio') {
        agentMessage.text = data.result.text;
        audioData = data.result.audio;
      }
      
      setMessages((prev) => [...prev, agentMessage]);

      if (audioData) {
        setAudioSrc(`data:audio/mpeg;base64,${audioData}`);
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

      <main className="flex-1 p-6 overflow-y-auto" ref={messagesEndRef}>
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