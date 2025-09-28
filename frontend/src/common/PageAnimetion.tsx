import { motion, type HTMLMotionProps } from "motion/react";
import React, { type ReactNode } from "react";

interface PageAnimationProps {
  index: number;
  children: ReactNode;
  initial?: HTMLMotionProps<"div">["initial"];
  animate?: HTMLMotionProps<"div">["animate"];
  transition?: HTMLMotionProps<"div">["transition"];
}

const PageAnimation: React.FC<PageAnimationProps> = ({
  index,
  children,
  initial = { opacity: 0, y: 30 },
  animate = { opacity: 1, y: 0 },
  transition = { delay: 0.2 * index, duration: 0.5 },
}) => {
  return (
    <motion.div
      key={index}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default PageAnimation;
