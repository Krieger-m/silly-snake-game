import styles from "../page.module.css";
import SnakeGame from "../_components/SnakeGame";
import Link from "next/link";
import { Spacing } from "../_components/Spacing";

export default function GamePage() {
  return (
    <div className={`${styles.page} ${styles.centerContent}`}>
      <h1>~ Snake-Game ~</h1>
      <Spacing height={2} />
      <SnakeGame />
      <Link href={"/"} className={styles.buttonLink}>
        Back
      </Link>
    </div>
  );
}
