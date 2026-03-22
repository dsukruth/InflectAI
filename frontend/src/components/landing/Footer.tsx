import { Link } from "react-router-dom";
import InflectLogo from "./InflectLogo";

const sectionAnchors: Record<string, string> = {
  Features: "#features",
  Pricing: "#cta",
  Demo: "#dashboard-preview",
};

const links = {
  Product: ["Features", "Pricing", "Demo", "API"],
  Research: ["SEC Filings", "Wolfram|Alpha", "Earnings", "Sentiment"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security", "Status"],
};

const Footer = () => (
  <footer className="border-t border-border py-16 px-6" style={{ background: "#060A12" }}>
    <div className="max-w-6xl mx-auto grid md:grid-cols-6 gap-10">
      <div className="md:col-span-2">
        <Link to="/" className="mb-3 inline-block">
          <InflectLogo size={48} />
        </Link>
        <p className="text-muted-foreground text-sm">Find the inflection point.</p>
      </div>

      {Object.entries(links).map(([title, items]) => (
        <div key={title}>
          <p className="text-foreground text-xs font-semibold tracking-wider uppercase mb-4">{title}</p>
          <ul className="space-y-2.5">
            {items.map((item) => {
              const anchor = sectionAnchors[item];
              return (
                <li key={item}>
                  {anchor ? (
                    <a href={anchor} className="text-muted-foreground text-sm hover:text-primary transition-colors">
                      {item}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer">
                      {item}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>

    <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="text-muted-foreground text-xs">© 2026 Inflect. All rights reserved.</p>
      <p className="text-muted-foreground text-xs">Built at HooHacks 2026 🦉 UVA</p>
    </div>
  </footer>
);

export default Footer;
