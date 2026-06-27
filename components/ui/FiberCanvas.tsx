"use client";

import { memo, useEffect, useRef, useState } from "react";

interface FiberCanvasProps {
  /** Disables the animated canvas entirely. Static page gradients remain outside this component. */
  disabled?: boolean;
  /** Overall canvas opacity (default: 0.55) */
  opacity?: number;
  /** Number of nodes on desktop-width viewports (default: 52) */
  nodeCount?: number;
  /** Number of nodes below the responsive breakpoint. Defaults to min(nodeCount, 28). */
  mobileNodeCount?: number;
  /** Viewport width where the mobile node count starts (default: 768) */
  responsiveBreakpoint?: number;
  /** Max distance between nodes before a line is drawn (default: 170) */
  connectionDistance?: number;
  /** Node movement speed multiplier (default: 0.65) */
  speed?: number;
  /** Line color as rgb tuple (default: [34, 211, 238] - cyan-300) */
  color?: [number, number, number];
  /** Max line alpha at closest distance (default: 0.18) */
  lineAlpha?: number;
  /** Line width in px (default: 0.5) */
  lineWidth?: number;
  /** Node dot radius in px (default: 1.35) */
  nodeRadius?: number;
  /** Node dot opacity (default: 0.48) */
  nodeOpacity?: number;
  /** Extra className on the canvas element */
  className?: string;
}

function useIsLowEndDevice() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const cpuCores = navigator.hardwareConcurrency;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    const hasLowCoreCount =
      typeof cpuCores === "number" && cpuCores <= 4;
    const hasLowMemory =
      typeof deviceMemory === "number" && deviceMemory <= 2;

    setIsLowEnd(hasLowCoreCount || hasLowMemory);
  }, []);

  return isLowEnd;
}

function FiberCanvas({
  disabled = false,
  opacity = 0.55,
  nodeCount = 52,
  mobileNodeCount,
  responsiveBreakpoint = 768,
  connectionDistance = 170,
  speed = 0.65,
  color = [34, 211, 238],
  lineAlpha = 0.18,
  lineWidth = 0.5,
  nodeRadius = 1.35,
  nodeOpacity = 0.48,
  className = "",
}: FiberCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const isLowEnd = useIsLowEndDevice();
  const shouldDisable = disabled || isLowEnd;

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (shouldDisable) return;

    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!canvas) return;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!context) return;

    let animId = 0;
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    let activeNodeCount = nodeCount;

    type NodePoint = {
      x: number;
      y: number;
      vx: number;
      vy: number;
    };

    let nodes: NodePoint[] = [];
    let width = 0;
    let height = 0;
    const [r, g, b] = color;

    function createNodes() {
      nodes = Array.from({ length: activeNodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
      }));
    }

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      activeNodeCount =
        window.innerWidth < responsiveBreakpoint
          ? (mobileNodeCount ?? Math.min(nodeCount, 28))
          : nodeCount;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      createNodes();
    }

    function draw() {
      if (!isVisible) {
        animId = requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const alpha = (1 - distance / connectionDistance) * lineAlpha;

            context.beginPath();
            context.moveTo(nodes[i].x, nodes[i].y);
            context.lineTo(nodes[j].x, nodes[j].y);
            context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            context.lineWidth = lineWidth;
            context.stroke();
          }
        }
      }

      for (const node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${nodeOpacity})`;
        context.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 100);
    };

    resize();
    draw();

    const observer = new ResizeObserver(debouncedResize);

    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    window.addEventListener("resize", debouncedResize);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", debouncedResize);

      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [
    color,
    connectionDistance,
    isVisible,
    lineAlpha,
    lineWidth,
    mobileNodeCount,
    nodeCount,
    nodeOpacity,
    nodeRadius,
    responsiveBreakpoint,
    shouldDisable,
    speed,
  ]);

  if (shouldDisable) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}

export default memo(FiberCanvas);
