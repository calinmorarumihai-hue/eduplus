import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from './lib/api';
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, Loader2, BookOpen, Calculator, Flame, Medal, Trophy, Target, History, Award, Link2, X, ArrowRight } from "lucide-react";

const ChildCard = ({ child, onView, onUnlink }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-xl transition-all"
    data-testid={`child-card-${child.id}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
          {child.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>{child.full_name}</h3>
          <p className="text-xs text-slate-500">{child.email}</p>
        </div>
      </div>
      <button onClick={() => onUnlink(child.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Deconectează">
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="text-center p-2 rounded-xl bg-amber-50">
        <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{child.points}</p>
        <p className="text-xs text-slate-500">puncte</p>
      </div>
      <div className="text-center p-2 rounded-xl bg-orange-50">
        <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{child.current_streak}</p>
        <p className="text-xs text-slate-500">streak</p>
      </div>
      <div className="text-center p-2 rounded-xl bg-violet-50">
        <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{child.medals}</p>
        <p className="text-xs text-slate-500">medalii</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="p-2 rounded-xl bg-rose-50 flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-rose-600" />
        <span className="text-slate-700">RO: <strong>{child.score_romana}%</strong></span>
      </div>
      <div className="p-2 rounded-xl bg-emerald-50 flex items-center gap-2">
        <Calculator className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-slate-700">MAT: <strong>{child.score_matematica}%</strong></span>
      </div>
    </div>
    <button
      data-testid={`view-child-${child.id}`}
      onClick={() => onView(child.id)}
      className="w-full mt-4 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all inline-flex items-center justify-center gap-2 text-sm"
    >
      Vezi detalii <ArrowRight className="w-4 h-4" />
    </button>
  </motion.div>
);

const ChildDetails = ({ childId, onClose }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/parent/child/${childId}`).then(({ data }) => setData(data)).catch(() => toast.error("Eroare"));
  }, [childId]);

  if (!data) return null;
  const c = data.child;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        data-testid="child-details-modal"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{c.full_name}</h2>
            <p className="text-slate-500">{c.email} • {c.grade}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Trophy, label: "Puncte", value: c.points, color: "amber" },
            { icon: Flame, label: "Streak", value: c.current_streak, color: "orange" },
            { icon: Medal, label: "Medalii", value: c.medals, color: "violet" },
            { icon: Target, label: "Teste", value: c.total_tests, color: "blue" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <s.icon className={`w-4 h-4 text-${s.color}-600 mb-1`} />
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-rose-50">
            <p className="text-sm uppercase font-semibold text-rose-600 mb-1">Română</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{c.score_romana}%</p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50">
            <p className="text-sm uppercase font-semibold text-emerald-600 mb-1">Matematică</p>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{c.score_matematica}%</p>
          </div>
        </div>

        {c.ai_plan && (
          <div className="mb-6 p-5 rounded-2xl bg-blue-50 border border-blue-100">
            <h3 className="font-semibold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>📝 Plan AI personalizat</h3>
            <div className="whitespace-pre-wrap text-sm text-slate-700">{c.ai_plan}</div>
          </div>
        )}

        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
          <History className="w-5 h-5 text-amber-600" /> Istoric teste ({data.history.length})
        </h3>
        {data.history.length === 0 ? (
          <p className="text-slate-500 italic text-sm">Niciun test rezolvat încă.</p>
        ) : (
          <div className="space-y-2">
            {data.history.slice(0, 15).map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${h.score >= 70 ? "text-emerald-500" : h.score >= 40 ? "text-amber-500" : "text-rose-500"}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{h.subject} {h.category && <span className="text-xs text-slate-500">• {h.category}</span>}</p>
                    <p className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{h.score}%</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const ParentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [viewingChild, setViewingChild] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "parent") {
      navigate("/cont");
      return;
    }
    load();
  }, [user, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/parent/children");
      setChildren(data);
    } catch {
      toast.error("Eroare la încărcare");
    }
    setLoading(false);
  };

  const linkChild = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLinking(true);
    try {
      const { data } = await api.post("/parent/link", { code: code.toUpperCase() });
      if (data.already_linked) {
        toast.info("Copilul este deja conectat");
      } else {
        toast.success(`${data.child_name} a fost conectat!`);
      }
      setCode("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cod invalid");
    }
    setLinking(false);
  };

  const unlink = async (childId) => {
    if (!confirm("Sigur vrei să deconectezi acest copil?")) return;
    try {
      await api.post(`/parent/unlink/${childId}`);
      toast.success("Copil deconectat");
      await load();
    } catch {
      toast.error("Eroare");
    }
  };

  if (!user || user.role !== "parent") return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="parent-dashboard">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider">Părinte</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
          Bine ai venit, <span className="text-blue-600">{user.full_name?.split(" ")[0]}</span>!
        </h1>
        <p className="text-slate-600 mt-2">Urmărește progresul copiilor tăi la pregătirea pentru Evaluarea Națională.</p>

        {/* Link new child */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid="link-child-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
            <UserPlus className="w-5 h-5 text-blue-600" /> Conectează un copil
          </h2>
          <p className="text-sm text-slate-500 mb-4">Cere-i copilului tău să genereze un cod din contul său (Cont → „Cod părinte”). Apoi introdu codul aici.</p>
          <form onSubmit={linkChild} className="flex flex-col sm:flex-row gap-3">
            <input
              data-testid="parent-link-input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX: ABC123"
              maxLength={6}
              className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-slate-900 font-mono text-lg tracking-wider text-center focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            />
            <button
              data-testid="parent-link-submit"
              type="submit"
              disabled={linking || code.length < 6}
              className="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Conectează
            </button>
          </form>
        </div>

        {/* Children list */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>Copiii tăi ({children.length})</h2>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          ) : children.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
              <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Niciun copil conectat încă. Folosește un cod pentru a începe.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {children.map((c) => (
                <ChildCard key={c.id} child={c} onView={setViewingChild} onUnlink={unlink} />
              ))}
            </div>
          )}
        </div>
      </div>
      {viewingChild && <ChildDetails childId={viewingChild} onClose={() => setViewingChild(null)} />}
      <Footer />
    </div>
  );
};

export default ParentDashboard;
