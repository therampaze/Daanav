import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Donations from './components/Donations.jsx';
import Allocations from './components/Allocations.jsx';

const PAGES = {
  dashboard: { label: 'Dashboard', Component: Dashboard },
  donations: { label: 'Donations', Component: Donations },
  allocations: { label: 'Allocations', Component: Allocations },
};

function currentPage() {
  const key = window.location.hash.replace('#/', '');
  return PAGES[key] ? key : 'dashboard';
}

export default function App() {
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    const onHashChange = () => setPage(currentPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const { Component } = PAGES[page];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#/dashboard">Daanav</a>
          <nav className="nav" aria-label="Main">
            {Object.entries(PAGES).map(([key, { label }]) => (
              <a
                key={key}
                href={`#/${key}`}
                className={key === page ? 'active' : undefined}
                aria-current={key === page ? 'page' : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="main">
        <Component />
      </main>
    </div>
  );
}
