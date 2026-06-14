import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Clock, BookOpen, Calculator, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

const EXAM_DURATION_MIN = 120; // 2 hours

const Simulation = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [stage, setStage] = useState("intro"); // intro | subject | exam | result
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_MIN * 60);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) navigate("/autentificare");
  }, [user, navigate]);

  const startExam = async (subj) => {
    setLoading(true);
    setSubject(subj);
    try {
      const { data } = await api.get(`/exam/${subj}`, { params: { limit: 25 } });
      setQuestions(data);
      setCurrent(0);
      setAnswers({});
      setSecondsLeft(EXAM_DURATION_MIN * 60);
      setStage("exam");
    } catch {
      toast.error("Eroare la încărcare");
    }
    setLoading(false);
  };

  // Timer
  useEffect(() => {
    if (stage !== "exam") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          submitExam(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [stage]);

  const submitExam = async (auto = false) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLoading(true);
    try {
      const submission = {
        subject,
        is_initial: false,
        is_simulation: true,
        answers: questions.map((q) => ({ question_id: q.id, selected: answers[q.id] ?? -1 })),
      };
      const { data } = await api.post("/test/submit", submission);
      setResult(data);
      setStage("result");
      await refresh();
      if (auto) toast.warning("Timpul a expirat — testul a fost trimis automat");
      else toast.success("Test trimis cu succes!");
    } catch {
      toast.error("Eroare la trimitere");
    }
    setLoading(false);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white" data-testid="simulation-intro">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-md">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: "Outfit" }}>Mod simulare examen</h1>
            <p className="text-lg text-slate-600 mb-6">
              Simulează condițiile reale ale Evaluării Naționale: <strong>25 de întrebări</strong> pe materie, timp limită de <strong>2 ore</strong>.
              La final, primești scorul și <strong>puncte duble</strong> pentru fiecare răspuns corect (recompensa modului simulare).
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <Clock className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-sm font-semibold text-slate-900">2 ore</p>
                <p className="text-xs text-slate-500">timp total</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-sm font-semibold text-slate-900">25 întrebări</p>
                <p className="text-xs text-slate-500">aleatorii din toate capitolele</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-sm font-semibold text-slate-900">Puncte ×2</p>
                <p className="text-xs text-slate-500">recompensă bonus</p>
              </div>
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <strong>Atenție:</strong> odată început, cronometrul nu se oprește. Asigură-te că ai 2 ore disponibile.
            </p>
            <button data-testid="simulation-start" onClick={() => setStage("subject")} className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-200">
              Începe simularea <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "subject") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: "Outfit" }}>Alege materia pentru simulare</h1>
          <div className="grid sm:grid-cols-2 gap-6">
            <button data-testid="sim-select-romana" disabled={loading} onClick={() => startExam("romana")} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-300 hover:-translate-y-1 shadow-md transition-all text-left disabled:opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Limba română</h3>
              <p className="text-sm text-slate-500 mt-2">25 întrebări • 2 ore</p>
            </button>
            <button data-testid="sim-select-mate" disabled={loading} onClick={() => startExam("matematica")} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-300 hover:-translate-y-1 shadow-md transition-all text-left disabled:opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Matematică</h3>
              <p className="text-sm text-slate-500 mt-2">25 întrebări • 2 ore</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result") {
    return (
      <div className="min-h-screen bg-slate-50" data-testid="simulation-result">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
            <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Simulare finalizată!</h2>
            <div className="my-6">
              <p className="text-6xl font-bold text-blue-600" style={{ fontFamily: "Outfit" }}>{result.score}%</p>
              <p className="text-slate-600 mt-2">{result.correct} din {result.total} răspunsuri corecte</p>
              <p className="text-amber-600 font-semibold mt-2 text-lg">+{result.points_earned} puncte! 🎉</p>
              {result.current_streak > 1 && <p className="text-orange-600 mt-1 text-sm">🔥 Streak: {result.current_streak} zile</p>}
            </div>
            <button onClick={() => navigate("/cont")} className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
              Mergi la cont <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // EXAM stage
  if (loading || questions.length === 0) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div></div>;
  }

  const q = questions[current];
  const selected = answers[q.id];
  const progress = ((current + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;
  const lowTime = secondsLeft <= 300; // 5 min

  return (
    <div className="min-h-screen bg-slate-50" data-testid="simulation-exam">
      <Navbar />
      <div className={`sticky top-16 z-40 backdrop-blur-xl border-b ${lowTime ? "bg-rose-50/95 border-rose-200" : "bg-white/95 border-slate-100"}`}>
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${lowTime ? "text-rose-600" : "text-blue-600"}`} />
            <span className={`font-mono text-xl font-bold ${lowTime ? "text-rose-700" : "text-slate-900"}`} data-testid="exam-timer">{formatTime(secondsLeft)}</span>
          </div>
          <div className="text-sm text-slate-600">{answeredCount}/{questions.length} răspunse</div>
        </div>
        <div className="h-1 bg-slate-200">
          <div className={`h-full ${lowTime ? "bg-rose-500" : "bg-blue-500"}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Simulare {subject === "romana" ? "Română" : "Matematică"}</span>
          <span className="text-sm text-slate-500">Întrebarea {current + 1} din {questions.length}</span>
        </div>

        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
          {q.category && <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-blue-100 text-blue-700 rounded-full mb-4">{q.category}</span>}
          <h2 className="text-2xl font-semibold text-slate-900 leading-snug mb-6" style={{ fontFamily: "Outfit" }}>{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                data-testid={`sim-option-${idx}`}
                onClick={() => setAnswers({ ...answers, [q.id]: idx })}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selected === idx
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm font-semibold ${selected === idx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-between items-center mt-6 gap-3">
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all">← Înapoi</button>
          {current < questions.length - 1 ? (
            <button data-testid="sim-next" onClick={() => setCurrent(current + 1)} className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">Înainte →</button>
          ) : (
            <button data-testid="sim-submit" onClick={() => submitExam(false)} disabled={loading} className="px-8 py-2.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-40 transition-all flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Trimite simularea
            </button>
          )}
        </div>

        {/* Quick navigation */}
        <div className="mt-8 p-5 bg-white rounded-3xl border border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Navigare rapidă</p>
          <div className="grid grid-cols-10 sm:grid-cols-12 gap-2">
            {questions.map((qq, idx) => (
              <button
                key={qq.id}
                onClick={() => setCurrent(idx)}
                className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                  idx === current
                    ? "bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1"
                    : answers[qq.id] !== undefined
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
