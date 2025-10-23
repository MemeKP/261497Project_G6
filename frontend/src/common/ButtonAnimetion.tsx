import { motion, type HTMLMotionProps } from "motion/react";

interface ButtonAnimationProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

const ButtonAnimation: React.FC<ButtonAnimationProps> = ({
  children,
  whileHover,
  whileTap,
  ...rest
}) => {
  return (
    <motion.button
      whileHover={whileHover || { scale: 1.03 }}
      whileTap={whileTap || { scale: 0.95 }}
      onHoverStart={() => console.log("hover started!")}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default ButtonAnimation;