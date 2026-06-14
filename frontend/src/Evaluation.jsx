import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { ArrowRight, Loader2, BookOpen, Calculator, CheckCircle2 } from "lucide-react";

const Evaluation = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const initial = params.get("initial") === "true";
  const initialSubject = params.get("subject") || (initial ? "romana" : null);
  const initialCategory = params.get("category") || null;

  const [stage, setStage] = useState(initial && initialSubject ? "test" : (initialSubject ? "category" : "select"));
  const [subject, setSubject] = useState(initialSubject);
  const [category, setCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [initialResults, setInitialResults] = useState({ romana: null, matematica: null });

  useEffect(() => {
    if (!user) navigate("/autentificare");
  }, [user, navigate]);

  const loadQuestions = async (subj, isInit, cat) => {
    setLoading(true);
    try {
      const params = { initial: isInit, limit: 10 };
      if (cat) params.category = cat;
      const { data } = await api.get(`/questions/${subj}`, { params });
      // Shuffle and pick max 10
      const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, isInit ? 100 : 10);
      setQuestions(shuffled);
      setCurrent(0);
      setAnswers({});
    } catch {
      toast.error("Eroare la încărcare");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (subject && stage === "test") {
      loadQuestions(subject, initial, category);
    }
    if (subject && stage === "category") {
      loadCategories(subject);
    }
  }, [subject, category, stage]);

  const loadCategories = async (subj) => {
    try {
      const { data } = await api.get(`/categories/${subj}`);
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const pickSubject = (subj) => {
    setSubject(subj);
    if (initial) {
      setStage("test");
    } else {
      setStage("category");
    }
  };

  const startWithCategory = (cat) => {
    setCategory(cat);
    setStage("test");
  };

  const selectAnswer = (idx) => {
    setAnswers({ ...answers, [questions[current].id]: idx });
  };

  const next = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const submit = async () => {
    setLoading(true);
    try {
      const submission = {
        subject,
        is_initial: initial,
        category: category,
        answers: questions.map((q) => ({ question_id: q.id, selected: answers[q.id] ?? -1 })),
      };
      const { data } = await api.post("/test/submit", submission);
      setResult(data);
      await refresh();

      // If initial eval, do both subjects
      if (initial && subject === "romana") {
        setInitialResults((r) => ({ ...r, romana: data }));
        setTimeout(() => {
          setSubject("matematica");
          setResult(null);
        }, 2500);
      } else if (initial && subject === "matematica") {
        setInitialResults((r) => ({ ...r, matematica: data }));
      }
    } catch (err) {
      toast.error("Eroare la trimitere");
    }
    setLoading(false);
  };

  if (stage === "select") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Alege o materie</h1>
          <p className="text-slate-600 mb-10">Începe un test de antrenament pentru materia preferată.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            <button data-testid="select-romana" onClick={() => pickSubject("romana")} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-300 hover:-translate-y-1 shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Limba română</h3>
              <p className="text-sm text-slate-500 mt-2">Gramatică, literatură, vocabular, fonetică, sintaxă</p>
            </button>
            <button data-testid="select-mate" onClick={() => pickSubject("matematica")} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-300 hover:-translate-y-1 shadow-md transition-all text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>Matematică</h3>
              <p className="text-sm text-slate-500 mt-2">Algebră, geometrie, aritmetică, ecuații, procente</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "category") {
    const SubjectIcon = subject === "romana" ? BookOpen : Calculator;
    const subjColor = subject === "romana" ? "rose" : "emerald";
    return (
      <div className="min-h-screen bg-slate-50" data-testid="category-picker">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-16">
          <button onClick={() => setStage("select")} className="text-sm text-slate-500 hover:text-slate-700 mb-6">← Înapoi la materii</button>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-2xl bg-${subjColor}-100 flex items-center justify-center`}>
              <SubjectIcon className={`w-5 h-5 text-${subjColor}-600`} />
            </div>
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{subject === "romana" ? "Limba română" : "Matematică"}</h1>
          </div>
          <p className="text-slate-600 mb-8">Alege un capitol sau exersează din toate.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <button data-testid="category-all" onClick={() => startWithCategory(null)} className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg hover:-translate-y-1 transition-all text-left">
              <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "Outfit" }}>Toate capitolele</h3>
              <p className="text-sm text-blue-100">Întrebări variate</p>
            </button>
            {categories.map((c) => (
              <button key={c.category} data-testid={`category-${c.category}`} onClick={() => startWithCategory(c.category)} className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-300 hover:-translate-y-1 shadow-sm transition-all text-left capitalize">
                <h3 className="text-lg font-semibold text-slate-900 mb-1" style={{ fontFamily: "Outfit" }}>{c.category}</h3>
                <p className="text-sm text-slate-500">{c.count} întrebări</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      </div>
    );
  }

  if (result && (!initial || (initial && initialResults.matematica))) {
    return (
      <div className="min-h-screen bg-slate-50" data-testid="result-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
            <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Test finalizat!</h2>
            {initial ? (
              <>
                <p className="text-slate-600 mb-6">Iată rezultatele evaluării inițiale:</p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-6 rounded-2xl bg-rose-50">
                    <p className="text-sm uppercase font-semibold text-rose-600">Română</p>
                    <p className="text-4xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit" }}>{initialResults.romana?.score}%</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-50">
                    <p className="text-sm uppercase font-semibold text-emerald-600">Matematică</p>
                    <p className="text-4xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit" }}>{initialResults.matematica?.score}%</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="my-6">
                <p className="text-6xl font-bold text-blue-600" style={{ fontFamily: "Outfit" }}>{result.score}%</p>
                <p className="text-slate-600 mt-2">{result.correct} din {result.total} răspunsuri corecte</p>
                <p className="text-amber-600 font-semibold mt-2">+{result.points_earned} puncte!</p>
                {result.current_streak > 1 && <p className="text-orange-600 mt-1 text-sm">🔥 Streak: {result.current_streak} zile</p>}
                {result.medals > 0 && <p className="text-violet-600 mt-1 text-sm">🏅 Total medalii: {result.medals}</p>}
              </div>
            )}
            <button data-testid="result-go-dashboard" onClick={() => navigate("/cont")} className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
              Mergi la cont <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-500">Nu există întrebări disponibile.</div>
      </div>
    );
  }

  const q = questions[current];
  const selected = answers[q.id];
  const progress = ((current + 1) / questions.length) * 100;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="evaluation-page">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              {initial ? "Evaluare Inițială" : "Test de antrenament"} — {subject === "romana" ? "Română" : "Matematică"}
            </span>
            <span className="text-sm text-slate-500">Întrebarea {current + 1} din {questions.length}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl p-8 shadow-md border border-slate-100">
          {q.category && <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-blue-100 text-blue-700 rounded-full mb-4">{q.category}</span>}
          <h2 className="text-2xl font-semibold text-slate-900 leading-snug mb-6" style={{ fontFamily: "Outfit" }}>{q.question}</h2>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                data-testid={`option-${idx}`}
                onClick={() => selectAnswer(idx)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selected === idx
                    ? "border-blue-600 bg-blue-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
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

        <div className="flex justify-between mt-6">
          <button data-testid="prev-btn" onClick={prev} disabled={current === 0} className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            ← Înapoi
          </button>
          {current < questions.length - 1 ? (
            <button data-testid="next-btn" onClick={next} disabled={selected === undefined} className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all">
              Înainte →
            </button>
          ) : (
            <button data-testid="submit-test-btn" onClick={submit} disabled={!allAnswered || loading} className="px-8 py-2.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-40 transition-all flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Trimite testul
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
