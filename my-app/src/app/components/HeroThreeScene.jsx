"use client";

import { useEffect, useRef } from "react";

export default function HeroThreeScene({ className = "" }) {
  const containerRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    const ensureThree = () =>
      new Promise((resolve, reject) => {
        if (typeof window !== "undefined" && window.THREE) return resolve(window.THREE);
        const script = document.createElement("script");
        script.src = "https://unpkg.com/three@0.160.0/build/three.min.js";
        script.async = true;
        script.onload = () => resolve(window.THREE);
        script.onerror = reject;
        document.head.appendChild(script);
      });

    ensureThree()
      .then((THREE) => {
        if (disposed) return;
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 0, 6);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.85);
        const dir = new THREE.DirectionalLight(0xff1a1a, 0.8);
        dir.position.set(3, 6, 4);
        scene.add(ambient, dir);

        // Subtle centerpiece that reacts only to scroll
        const knotGeo = new THREE.TorusKnotGeometry(1.1, 0.32, 256, 48);
        const knotMat = new THREE.MeshStandardMaterial({
          color: 0x111111,
          metalness: 0.85,
          roughness: 0.35,
          envMapIntensity: 0.8,
          transparent: true,
          opacity: 0.12,
        });
        const knot = new THREE.Mesh(knotGeo, knotMat);
        scene.add(knot);

        // No particle field – keep background clean

        const onResize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);

        // Animation loop: react only to scroll progress (no pointer interaction)
        const animate = () => {
          const scrollMax = Math.max(1, document.body.scrollHeight - window.innerHeight);
          const progress = Math.min(1, Math.max(0, window.scrollY / scrollMax));

          // Subtle scroll-driven transforms (no looping)
          knot.rotation.x = progress * 0.5;
          knot.rotation.y = progress * 0.9;
          camera.position.z = 6 - progress * 1.2;
          dir.intensity = 0.8 + progress * 0.3;
          knotMat.emissive = new THREE.Color(0xff1a1a).multiplyScalar(progress * 0.15);

          renderer.render(scene, camera);
          rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        cleanup = () => {
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(rafRef.current);
          try { container.removeChild(renderer.domElement); } catch {}
          knotGeo.dispose();
          renderer.dispose();
        };
      })
      .catch((e) => {
        console.warn("Failed to load three.js", e);
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
