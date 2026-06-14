import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { GraduationCap, Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Bun venit înapoi!");
      if (u.role === "admin") navigate("/admin");
      else if (u.role === "parent") navigate("/parinte");
      else navigate("/cont");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Eroare la autentificare");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white" data-testid="login-page">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-100 p-10 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>Bine ai revenit!</h1>
          <p className="text-center text-slate-500 mb-8">Autentifică-te ca să continui pregătirea</p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input data-testid="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Parolă</label>
              <input data-testid="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all" />
            </div>
            <button data-testid="login-submit" disabled={loading} type="submit" className="w-full py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Autentificare
            </button>
          </form>
          <p className="text-center text-sm text-slate-600 mt-6">
            Nu ai cont încă? <Link to="/inregistrare" className="text-blue-600 font-semibold hover:underline">Înregistrează-te</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
