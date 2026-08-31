/**
 * EnvironmentBanner.jsx
 * Subtle SVG environmental illustration banner.
 * Earth = Local, Sky = Cloud.
 */
import { useThemeStore } from '@/store';

export function EnvironmentBanner({ environment = 'cloud' }) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  return environment === 'local'
    ? <EarthBanner isDark={isDark} />
    : <SkyBanner isDark={isDark} />;
}

/* ── Earth ────────────────────────────────────────────────────── */
function EarthBanner({ isDark }) {
  const sky       = isDark ? '#111D17' : '#D4E9DC';
  const sky2      = isDark ? '#1A2820' : '#EAF3EC';
  const hillFar   = isDark ? '#1A2F24' : '#93B5A0';
  const hillMid   = isDark ? '#223A2C' : '#6A9479';
  const hillNear  = isDark ? '#2A4736' : '#587463';
  const ground    = isDark ? '#1E3328' : '#4A6254';
  const tree      = isDark ? '#1C3026' : '#3F594C';
  const birdColor = isDark ? '#5A8C70' : '#3A5040';

  return (
    <div className="w-full overflow-hidden shrink-0" style={{ height: 140 }}>
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="earthSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky} />
            <stop offset="100%" stopColor={sky2} />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="1440" height="140" fill="url(#earthSky)" />

        {/* Birds */}
        <path d="M180,28 Q185,23 190,28" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M186,24 Q191,19 196,24" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M620,18 Q625,13 630,18" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M627,14 Q632,9 637,14" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M1100,32 Q1105,27 1110,32" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* Far hills */}
        <path d="M-10,95 Q180,58 360,78 Q540,50 720,72 Q900,52 1080,75 Q1260,58 1450,88 L1450,140 L-10,140Z" fill={hillFar}/>

        {/* Mid hills */}
        <path d="M-10,115 Q120,90 280,105 Q440,88 600,108 Q760,90 920,108 Q1080,92 1250,112 L1450,118 L1450,140 L-10,140Z" fill={hillMid}/>

        {/* Near hills */}
        <path d="M-10,132 Q100,112 240,124 Q380,110 520,126 Q660,112 800,128 Q940,113 1080,128 Q1220,114 1450,132 L1450,140 L-10,140Z" fill={hillNear}/>

        {/* Ground strip */}
        <rect x="-10" y="137" width="1460" height="3" fill={ground}/>

        {/* Tree group 1 — around x=340 */}
        <rect x="339" y="128" width="2" height="12" fill={tree}/>
        <polygon points="330,128 341,108 352,128" fill={tree}/>
        <polygon points="331,120 341,103 351,120" fill={tree}/>
        <polygon points="334,113 341,100 348,113" fill={tree}/>

        <rect x="362" y="130" width="2" height="10" fill={tree}/>
        <polygon points="355,130 363,113 371,130" fill={tree}/>
        <polygon points="356,123 363,108 370,123" fill={tree}/>

        {/* Tree group 2 — around x=820 */}
        <rect x="819" y="126" width="2" height="14" fill={tree}/>
        <polygon points="809,126 820,104 831,126" fill={tree}/>
        <polygon points="810,117 820,99 830,117" fill={tree}/>
        <polygon points="813,110 820,97 827,110" fill={tree}/>

        <rect x="840" y="129" width="2" height="11" fill={tree}/>
        <polygon points="833,129 841,112 849,129" fill={tree}/>
        <polygon points="834,122 841,107 848,122" fill={tree}/>

        <rect x="856" y="130" width="2" height="10" fill={tree}/>
        <polygon points="850,130 857,116 864,130" fill={tree}/>
        <polygon points="851,123 857,111 863,123" fill={tree}/>
      </svg>
    </div>
  );
}

/* ── Sky ──────────────────────────────────────────────────────── */
function SkyBanner({ isDark }) {
  const skyTop    = isDark ? '#0A1628' : '#B8D4E8';
  const skyBottom = isDark ? '#162030' : '#E8F4FB';
  const cloud1    = isDark ? 'rgba(30,60,90,0.7)'   : 'rgba(255,255,255,0.95)';
  const cloud2    = isDark ? 'rgba(25,50,78,0.55)'  : 'rgba(255,255,255,0.80)';
  const cloud3    = isDark ? 'rgba(20,42,65,0.45)'  : 'rgba(230,244,252,0.90)';
  const birdColor = isDark ? '#4A7BA0' : '#5A8CB0';

  return (
    <div className="w-full overflow-hidden shrink-0" style={{ height: 140 }}>
      <svg
        viewBox="0 0 1440 140"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="skybg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="1440" height="140" fill="url(#skybg)" />

        {/* Far clouds (small) */}
        <path d="M80,70 Q90,55 110,60 Q118,48 132,56 Q142,50 152,58 Q158,65 145,72 Q120,76 95,74 Q82,75 80,70Z" fill={cloud3}/>
        <path d="M1200,55 Q1212,42 1228,48 Q1237,38 1250,44 Q1260,38 1270,46 Q1278,54 1265,60 Q1245,65 1220,62 Q1203,62 1200,55Z" fill={cloud3}/>

        {/* Mid clouds */}
        <path d="M320,82 Q335,65 360,70 Q372,55 395,63 Q410,54 425,64 Q440,70 430,80 Q412,88 375,86 Q342,88 320,82Z" fill={cloud2}/>
        <path d="M940,65 Q958,50 985,56 Q998,44 1018,52 Q1030,44 1045,54 Q1058,62 1045,72 Q1022,80 988,78 Q960,80 940,72 Q934,69 940,65Z" fill={cloud2}/>

        {/* Near clouds (large, foreground) */}
        <path d="M-20,105 Q5,85 40,92 Q58,75 90,83 Q108,70 130,80 Q148,72 168,82 Q185,90 175,105 Q148,116 90,114 Q40,116 5,112 Q-18,112 -20,105Z" fill={cloud1}/>
        <path d="M480,95 Q505,78 540,86 Q558,68 592,78 Q614,66 638,78 Q660,86 648,100 Q620,112 570,110 Q520,112 490,106 Q474,103 480,95Z" fill={cloud1}/>
        <path d="M1100,100 Q1125,82 1160,90 Q1180,72 1214,82 Q1236,70 1258,82 Q1278,90 1268,105 Q1242,116 1195,114 Q1148,116 1118,108 Q1103,104 1100,100Z" fill={cloud1}/>

        {/* Birds */}
        <path d="M250,40 Q255,35 260,40" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M257,36 Q262,31 267,36" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M750,28 Q755,23 760,28" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M757,24 Q762,19 767,24" stroke={birdColor} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
