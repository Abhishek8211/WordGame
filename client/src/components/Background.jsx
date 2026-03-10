import React, { useEffect, useRef } from "react";

/**
 * Anti-gravity background:
 * Renders a canvas of floating '+' grid ticks that repel from the cursor.
 * Each tick cycles through pastel purple → pink → blue with a soft glow,
 * and the whole grid gently floats via a sinusoidal parallax offset.
 */
export default function Background() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const ticksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const TICK_SPACING = 48;
    const REPEL_RADIUS = 130;
    const REPEL_STRENGTH = 0.28;
    const RETURN_SPEED = 0.06;
    const TICK_SIZE = 6;
    const TICK_OPACITY = 0.15; // 15% — aesthetic but not distracting
    const GLOW_OPACITY = 0.55;
    const COLOR_CYCLE_MS = 7000; // full palette loop duration
    const FLOAT_AMPLITUDE = 5; // parallax drift px

    // Title-matching pastel palette: purple · pink · blue
    const PALETTE = [
      { r: 167, g: 139, b: 250 }, // #a78bfa
      { r: 244, g: 114, b: 182 }, // #f472b6
      { r: 96, g: 165, b: 250 }, // #60a5fa
    ];

    function lerpColor(a, b, t) {
      return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t),
      };
    }

    function paletteColor(phase) {
      const n = PALETTE.length;
      const scaled = (((phase % 1) + 1) % 1) * n;
      const i = Math.floor(scaled) % n;
      const t = scaled - Math.floor(scaled);
      return lerpColor(PALETTE[i], PALETTE[(i + 1) % n], t);
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildTicks();
    }

    function buildTicks() {
      ticksRef.current = [];
      const cols = Math.ceil(canvas.width / TICK_SPACING) + 1;
      const rows = Math.ceil(canvas.height / TICK_SPACING) + 1;
      const total = cols * rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Spread phase offsets across the grid so colours ripple diagonally
          const phaseOffset = (r * cols + c) / total;
          ticksRef.current.push({
            ox: c * TICK_SPACING,
            oy: r * TICK_SPACING,
            x: c * TICK_SPACING,
            y: r * TICK_SPACING,
            vx: 0,
            vy: 0,
            phaseOffset,
          });
        }
      }
    }

    function drawTick(x, y, fillColor, glowColor) {
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x - TICK_SIZE, y);
      ctx.lineTo(x + TICK_SIZE, y);
      ctx.moveTo(x, y - TICK_SIZE);
      ctx.lineTo(x, y + TICK_SIZE);
      ctx.stroke();
      // Reset shadow so it doesn't bleed into clearRect next frame
      ctx.shadowBlur = 0;
    }

    let animId;
    function animate(timestamp) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const globalPhase = (timestamp / COLOR_CYCLE_MS) % 1;
      // Slow sinusoidal floating — independent axes at different frequencies
      const floatX = Math.sin(timestamp / 4200) * FLOAT_AMPLITUDE;
      const floatY = Math.cos(timestamp / 5600) * FLOAT_AMPLITUDE;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const tick of ticksRef.current) {
        const dx = tick.x - mx;
        const dy = tick.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          tick.vx += (dx / dist) * force * REPEL_STRENGTH * 10;
          tick.vy += (dy / dist) * force * REPEL_STRENGTH * 10;
        }

        // Spring toward the floating origin (not the fixed grid origin)
        tick.vx += (tick.ox + floatX - tick.x) * RETURN_SPEED;
        tick.vy += (tick.oy + floatY - tick.y) * RETURN_SPEED;

        tick.vx *= 0.82;
        tick.vy *= 0.82;
        tick.x += tick.vx;
        tick.y += tick.vy;

        const phase = (globalPhase + tick.phaseOffset) % 1;
        const { r, g, b } = paletteColor(phase);
        const fillColor = `rgba(${r},${g},${b},${TICK_OPACITY})`;
        const glowColor = `rgba(${r},${g},${b},${GLOW_OPACITY})`;

        drawTick(tick.x, tick.y, fillColor, glowColor);
      }

      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    resize();
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
