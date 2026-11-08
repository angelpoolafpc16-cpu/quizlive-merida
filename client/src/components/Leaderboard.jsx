import { motion } from 'framer-motion';

export default function Leaderboard({ entries }) {
  return (
    <div className="stack" style={{ maxWidth: 480, width: '100%' }}>
      {entries.map((p, i) => (
        <motion.div
          key={p.name}
          className="leaderboard-row"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <span>
            <span className="leaderboard-rank">#{i + 1}</span>
            {p.name}
          </span>
          <span>{p.score} pts</span>
        </motion.div>
      ))}
    </div>
  );
}
