import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WaveDivider } from "@/components/Wave";
import { Check, Loader2, Sparkles } from "lucide-react";

const Packages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    api.get("/packages").then(({ data }) => setPackages(data));
  }, []);

  const buy = async (pkg) => {
    if (!user) {
      toast.error("Autentifică-te ca să cumperi un pachet");
      navigate("/autentificare");
      return;
    }
    setLoadingId(pkg.id);
    try {
      const { data } = await api.post("/payments/checkout", {
        package_id: pkg.id,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare la plată");
      setLoadingId(null);
    }
  };

  return (
    <div data-testid="packages-page">
      <Navbar />
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Pachete educaționale
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>
            Alege valul potrivit pentru tine
          </h1>
          <p className="text-lg text-slate-600">Pachete clare, fără surprize. Acces instant după plată.</p>
        </div>
        <WaveDivider color="#ffffff" />
      </section>

      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 border-2 transition-all ${
                pkg.popular
                  ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white border-blue-700 shadow-2xl shadow-blue-300 scale-105"
                  : "bg-white border-slate-100 hover:border-blue-200 hover:-translate-y-1 shadow-md"
              }`}
              data-testid={`package-card-${pkg.id}`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-bold shadow-md">
                  CEL MAI POPULAR
                </span>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "Outfit" }}>
                {pkg.name}
              </h3>
              <p className={`text-sm mb-6 ${pkg.popular ? "text-blue-100" : "text-slate-500"}`}>{pkg.description}</p>
              <div className="mb-6">
                <span className={`text-5xl font-bold ${pkg.popular ? "text-white" : "text-slate-900"}`} style={{ fontFamily: "Outfit" }}>
                  {pkg.price}
                </span>
                <span className={`text-lg ml-1 ${pkg.popular ? "text-blue-100" : "text-slate-500"}`}>RON</span>
                <span className={`block text-xs mt-1 ${pkg.popular ? "text-blue-200" : "text-slate-400"}`}>plată unică</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${pkg.popular ? "text-amber-300" : "text-blue-600"}`} />
                    <span className={pkg.popular ? "text-blue-50" : "text-slate-700"}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                data-testid={`buy-${pkg.id}-btn`}
                onClick={() => buy(pkg)}
                disabled={loadingId === pkg.id}
                className={`w-full py-3 rounded-full font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? "bg-amber-400 text-slate-900 hover:bg-amber-500 hover:-translate-y-0.5"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 shadow-md"
                }`}
              >
                {loadingId === pkg.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Cumpără acum
              </button>
            </motion.div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Packages;
