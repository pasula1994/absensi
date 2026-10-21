import React from 'react';

interface KotaSolokLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const KotaSolokLogo: React.FC<KotaSolokLogoProps> = ({
  size = 'md',
  showText = false,
  textColor = 'text-slate-900',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Authentic Stylized Vector Emblem of Kota Solok */}
      <svg
        viewBox="0 0 120 140"
        className={`${sizeMap[size]} shrink-0 drop-shadow-xs select-none`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shield gradient */}
          <linearGradient id="solokShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          {/* Gold border gradient */}
          <linearGradient id="solokGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          {/* Gonjong Roof Gradient */}
          <linearGradient id="solokRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>
        </defs>

        {/* Outer Shield Border (Segilima / Perisai Adat Minangkabau) */}
        <path
          d="M60 4 L112 24 L98 108 L60 134 L22 108 L8 24 Z"
          fill="url(#solokGoldGrad)"
          stroke="#92400E"
          strokeWidth="1.5"
        />

        {/* Inner Shield Body */}
        <path
          d="M60 10 L105 28 L92 103 L60 126 L28 103 L15 28 Z"
          fill="url(#solokShieldGrad)"
          stroke="#FDE68A"
          strokeWidth="1"
        />

        {/* Top Sky / Golden Sun Halo */}
        <circle cx="60" cy="46" r="22" fill="#FEF08A" opacity="0.45" />

        {/* Beringin Tree (Pohon Beringin - Simbol Pengayoman) */}
        <path
          d="M60 36 C50 36 44 42 45 49 C40 50 38 56 42 61 C45 64 50 63 53 62 C54 66 58 68 62 67 C66 68 70 65 71 61 C75 62 79 57 76 51 C77 44 71 36 60 36 Z"
          fill="#15803D"
          stroke="#166534"
          strokeWidth="0.8"
        />

        {/* Rumah Gadang Gonjong 5 (Ciri Khas Minangkabau Kota Solok) */}
        {/* Gonjong Center */}
        <path d="M60 38 L54 62 L66 62 Z" fill="#F59E0B" />
        <path d="M60 37 L58 46 L62 46 Z" fill="#DC2626" />
        {/* Gonjong Left 1 */}
        <path d="M47 43 L42 62 L52 62 Z" fill="#D97706" />
        {/* Gonjong Right 1 */}
        <path d="M73 43 L68 62 L78 62 Z" fill="#D97706" />
        {/* Gonjong Left Outer */}
        <path d="M35 50 L32 63 L42 63 Z" fill="#B45309" />
        {/* Gonjong Right Outer */}
        <path d="M85 50 L78 63 L88 63 Z" fill="#B45309" />

        {/* Rumah Gadang Base Wall */}
        <rect x="33" y="62" width="54" height="13" rx="1.5" fill="url(#solokRoofGrad)" stroke="#F59E0B" strokeWidth="0.8" />
        {/* Ukiran Minang Pattern Lines */}
        <line x1="36" y1="65" x2="84" y2="65" stroke="#FDE68A" strokeWidth="0.8" />
        <line x1="36" y1="71" x2="84" y2="71" stroke="#FDE68A" strokeWidth="0.8" />

        {/* Keris Pusaka di Tengah (Simbol Keberanian & Keadilan) */}
        <path
          d="M60 52 L62 76 L60 92 L58 76 Z"
          fill="#F8FAFC"
          stroke="#334155"
          strokeWidth="0.8"
        />
        {/* Gagang Keris */}
        <path d="M57 91 C57 91 60 94 62 94 C64 94 64 97 61 98" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

        {/* Padi (Kiri) - Solok Kota Beras */}
        <path
          d="M26 86 C24 74 27 60 34 52"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="27" cy="55" r="2" fill="#FBBF24" />
        <circle cx="25" cy="62" r="2" fill="#FBBF24" />
        <circle cx="24" cy="70" r="2" fill="#FBBF24" />
        <circle cx="26" cy="78" r="2" fill="#FBBF24" />

        {/* Kapas (Kanan) - Kemakmuran */}
        <path
          d="M94 86 C96 74 93 60 86 52"
          fill="none"
          stroke="#10B981"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="93" cy="55" r="2.2" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" />
        <circle cx="95" cy="63" r="2.2" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" />
        <circle cx="96" cy="71" r="2.2" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" />
        <circle cx="94" cy="79" r="2.2" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" />

        {/* Bintang Bersudut Lima (Ketuhanan yang Maha Esa) */}
        <polygon
          points="60,20 62,25 67,25 63,28 65,33 60,30 55,33 57,28 53,25 58,25"
          fill="#FBBF24"
          stroke="#D97706"
          strokeWidth="0.5"
        />

        {/* Pita Bawah (Ribbon) - KOTA SOLOK */}
        <path
          d="M25 106 L60 114 L95 106 L90 118 L60 125 L30 118 Z"
          fill="#DC2626"
          stroke="#FBBF24"
          strokeWidth="1"
        />
        <text
          x="60"
          y="118"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="900"
          fill="#FFFFFF"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.8"
        >
          KOTA SOLOK
        </text>

        {/* Slogan Text Below - TUAH SAKATO */}
        <text
          x="60"
          y="102"
          textAnchor="middle"
          fontSize="5"
          fontWeight="700"
          fill="#FDE68A"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
        >
          TUAH SAKATO
        </text>
      </svg>

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black text-sm uppercase tracking-wide ${textColor}`}>
              Kota Solok
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
              Sumbar
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Kota Beras Serambi Madinah
          </span>
        </div>
      )}
    </div>
  );
};
