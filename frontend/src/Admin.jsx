import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import api from './lib/api';
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  BarChart3, BookOpen, Package, Users, Video, Pencil, Trash2, Plus, X, Loader2,
  Trophy, DollarSign, Target, GraduationCap, TrendingUp, Save
} from "lucide-react";

const TABS = [
  { id: "stats", label: "Statistici", icon: BarChart3 },
  { id: "questions", label: "Întrebări", icon: BookOpen },
  { id: "packages", label: "Pachete", icon: Package },
  { id: "team", label: "Profesori", icon: Users },
  { id: "sessions", label: "Sesiuni live", icon: Video },
];

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label>
    {children}
  </div>
);

const Input = (p) => <input {...p} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />;
const TextArea = (p) => <textarea {...p} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />;
const Select = ({ children, ...p }) => <select {...p} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all">{children}</select>;

// ----------------- STATS -----------------
const StatsTab = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then(({ data }) => setStats(data)); }, []);
  if (!stats) return <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mt-10" />;

  const cards = [
    { icon: GraduationCap, label: "Elevi", value: stats.total_students, color: "blue" },
    { icon: Users, label: "Părinți", value: stats.total_parents, color: "violet" },
    { icon: Target, label: "Teste rezolvate", value: stats.total_tests_taken, color: "emerald" },
    { icon: BookOpen, label: "Întrebări", value: stats.total_questions, color: "rose" },
    { icon: Trophy, label: "Plăți reușite", value: stats.paid_transactions, color: "amber" },
    { icon: DollarSign, label: "Venit", value: `${stats.revenue_ron} RON`, color: "green" },
    { icon: TrendingUp, label: "Avg Română", value: `${stats.avg_score_romana}%`, color: "rose" },
    { icon: TrendingUp, label: "Avg Mate", value: `${stats.avg_score_matematica}%`, color: "emerald" },
  ];

  return (
    <div className="space-y-6" data-testid="admin-stats">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_24px_rgb(0,0,0,0.02)]" data-testid={`stat-card-${i}`}>
            <div className={`w-10 h-10 rounded-2xl bg-${c.color}-100 flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 text-${c.color}-600`} />
            </div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Outfit" }}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="p-6 rounded-3xl bg-white border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>🏆 Top 5 elevi</h3>
        <div className="space-y-2">
          {stats.top_users.map((u, i) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">{i + 1}</span>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <span className="font-bold text-slate-900">{u.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------- QUESTIONS -----------------
const emptyQ = { subject: "romana", category: "gramatica", question: "", options: ["", "", "", ""], correct: 0, is_initial: false };

const QuestionsTab = () => {
  const [questions, setQuestions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("romana");

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admin/questions");
    setQuestions(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.question.trim() || editing.options.some((o) => !o.trim())) {
      toast.error("Completează toate câmpurile");
      return;
    }
    try {
      if (editing.id) {
        const { id, ...payload } = editing;
        await api.put(`/admin/questions/${id}`, payload);
        toast.success("Întrebare actualizată");
      } else {
        await api.post("/admin/questions", editing);
        toast.success("Întrebare adăugată");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare");
    }
  };

  const del = async (q) => {
    if (!confirm(`Ștergi întrebarea „${q.question.slice(0, 60)}…"?`)) return;
    await api.delete(`/admin/questions/${q.id}`);
    toast.success("Întrebare ștearsă");
    load();
  };

  const filtered = questions.filter((q) => q.subject === subjectFilter);
  const grouped = filtered.reduce((acc, q) => {
    (acc[q.category] = acc[q.category] || []).push(q);
    return acc;
  }, {});

  return (
    <div data-testid="admin-questions">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button data-testid="filter-romana" onClick={() => setSubjectFilter("romana")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${subjectFilter === "romana" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>Română ({questions.filter(q => q.subject === "romana").length})</button>
          <button data-testid="filter-mate" onClick={() => setSubjectFilter("matematica")} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${subjectFilter === "matematica" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>Matematică ({questions.filter(q => q.subject === "matematica").length})</button>
        </div>
        <button data-testid="add-question" onClick={() => setEditing({ ...emptyQ, subject: subjectFilter })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
          <Plus className="w-4 h-4" /> Adaugă întrebare
        </button>
      </div>

      {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /> : Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="mb-6">
          <h3 className="text-sm uppercase font-semibold tracking-wider text-slate-500 mb-3 capitalize">{cat} ({items.length})</h3>
          <div className="space-y-2">
            {items.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all">
                <div className="flex-1">
                  <p className="font-medium text-slate-900 text-sm">{q.question}</p>
                  <p className="text-xs text-emerald-600 mt-1">✓ {q.options[q.correct]} {q.is_initial && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Inițial</span>}</p>
                </div>
                <button onClick={() => setEditing(q)} className="p-2 rounded-xl hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(q)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editează întrebare" : "Adaugă întrebare"}>
        {editing && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Materie">
                <Select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })}>
                  <option value="romana">Română</option>
                  <option value="matematica">Matematică</option>
                </Select>
              </Field>
              <Field label="Categorie">
                <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {editing.subject === "romana"
                    ? ["gramatica", "literatura", "vocabular", "fonetica", "sintaxa"].map((c) => <option key={c} value={c}>{c}</option>)
                    : ["algebra", "aritmetica", "geometrie", "ecuatii", "procente"].map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Întrebare">
              <TextArea rows={3} value={editing.question} onChange={(e) => setEditing({ ...editing, question: e.target.value })} />
            </Field>
            <Field label="Variante (selectează răspunsul corect)">
              {editing.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setEditing({ ...editing, correct: idx })} className={`w-8 h-8 rounded-full font-bold text-sm flex-shrink-0 ${editing.correct === idx ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <Input value={opt} onChange={(e) => { const opts = [...editing.options]; opts[idx] = e.target.value; setEditing({ ...editing, options: opts }); }} />
                </div>
              ))}
            </Field>
            <label className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={editing.is_initial} onChange={(e) => setEditing({ ...editing, is_initial: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-slate-700">Folosește în evaluarea inițială</span>
            </label>
            <button onClick={save} className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Salvează
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ----------------- PACKAGES -----------------
const emptyPkg = { id: "", name: "", price: 0, currency: "ron", description: "", features: [""], popular: false };

const PackagesTab = () => {
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => { const { data } = await api.get("/admin/packages"); setPackages(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...editing, features: editing.features.filter((f) => f.trim()) };
    try {
      if (editing._isNew) {
        const { _isNew, ...body } = payload;
        await api.post("/admin/packages", body);
        toast.success("Pachet adăugat");
      } else {
        const { _isNew, ...body } = payload;
        await api.put(`/admin/packages/${editing.id}`, body);
        toast.success("Pachet actualizat");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare");
    }
  };

  const del = async (p) => {
    if (!confirm(`Ștergi pachetul „${p.name}”?`)) return;
    await api.delete(`/admin/packages/${p.id}`);
    toast.success("Pachet șters");
    load();
  };

  return (
    <div data-testid="admin-packages">
      <div className="flex justify-end mb-6">
        <button data-testid="add-package" onClick={() => setEditing({ ...emptyPkg, _isNew: true })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Adaugă pachet</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((p) => (
          <div key={p.id} className={`rounded-3xl p-6 border-2 ${p.popular ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white"}`} data-testid={`pkg-card-${p.id}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{p.name}</h3>
              <div className="flex gap-1">
                <button onClick={() => setEditing({ ...p, _isNew: false })} className="p-2 rounded-xl hover:bg-blue-100 text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(p)} className="p-2 rounded-xl hover:bg-rose-100 text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2" style={{ fontFamily: "Outfit" }}>{p.price} <span className="text-sm text-slate-500">{p.currency.toUpperCase()}</span></p>
            <p className="text-sm text-slate-600 mb-3">{p.description}</p>
            <ul className="text-xs text-slate-500 space-y-1">
              {p.features.slice(0, 3).map((f, i) => <li key={i}>• {f}</li>)}
              {p.features.length > 3 && <li className="text-slate-400 italic">+{p.features.length - 3} altele</li>}
            </ul>
            {p.popular && <span className="inline-block mt-3 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">POPULAR</span>}
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?._isNew ? "Adaugă pachet" : "Editează pachet"}>
        {editing && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ID (slug)"><Input value={editing.id} disabled={!editing._isNew} onChange={(e) => setEditing({ ...editing, id: e.target.value.toLowerCase().replace(/\s/g, "-") })} /></Field>
              <Field label="Nume"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Preț"><Input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Monedă"><Select value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}><option value="ron">RON</option><option value="eur">EUR</option><option value="usd">USD</option></Select></Field>
            </div>
            <Field label="Descriere"><Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Beneficii (câte una pe rând)">
              {editing.features.map((f, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input value={f} onChange={(e) => { const ff = [...editing.features]; ff[idx] = e.target.value; setEditing({ ...editing, features: ff }); }} />
                  <button onClick={() => setEditing({ ...editing, features: editing.features.filter((_, i) => i !== idx) })} className="px-3 rounded-xl hover:bg-rose-50 text-rose-600"><X className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setEditing({ ...editing, features: [...editing.features, ""] })} className="text-sm text-blue-600 font-semibold mt-1">+ Adaugă beneficiu</button>
            </Field>
            <label className="flex items-center gap-2 mb-6">
              <input type="checkbox" checked={editing.popular} onChange={(e) => setEditing({ ...editing, popular: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm text-slate-700">Marchează drept „Popular"</span>
            </label>
            <button onClick={save} className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Salvează</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ----------------- TEAM -----------------
const emptyTeam = { name: "", subject: "Limba și literatura română", bio: "", fun_fact: "", image: "" };

const TeamTab = () => {
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = async () => { const { data } = await api.get("/admin/team"); setMembers(data); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      if (editing.id) {
        const { id, ...body } = editing; await api.put(`/admin/team/${id}`, body); toast.success("Actualizat");
      } else { await api.post("/admin/team", editing); toast.success("Adăugat"); }
      setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Eroare"); }
  };
  const del = async (m) => { if (!confirm(`Ștergi profesor „${m.name}”?`)) return; await api.delete(`/admin/team/${m.id}`); load(); };

  return (
    <div data-testid="admin-team">
      <div className="flex justify-end mb-6"><button onClick={() => setEditing(emptyTeam)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Adaugă profesor</button></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="rounded-3xl bg-white border border-slate-100 overflow-hidden">
            <img src={m.image} alt={m.name} className="w-full h-48 object-cover" />
            <div className="p-5">
              <p className="text-xs uppercase font-semibold text-blue-600 mb-1">{m.subject}</p>
              <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>{m.name}</h3>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{m.bio}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(m)} className="flex-1 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm hover:bg-blue-100"><Pencil className="w-3.5 h-3.5 inline mr-1" /> Editează</button>
                <button onClick={() => del(m)} className="px-3 py-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editează profesor" : "Adaugă profesor"}>
        {editing && (
          <div>
            <Field label="Nume complet"><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Materie"><Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
            <Field label="Bio"><TextArea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Field>
            <Field label="Fun fact"><Input value={editing.fun_fact} onChange={(e) => setEditing({ ...editing, fun_fact: e.target.value })} /></Field>
            <Field label="URL imagine"><Input value={editing.image} placeholder="https://..." onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></Field>
            <button onClick={save} className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 mt-2"><Save className="w-4 h-4" /> Salvează</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ----------------- SESSIONS -----------------
const emptySession = { title: "", professor: "", subject: "romana", description: "", date: "", duration_min: 60, zoom_link: "", required_package: "premium", spots_left: 20 };

const SessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = async () => { const { data } = await api.get("/admin/sessions"); setSessions(data); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    try {
      // Convert datetime-local to ISO
      const payload = { ...editing };
      if (payload.date && !payload.date.includes("Z")) {
        payload.date = new Date(payload.date).toISOString();
      }
      if (editing.id) { const { id, reminder_sent, ...body } = payload; await api.put(`/admin/sessions/${id}`, body); toast.success("Actualizat"); }
      else { await api.post("/admin/sessions", payload); toast.success("Adăugat"); }
      setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Eroare"); }
  };
  const del = async (s) => { if (!confirm(`Ștergi sesiunea „${s.title}”?`)) return; await api.delete(`/admin/sessions/${s.id}`); load(); };
  const toDateInput = (iso) => iso ? new Date(iso).toISOString().slice(0, 16) : "";

  return (
    <div data-testid="admin-sessions">
      <div className="flex justify-end mb-6"><button onClick={() => setEditing(emptySession)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Adaugă sesiune</button></div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900" style={{ fontFamily: "Outfit" }}>{s.title}</h3>
              <p className="text-sm text-slate-500">{s.professor} • {new Date(s.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} • {s.duration_min}min</p>
              <div className="flex gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.required_package === "premium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{s.required_package}</span>
                <span className="text-xs text-slate-500">{s.spots_left} locuri</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing({ ...s, date: toDateInput(s.date) })} className="p-2 rounded-xl hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(s)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Editează sesiune" : "Adaugă sesiune"}>
        {editing && (
          <div>
            <Field label="Titlu"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Profesor"><Input value={editing.professor} onChange={(e) => setEditing({ ...editing, professor: e.target.value })} /></Field>
              <Field label="Materie"><Select value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })}><option value="romana">Română</option><option value="matematica">Matematică</option></Select></Field>
            </div>
            <Field label="Descriere"><TextArea rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Dată și oră"><Input type="datetime-local" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></Field>
              <Field label="Durată (min)"><Input type="number" value={editing.duration_min} onChange={(e) => setEditing({ ...editing, duration_min: parseInt(e.target.value) || 60 })} /></Field>
            </div>
            <Field label="Link Zoom"><Input value={editing.zoom_link} placeholder="https://zoom.us/..." onChange={(e) => setEditing({ ...editing, zoom_link: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pachet necesar"><Select value={editing.required_package} onChange={(e) => setEditing({ ...editing, required_package: e.target.value })}><option value="none">Niciunul</option><option value="standard">Standard</option><option value="premium">Premium</option></Select></Field>
              <Field label="Locuri disponibile"><Input type="number" value={editing.spots_left} onChange={(e) => setEditing({ ...editing, spots_left: parseInt(e.target.value) || 0 })} /></Field>
            </div>
            <button onClick={save} className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 mt-2"><Save className="w-4 h-4" /> Salvează</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ----------------- MAIN -----------------
const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") navigate("/");
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-page">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider">Admin</span>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2" style={{ fontFamily: "Outfit" }}>Panou de administrare</h1>
            <p className="text-slate-600 mt-1">Gestionează conținutul platformei Edu Plus</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto mt-8 mb-6 pb-2" data-testid="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white text-slate-700 hover:bg-blue-50 border border-slate-200"}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === "stats" && <StatsTab />}
        {tab === "questions" && <QuestionsTab />}
        {tab === "packages" && <PackagesTab />}
        {tab === "team" && <TeamTab />}
        {tab === "sessions" && <SessionsTab />}
      </div>
    </div>
  );
};

export default Admin;
