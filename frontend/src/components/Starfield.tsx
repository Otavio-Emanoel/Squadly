"use client";
import { useEffect, useMemo, useRef } from "react";

/*****
 * Starfield em canvas para fundo animado leve
 */
export default function Starfield({ className = "", density = 90 }: { className?: string; density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stars = useMemo(() => {
    const list: { x: number; y: number; r: number; s: number; o: number }[] = [];
    for (let i = 0; i < density; i++) {
      list.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.6 + 0.3,
        s: Math.random() * 0.2 + 0.05, // velocidade sutil
        o: Math.random() * 0.6 + 0.3, // opacidade
      });
    }
    return list;
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const onResize = () => {
      const { innerWidth, innerHeight, devicePixelRatio } = window;
      canvas.width = Math.floor(innerWidth * devicePixelRatio);
      canvas.height = Math.floor(innerHeight * devicePixelRatio);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const render = () => {
      t += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        const x = star.x * w + Math.sin(t * star.s * 0.5) * 8;
        const y = star.y * h + Math.cos(t * star.s * 0.5) * 6;
        const twinkle = (Math.sin(t * (1.5 + star.s) + star.x * 10) + 1) / 2; // 0..1
        const o = star.o * (0.4 + twinkle * 0.6);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.r * 6);
        gradient.addColorStop(0, `rgba(255,255,255,${o})`);
        gradient.addColorStop(1, `rgba(168,164,255,0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    onResize();
    render();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [stars]);

  return <canvas ref={canvasRef} className={`pointer-events-none fixed inset-0 ${className}`} />;
}
