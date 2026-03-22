interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

const Skeleton = ({ width, height, borderRadius = 4, className = "" }: SkeletonProps) => (
  <div
    className={`animate-shimmer ${className}`}
    style={{
      width,
      height,
      borderRadius,
      background: "linear-gradient(90deg, #0F1820 0%, #1E2D40 50%, #0F1820 100%)",
      backgroundSize: "200% 100%",
    }}
  />
);

export default Skeleton;
