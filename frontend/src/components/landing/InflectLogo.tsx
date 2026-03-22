import logo from "@/assets/inflect-logo.png";

const InflectLogo = ({ size = 48, className = "" }: { size?: number; className?: string }) => (
  <a href="#" className={`flex items-center gap-3 ${className}`}>
    <img
      src={logo}
      alt="Inflect"
      style={{ height: size }}
      className="object-contain"
    />
  </a>
);

export default InflectLogo;
