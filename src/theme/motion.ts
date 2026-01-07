export const motion = {
  duration: {
    fast: 150,
    medium: 250,
    slow: 350,
  },
  easing: {
    standard: 'ease-in-out',
    out: 'ease-out',
    in: 'ease-in',
  },
  spring: {
    bouncy: {
      damping: 10,
      stiffness: 100,
    },
    snappy: {
      damping: 20,
      stiffness: 250,
    },
    gentle: {
      damping: 20,
      stiffness: 100,
    }
  },
  scale: {
    pressed: 0.96,
  }
};

export type MotionTokens = typeof motion
