import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../services/cart";

const links = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Products", to: "/products" },
  { label: "Solutions", to: "/solutions" },
  { label: "Tutorials", to: "/tutorials" },
  { label: "Contact", to: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/92 backdrop-blur">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="group flex items-center gap-3" aria-label="EnsureSolution home">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-sm font-black uppercase text-white">
            ES
          </span>
          <span className="hidden text-sm font-black uppercase tracking-[0.18em] sm:block">
            EnsureSolution
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-xs font-bold uppercase tracking-[0.14em] transition ${
                  isActive ? "text-orange" : "text-muted hover:text-ink"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="icon-button hidden sm:grid" aria-label="Search products">
            <Search size={18} />
          </button>
          <Link className="icon-button hidden sm:grid" to="/login" aria-label="Account login">
            <UserRound size={18} />
          </Link>
          <Link className="icon-button relative" to="/cart" aria-label={`${count} cart items`}>
            <ShoppingCart size={18} />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[10px] font-black text-white">
              {count}
            </span>
          </Link>
          <Link className="premium-button hidden xl:inline-flex" to="/contact">
            Request a Quote <ArrowRight size={16} />
          </Link>
          <button className="icon-button lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-ink/30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.aside
              className="ml-auto flex h-full w-[min(88vw,380px)] flex-col gap-8 bg-paper p-6 shadow-soft"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-[0.18em]">Menu</span>
                <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-2xl border border-line px-4 py-3 text-sm font-bold uppercase tracking-[0.14em]"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link className="premium-button justify-center" to="/contact" onClick={() => setOpen(false)}>
                Request a Quote <ArrowRight size={16} />
              </Link>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
