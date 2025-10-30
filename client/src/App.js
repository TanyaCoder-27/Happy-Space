import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './StarfieldDashboard.module.css';
import HeroLogin from './HeroLogin';

const backendUrl = 'http://localhost:5000';

function Home({ user, onLogout }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [topSearches, setTopSearches] = useState([]);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]); // all loaded images

  const fetchHistory = async () => { try { const res = await fetch(`${backendUrl}/api/history`, { credentials: 'include' }); if (res.ok) { setHistory(await res.json()); } } catch {} };
  useEffect(() => { const fetchTopSearches = async () => { try { const res = await fetch(`${backendUrl}/api/top-searches`, { credentials: 'include' }); if (res.ok) setTopSearches(await res.json()); } catch {} }; fetchTopSearches(); fetchHistory(); }, []);

  const handleSearch = async (e, searchTerm = term) => {
    if (e) e.preventDefault();
    if (!searchTerm) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(`${backendUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ term: searchTerm, page: 1 }),
      });
      const data = await res.json();
      setResults(data);
      setPage(1);
      setAllResults(data.results);
      fetchHistory();
    } catch {} finally {
      setLoadingSearch(false);
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingSearch(true);
    try {
      const res = await fetch(`${backendUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ term, page: nextPage }),
      });
      const data = await res.json();
      setResults(data);
      setPage(nextPage);
      setAllResults(prev => [...prev, ...data.results]);
    } catch {} finally {
      setLoadingSearch(false);
    }
  };

  const handleTopSearchClick = (topTerm) => {
    setTerm(topTerm);
    handleSearch(null, topTerm);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  return (
    <div className={styles.starBg}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center'}}>
          {user.photo ? (
            <img src={user.photo} alt="Profile" className={styles.profileIcon} style={{objectFit: 'cover', width: 44, height: 44, borderRadius: '50%'}} />
          ) : (
            <span className={styles.profileIcon}><i className="fas fa-user"/></span>
          )}
          <span className={styles.welcome}>Welcome, {user.displayName}!</span>
        </div>
        <button className={styles.logoutBtn} onClick={onLogout}>Logout</button>
      </div>
      <div className={styles.dashBody}>
        <div className={styles.mainCard}>
          <div className={styles.topSearchRow}>
            <span className={styles.topSearchLabel}>Top Searches:</span>
            {topSearches.map((s, idx) => (
              <button key={idx} className={styles.topChip + (term === s.term ? ' '+styles.selected : '')} onClick={() => handleTopSearchClick(s.term)}>
                {s.term}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className={styles.searchBarRow}>
            <input type="text" value={term} onChange={e => setTerm(e.target.value)} className={styles.searchInput} placeholder="Search for images..." />
            <button type="submit" className={styles.searchBtn}>Search</button>
          </form>
          {loadingSearch && <p style={{ color: '#fff', textAlign: 'center' }}>Loading results...</p>}
          {(allResults && allResults.length > 0) && (
            <div>
              <div style={{ color: '#fbd9ec', marginBottom: '1em', fontWeight: 500, letterSpacing: '.01em' }}>
                You searched for "{results.term}" — {results.total} results. <span style={{ color: '#5bf8ff', marginLeft: 12 }}>Selected: {selected.size} images</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {allResults.map(img => (
                  <div key={img.id} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 18px #111a 0 1px 14px #2d63a330', cursor: 'pointer', position: 'relative', transition: 'box-shadow .14s,transform .11s', background: '#181f2a' }}
                    onClick={() => toggleSelect(img.id)}>
                    <img src={img.urls.small} alt={img.alt_description} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block', filter: selected.has(img.id) ? 'brightness(0.82)' : 'none', transition: 'filter .16s' }} />
                    <input type="checkbox" checked={selected.has(img.id)} readOnly style={{ position: 'absolute', top: 15, right: 15, width: 22, height: 22, accentColor: '#fc446f', borderRadius: 5, background: '#fff' }} />
                  </div>
                ))}
              </div>
              {results.page < results.totalPages && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                  <button className={styles.searchBtn} style={{ minWidth: 170, fontSize: '1.16em' }} onClick={handleLoadMore} disabled={loadingSearch}>Load More</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.sidebarCard}>
          <span className={styles.sidebarTitle}>Search History</span>
          <ul className={styles.historyList}>
            {history.map((item, idx) => (
              <li key={idx} className={styles.historyItem}>
                <b>{item.term}</b><br/>
                <span className={styles.historyTime}>{new Date(item.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${backendUrl}/auth/me`, { method: 'GET', credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data && data._id ? data : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch(`${backendUrl}/logout`, {
      method: 'GET',
      credentials: 'include',
    });
    setUser(null);
    window.location.href = '/login';
  };

  if (loading) return <div style={{textAlign:'center',marginTop:'5rem',color:'#fff'}}>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <HeroLogin />} />
        <Route path="/" element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;