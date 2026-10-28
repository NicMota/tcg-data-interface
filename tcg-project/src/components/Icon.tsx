export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    insights: (
      <>
        <path d="m3 17 6-6 4 3 8-10" />
        <path d="M15 4h6v6" />
      </>
    ),
    cards: (
      <>
        <rect x="7" y="4" width="13" height="17" rx="2" />
        <path d="M16 4V2H4v16h3M11 9h5M11 13h5" />
      </>
    ),
    charts: (
      <>
        <path d="M3 3v18h18M7 16v-5M12 16V6M17 16v-8" />
      </>
    ),
    favorites: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    inventory: (
      <>
        <path d="m3 7 9-4 9 4v10l-9 4-9-4ZM3 7l9 4 9-4M12 11v10M7 5l10 4" />
      </>
    ),
    admin: (
      <>
        <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    logout: (
      <>
        <path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    plus: <path d="M12 4v16M4 12h16" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.cards}
    </svg>
  );
}
