import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trophy, Brain, BookOpen, Calculator, Sparkles, Loader2, History, Target, Award, Flame, Medal, Clock, Video, Link2, Copy, CheckCheck } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color, testid }) => (
  <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid={testid}>
    <div className={`w-11 h-11 rounded-2xl bg-${color}-100 flex items-center justify-center mb-3`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">{label}</p>
    <p className="text-3xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit" }}>{value}</p>
  </div>
);

const ProgressRing = ({ value, label, color }) => {
  const circ = 2 * Math.PI * 45;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="-rotate-90 w-32 h-32">
          <circle cx="64" cy="64" r="45" stroke="#e0e7ff" strokeWidth="10" fill="none" />
          <circle cx="64" cy="64" r="45" stroke={color} strokeWidth="10" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{value}%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-700 mt-3">{label}</p>
    </div>
  );
};

const Dashboard = () => {
  const { user, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [parentCode, setParentCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const generateParentCode = async () => {
    setGeneratingCode(true);
    try {
      const { data } = await api.post("/parent/generate-code");
      setParentCode(data.code);
      toast.success("Cod generat. Dă-l părintelui tău.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare");
    }
    setGeneratingCode(false);
  };

  const copyCode = () => {
    if (!parentCode) return;
    navigator.clipboard.writeText(parentCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/dashboard/me");
      setData(data);
    } catch {
      toast.error("Eroare la încărcarea contului");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const { data: res } = await api.post("/ai/study-plan");
      setData((d) => ({ ...d, ai_plan: res.plan }));
      toast.success("Plan AI generat!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare AI");
    }
    setGenerating(false);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="dashboard-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>
            Salut, <span className="text-blue-600">{user?.full_name?.split(" ")[0]}</span>! 👋
          </h1>
          <p className="text-slate-600 mt-2">Iată cum stai cu pregătirea pentru Evaluarea Națională.</p>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatCard icon={Trophy} label="Puncte" value={data.user.points} color="amber" testid="stat-points" />
          <StatCard icon={Flame} label="Streak (zile)" value={data.user.current_streak || 0} color="orange" testid="stat-streak" />
          <StatCard icon={Medal} label="Medalii" value={data.user.medals || 0} color="violet" testid="stat-medals" />
          <StatCard icon={Target} label="Teste rezolvate" value={data.user.total_tests} color="blue" testid="stat-tests" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard icon={BookOpen} label="Scor Română" value={`${data.user.score_romana}%`} color="rose" testid="stat-romana" />
          <StatCard icon={Calculator} label="Scor Mate" value={`${data.user.score_matematica}%`} color="emerald" testid="stat-mate" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* AI PLAN */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid="ai-plan-section">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Strategia ta AI</h2>
              </div>
              {data.has_initial_eval && (
                <button data-testid="generate-plan-btn" onClick={generatePlan} disabled={generating} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-60">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {data.ai_plan ? "Regenerează" : "Generează plan"}
                </button>
              )}
            </div>
            {!data.has_initial_eval ? (
              <div className="text-center py-12 bg-blue-50 rounded-2xl border border-dashed border-blue-200">
                <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <p className="text-slate-700 font-medium mb-4">Completează evaluarea inițială ca să primești planul tău AI personalizat.</p>
                <Link to="/evaluare?initial=true" data-testid="start-initial-eval" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
                  Începe evaluarea inițială
                </Link>
              </div>
            ) : data.ai_plan ? (
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px]" data-testid="ai-plan-content">
                {data.ai_plan}
              </div>
            ) : (
              <p className="text-slate-500 italic">Apasă „Generează plan” pentru a primi strategia ta personalizată.</p>
            )}
          </div>

          {/* PROGRESS + ACTIONS */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>Progresul tău</h3>
              <div className="flex justify-around">
                <ProgressRing value={data.user.score_romana} label="Română" color="#f43f5e" />
                <ProgressRing value={data.user.score_matematica} label="Mate" color="#10b981" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-sky-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
              <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "Outfit" }}>Antrenament rapid</h3>
              <p className="text-blue-100 text-sm mb-4">Rezolvă un test scurt și câștigă puncte.</p>
              <div className="flex gap-2">
                <Link to="/evaluare?subject=romana" data-testid="practice-romana" className="flex-1 text-center py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-all text-sm font-semibold">Română</Link>
                <Link to="/evaluare?subject=matematica" data-testid="practice-mate" className="flex-1 text-center py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-all text-sm font-semibold">Mate</Link>
              </div>
            </div>

            <Link to="/simulare" data-testid="cta-simulation" className="block bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-400/20 rounded-full blur-xl" />
              <Clock className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "Outfit" }}>Mod simulare examen</h3>
              <p className="text-slate-300 text-sm mb-2">25 întrebări • 2 ore • puncte ×2</p>
              <span className="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold">Începe simularea →</span>
            </Link>

            {data.upcoming_sessions && data.upcoming_sessions.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid="dashboard-sessions">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2" style={{ fontFamily: "Outfit" }}>
                    <Video className="w-5 h-5 text-blue-600" /> Sesiuni live
                  </h3>
                  <Link to="/sesiuni-live" className="text-xs font-semibold text-blue-600 hover:underline">Vezi toate →</Link>
                </div>
                <div className="space-y-2">
                  {data.upcoming_sessions.slice(0, 2).map((s) => (
                    <div key={s.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1 flex-1">{s.title}</p>
                        {s.required_package === "premium" && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} • {s.professor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parent Code Widget */}
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-violet-200" data-testid="parent-code-widget">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold" style={{ fontFamily: "Outfit" }}>Cod părinte</h3>
              </div>
              <p className="text-violet-100 text-sm mb-4">Generează un cod pe care părintele tău îl folosește pentru a-ți vedea progresul.</p>
              {parentCode ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/15 backdrop-blur text-center">
                    <p className="font-mono text-3xl font-bold tracking-[0.4em]" data-testid="parent-code-value">{parentCode}</p>
                  </div>
                  <button onClick={copyCode} className="w-full py-2.5 rounded-full bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all flex items-center justify-center gap-2">
                    {codeCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {codeCopied ? "Copiat!" : "Copiază codul"}
                  </button>
                  <p className="text-xs text-violet-200 text-center">Codul se invalidează după ce un părinte îl folosește.</p>
                </div>
              ) : (
                <button data-testid="generate-parent-code" onClick={generateParentCode} disabled={generatingCode} className="w-full py-2.5 rounded-full bg-white text-violet-700 font-semibold text-sm hover:bg-violet-50 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {generatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Generează cod
                </button>
              )}
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid="history-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
              <History className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Istoric teste</h2>
          </div>
          {data.history.length === 0 ? (
            <p className="text-slate-500 italic">Niciun test rezolvat încă. Începe acum!</p>
          ) : (
            <div className="space-y-2">
              {data.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Award className={`w-5 h-5 ${h.score >= 70 ? "text-emerald-500" : h.score >= 40 ? "text-amber-500" : "text-rose-500"}`} />
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{h.subject} {h.is_initial && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">Inițial</span>}</p>
                      <p className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{h.score}%</p>
                    <p className="text-xs text-slate-500">{h.correct}/{h.total} corecte</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
