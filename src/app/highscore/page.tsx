import HighScoreList from "../_components/HighscoreList";
import { Spacing } from "../_components/Spacing";
import styles from "../page.module.css";
import Link from "next/link";

export default function MainPage() {
  return (
    <div className={`${styles.page} ${styles.centerContent}`}>
      <h1>~ Snake-Game High-Score ~</h1>
      <br />
      <HighScoreList />
      <br />
      <p>press the new game button to play</p>
      <Link href={"/game"} className={styles.buttonLink}>
        New Game
      </Link>
      <Spacing height={4} />
      <Link href={"/"} className={styles.buttonLink}>
        Back
      </Link>
    </div>
  );
}
