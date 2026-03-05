"use client";

import styles from "../page.module.css";
import SnakeGame from "../_components/SnakeGame";
import Link from "next/link";

export default function GamePage() {
  return (
    <div
      className={styles.page}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <SnakeGame />
      <a href={"/"}><div style={{border: "3px solid white", borderRadius: 5, padding: 10}}>Back</div></a>
    </div>
  );
}
