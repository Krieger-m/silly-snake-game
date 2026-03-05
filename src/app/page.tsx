"use client";

import { useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

export default function MainPage() {
  return (
    <div
      className={styles.page}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h1>- Snake-Game -</h1>
      <br />
      <p>press the new game button to play</p>
      <br />
      <Link href={"/game"}><div style={{border: "3px solid white", borderRadius: 5, padding: 10}}>New Game</div></Link>
    </div>
  );
}
