import { motion } from 'framer-motion';

export default function Timer({ duration, questionIndex }) {
  return (
    <div className="timer-bar-track">
      <motion.div
        key={questionIndex}
        className="timer-bar-fill"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration, ease: 'linear' }}
      />
    </div>
  );
}
