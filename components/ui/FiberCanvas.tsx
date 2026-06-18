"use client";

import { useEffect, useRef } from "react";

interface FiberCanvasProps {
  /** Overall canvas opacity (default: 0.45) */
  opacity?: number;
  /** Number of nodes in the network (default: 28) */
  nodeCount?: number;
  /** Max distance between nodes before a line is drawn (default: 160) */
  connectionDistance?: number;
  /** Node movement speed multiplier (default: 0.3) */
  speed?: number;
  /** Line color as rgb tuple (default: [34, 211, 238] — cyan-300) */
  color?: [number, number, number];
  /** Max line alpha at closest distance (default: 0.3) */
  lineAlpha?: number;
  /** Node dot radius in px (default: 1.6) */
  nodeRadius?: number;
  /** Node dot opacity (default: 0.5) */
  nodeOpacity?: number;
  /** Extra className on the canvas element */
  className?: string;
}

export default function FiberCanvas({
  opacity = 0.45,
  nodeCount = 28,
  connectionDistance = 160,
  speed = 0.3,
  color = [34, 211, 238],
  lineAlpha = 0.3,
  nodeRadius = 1.6,
  nodeOpacity = 0.5,
  className = "",
}: FiberCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    let animId: number;
    type Node = { x: number; y: number; vx: number; vy: number };
    let nodes: Node[] = [];
    let W = 0,
      H = 0;

    const [r, g, b] = color;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      W = canvas.width = parent.offsetWidth;
      H = canvas.height = parent.offsetHeight;
      nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const a = (1 - dist / connectionDistance) * lineAlpha;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${nodeOpacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ↑ intentionally empty deps — all config is read once on mount.
  // If you need live prop updates, wrap values in refs instead.

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
