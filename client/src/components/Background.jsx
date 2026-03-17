import React, { useEffect, useRef } from "react";

/**
 * Interactive background field.
 * Renders floating grid ticks that repel from the pointer and drift through
 * a cyan, amber, and emerald palette.
 */
export default function Background() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const ticksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const supportsPointerTracking = window.matchMedia("(pointer: fine)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);

    const REPEL_ENABLED = !prefersReducedMotion && supportsPointerTracking;
    const REPEL_RADIUS = 130;
    const REPEL_STRENGTH = 0.18;
    const RETURN_SPEED = 0.05;
    const TICK_SIZE = 5;
    const TICK_OPACITY = 0.13;
    const COLOR_CYCLE_MS = 7000;
    const FLOAT_AMPLITUDE = prefersReducedMotion ? 0 : 3;

    const viewport = {
      width: 0,
      height: 0,
    };

    const PALETTE = [
      { r: 34, g: 211, b: 238 },
      { r: 251, g: 191, b: 36 },
      { r: 52, g: 211, b: 153 },
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

    function getTickSpacing(width) {
      if (prefersReducedMotion) return 96;
      if (width < 768) return 92;
      if (width < 1280) return 72;
      return 64;
    }

    function resize() {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      buildTicks();
    }

    function buildTicks() {
      ticksRef.current = [];
      const tickSpacing = getTickSpacing(viewport.width);
      const cols = Math.ceil(viewport.width / tickSpacing) + 1;
      const rows = Math.ceil(viewport.height / tickSpacing) + 1;
      const total = cols * rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const phaseOffset = (r * cols + c) / total;
          ticksRef.current.push({
            ox: c * tickSpacing,
            oy: r * tickSpacing,
            x: c * tickSpacing,
            y: r * tickSpacing,
            vx: 0,
            vy: 0,
            phaseOffset,
          });
        }
      }
    }

    function drawTick(x, y, fillColor) {
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(x - TICK_SIZE, y);
      ctx.lineTo(x + TICK_SIZE, y);
      ctx.moveTo(x, y - TICK_SIZE);
      ctx.lineTo(x, y + TICK_SIZE);
      ctx.stroke();
    }

    let animId = 0;
    let lastFrameTime = 0;

    function renderFrame(timestamp) {
      ctx.clearRect(0, 0, viewport.width, viewport.height);

      const globalPhase = (timestamp / COLOR_CYCLE_MS) % 1;
      const floatX = Math.sin(timestamp / 4200) * FLOAT_AMPLITUDE;
      const floatY = Math.cos(timestamp / 5600) * FLOAT_AMPLITUDE;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const tick of ticksRef.current) {
        if (REPEL_ENABLED) {
          const dx = tick.x - mx;
          const dy = tick.y - my;
          const dist = Math.hypot(dx, dy);

          if (dist < REPEL_RADIUS && dist > 0) {
            const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
            tick.vx += (dx / dist) * force * REPEL_STRENGTH * 10;
            tick.vy += (dy / dist) * force * REPEL_STRENGTH * 10;
          }
        }

        tick.vx += (tick.ox + floatX - tick.x) * RETURN_SPEED;
        tick.vy += (tick.oy + floatY - tick.y) * RETURN_SPEED;

        tick.vx *= 0.86;
        tick.vy *= 0.86;
        tick.x += tick.vx;
        tick.y += tick.vy;

        const phase = (globalPhase + tick.phaseOffset) % 1;
        const { r, g, b } = paletteColor(phase);
        const fillColor = `rgba(${r},${g},${b},${TICK_OPACITY})`;

        drawTick(tick.x, tick.y, fillColor);
      }
    }

    function animate(timestamp) {
      animId = requestAnimationFrame(animate);

      if (document.hidden || timestamp - lastFrameTime < 32) {
        return;
      }

      lastFrameTime = timestamp;
      renderFrame(timestamp);
    }

    function onPointerMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function onPointerLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    window.addEventListener("resize", resize);
    if (REPEL_ENABLED) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    resize();

    if (prefersReducedMotion) {
      renderFrame(0);
    } else {
      animId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (REPEL_ENABLED) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerleave", onPointerLeave);
      }
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 h-full w-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
