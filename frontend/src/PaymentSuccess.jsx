import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from './lib/api';
import Navbar from "@/components/Navbar";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);
  const [packageId, setPackageId] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    let timer;
    const poll = async (n) => {
      if (n >= 8) {
        setStatus("timeout");
        return;
      }
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        setPackageId(data.package_id);
        if (data.payment_status === "paid") {
          setStatus("success");
        } else if (data.status === "expired") {
          setStatus("expired");
        } else {
          setAttempts(n + 1);
          timer = setTimeout(() => poll(n + 1), 2000);
        }
      } catch {
        setStatus("error");
      }
    };
    poll(0);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white" data-testid="payment-success-page">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
          {status === "checking" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Verificăm plata...</h2>
              <p className="text-slate-500 mt-2">Te rugăm să aștepți câteva secunde.</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Plată reușită! 🎉</h2>
              <p className="text-slate-600 mb-6">Pachetul <strong>{packageId}</strong> a fost activat în contul tău.</p>
              <button data-testid="success-go-dashboard" onClick={() => navigate("/cont")} className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
                Mergi la cont <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {(status === "error" || status === "expired" || status === "timeout") && (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-100 mx-auto flex items-center justify-center mb-6">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Plata nu s-a putut confirma</h2>
              <p className="text-slate-500 mb-6">Poți încerca din nou sau ne poți contacta dacă suma a fost retrasă.</p>
              <button onClick={() => navigate("/pachete")} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
                Înapoi la pachete
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
