import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { FAQPage } from './components/FAQPage';

type Page = 'home' | 'faq';

function getPageFromHash(): Page {
  const hash = window.location.hash;
  if (hash === '#/faq') return 'faq';
  return 'home';
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = page === 'home' ? '/' : `#/${page}`;
  };

  return (
    <div className="bg-bg text-text font-sans antialiased">
      {currentPage === 'faq' ? (
        <FAQPage onNavigate={navigate} />
      ) : (
        <LandingPage onNavigate={navigate} />
      )}
    </div>
  );
};

export default App;
