import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from './lib/api';
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WaveDivider } from "@/components/Wave";
import { Calendar, Clock, Users, Lock, Video, Sparkles, CheckCircle2 } from "lucide-react";

const LiveSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);

  const load = async () => {
    if (!user) {
      navigate("/autentificare");
      return;
    }
    try {
      const { data } = await api.get("/live-sessions");
      setSessions(data);
    } catch {
      toast.error("Eroare la încărcare");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const register = async (sessionId) => {
    setRegisteringId(sessionId);
    try {
      await api.post("/live-sessions/register", { session_id: sessionId });
      toast.success("Te-ai înscris la sesiune!");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare la înscriere");
    }
    setRegisteringId(null);
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div data-testid="sessions-page">
      <Navbar />
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-4">
            <Video className="w-4 h-4" /> Sesiuni live
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>
            Cursuri live cu profesorii noștri
          </h1>
          <p className="text-lg text-slate-600">Învață direct de la sursă. Întreabă orice, în timp real.</p>
        </div>
        <WaveDivider color="#ffffff" />
      </section>

      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-6 space-y-4">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Se încarcă...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-slate-500 py-10">Nicio sesiune planificată momentan.</p>
          ) : (
            sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`flex flex-col md:flex-row gap-6 p-6 rounded-3xl border-2 transition-all ${s.required_package === "premium" ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white" : "border-slate-100 bg-white"} hover:shadow-lg`}
                data-testid={`session-card-${i}`}
              >
                <div className="flex md:flex-col items-center md:items-start gap-3 md:w-40">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${s.subject === "romana" ? "bg-rose-100" : "bg-emerald-100"}`}>
                    <Calendar className={`w-7 h-7 ${s.subject === "romana" ? "text-rose-600" : "text-emerald-600"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.subject === "romana" ? "Română" : "Matematică"}</p>
                    {s.required_package === "premium" && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-semibold">
                        <Sparkles className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontFamily: "Outfit" }}>{s.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{s.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {s.professor}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(s.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {s.duration_min} min</span>
                    <span className="text-blue-600">{s.spots_left} locuri</span>
                  </div>
                </div>
                <div className="flex items-center md:w-40 md:justify-end">
                  {s.is_registered ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm" data-testid={`session-registered-${i}`}>
                      <CheckCircle2 className="w-4 h-4" /> Înscris
                    </span>
                  ) : !s.can_attend ? (
                    <Link to="/pachete" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-sm hover:bg-amber-200 transition-all">
                      <Lock className="w-4 h-4" /> Premium
                    </Link>
                  ) : (
                    <button
                      data-testid={`session-register-${i}`}
                      onClick={() => register(s.id)}
                      disabled={registeringId === s.id}
                      className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60"
                    >
                      Înscrie-mă
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LiveSessions;
