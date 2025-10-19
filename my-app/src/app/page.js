"use client";

import { useMemo, useState } from "react";

import CarModel from "./components/CarModel";

const garageModels = [
  {
    id: "gr86",
    badge: "GR",
    name: "GR86",
    tagline: "Lightweight, track-honed coupe",
    theme: {
      accent: "#E10600",
      accentSoft: "rgba(225, 6, 0, 0.15)",
      accentDeep: "rgba(225, 6, 0, 0.45)",
    },
    src: "/models/2022%20Toyota%20GR86%203D%20Model.glb",
    heroCopy:
      "Choose your Toyota drive and feel the Gazoo Racing pulse. Scroll to see how the engineering travels with you into the details.",
    heroView: {
      cameraOrbit: "0deg 68deg 1.12m",
      cameraTarget: "0m -0.02m 0m",
      fieldOfView: "18deg",
      rotationPerSecond: "32deg",
      stageHeightVh: 82,
      stageMaxWidth: "1120px",
    },
    spotlight: {
      heading: "Pure lightweight adrenaline",
      summary:
        "The GR86 rewards commitment with near-perfect balance, rear-wheel drive playfulness, and a cabin ready for heel-toe ballet.",
      metrics: [
        { label: "0-60 mph", value: "6.1 s", detail: "Manual launch" },
        { label: "Power", value: "228 hp", detail: "2.4L boxer" },
        { label: "Offset", value: "53/47", detail: "Front/rear balance" },
        { label: "Weight", value: "2,811 lb", detail: "Whittled for agility" },
      ],
      highlights: [
        {
          title: "Lightweight, rigid shell",
          description: "A low center of gravity and rigid frame keep the coupe glued to clipping points.",
        },
        {
          title: "Driver-first cockpit",
          description: "Deep bucket seats, analog dials, and just the essentials keep the focus on the next apex.",
        },
        {
          title: "Gazoo Racing tuning",
          description: "Track-calibrated dampers and Torsen LSD translate intent into traction immediately.",
        },
      ],
      msrp: "$28,400*",
    },
  },
  {
    id: "prius",
    badge: "HYBRID",
    name: "Prius Prime",
    tagline: "Electrified efficiency icon",
    theme: {
      accent: "#4BAE4F",
      accentSoft: "rgba(75, 174, 79, 0.15)",
      accentDeep: "rgba(75, 174, 79, 0.45)",
    },
    src: "/models/2022%20Toyota%20GR86%203D%20Model.glb",
    heroCopy:
      "Plug-in practicality with a sculpted silhouette. Prius Prime evolves Toyota's hybrid heritage into confident daily performance.",
    heroView: {
      cameraOrbit: "22deg 66deg 1.14m",
      cameraTarget: "0m -0.02m 0m",
      fieldOfView: "19deg",
      rotationPerSecond: "30deg",
      stageHeightVh: 84,
      stageMaxWidth: "1120px",
    },
    spotlight: {
      heading: "Electrified for everyday momentum",
      summary:
        "All-electric range for weekday errands, hybrid stamina for long highway stretches. Prius Prime keeps efficiency intentional and expressive.",
      metrics: [
        { label: "EV range", value: "44 mi", detail: "EPA estimate" },
        { label: "Total range", value: "~600 mi", detail: "With hybrid assist" },
        { label: "Combined", value: "52 mpg", detail: "Hybrid drive" },
        { label: "Output", value: "220 hp", detail: "Hybrid system" },
      ],
      highlights: [
        {
          title: "Seamless EV to hybrid handoff",
          description: "Smart energy management balances electric miles with fuel for instant response.",
        },
        {
          title: "Toyota Safety Sense 3.0",
          description: "Standard advanced driver aids keep commutes calm and confident.",
        },
        {
          title: "Connected cabin",
          description: "12.3-inch multimedia and over-the-air updates make tech feel effortless.",
        },
      ],
      msrp: "$32,350*",
    },
  },
  {
    id: "corolla-cross",
    badge: "SUV",
    name: "Corolla Cross",
    tagline: "Compact utility, urban poise",
    theme: {
      accent: "#1F4C94",
      accentSoft: "rgba(31, 76, 148, 0.15)",
      accentDeep: "rgba(31, 76, 148, 0.45)",
    },
    src: "/models/2022%20Toyota%20GR86%203D%20Model.glb",
    heroCopy:
      "Built to navigate the city and sneak out on weekends. Corolla Cross is the hybrid-ready crossover with Toyota durability.",
    heroView: {
      cameraOrbit: "-26deg 68deg 1.17m",
      cameraTarget: "0m -0.03m 0m",
      fieldOfView: "19deg",
      rotationPerSecond: "30deg",
      stageHeightVh: 84,
      stageMaxWidth: "1120px",
    },
    spotlight: {
      heading: "Sized for city rhythm, tuned for Toyota reliability",
      summary:
        "Elevated seating, flexible cargo solutions, and available all-wheel drive mean the Corolla family now spans every adventure.",
      metrics: [
        { label: "Cargo", value: "24 ft³", detail: "Behind 2nd row" },
        { label: "MPG", value: "32 combined", detail: "AWD available" },
        { label: "Safety", value: "TSS 3.0", detail: "Standard suite" },
        { label: "Warranty", value: "36/36k", detail: "Bumper-to-bumper" },
      ],
      highlights: [
        {
          title: "Flexible cabin",
          description: "60/40 split seats and low load floor keep daily life simple.",
        },
        {
          title: "Hybrid option",
          description: "Available electrified powertrain maximizes efficiency without compromise.",
        },
        {
          title: "Toyota Connected Services",
          description: "Remote start, service alerts, and Wi-Fi bring convenience to every drive.",
        },
      ],
      msrp: "$24,995*",
    },
  },
  {
    id: "supra",
    badge: "GR",
    name: "Supra GT",
    tagline: "Grand tourer with racing DNA",
    theme: {
      accent: "#F5B301",
      accentSoft: "rgba(245, 179, 1, 0.18)",
      accentDeep: "rgba(245, 179, 1, 0.5)",
    },
    src: "/models/2022%20Toyota%20GR86%203D%20Model.glb",
    heroCopy:
      "Twin-scroll boost, adaptive aero, and GR calibration turn every expressway into a proving ground. Supra GT is Toyota's legend evolved.",
    heroView: {
      cameraOrbit: "-32deg 66deg 1.14m",
      cameraTarget: "0m -0.03m 0m",
      fieldOfView: "18deg",
      rotationPerSecond: "32deg",
      stageHeightVh: 84,
      stageMaxWidth: "1120px",
    },
    spotlight: {
      heading: "Engineered for long-haul pace",
      summary:
        "Adaptive dampers, active differential, and a cockpit wrapped in carbon accents make Supra GT the flagship of Toyota's performance roster.",
      metrics: [
        { label: "0-60 mph", value: "3.9 s", detail: "Sport+ launch" },
        { label: "Power", value: "382 hp", detail: "Turbo inline-six" },
        { label: "Torque", value: "368 lb-ft", detail: "1,800-5,000 rpm" },
        { label: "Top speed", value: "155 mph", detail: "Electronically limited" },
      ],
      highlights: [
        {
          title: "Adaptive aero",
          description: "Real-time deck-lid adjustments keep stability locked at speed.",
        },
        {
          title: "GR cockpit",
          description: "Alcantara bolsters and forged carbon set the tone for long stints.",
        },
        {
          title: "Active differential",
          description: "Variable locking diff cues up traction exiting every bend.",
        },
      ],
      msrp: "$45,540*",
    },
  },
];

const brandPillars = [
  {
    title: "Toyota Safety Sense",
    description:
      "Standard driver assistance across the lineup, continuously advanced with over-the-air updates and expanded sensing ranges.",
  },
  {
    title: "Electrified Leadership",
    description:
      "From hybrids to fuel cells, Toyota has logged more than 20 million electrified vehicles on the road, refining efficiency at every tier.",
  },
  {
    title: "Gazoo Racing DNA",
    description:
      "Toyota's global motorsport arm feeds technology into road cars, ensuring reliability with a competitive edge.",
  },
];

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = clamp(activeIndex, 0, garageModels.length - 1);
  const activeModel = garageModels[safeIndex];

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900">
      <div className="h-[72px] w-full" />
      <HeroShowcase
        models={garageModels}
        activeIndex={safeIndex}
        onActiveIndexChange={setActiveIndex}
      />
      <GarageSpotlight model={activeModel} />
      <BrandPillars pillars={brandPillars} />
    </div>
  );
}

function HeroShowcase({ models, activeIndex, onActiveIndexChange }) {
  const activeModel = models[activeIndex] ?? models[0];

  // Always use GR86's heroView for all models
  const gr86Model = models.find(m => m.id === "gr86");
  const accentStyles = useMemo(
    () => ({
      "--hero-accent": gr86Model?.theme?.accent ?? "#E10600",
      "--hero-accent-soft": gr86Model?.theme?.accentSoft ?? "rgba(225,6,0,0.25)",
      "--hero-accent-deep": gr86Model?.theme?.accentDeep ?? "rgba(225,6,0,0.45)",
    }),
    [gr86Model?.theme?.accent, gr86Model?.theme?.accentSoft, gr86Model?.theme?.accentDeep],
  );

  const heroView = gr86Model?.heroView || {
    cameraOrbit: "0deg 68deg 1.12m",
    cameraTarget: "0m -0.02m 0m",
    fieldOfView: "18deg",
    rotationPerSecond: "32deg",
    stageHeightVh: 82,
    stageMaxWidth: "1120px",
  };

  const totalModels = models.length;
  const hasMultiple = totalModels > 1;

  const handlePrev = () => {
    if (!hasMultiple || typeof onActiveIndexChange !== "function") return;
    onActiveIndexChange((prev) => (prev - 1 + totalModels) % totalModels);
  };

  const handleNext = () => {
    if (!hasMultiple || typeof onActiveIndexChange !== "function") return;
    onActiveIndexChange((prev) => (prev + 1) % totalModels);
  };

  return (
    <section
      className="relative overflow-visible bg-white pt-12 pb-[34vh] md:pt-16 lg:pt-18"
      style={accentStyles}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42vh] bg-gradient-to-b from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] bg-gradient-to-t from-neutral-100 via-white to-transparent" />

      <div className="sticky top-[78px] md:top-[92px]">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-5 text-center sm:px-8 lg:px-14">
          <HeroTagline />

          <HeroModelStage
            model={activeModel}
            heroView={heroView}
            onPrev={handlePrev}
            onNext={handleNext}
            hasMultiple={hasMultiple}
          />

          <HeroCarousel
            models={models}
            activeIndex={activeIndex}
            onSelect={onActiveIndexChange}
          />
        </div>
      </div>
    </section>
  );
}

function HeroTagline() {
  return (
    <div className="relative z-40 mx-auto flex w-full flex-col items-center text-center">
      <div className="brand-tagline-stack">
        <h1 className="brand-tagline-layer brand-tagline-main">
          <span className="block">
            TOYOTA IS<br />LIFE
            <span className="brand-tagline-period">.</span>
          </span>
        </h1>
      </div>
    </div>
  );
}

function HeroModelStage({ model, heroView, onPrev, onNext, hasMultiple }) {
  if (!model) return null;
  const stageHeightVh = heroView?.stageHeightVh ?? 86;
  const stageMaxWidth = heroView?.stageMaxWidth ?? "1120px";

  return (
    <div className="relative w-full max-w-6xl pt-2 px-4 sm:px-6">
      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous model"
            className="absolute left-2 top-1/2 z-40 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/95 p-3 text-neutral-900 shadow-md backdrop-blur-lg transition hover:-translate-y-1/2 hover:scale-105 hover:shadow-lg active:scale-95 sm:left-4"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next model"
            className="absolute right-2 top-1/2 z-40 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/95 p-3 text-neutral-900 shadow-md backdrop-blur-lg transition hover:-translate-y-1/2 hover:scale-105 hover:shadow-lg active:scale-95 sm:right-4"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      ) : null}

      <div className="relative mx-auto max-w-[min(1200px,95vw)]">
        <div className="pointer-events-none absolute inset-x-0 -top-40 flex items-center justify-center blur-[70px]" aria-hidden>
          <div
            className="h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle_at_center,var(--hero-accent-deep),transparent_68%)]"
            style={{ opacity: 0.34 }}
          />
        </div>

        <CarModel
          key={model.id}
          src={model.src}
          alt={`${model.name} hero model`}
          autoRotate
          stageHeightVh={stageHeightVh}
          stageMaxWidth={stageMaxWidth}
          rotationPerSecond={heroView?.rotationPerSecond}
          cameraOrbit={heroView?.cameraOrbit}
          cameraTarget={heroView?.cameraTarget}
          fieldOfView={heroView?.fieldOfView}
          className="mx-auto mt-12"
        />

        <div className="mt-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.48em] text-neutral-400">{model.badge}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[2.4rem]">{model.name}</p>
          <p className="mt-2 text-sm uppercase tracking-[0.34em] text-neutral-500">{model.tagline}</p>
        </div>
      </div>

      <ScrollCue label="Scroll to explore Toyota" />
    </div>
  );
}

function HeroCarousel({ models, activeIndex, onSelect }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-400">
          Toyota lineup
        </span>
      </div>
      <div className="mt-3 flex w-full items-stretch justify-center gap-3 overflow-x-auto pb-2">
        {models.map((model, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`model-chip ${selected ? "is-active" : ""}`}
            >
              <span className="model-chip-badge">{model.badge}</span>
              <span className="model-chip-name">{model.name}</span>
              <span className="model-chip-tagline">{model.tagline}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScrollCue({ label }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.4em] text-neutral-400 sm:mt-3">
      <span className="inline-flex h-[1px] w-16 bg-gradient-to-r from-transparent via-neutral-300/60 to-transparent" />
      <span>{label}</span>
      <span className="inline-flex h-[1px] w-16 bg-gradient-to-r from-transparent via-neutral-300/60 to-transparent" />
    </div>
  );
}

function GarageSpotlight({ model }) {
  if (!model?.spotlight) return null;
  const { theme, spotlight } = model;

  return (
    <section className="relative -mt-[24vh] bg-gradient-to-b from-white via-neutral-50 to-neutral-100 pb-24 pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white via-white/85 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 sm:px-8 lg:px-14">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.5em]" style={{ color: theme?.accent }}>
            Spotlight // {model.name}
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
            {spotlight.heading}
          </h2>
          <p className="text-pretty text-base text-neutral-600 sm:text-lg">{spotlight.summary}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] xl:gap-16">
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {spotlight.metrics?.map((stat) => (
                <div
                  key={`${model.id}-${stat.label}`}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200/70 bg-white/95 p-6 shadow-[0_20px_60px_-48px_rgba(15,15,15,0.3)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-46px_rgba(15,15,15,0.28)]"
                >
                  <p className="text-xs uppercase tracking-[0.48em] text-neutral-400">{stat.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-[2.1rem]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">{stat.detail}</p>
                  <span
                    className="absolute -bottom-9 right-6 h-16 w-16 translate-y-2 rounded-full opacity-0 blur-xl transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${theme?.accentDeep ?? "rgba(225,6,0,0.4)"}, transparent 70%)`,
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-neutral-200/80 bg-white/95 p-8 shadow-[0_28px_80px_-58px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.48em] text-neutral-400">Starting MSRP</p>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                {spotlight.msrp}
              </p>
              <p className="mt-3 text-sm text-neutral-500">
                Destination and handling extra. Contact your Toyota dealer for availability.
              </p>
              <div
                className="mt-6 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-[0.35em]"
                style={{ color: theme?.accent }}
              >
                Build & price
                <span
                  className="inline-flex h-[1px] w-12"
                  style={{
                    background: `linear-gradient(90deg, ${(theme?.accentSoft ?? "rgba(225,6,0,0.25)")}, ${theme?.accent}, transparent)`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {spotlight.highlights?.map((item) => (
              <div
                key={`${model.id}-${item.title}`}
                className="rounded-3xl border border-neutral-200/70 bg-white/95 p-6 text-left shadow-[0_20px_56px_-48px_rgba(15,15,15,0.28)]"
              >
                <p className="text-xs uppercase tracking-[0.44em]" style={{ color: theme?.accent }}>
                  {item.title}
                </p>
                <p className="mt-3 text-sm text-neutral-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-400">*Pricing shown is estimated starting MSRP. Final pricing and availability may vary by dealer.</p>
      </div>
    </section>
  );
}

function BrandPillars({ pillars }) {
  if (!pillars?.length) return null;
  return (
    <section className="bg-white py-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 sm:px-8 lg:px-14">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-[0.48em] text-neutral-400">Why Toyota</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            A lineup engineered for every tomorrow
          </h2>
          <p className="text-pretty text-base text-neutral-600 sm:text-lg">
            Safety innovations, electrified leadership, and motorsport-proven reliability keep Toyota at the front of
            the road ahead.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-3xl border border-neutral-200/70 bg-neutral-50/90 p-6 shadow-[0_24px_60px_-48px_rgba(15,15,15,0.3)]"
            >
              <p className="text-xs uppercase tracking-[0.42em] text-neutral-500">{pillar.title}</p>
              <p className="mt-3 text-sm text-neutral-600">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
