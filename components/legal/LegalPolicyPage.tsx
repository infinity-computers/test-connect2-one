type PolicySection = {
  title: string;
  items: string[];
};

type LegalPolicyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
};

const lastUpdated = "June 12, 2026";

export default function LegalPolicyPage({ eyebrow, title, description, sections }: LegalPolicyPageProps) {
  return (
    <div className="pt-14 bg-slate-950 min-h-screen">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-200 mb-4">
            {eyebrow}
          </div>
          <h1 className="heading-rhythm text-4xl font-bold mb-3">{title}</h1>
          <p className="copy-rhythm text-slate-300 max-w-2xl">{description}</p>
          <p className="mt-4 text-xs text-slate-500">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {sections.map((section, index) => (
          <section key={section.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-900/50 text-sm font-bold text-blue-200">
                {index + 1}
              </span>
              <h2 className="subheading-rhythm text-xl font-bold text-slate-100">{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  <p className="text-sm leading-relaxed text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="subheading-rhythm text-xl font-bold text-slate-100 mb-3">Contact</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Connect One Networks</p>
            <p>13(A), A-Building, Shubham Valley, Village: Tavra, Bharuch - 392011, Gujarat, India</p>
            <p>Email: <a href="mailto:care@connect2one.in" className="text-blue-300 hover:text-blue-200">care@connect2one.in</a></p>
            <p>Service / WhatsApp: <a href="tel:+919974955502" className="text-blue-300 hover:text-blue-200">99749 55502</a></p>
            <p>Sales: <a href="tel:+919974955542" className="text-blue-300 hover:text-blue-200">99749 55542</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
