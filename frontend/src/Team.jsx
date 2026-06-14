import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WaveDivider } from "@/components/Wave";
import { Sparkles } from "lucide-react";

const Team = () => {
  const [team, setTeam] = useState([]);
  useEffect(() => {
    api.get("/team").then(({ data }) => setTeam(data));
  }, []);

  return (
    <div data-testid="team-page">
      <Navbar />
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Echipa Edu Plus
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>
            Profesori care îți țin cu adevărat partea
          </h1>
          <p className="text-lg text-slate-600">Mentori cu experiență, alături de tine la fiecare pas spre Evaluarea Națională.</p>
        </div>
        <WaveDivider color="#ffffff" />
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 transition-all"
              data-testid={`team-card-${i}`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-blue-100">
                <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1">{m.subject}</p>
                <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: "Outfit" }}>{m.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{m.bio}</p>
                <p className="text-xs text-slate-500 italic flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-500" /> {m.fun_fact}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Team;
