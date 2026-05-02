
import { seedUsers } from "@/lib/seed";
import styles from "./page.module.css";
import Link from "next/link";
import { getUsers, insertUser } from "@/lib/actions";

export default async function MainPage() {
  // seedUsers()

  // const a = await insertUser('Peter', 5)

  // const res = await getUsers()
  // console.log(res)

  return (
    <div
      className={`${styles.page} ${styles.centerContent}`}
    >
      <h1>~ Snake-Game ~</h1>
      <br/>
      <p>press the new game button to play</p>
      <Link href={"/game"} className={styles.buttonLink}>
        New Game
      </Link>
      <br/>
      <p>view the highscore list</p>
      <Link href={"/highscore"} className={styles.buttonLink}>
        Highscore
      </Link>
      <br/>
      <br/>
      <br/>
      <br/>
      <a href={"https://mk-dev.org/projects"} className={styles.buttonLink}>
        Back
      </a>
    </div>
  );
}
