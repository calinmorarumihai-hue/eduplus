import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { GraduationCap, Loader2, Users } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", grade: "Clasa a VIII-a", role: "student" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Parola trebuie să aibă cel puțin 6 caractere");
      return;
    }
    setLoading(true);
    try {
      const u = await register(form);
      toast.success("Bine ai venit pe Edu Plus!");
      if (u.role === "parent") navigate("/parinte");
      else navigate("/evaluare?initial=true");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare la înregistrare");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white" data-testid="register-page">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 p-10 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Creează contul gratuit</h1>
          <p className="text-center text-slate-500 mb-6">Începe pregătirea sau urmărește progresul copilului tău</p>

          {/* Role toggle */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-full mb-6" data-testid="register-role-toggle">
            <button
              type="button"
              data-testid="role-student"
              onClick={() => setForm({ ...form, role: "student" })}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${form.role === "student" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}
            >
              <GraduationCap className="w-4 h-4" /> Elev
            </button>
            <button
              type="button"
              data-testid="role-parent"
              onClick={() => setForm({ ...form, role: "parent" })}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 ${form.role === "parent" ? "bg-white text-violet-700 shadow-sm" : "text-slate-600"}`}
            >
              <Users className="w-4 h-4" /> Părinte
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nume complet</label>
              <input data-testid="register-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input data-testid="register-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Parolă (minim 6 caractere)</label>
              <input data-testid="register-password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />
            </div>
            <button data-testid="register-submit" disabled={loading} type="submit" className={`w-full py-3 rounded-full font-semibold shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2 ${form.role === "parent" ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"} text-white hover:-translate-y-0.5`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Creează cont {form.role === "parent" ? "părinte" : ""}
            </button>
          </form>
          <p className="text-center text-sm text-slate-600 mt-6">
            Ai deja cont? <Link to="/autentificare" className="text-blue-600 font-semibold hover:underline">Autentifică-te</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
