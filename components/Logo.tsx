import React from "react";

// On permet de passer des classes (pour la taille : w-8 h-8, etc.)
type LogoProps = {
  className?: string;
};

export default function Logo({ className = "w-10 h-10" }: LogoProps) {
  return (
    // SVG optimisé basé sur ton design Bouton + Aiguille
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      role="img"
      aria-label="Logo CoutureOS"
    >
      {/* Le Bouton (Noir avec bordure Or) */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#1a1a1a"
        stroke="#D4AF37"
        strokeWidth="4"
      />

      {/* Les 4 trous du bouton (Gris foncé pour la profondeur) */}
      <circle cx="38" cy="38" r="5" fill="#333333" />
      <circle cx="62" cy="38" r="5" fill="#333333" />
      <circle cx="38" cy="62" r="5" fill="#333333" />
      <circle cx="62" cy="62" r="5" fill="#333333" />

      {/* L'Aiguille (Argentée, inclinée à -45deg) */}
      <g transform="rotate(-45 50 50)">
        {/* Corps de l'aiguille */}
        <rect
          x="15"
          y="47.5"
          width="70"
          height="5"
          rx="2.5"
          fill="#E5E7EB" // Gris argenté clair
          stroke="#9CA3AF" // Bordure argentée plus foncée
          strokeWidth="1"
        />
        {/* Le chas de l'aiguille (le trou) */}
        <rect x="75" y="49" width="8" height="2" rx="1" fill="#1a1a1a" />
      </g>

      {/* Petit reflet brillant sur le bouton (touche finale luxe) */}
      <ellipse
        cx="35"
        cy="30"
        rx="15"
        ry="8"
        fill="white"
        fillOpacity="0.1"
        transform="rotate(-30 35 30)"
      />
    </svg>
  );
}
