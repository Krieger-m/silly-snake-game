"use client";

import styles from "./page.module.css";
import Link from "next/link";

export default function MainPage() {
  return (
    <div
      className={`${styles.page} ${styles.centerContent}`}
    >
      <h1>- Snake-Game -</h1>
      <p>press the new game button to play</p>
      <Link href={"/game"} className={styles.buttonLink}>
        New Game
      </Link>
    </div>
  );
}
