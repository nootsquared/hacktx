'use client';
import React from 'react';

// --- Data for the developers (no changes here) ---
const devs = [
  {
    id: 1,
    name: "Pranav Maringanti",
    role: "Lead Frontend Developer",
    imageUrl: "https://placehold.co/128x128/e2e8f0/334155?text=PM",
    description: "Pranav specializes in React and Next.js, building intuitive user interfaces and bringing complex designs to life with clean, efficient code.",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
    }
  },
  {
    id: 2,
    name: "Samantha Lee",
    role: "Backend & AI Engineer",
    imageUrl: "https://placehold.co/128x128/e2e8f0/334155?text=SL",
    description: "Samantha architects the powerful backend systems and AI integrations that drive our application, focusing on scalability and performance.",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
    }
  },
  {
    id: 3,
    name: "David Chen",
    role: "UI/UX Designer",
    imageUrl: "https://placehold.co/128x128/e2e8f0/334155?text=DC",
    description: "David is the creative mind behind the application's look and feel, ensuring a seamless and visually appealing user experience.",
    socials: {
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
    }
  },
  {
    id: 4,
    name: "Maria Garcia",
    role: "DevOps & Cloud Specialist",
    imageUrl: "https://placehold.co/128x128/e2e8f0/334155?text=MG",
    description: "Maria ensures our application is always running smoothly by managing our cloud infrastructure and deployment pipelines.",
    socials: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
    }
  }
];

// --- Social Icon SVGs (no changes here) ---
const SocialIcon = ({ platform, url }) => {
  const icons = {
    github: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
    ),
    linkedin: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
    ),
    twitter: (
       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
    ),
  };

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-neutral-500 transition hover:text-neutral-900 dark:hover:text-white">
      {icons[platform]}
    </a>
  );
};


// --- The Main About Page Component ---
export default function AboutPage() {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 min-h-screen flex items-center p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-neutral-900 dark:text-white mb-4">Meet the Team</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 text-center mb-12">
          We are a passionate team of developers and designers dedicated to building innovative solutions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {devs.map((dev) => (
            <div
              key={dev.id}
              className="flex flex-col rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/80 dark:bg-neutral-800/50 p-6 text-center backdrop-blur-xl
                       shadow-[0_8px_30px_-10px_rgba(239,68,68,0.25)] transition duration-300 hover:shadow-[0_15px_40px_-12px_rgba(239,68,68,0.35)]
                       dark:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_15px_40px_-12px_rgba(0,0,0,0.5)]" // Red highlights for light mode, retain dark for dark mode
            >
              <img
                src={dev.imageUrl}
                alt={dev.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white dark:border-neutral-700 shadow-md"
              />
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{dev.name}</h3>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">{dev.role}</p> {/* Changed role text color to red */}
              <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-6 flex-grow">
                {dev.description}
              </p>
              <div className="mt-auto flex justify-center items-center gap-4">
                {Object.entries(dev.socials).map(([platform, url]) => (
                  <SocialIcon key={platform} platform={platform} url={url} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}