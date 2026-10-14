import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { heroImage } from "../../data/catalog";

export function HeroSection() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-12 md:grid-cols-[0.86fr_1.14fr] md:py-20 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <p className="eyebrow">Engineered for precision</p>
        <h1 className="mt-5 text-[clamp(3rem,8vw,7.4rem)] font-black leading-[0.9] tracking-[-0.04em]">
          <span className="text-orange">Precision</span> Printing.
          <br />
          Built for Industry.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
          Discover reliable wire-marking and industrial printing solutions designed to make identification clearer, workflows smoother, and production more efficient.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="premium-button justify-center" to="/products">
            Explore Products <ArrowRight size={17} />
          </Link>
          <button className="secondary-button justify-center" onClick={() => setDemoOpen(true)}>
            Watch Machine Demo <Play size={16} />
          </button>
        </div>
        <p className="mt-5 max-w-xl text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Replaceable product imagery shown until verified EnsureSolution assets are supplied.
        </p>
      </motion.div>

      <motion.div
        className="relative overflow-hidden rounded-[28px] border border-line bg-soft shadow-soft"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.55 }}
      >
        <img className="aspect-[1.35] w-full object-cover" src={heroImage} alt="Industrial wire marking machine" />
        <div className="absolute bottom-5 left-5 rounded-2xl bg-paper/94 p-4 shadow-card backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-orange">Wire identification</p>
          <p className="mt-1 text-sm font-bold">Machine, tutorials, quote, and support workflows.</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {demoOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center bg-ink/60 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-3xl rounded-[28px] bg-paper p-5 shadow-soft"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black">Machine Demo Preview</h2>
                <button className="icon-button" onClick={() => setDemoOpen(false)} aria-label="Close demo">
                  <X size={20} />
                </button>
              </div>
              <div className="grid aspect-video place-items-center rounded-2xl bg-ink text-center text-white">
                <div>
                  <Play className="mx-auto mb-4 text-orange" size={44} />
                  <p className="text-sm font-bold uppercase tracking-[0.16em]">Connect tutorial video hosting here</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
