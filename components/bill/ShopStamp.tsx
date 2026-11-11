"use client";

import { useId } from "react";

/**
 * The shop's round violet rubber stamp, pressed on a bill once money is in (or an owner entry is made).
 * Marathi in the centre, the shop name around the ring, slightly uneven ink.
 */
export function ShopStamp({
  center = "पैसे मिळाले",
  sub,
  size = 132,
  animate = true,
  label,
}: {
  center?: string;
  sub?: string;
  size?: number;
  animate?: boolean;
  label: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={animate ? "anim-stamp" : "stamp-rest"}
    >
      <defs>
        <filter id={`ink-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" result="rough" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="gaps" />
          <feComposite in="rough" in2="gaps" operator="in" />
        </filter>
        <path id={`ring-${id}`} d="M70,70 m-51,0 a51,51 0 1,1 102,0 a51,51 0 1,1 -102,0" />
      </defs>
      <g filter={`url(#ink-${id})`} fill="none" stroke="var(--stamp)">
        <circle cx="70" cy="70" r="66" strokeWidth="3.6" />
        <circle cx="70" cy="70" r="43" strokeWidth="1.8" />
        <text fill="var(--stamp)" stroke="none" fontSize="11.5" fontFamily="var(--font-anek)" fontWeight="700" letterSpacing="0.4">
          <textPath href={`#ring-${id}`} startOffset="0">
            भाऊसाहेब जनरल किराणा स्टोर्स — कर्जत —
          </textPath>
        </text>
        <text x="70" y="70" textAnchor="middle" fill="var(--stamp)" stroke="none" fontSize="19" fontWeight="700" fontFamily="var(--font-tiro-mr)">
          {center}
        </text>
        {sub && (
          <text x="70" y="88" textAnchor="middle" fill="var(--stamp)" stroke="none" fontSize="11.5" fontFamily="var(--font-anek)" fontWeight="700">
            {sub}
          </text>
        )}
      </g>
    </svg>
  );
}
