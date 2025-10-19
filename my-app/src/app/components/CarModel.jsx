"use client";

import { useEffect, useRef, useState } from "react";

export default function CarModel({
  src,
  alt,
  rotationPerSecond = "8deg",
  exposure = 0.68,
  className = "",
  stageHeightVh = 65,
  autoRotate = true,
  cameraOrbit,
  cameraTarget,
  fieldOfView,
  orientation,
  stageMaxWidth,
  onReady,
  onModelLoad,
}) {
  const [ready, setReady] = useState(false);
  const viewerRef = useRef(null);
  const readyNotifiedRef = useRef(false);

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

  // After the model loads, gently reduce metallic and increase roughness for a more matte, premium look.
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const el = viewerRef.current;
    const onLoad = () => {
      try {
        const { model } = el;
        const materials = model?.materials || [];
        materials.forEach((mat) => {
          const name = (mat?.name || "").toLowerCase();
          const pmr = mat.pbrMetallicRoughness;
          if (!pmr) return;
          // Heuristics: adjust by common material names to avoid plastic look
          if (name.includes("glass") || name.includes("head") || name.includes("lamp") || name.includes("lens")) {
            if (typeof pmr.setMetallicFactor === "function") pmr.setMetallicFactor(0.0);
            if (typeof pmr.setRoughnessFactor === "function") pmr.setRoughnessFactor(0.05);
            return;
          }
          if (name.includes("tire") || name.includes("rubber")) {
            if (typeof pmr.setMetallicFactor === "function") pmr.setMetallicFactor(0.0);
            if (typeof pmr.setRoughnessFactor === "function") pmr.setRoughnessFactor(0.95);
            return;
          }
          if (name.includes("rim") || name.includes("wheel") || name.includes("metal")) {
            if (typeof pmr.setMetallicFactor === "function") pmr.setMetallicFactor(0.9);
            if (typeof pmr.setRoughnessFactor === "function") pmr.setRoughnessFactor(0.25);
            return;
          }
          if (name.includes("paint") || name.includes("body") || name.includes("carpaint")) {
            if (typeof pmr.setMetallicFactor === "function") pmr.setMetallicFactor(0.55);
            if (typeof pmr.setRoughnessFactor === "function") pmr.setRoughnessFactor(0.38);
            return;
          }
          // Fallback: a balanced look
          if (typeof pmr.setMetallicFactor === "function") pmr.setMetallicFactor(0.35);
          if (typeof pmr.setRoughnessFactor === "function") pmr.setRoughnessFactor(0.55);
        });
      } catch (e) {
        // Silently ignore if scene-graph API is unavailable
      }
      if (typeof onModelLoad === "function") {
        onModelLoad(el);
      }
    };
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [ready, onModelLoad]);

  useEffect(() => {
    if (!ready || !viewerRef.current || readyNotifiedRef.current) return;
    if (typeof onReady === "function") {
      onReady(viewerRef.current);
    }
    readyNotifiedRef.current = true;
  }, [ready, onReady]);

  const stageStyle = { height: `${stageHeightVh}vh` };
  if (stageMaxWidth) {
    stageStyle["--stage-max-width"] = stageMaxWidth;
  }

  return (
    <div className={`relative z-10 flex w-full justify-center ${className}`} style={{ marginBottom: '-50vh' }}>
      <div className="model-stage relative" style={stageStyle}>
        {/* Shadow rendered directly beneath the car model */}

        {ready ? (
          // eslint-disable-next-line react/no-unknown-property
          <model-viewer
            src={src}
            alt={alt}
            ar
            ar-modes="webxr scene-viewer quick-look"
            autoplay
            auto-rotate={autoRotate ? true : undefined}
            rotation-per-second={rotationPerSecond}
            reveal="auto"
            exposure={String(exposure)}
            shadow-intensity="0.8"
            shadow-softness="1"
            environment-image="neutral"
            tone-mapping="aces"
            interaction-prompt="none"
            background-color="#ffffff"
            camera-orbit={cameraOrbit}
            camera-target={cameraTarget}
            field-of-view={fieldOfView}
            orientation={orientation}
            ref={viewerRef}
            style={{ width: "100%", height: "100%", position: "relative", zIndex: 2 }}
          />
        ) : (
          <div className="grid place-items-center placeholder-stage" style={{ height: `${stageHeightVh}vh` }}>
            <span className="text-sm text-gray-500">Loading 3D model...</span>
          </div>
        )}
      </div>
    </div>
  );
}
