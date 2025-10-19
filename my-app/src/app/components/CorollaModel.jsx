"use client";

import { useEffect, useState } from "react";

export default function CorollaModel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.customElements && window.customElements.get("model-viewer")) {
      setReady(true);
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.onload = () => setReady(true);
    script.onerror = () => setReady(false);
    document.head.appendChild(script);
  }, []);

  return (
    <div className="relative z-10 flex w-full justify-center">
      <div className="model-stage">
        {ready ? (
          // eslint-disable-next-line react/no-unknown-property
          <model-viewer
            src="/models/2022%20Toyota%20GR86%203D%20Model.glb"
            alt="2022 Toyota GR86"
            ar
            ar-modes="webxr scene-viewer quick-look"
            autoplay
            auto-rotate
            rotation-per-second="8deg"
            reveal="auto"
            exposure="0.76"
            shadow-intensity="0.85"
            shadow-softness="1"
            environment-image="neutral"
            interaction-prompt="none"
            background-color="#ffffff"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="grid place-items-center placeholder-stage">
            <span className="text-sm text-gray-500">Loading 3D model…</span>
          </div>
        )}
      </div>
    </div>
  );
}
