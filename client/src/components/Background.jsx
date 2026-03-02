import React, { useEffect, useRef } from "react";

/**
 * Anti-gravity background:
 * Renders a canvas of floating '+' grid ticks that repel from the cursor.
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
    const TICK_OPACITY = 0.18;
    const TICK_COLOR_DARK = `rgba(139,92,246,${TICK_OPACITY})`;
    const TICK_COLOR_LIGHT = `rgba(109,40,217,${TICK_OPACITY})`;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildTicks();
    }

    function buildTicks() {
      ticksRef.current = [];
      const cols = Math.ceil(canvas.width / TICK_SPACING) + 1;
      const rows = Math.ceil(canvas.height / TICK_SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ticksRef.current.push({
            ox: c * TICK_SPACING, // origin x
            oy: r * TICK_SPACING, // origin y
            x: c * TICK_SPACING, // current x
            y: r * TICK_SPACING, // current y
            vx: 0,
            vy: 0,
          });
        }
      }
    }

    function drawTick(x, y) {
      ctx.beginPath();
      ctx.moveTo(x - TICK_SIZE, y);
      ctx.lineTo(x + TICK_SIZE, y);
      ctx.moveTo(x, y - TICK_SIZE);
      ctx.lineTo(x, y + TICK_SIZE);
      ctx.stroke();
    }

    let animId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains("dark");
      ctx.strokeStyle = isDark ? TICK_COLOR_DARK : TICK_COLOR_LIGHT;
      ctx.lineWidth = 1;

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

        // Spring back to origin
        tick.vx += (tick.ox - tick.x) * RETURN_SPEED;
        tick.vy += (tick.oy - tick.y) * RETURN_SPEED;

        // Dampen
        tick.vx *= 0.82;
        tick.vy *= 0.82;

        tick.x += tick.vx;
        tick.y += tick.vy;

        drawTick(tick.x, tick.y);
      }

      animId = requestAnimationFrame(animate);
    }

    function onMouseMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);

    resize();
    animate();

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
