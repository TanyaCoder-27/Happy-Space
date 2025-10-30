import React from 'react';
import styles from './HeroLogin.module.css';

const backendUrl = 'http://localhost:5000';

export default function HeroLogin() {
  function handleOAuthLogin(provider) {
    fetch(`${backendUrl}/logout`, { credentials: 'include' }).finally(() => {
      window.location.href = `${backendUrl}/auth/${provider}`;
    });
  }

  return (
    <div className={styles.heroRoot}>
      <div className={styles.heroLeft}>
        <div className={styles.appTitle}>ImageMaster Search Portal</div>
        <div className={styles.appSubtitle}>
          Instantly search Unsplash images, multi-select your favorites, discover trending terms, and track your own search history—all for registered users!
        </div>
        <div className={styles.featureList}>
          <div className={styles.featureChip}>Image Search</div>
          <div className={styles.featureChip}>Multi-Select Grid</div>
          <div className={styles.featureChip}>Top Searches</div>
          <div className={styles.featureChip}>Search History</div>
        </div>
      </div>
      <div className={styles.heroRight}>
        <div className={styles.heroLoginBox}>
          <h2>Login to Continue</h2>
          <button
            className={`${styles.heroOAuthBtn} ${styles.google}`}
            type="button"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => handleOAuthLogin('google')}
          >
            <i className={`fab fa-google ${styles.heroOAuthIcon}`}></i>
            Login with Google
          </button>
          <button
            className={`${styles.heroOAuthBtn} ${styles.facebook}`}
            type="button"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => handleOAuthLogin('facebook')}
          >
            <i className={`fab fa-facebook-f ${styles.heroOAuthIcon}`}></i>
            Login with Facebook
          </button>
          <button
            className={`${styles.heroOAuthBtn} ${styles.github}`}
            type="button"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => handleOAuthLogin('github')}
          >
            <i className={`fab fa-github ${styles.heroOAuthIcon}`}></i>
            Login with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
