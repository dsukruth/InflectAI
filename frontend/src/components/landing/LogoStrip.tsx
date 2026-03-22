const companies = [
  "apple.com", "nvidia.com", "tesla.com", "microsoft.com",
  "amazon.com", "google.com", "meta.com", "netflix.com",
  "visa.com", "jpmorgan.com", "goldmansachs.com",
  "walmart.com", "disney.com", "amd.com", "intel.com",
  "salesforce.com", "oracle.com", "adobe.com", "spotify.com",
  "paypal.com", "airbnb.com", "uber.com", "coinbase.com",
];

const LOGO_TOKEN = "pk_AH1Nlal1QY6dlBilaz85Bg";

const LogoStrip = () => (
  <section className="py-10 border-t border-b border-border overflow-hidden" style={{ background: "hsl(var(--background))" }}>
    <p className="text-center text-[11px] text-muted-foreground tracking-[0.2em] uppercase mb-8">
      Research any of these companies
    </p>
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[120px] z-[2]" style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-[120px] z-[2]" style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />
      <div className="flex animate-marquee w-max">
        {[...companies, ...companies].map((domain, i) => (
          <div key={`${domain}-${i}`} className="flex items-center justify-center mx-8 shrink-0">
            <div className="rounded-full p-[2px] transition-all duration-300" style={{ boxShadow: "0 0 10px rgba(240,165,0,0.3), inset 0 0 10px rgba(240,165,0,0.1)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 18px rgba(240,165,0,0.6), inset 0 0 12px rgba(240,165,0,0.2)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 10px rgba(240,165,0,0.3), inset 0 0 10px rgba(240,165,0,0.1)"; }}>
              <img
                src={`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=48`}
                alt={domain.replace(".com", "")}
                loading="lazy"
                className="w-12 h-12 rounded-full opacity-80 hover:scale-[1.15] transition-all duration-300 ring-1 ring-primary/30"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LogoStrip;
