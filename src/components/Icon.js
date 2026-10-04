import React from "react";
const paths = {
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  upload: (
    <>
      <path d="M12 16V3m-5 5 5-5 5 5M4 16v4h16v-4" />
    </>
  ),
  save: (
    <>
      <path d="M4 3h13l3 3v15H4zM7 3v6h9V3M8 21v-7h8v7" />
    </>
  ),
  folder: <path d="M3 7V4h7l2 3h9v13H3z" />,
  screen: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="1" />
      <path d="M8 21h8m-4-4v4" />
    </>
  ),
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />
    </>
  ),
  undo: (
    <>
      <path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14" />
    </>
  ),
  download: <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="1" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  search: (
    <>
      <circle cx="10" cy="10" r="6" />
      <path d="m15 15 6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  ticket: (
    <>
      <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 6v2m0 3v2m0 3v2" />
    </>
  ),
};
export default function Icon({ name, ...props }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
