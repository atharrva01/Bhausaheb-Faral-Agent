import { AskBar } from "@/components/counter/AskButton";

function Diyas() {
  const gap = 110;
  return (
    <svg viewBox={`0 0 ${3 * gap} 120`} className="w-full" aria-hidden="true">
      <defs>
        <radialGradient id="diya-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffc52e" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffc52e" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0, 1, 2].map((i) => {
        const delay = { animationDelay: `${150 + i * 140}ms` };
        return (
          <g key={i} transform={`translate(${gap / 2 + i * gap} 96)`}>
            <circle cx="0" cy="-26" r="40" fill="url(#diya-glow)" className="anim-diya" style={delay} />
            <path d="M -30 -4 Q 0 -11 30 -4 Q 23 16 0 17 Q -23 16 -30 -4 Z" fill="#b5532a" />
            <path d="M -30 -4 Q 0 3 30 -4" fill="none" stroke="#e8955a" strokeWidth="2" />
            <path d="M 0 -36 C 7 -25 7 -16 0 -10 C -7 -16 -7 -25 0 -36 Z" fill="#f59e0b" className="anim-diya" style={delay} />
            <path d="M 0 -27 C 3 -21 3 -17 0 -13 C -3 -17 -3 -21 0 -27 Z" fill="#fff7dc" className="anim-diya" style={delay} />
          </g>
        );
      })}
    </svg>
  );
}

/** Home banner: Diwali batch announcement + the "Ask Aai" bar (the assistant's front door). */
export function DiwaliBanner() {
  return (
    <section aria-labelledby="banner-heading" className="overflow-hidden rounded-[14px] bg-[#fff3d0]">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 px-5 pb-2 pt-6 sm:px-8 sm:pt-8 md:pb-8">
          <p className="text-[15px] font-semibold text-accent">Diwali 2026 batch, made fresh in Karjat</p>
          <h1 id="banner-heading" className="type-title mt-1 text-[30px] leading-[1.06] text-ink sm:text-[42px]">
            Aai&apos;s homemade faral, posted to you abroad
          </h1>
          <p className="mt-2 max-w-[34rem] text-[17px] text-muted">
            Order like you&apos;d message home. Aai&apos;s assistant fills your cart, adds postage and sets up PayPal.
          </p>
          <AskBar className="mt-5 max-w-[36rem]" />
          <p className="mt-2 text-[14px] text-muted">Ships to the US, UK, Canada, UAE and Australia.</p>
        </div>
        <div className="hidden px-4 md:block md:pr-6">
          <Diyas />
        </div>
      </div>
    </section>
  );
}
