import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "../components/layout/Footer";
import { Navbar } from "../components/layout/Navbar";
import { HomePage } from "../pages/HomePage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { TutorialsPage } from "../pages/TutorialsPage";
import { AboutPage } from "../pages/AboutPage";
import { ContactPage } from "../pages/ContactPage";
import { LoginPage } from "../pages/LoginPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { SignupPage } from "../pages/SignupPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OwnerPortal } from "../pages/portals/OwnerPortal";
import { StaffPortal } from "../pages/portals/StaffPortal";
import { CustomerPortal } from "../pages/portals/CustomerPortal";
import { AuthProvider, ProtectedPortalRoute } from "../services/auth";
import { CartProvider } from "../services/cart";
import { PortalDataProvider } from "../services/portalData";

function AppLayout() {
  const location = useLocation();
  const isAdminLogin = location.pathname === "/adminlogin";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <WelcomeOverlay />
      {!isAdminLogin ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/solutions" element={<ProductsPage />} />
        <Route path="/tutorials" element={<TutorialsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/adminlogin" element={<AdminLoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route
          path="/owner"
          element={
            <ProtectedPortalRoute allowedRoles={["owner"]}>
              <OwnerPortal />
            </ProtectedPortalRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedPortalRoute allowedRoles={["staff"]}>
              <StaffPortal />
            </ProtectedPortalRoute>
          }
        />
        <Route
          path="/customer"
          element={
            <ProtectedPortalRoute allowedRoles={["customer"]}>
              <CustomerPortal />
            </ProtectedPortalRoute>
          }
        />
      </Routes>
      {!isAdminLogin ? <Footer /> : null}
    </div>
  );
}

function WelcomeOverlay() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {isVisible ? (
        <motion.div
          key={location.pathname}
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-slate-950"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,118,54,0.24),transparent_45%)]"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center"
          >
            <p className="text-xs font-black uppercase tracking-[0.45em] text-orange/90">Ensuring every detail</p>
            <h1 className="mt-5 text-[clamp(2.25rem,7vw,7rem)] font-black leading-none tracking-[-0.06em] text-white">
              Welcome to EnsureSolution
            </h1>
            <div className="mt-6 flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              <span className="h-px w-12 bg-white/30" />
              Industrial workflows, reimagined
              <span className="h-px w-12 bg-white/30" />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <PortalDataProvider>
          <AppLayout />
        </PortalDataProvider>
      </AuthProvider>
    </CartProvider>
  );
}
