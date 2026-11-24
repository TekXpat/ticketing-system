"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    // Trigger zoom animation
    const zoomTimer = setTimeout(() => setZoomed(true), 10);
    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    // Remove from DOM after fade completes
    const removeTimer = setTimeout(() => setVisible(false), 3100);
    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030B24",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        overflow: "hidden",
      }}
    >
      {/* GLOWS */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient
            id="g_ul"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(320 210) scale(850 630)"
          >
            <stop stopColor="#075BFF" stopOpacity="0.28" />
            <stop offset="0.4" stopColor="#075BFF" stopOpacity="0.084" />
            <stop offset="1" stopColor="#075BFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="g_lr"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(1755 1090) scale(675 500)"
          >
            <stop stopColor="#075BFF" stopOpacity="0.24" />
            <stop offset="0.4" stopColor="#075BFF" stopOpacity="0.072" />
            <stop offset="1" stopColor="#075BFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient
            id="g_logo"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(960 540) scale(240 200)"
          >
            <stop stopColor="#075BFF" stopOpacity="0.14" />
            <stop offset="0.4" stopColor="#075BFF" stopOpacity="0.042" />
            <stop offset="1" stopColor="#075BFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="320" cy="210" rx="850" ry="630" fill="url(#g_ul)" />
        <ellipse cx="1755" cy="1090" rx="675" ry="500" fill="url(#g_lr)" />
        <ellipse cx="960" cy="540" rx="240" ry="200" fill="url(#g_logo)" />
      </svg>

      {/* WAVES */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "hidden",
        }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ul1" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#030B24" />
            <stop offset="55%" stopColor="#062A8D" />
            <stop offset="89%" stopColor="#075BFF" />
            <stop offset="100%" stopColor="#087BFF" />
          </linearGradient>
          <linearGradient id="ul2" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#03133D" />
            <stop offset="30%" stopColor="#0633A0" />
            <stop offset="67%" stopColor="#075BFF" />
            <stop offset="88%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#00CFFF" />
          </linearGradient>
          <linearGradient id="ul3" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#063198" />
            <stop offset="50%" stopColor="#075BFF" />
            <stop offset="88%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#66E5FF" />
          </linearGradient>
          <linearGradient id="lr1" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#030B24" />
            <stop offset="55%" stopColor="#062A8D" />
            <stop offset="89%" stopColor="#075BFF" />
            <stop offset="100%" stopColor="#087BFF" />
          </linearGradient>
          <linearGradient id="lr2" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#03133D" />
            <stop offset="30%" stopColor="#0633A0" />
            <stop offset="67%" stopColor="#075BFF" />
            <stop offset="88%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#00CFFF" />
          </linearGradient>
          <linearGradient id="lr3" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#063198" />
            <stop offset="50%" stopColor="#075BFF" />
            <stop offset="88%" stopColor="#087BFF" />
            <stop offset="100%" stopColor="#66E5FF" />
          </linearGradient>
        </defs>

        {/* UL ribbons */}
        <path
          d="M -60 -20 L 780 -20 Q 820 -18 860 10 Q 920 55 820 180 Q 700 330 480 430 Q 280 510 60 500 Q -20 490 -60 460 Z"
          fill="url(#ul1)"
          opacity="0.92"
        />
        <path
          d="M -60 -20 L 560 -20 Q 600 -18 640 15 Q 700 65 590 200 Q 460 360 240 440 Q 80 490 -60 450 Z"
          fill="url(#ul2)"
          opacity="0.88"
        />
        <path
          d="M -60 -20 L 340 -20 Q 380 -15 410 20 Q 460 75 350 215 Q 240 350 60 400 Q -20 420 -60 400 Z"
          fill="url(#ul3)"
          opacity="0.90"
        />
        <path
          d="M -60 450 Q 80 490 240 440 Q 460 360 590 200 Q 700 65 640 15 Q 600 -18 560 -20"
          fill="none"
          stroke="#00CFFF"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M -60 400 Q -20 420 60 400 Q 240 350 350 215 Q 460 75 410 20 Q 380 -15 340 -20"
          fill="none"
          stroke="#99EEFF"
          strokeWidth="1"
          opacity="0.55"
        />

        {/* LR ribbons */}
        <path
          d="M -60 -20 L 780 -20 Q 820 -18 860 10 Q 920 55 820 180 Q 700 330 480 430 Q 280 510 60 500 Q -20 490 -60 460 Z"
          fill="url(#lr1)"
          opacity="0.76"
          transform="rotate(180 960 540)"
        />
        <path
          d="M -60 -20 L 560 -20 Q 600 -18 640 15 Q 700 65 590 200 Q 460 360 240 440 Q 80 490 -60 450 Z"
          fill="url(#lr2)"
          opacity="0.72"
          transform="rotate(180 960 540)"
        />
        <path
          d="M -60 -20 L 340 -20 Q 380 -15 410 20 Q 460 75 350 215 Q 240 350 60 400 Q -20 420 -60 400 Z"
          fill="url(#lr3)"
          opacity="0.75"
          transform="rotate(180 960 540)"
        />
        <path
          d="M -60 450 Q 80 490 240 440 Q 460 360 590 200 Q 700 65 640 15 Q 600 -18 560 -20"
          fill="none"
          stroke="#00CFFF"
          strokeWidth="1.5"
          opacity="0.4"
          transform="rotate(180 960 540)"
        />
        <path
          d="M -60 400 Q -20 420 60 400 Q 240 350 350 215 Q 460 75 410 20 Q 380 -15 340 -20"
          fill="none"
          stroke="#99EEFF"
          strokeWidth="1"
          opacity="0.45"
          transform="rotate(180 960 540)"
        />
      </svg>

      {/* BRAND */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          position: "relative",
          zIndex: 10,
          transform: zoomed ? "scale(1)" : "scale(0.15)",
          opacity: zoomed ? 1 : 0,
          transition: "transform 0.8s ease-out, opacity 0.8s ease-out",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt="Tikets icon"
          style={{
            width: "96px",
            height: "91px",
            borderRadius: "20px",
            filter: "drop-shadow(0px 0px 44px rgba(7,91,255,0.35))",
            flexShrink: 0,
            objectFit: "contain",
          }}
        />
        <span
          style={{
            fontSize: "88px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            fontFamily: "Inter, system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Tikets
        </span>
      </div>
    </div>
  );
}
