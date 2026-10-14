import { Link } from "react-router-dom";

const columns = [
  {
    title: "Products",
    links: ["Wire Marking", "Industrial Printing", "Support Kits", "Manuals"],
  },
  {
    title: "Company",
    links: ["About Us", "Contact", "Customer Support", "Machine Tutorials"],
  },
  {
    title: "Account",
    links: ["Login", "Orders", "Invoices", "Warranty"],
  },
  {
    title: "Policies",
    links: ["Shipping", "Returns", "Privacy Policy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-soft">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-8">
        <div>
          <Link to="/" className="mb-5 inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-sm font-black uppercase text-white">
              ES
            </span>
            <span className="text-sm font-black uppercase tracking-[0.18em]">EnsureSolution</span>
          </Link>
          <p className="max-w-sm text-sm leading-7 text-muted">
            Premium industrial wire marking and business management tools for teams that need clearer identification, support, and order workflows.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-4 text-xs font-black uppercase tracking-[0.16em]">{column.title}</h2>
            <ul className="space-y-3 text-sm text-muted">
              {column.links.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-3 border-t border-line px-5 py-6 text-xs text-muted sm:flex-row lg:px-8">
        <span>Copyright 2026 EnsureSolution. All rights reserved.</span>
        <span>Contact details and social links can be configured by the owner.</span>
      </div>
    </footer>
  );
}
