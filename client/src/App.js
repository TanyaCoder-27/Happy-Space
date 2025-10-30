import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styles from './StarfieldDashboard.module.css';
import HeroLogin from './HeroLogin';

const backendUrl = 'http://localhost:5000';

const TABS = ['Results', 'Downloads', 'Favourites'];

function Home({ user, onLogout }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [topSearches, setTopSearches] = useState([]);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [allResults, setAllResults] = useState([]);
  const [tab, setTab] = useState('Results');
  const [downloads, setDownloads] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [preview, setPreview] = useState(null); // modal image

  // utils
  const toMeta = (img, query) => ({
    url: (img.urls && (img.urls.full || img.urls.regular)) || img.url,
    thumb: (img.urls && img.urls.small) || img.thumb || img.url,
    query: query || term,
    description: img.alt_description || img.description || '',
    unsplashId: img.id || img.unsplashId || img.url
  });
  const isFav = (img) => {
    const id = img.id || img.unsplashId || img.url;
    return favourites.some(f => (f.unsplashId || f.url) === id);
  };

  // Fetch on login
  useEffect(() => {
    const fetchTopSearches = async () => { try { const res = await fetch(`${backendUrl}/api/top-searches`, { credentials: 'include' }); if (res.ok) setTopSearches(await res.json()); } catch {} };
    const fetchHistory = async () => { try { const res = await fetch(`${backendUrl}/api/history`, { credentials: 'include' }); if (res.ok) setHistory(await res.json()); } catch {} };
    const fetchDownloads = async () => { try { const res = await fetch(`${backendUrl}/api/downloads`, { credentials: 'include' }); if (res.ok) setDownloads((await res.json()).downloads || []);} catch {}};
    const fetchFavourites = async () => { try { const res = await fetch(`${backendUrl}/api/favourites`, { credentials: 'include' }); if (res.ok) setFavourites((await res.json()).favourites || []);} catch {}};
    fetchTopSearches();
    fetchHistory();
    fetchDownloads();
    fetchFavourites();
  }, []);

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
      setTab('Results');
      setSelected(new Set());
      const resFav = await fetch(`${backendUrl}/api/favourites`, { credentials: 'include' });
      if (resFav.ok) setFavourites((await resFav.json()).favourites || []);
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

  const handleTabSwitch = tab => {
    setTab(tab);
    setSelected(new Set());
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

  const refreshDownloads = async () => {
    try { const res = await fetch(`${backendUrl}/api/downloads`, { credentials: 'include' }); if (res.ok) setDownloads((await res.json()).downloads || []);} catch {}
  };
  const refreshFavourites = async () => {
    try { const res = await fetch(`${backendUrl}/api/favourites`, { credentials: 'include' }); if (res.ok) setFavourites((await res.json()).favourites || []);} catch {}
  };

  // file download helper
  const downloadFile = async (url, filename) => {
    try {
      const resp = await fetch(url, { mode: 'cors' });
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {}
  };

  const handleDownloadSelected = async () => {
    if (tab !== 'Results' || selected.size === 0) return;
    const selectedImages = allResults.filter(img => selected.has(img.id));
    const payload = selectedImages.map(img => toMeta(img, term));
    try {
      await fetch(`${backendUrl}/api/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ images: payload })
      });
      // Trigger real downloads one-by-one
      for (const meta of payload) {
        await downloadFile(meta.url || meta.thumb, `${meta.unsplashId || 'image'}.jpg`);
      }
      await refreshDownloads();
      setTab('Downloads');
      setSelected(new Set());
    } catch {}
  };

  const handleToggleFavourite = async (img) => {
    const fav = isFav(img);
    const meta = toMeta(img, term);
    try {
      await fetch(`${backendUrl}/api/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: meta, action: fav ? 'remove' : 'add' })
      });
      await refreshFavourites();
    } catch {}
  };

  const openPreview = (img) => {
    setPreview(toMeta(img, term));
  };
  const closePreview = () => setPreview(null);
  const downloadPreview = async () => {
    if (!preview) return;
    // persist & download single
    try {
      await fetch(`${backendUrl}/api/downloads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ images: [preview] })
      });
      await downloadFile(preview.url || preview.thumb, `${preview.unsplashId || 'image'}.jpg`);
      await refreshDownloads();
    } catch {}
  };
  const togglePreviewFav = async () => {
    if (!preview) return;
    try {
      await fetch(`${backendUrl}/api/favourites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: preview, action: isFav(preview) ? 'remove' : 'add' })
      });
      await refreshFavourites();
    } catch {}
  };

  // Which images to show based on tab
  let imagesToShow = [];
  if (tab === 'Results') imagesToShow = allResults;
  else if (tab === 'Downloads') imagesToShow = downloads;
  else if (tab === 'Favourites') imagesToShow = favourites;

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
      <div style={{width:'90vw',maxWidth:'1400px',margin:'0 auto 10px auto',display:'flex',gap:24,alignItems:'center'}}>
        {TABS.map(t => (
          <button key={t} onClick={() => handleTabSwitch(t)}
            style={{background:tab===t?'#5bf8ff33':'#fff0',color:tab===t?'#5bf8ff':'#9ad4ff',fontWeight:tab===t?700:500,border:'none',fontSize:'1.16em',margin:'0 9px',padding:'15px 38px',borderRadius:22,boxShadow:tab===t?'0 0 20px #5bf8ff44':'0 2px 10px #2b5eb433',letterSpacing:'.03em',outline:tab===t?'2px solid #5bf8ffaa':'none',transition:'background .17s,color .18s,box-shadow .18s,outline .13s',cursor:'pointer'}}>
            {t}
          </button>
        ))}
      </div>
      <div className={styles.dashBody}>
        <div className={styles.mainCard}>
          {tab === 'Results' && (
            <>
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
            </>
          )}

          {/* Toolbar for bulk actions */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'6px 0 14px 0' }}>
            <div style={{ color:'#fbd9ec' }}>{selected.size > 0 ? `Selected: ${selected.size}` : ''}</div>
            {tab==='Results' && (
              <button className={styles.searchBtn} onClick={handleDownloadSelected} disabled={selected.size===0} style={{opacity:selected.size===0?0.6:1}}>
                <i className="fas fa-download" style={{marginRight:10}}/> Download Selected
              </button>
            )}
          </div>

          {loadingSearch && tab==='Results' && <p style={{ color: '#fff', textAlign: 'center' }}>Loading results...</p>}
          {(imagesToShow && imagesToShow.length > 0) && (
            <div>
              {tab==='Results' && <div style={{ color: '#fbd9ec', marginBottom: '1em', fontWeight: 500, letterSpacing: '.01em' }}>
                You searched for "{results?.term}" — {results?.total} results. <span style={{ color: '#5bf8ff', marginLeft: 12 }}>Selected: {selected.size} images</span>
              </div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {imagesToShow.map(img => {
                  const id = img.unsplashId || img.id || img.url;
                  const fav = isFav(img);
                  const thumb = img.thumb || (img.urls && img.urls.small) || img.url;
                  return (
                  <div key={id} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 18px #111a 0 1px 14px #2d63a330', position: 'relative', transition: 'box-shadow .14s,transform .11s', background: '#181f2a' }}>
                    <img onClick={()=>openPreview(img)} src={thumb} alt={img.alt_description||img.description||''} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block', filter: selected.has(id) ? 'brightness(0.82)' : 'none', transition: 'filter .16s', cursor:'zoom-in' }} />
                    <input onClick={(e)=>{e.stopPropagation(); toggleSelect(id);}} type="checkbox" checked={selected.has(id)} readOnly style={{ position: 'absolute', top: 15, right: 15, width: 22, height: 22, accentColor: '#fc446f', borderRadius: 5, background: '#fff', cursor:'pointer' }} />
                    {/* Favourite icon */}
                    <button type="button" onClick={(e)=>{ e.stopPropagation(); handleToggleFavourite(img); }}
                      style={{ position:'absolute', left: 14, top: 12, width: 34, height: 34, borderRadius: '50%', border:'none', background: fav?'#ff4d7e':'#ffffffc0', color: fav?'#fff':'#d12e5b', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 10px #0005', cursor:'pointer' }}>
                      <i className="fas fa-heart" style={{pointerEvents:'none'}}></i>
                    </button>
                  </div>
                )})}
              </div>
              {tab==='Results' && results && results.page < results.totalPages && (
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

      {/* Fullscreen Modal Preview */}
      {preview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(7,10,20,0.85)', backdropFilter:'blur(2px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }} onClick={closePreview}>
          <div style={{ maxWidth:'90vw', maxHeight:'86vh', borderRadius:16, overflow:'hidden', background:'#0f1730', boxShadow:'0 8px 40px #0008', position:'relative' }} onClick={e=>e.stopPropagation()}>
            <img src={preview.url || preview.thumb} alt={preview.description||''} style={{ display:'block', maxWidth:'90vw', maxHeight:'70vh', objectFit:'contain' }} />
            <div style={{ display:'flex', gap:12, padding:'14px 16px', justifyContent:'flex-end' }}>
              <button className={styles.searchBtn} onClick={downloadPreview}><i className="fas fa-download" style={{marginRight:8}}/>Download</button>
              <button className={styles.searchBtn} onClick={togglePreviewFav}><i className="fas fa-heart" style={{marginRight:8}}/>Favourite</button>
              <button className={styles.searchBtn} onClick={closePreview}><i className="fas fa-times" style={{marginRight:8}}/>Close</button>
            </div>
          </div>
        </div>
      )}
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