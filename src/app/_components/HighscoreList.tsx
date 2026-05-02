import { getUsers } from "@/lib/actions";
import styles from "./highscore.module.css";

interface UserProps {
  score: number;
  username: string;
}

export default async function HighScoreList() {
  const users = await getUsers();
  return (
    <>
      <br />
      <p>scores</p>
      <br />

      <div className={styles.scoreList}>
        {(users as UserProps[]).map((user: UserProps, key: number) => (
          <div key={key} className={styles.scoreItem}>
            <div className={styles.nameItem}>
              <p style={{ width: 15 }}>{key + 1}.</p> <p>{user.username}</p>
            </div>{" "}
            <p>{user.score}</p>
          </div>
        ))}
      </div>
    </>
  );
}
