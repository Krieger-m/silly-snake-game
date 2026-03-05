"use client";

import styles from "../page.module.css";
import SnakeGame from "../_components/SnakeGame";
import Link from "next/link";

export default function GamePage() {
  return (
    <div
      className={`${styles.page} ${styles.centerContent}`}
    >
      <SnakeGame />
      <Link href={"/"} className={styles.buttonLink}>
        Back
      </Link>
    </div>
  );
}
