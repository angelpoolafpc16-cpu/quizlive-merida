export const cardVariants = {
  initial: { opacity: 0, scale: 0.82, y: 18 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.9, y: -14, transition: { duration: 0.18 } },
};

export const optionContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const optionItemVariants = {
  initial: { opacity: 0, scale: 0.6, y: 14 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 16 },
  },
};

export const popVariants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
};
