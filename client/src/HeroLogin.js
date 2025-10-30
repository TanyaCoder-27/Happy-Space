import React from 'react';
import styles from './HeroLogin.module.css';

const backendUrl = 'http://localhost:5000';

export default function HeroLogin() {
  return (
    <div className={styles.heroRoot}>
      <div className={styles.heroLeft}>
        <div className={styles.appTitle}>Happy Space ✨</div>
        <div className={styles.appSubtitle}>
          Explore joyful visuals 🎉 from Unsplash, curate your favourites ❤️, discover what’s trending 🔥, and revisit your personal search history 🕘 — all in one happy place 😊.
        </div>
        <div className={styles.featureList}>
          <div className={styles.featureChip}>Happy Image Search 🔎</div>
          <div className={styles.featureChip}>Multi‑Select Grid ✅</div>
          <div className={styles.featureChip}>Top Searches 🔝</div>
          <div className={styles.featureChip}>Your History 🧭</div>
        </div>
      </div>
      <div className={styles.heroRight}>
        <div className={styles.heroLoginBox}>
          <h2>Login to Continue</h2>
          <a href={`${backendUrl}/auth/google`} style={{ width: '100%', textDecoration: 'none' }}>
            <button className={`${styles.heroOAuthBtn} ${styles.google}`}>
              <i className={`fab fa-google ${styles.heroOAuthIcon}`}></i>
              Login with Google
            </button>
          </a>
          <a href={`${backendUrl}/auth/facebook`} style={{ width: '100%', textDecoration: 'none' }}>
            <button className={`${styles.heroOAuthBtn} ${styles.facebook}`}>
              <i className={`fab fa-facebook-f ${styles.heroOAuthIcon}`}></i>
              Login with Facebook
            </button>
          </a>
          <a href={`${backendUrl}/auth/github`} style={{ width: '100%', textDecoration: 'none' }}>
            <button className={`${styles.heroOAuthBtn} ${styles.github}`}>
              <i className={`fab fa-github ${styles.heroOAuthIcon}`}></i>
              Login with GitHub
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
