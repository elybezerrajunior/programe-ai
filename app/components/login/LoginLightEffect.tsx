import styles from './LoginLightEffect.module.scss';

export function LoginLightEffect() {
  return (
    <div className={styles.lightContainer}>
      <div className={`${styles.lightOrb} ${styles.light1}`}></div>
      <div className={`${styles.lightOrb} ${styles.light2}`}></div>
      <div className={`${styles.lightOrb} ${styles.light3}`}></div>
    </div>
  );
}

