// icons.jsx — Feather-style line icons (no external deps)

const Ic = ({ d, size = 18, stroke = 2, fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children || <path d={d} />}
  </svg>
);

const IcHome      = (p) => <Ic {...p}>{<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>}</Ic>;
const IcBed       = (p) => <Ic {...p}>{<><path d="M3 18V8"/><path d="M21 18v-6a3 3 0 0 0-3-3H3"/><circle cx="7.5" cy="11.5" r="2"/><path d="M3 18h18"/></>}</Ic>;
const IcWallet    = (p) => <Ic {...p}>{<><path d="M3 7v12a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13"/><circle cx="17" cy="14" r="1.4" fill="currentColor"/></>}</Ic>;
const IcContract  = (p) => <Ic {...p}>{<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></>}</Ic>;
const IcCalendar  = (p) => <Ic {...p}>{<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>}</Ic>;
const IcShield    = (p) => <Ic {...p} d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/>;
const IcChart     = (p) => <Ic {...p}>{<><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>}</Ic>;
const IcLayers    = (p) => <Ic {...p}>{<><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/></>}</Ic>;
const IcUser      = (p) => <Ic {...p}>{<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>}</Ic>;
const IcUsers     = (p) => <Ic {...p}>{<><circle cx="9" cy="8" r="4"/><path d="M2 21c1.2-4 3.7-6 7-6s5.8 2 7 6"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21c-.5-2.7-2-4.7-4-5.5"/></>}</Ic>;
const IcMail      = (p) => <Ic {...p}>{<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></>}</Ic>;
const IcLock      = (p) => <Ic {...p}>{<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>}</Ic>;
const IcKey       = (p) => <Ic {...p}>{<><circle cx="8" cy="14" r="4"/><path d="M11 11l9-9"/><path d="M16 6l3 3"/></>}</Ic>;
const IcArrow     = (p) => <Ic {...p}>{<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>}</Ic>;
const IcArrowL    = (p) => <Ic {...p}>{<><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></>}</Ic>;
const IcCheck     = (p) => <Ic {...p} d="M5 12l4.5 4.5L20 6"/>;
const IcX         = (p) => <Ic {...p}>{<><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>}</Ic>;
const IcInfo      = (p) => <Ic {...p}>{<><circle cx="12" cy="12" r="9"/><path d="M12 8v.01"/><path d="M11 12h1v5h1"/></>}</Ic>;
const IcAlert     = (p) => <Ic {...p}>{<><path d="M12 3l10 17H2z"/><path d="M12 10v5"/><path d="M12 18v.01"/></>}</Ic>;
const IcBell      = (p) => <Ic {...p}>{<><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z"/><path d="M10 21a2 2 0 0 0 4 0"/></>}</Ic>;
const IcSettings  = (p) => <Ic {...p}>{<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.3-1.3L13.7 3h-3.4l-.6 2.4a7 7 0 0 0-2.3 1.3l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.3 1.3l.6 2.4h3.4l.6-2.4a7 7 0 0 0 2.3-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/></>}</Ic>;
const IcLogout    = (p) => <Ic {...p}>{<><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>}</Ic>;
const IcSearch    = (p) => <Ic {...p}>{<><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></>}</Ic>;
const IcMenu      = (p) => <Ic {...p}>{<><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></>}</Ic>;
const IcBuilding  = (p) => <Ic {...p}>{<><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2"/><path d="M13 7h2"/><path d="M9 11h2"/><path d="M13 11h2"/><path d="M9 15h2"/><path d="M13 15h2"/></>}</Ic>;
const IcDoor      = (p) => <Ic {...p}>{<><path d="M5 21h14"/><path d="M7 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><circle cx="14" cy="13" r="0.7" fill="currentColor"/></>}</Ic>;
const IcStar      = (p) => <Ic {...p} d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6L12 17l-5.4 2.7 1-6L3.2 9.4l6.1-.9z"/>;
const IcReceipt   = (p) => <Ic {...p}>{<><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></>}</Ic>;
const IcSig       = (p) => <Ic {...p}>{<><path d="M3 17c2 0 3-1 4-3s2-7 4-7 1 6 3 6 3-3 7-3"/><path d="M3 21h18"/></>}</Ic>;
const IcUpload    = (p) => <Ic {...p}>{<><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/></>}</Ic>;
const IcDownload  = (p) => <Ic {...p}>{<><path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></>}</Ic>;
const IcMoon      = (p) => <Ic {...p} d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z"/>;
const IcGlobe     = (p) => <Ic {...p}>{<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></>}</Ic>;
const IcFilter    = (p) => <Ic {...p} d="M3 5h18l-7 9v6l-4-2v-4z"/>;
const IcSort      = (p) => <Ic {...p}>{<><path d="M7 4v16"/><path d="M3 8l4-4 4 4"/><path d="M17 20V4"/><path d="M21 16l-4 4-4-4"/></>}</Ic>;
const IcMore      = (p) => <Ic {...p}>{<><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></>}</Ic>;
const IcPlus      = (p) => <Ic {...p}>{<><path d="M12 5v14"/><path d="M5 12h14"/></>}</Ic>;
const IcEye       = (p) => <Ic {...p}>{<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}</Ic>;

Object.assign(window, {
  Ic, IcHome, IcBed, IcWallet, IcContract, IcCalendar, IcShield, IcChart, IcLayers,
  IcUser, IcUsers, IcMail, IcLock, IcKey, IcArrow, IcArrowL, IcCheck, IcX, IcInfo, IcAlert,
  IcBell, IcSettings, IcLogout, IcSearch, IcMenu, IcBuilding, IcDoor, IcStar, IcReceipt,
  IcSig, IcUpload, IcDownload, IcMoon, IcGlobe, IcFilter, IcSort, IcMore, IcPlus, IcEye
});
