import { useEffect, useRef } from "react";
import { useDesign } from "@/lib/design";

/** Hero artwork for the landing page, one signature visual per design. Purely decorative. */
export function DesignArt() {
  const design = useDesign();
  if (design === "resend") return <CubeArt />;
  if (design === "dala") return <ConstellationArt />;
  if (design === "factory") return <DashboardArt />;
  return (
    <>
      <div className="landing__orb landing__orb--one" />
      <div className="landing__orb landing__orb--two" />
      <div className="landing__preview"><span>MARKET PULSE</span><strong>Curated collections</strong><div className="landing__bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
    </>
  );
}

/** Resend: a slowly rotating black cube with hairline edges. */
function CubeArt() {
  return (
    <div className="art-cube" data-testid="art-cube">
      <div className="art-cube__body">
        {["front", "back", "right", "left", "top", "bottom"].map((face) => <i key={face} className={`art-cube__face art-cube__face--${face}`} />)}
      </div>
    </div>
  );
}

const PARTICLE_COLORS = ["#8052ff", "#ffb829", "#2fc9a4", "#e05cc0", "#4da3ff", "#ffffff"];

/** Dala: a field of tiny outlined triangles gathered into a brain-like cloud, drifting slowly. */
function ConstellationArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let animation = 0;

    type Particle = { x: number; y: number; hx: number; hy: number; size: number; angle: number; spin: number; color: string; phase: number };
    let particles: Particle[] = [];

    function build() {
      const ratio = window.devicePixelRatio || 1;
      width = canvas?.clientWidth ?? 0;
      height = canvas?.clientHeight ?? 0;
      if (!canvas || !context || width === 0) return;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(900, Math.floor((width * height) / 380));
      particles = Array.from({ length: count }, (_, index) => {
        const inBrain = index < count * 0.72;
        let hx: number;
        let hy: number;
        if (inBrain) {
          // Two lobes of an ellipse-ish shape with a central fissure.
          const lobe = Math.random() < 0.5 ? -1 : 1;
          const radius = Math.sqrt(Math.random());
          const theta = Math.random() * Math.PI * 2;
          hx = width * 0.5 + lobe * width * 0.13 + Math.cos(theta) * radius * width * 0.24;
          hy = height * 0.46 + Math.sin(theta) * radius * height * 0.3 - Math.abs(Math.cos(theta)) * 6;
        } else {
          hx = Math.random() * width;
          hy = Math.random() * height;
        }
        return { x: hx, y: hy, hx, hy, size: inBrain ? 2 + Math.random() * 3.2 : 1.5 + Math.random() * 2, angle: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.01, color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ?? "#8052ff", phase: Math.random() * Math.PI * 2 };
      });
    }

    function draw() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      frame += 1;
      for (const p of particles) {
        p.angle += p.spin;
        p.x = p.hx + Math.cos(frame * 0.008 + p.phase) * 3;
        p.y = p.hy + Math.sin(frame * 0.01 + p.phase) * 3;
        context.save();
        context.translate(p.x, p.y);
        context.rotate(p.angle);
        context.beginPath();
        context.moveTo(0, -p.size);
        context.lineTo(p.size * 0.9, p.size * 0.7);
        context.lineTo(-p.size * 0.9, p.size * 0.7);
        context.closePath();
        context.strokeStyle = p.color;
        context.globalAlpha = 0.55 + 0.45 * Math.sin(frame * 0.02 + p.phase);
        context.lineWidth = 1;
        context.stroke();
        context.restore();
      }
      if (!reduceMotion) animation = window.requestAnimationFrame(draw);
    }

    build();
    draw();
    const observer = new ResizeObserver(() => { build(); if (reduceMotion) draw(); });
    observer.observe(canvas);
    return () => { window.cancelAnimationFrame(animation); observer.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="art-constellation" data-testid="art-constellation" />;
}

const SPARKS = ["M0,34 L14,28 L28,31 L42,18 L56,22 L70,10 L84,14 L100,4", "M0,30 L14,32 L28,20 L42,24 L56,12 L70,16 L84,8 L100,10", "M0,36 L14,30 L28,33 L42,26 L56,28 L70,18 L84,20 L100,12", "M0,28 L14,34 L28,26 L42,30 L56,16 L70,22 L84,10 L100,6"];

/** Factory: a "live" dashboard window with metric tiles and sparklines. */
function DashboardArt() {
  const tiles = [
    { label: "Коллекции", value: "128", accent: "orange" },
    { label: "Сделки / 24ч", value: "2 481", accent: "green" },
    { label: "Средняя цена", value: "0.84 ETH", accent: "orange" },
    { label: "Активные лоты", value: "9 302", accent: "green" }
  ];
  return (
    <div className="art-dashboard" data-testid="art-dashboard">
      <div className="art-dashboard__bar"><span className="art-dashboard__dots"><i /><i /><i /></span><span className="art-dashboard__title">MARKET · LIVE</span><span className="art-dashboard__status" /></div>
      <div className="art-dashboard__grid">
        {tiles.map((tile, index) => (
          <div className="art-dashboard__tile" key={tile.label}>
            <span>{tile.label}</span>
            <strong>{tile.value}</strong>
            <svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d={SPARKS[index] ?? SPARKS[0] ?? ""} className={`art-dashboard__spark art-dashboard__spark--${tile.accent}`} /></svg>
          </div>
        ))}
      </div>
    </div>
  );
}
