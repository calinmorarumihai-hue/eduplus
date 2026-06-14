import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Brain, Waves, BookOpen, Calculator, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WaveDivider, WaveBg } from "@/components/Wave";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" },
};

const Home = () => {
  return (
    <div data-testid="home-page">
      <Navbar />

      {/* HERO */}
      <section className="relative bg-gradient-to-b from-blue-50 via-sky-50 to-white overflow-hidden">
        <WaveBg className="absolute inset-0 w-full h-full opacity-60 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-200 opacity-30 blob" />
        <div className="absolute top-40 -left-10 w-72 h-72 rounded-full bg-sky-200 opacity-40 blob" style={{ animationDelay: "4s" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-6" data-testid="hero-badge">
              <Sparkles className="w-4 h-4" /> Pregătire personalizată cu AI
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05] mb-6" style={{ fontFamily: "Outfit" }}>
              Reușește la <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">Evaluarea Națională</span> cu valuri de încredere.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
              Edu Plus combină evaluări inițiale inteligente, plan de studiu AI și un leaderboard motivant —
              ca pregătirea pentru clasa a VIII-a să devină ușoară, distractivă și eficientă.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/inregistrare" data-testid="hero-cta-primary" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                Începe evaluarea gratuită <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pachete" data-testid="hero-cta-secondary" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-blue-700 font-semibold border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all">
                Vezi pachete
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-slate-600">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fără carduri necesare</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Profesori cu experiență</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI care învață cu tine</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
            <div className="relative wave-float">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-300 to-sky-200 rounded-[3rem] blur-2xl opacity-50" />
              <img
                src="https://images.unsplash.com/photo-1514369118554-e20d93546b30?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85"
                alt="Elev fericit"
                className="relative rounded-[2.5rem] shadow-2xl shadow-blue-200 w-full object-cover"
                style={{ aspectRatio: "4/5" }}
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-3xl p-4 shadow-xl shadow-blue-100 flex items-center gap-3" data-testid="hero-stat-card">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Top 10%</p>
                  <p className="text-slate-900 font-bold">Elevi promovați</p>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white rounded-3xl p-4 shadow-xl shadow-blue-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Plan AI</p>
                  <p className="text-slate-900 font-bold">Personalizat</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <WaveDivider color="#ffffff" />
      </section>

      {/* FEATURES */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="max-w-2xl mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">De ce Edu Plus</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-3 mb-4" style={{ fontFamily: "Outfit" }}>
              Învățare prietenoasă, rezultate reale
            </h2>
            <p className="text-lg text-slate-600">Un val de instrumente create să te ducă natural spre obiectivul tău.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Brain, color: "blue", title: "Strategie AI personalizată", desc: "După evaluarea inițială, AI-ul Claude îți construiește un plan de studiu unic pentru Română și Matematică." },
              { icon: Trophy, color: "amber", title: "Leaderboard motivant", desc: "Urcă în clasament cu fiecare test rezolvat și concurează prietenește cu alți elevi." },
              { icon: Waves, color: "sky", title: "Curge ușor, ca un val", desc: "Interfață prietenoasă, teme luminoase, conținut adaptat clasei a VIII-a. Fără stres." },
              { icon: BookOpen, color: "rose", title: "Limba română", desc: "Gramatică, literatură, redactare — exerciții variate, explicații clare, feedback imediat." },
              { icon: Calculator, color: "emerald", title: "Matematică", desc: "Algebră, geometrie, probleme reale. Antrenament zilnic adaptat la nivelul tău." },
              { icon: Sparkles, color: "violet", title: "Profesori cu experiență", desc: "Echipa noastră a pregătit sute de elevi promovați cu medii peste 9." },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:-translate-y-1 shadow-[0_4px_24px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(37,99,235,0.08)] transition-all"
                data-testid={`feature-card-${i}`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-${f.color}-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-6 h-6 text-${f.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-blue-50 py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">Cum funcționează</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mt-3" style={{ fontFamily: "Outfit" }}>
              Trei pași spre note mai bune
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "01", title: "Evaluarea inițială", desc: "Rezolvi un test scurt și aflăm exact unde te afli la Română și Matematică." },
              { n: "02", title: "Plan AI personalizat", desc: "Algoritmul Claude îți construiește o strategie de studiu adaptată ție." },
              { n: "03", title: "Practică & concurează", desc: "Antrenează-te cu teste, câștigă puncte și urcă în leaderboard." },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative p-8 rounded-3xl bg-white shadow-lg"
              >
                <span className="text-6xl font-bold text-blue-100" style={{ fontFamily: "Outfit" }}>{s.n}</span>
                <h3 className="text-2xl font-semibold text-slate-900 mt-2 mb-3" style={{ fontFamily: "Outfit" }}>{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full">
            <path fill="#1e40af" d="M0,300 C300,400 500,200 800,300 C1100,400 1300,250 1440,300 L1440,600 L0,600 Z" />
            <path fill="#1d4ed8" d="M0,400 C300,500 500,300 800,400 C1100,500 1300,350 1440,400 L1440,600 L0,600 Z" opacity="0.6" />
          </svg>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6" style={{ fontFamily: "Outfit" }}>
            Lasă-te purtat de valul cunoașterii
          </motion.h2>
          <motion.p {...fadeUp} className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Înscrie-te azi și începe evaluarea inițială gratuită. Primul pas spre o medie mare la Evaluarea Națională.
          </motion.p>
          <motion.div {...fadeUp}>
            <Link to="/inregistrare" data-testid="cta-bottom-button" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-400 text-slate-900 font-bold shadow-2xl hover:bg-amber-500 hover:-translate-y-0.5 transition-all">
              Creează cont gratuit <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
