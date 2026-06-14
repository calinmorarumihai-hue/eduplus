import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { WaveDivider } from "@/components/Wave";
import { Trophy, Medal, Award, Flame } from "lucide-react";

const rankStyle = (idx) => {
  if (idx === 0) return { bg: "bg-gradient-to-r from-amber-100 to-amber-50", border: "border-amber-200", icon: <Trophy className="w-5 h-5 text-amber-500" /> };
  if (idx === 1) return { bg: "bg-gradient-to-r from-slate-100 to-slate-50", border: "border-slate-200", icon: <Medal className="w-5 h-5 text-slate-400" /> };
  if (idx === 2) return { bg: "bg-gradient-to-r from-orange-100 to-orange-50", border: "border-orange-200", icon: <Medal className="w-5 h-5 text-orange-500" /> };
  return { bg: "bg-white", border: "border-slate-100", icon: <Award className="w-5 h-5 text-slate-400" /> };
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [weeklyRows, setWeeklyRows] = useState([]);
  const [tab, setTab] = useState("all"); // all | weekly

  useEffect(() => {
    api.get("/leaderboard").then(({ data }) => setRows(data));
    api.get("/leaderboard/weekly").then(({ data }) => setWeeklyRows(data));
  }, []);

  const currentRows = tab === "all" ? rows : weeklyRows;
  const pointsKey = tab === "all" ? "points" : "weekly_points";

  return (
    <div data-testid="leaderboard-page">
      <Navbar />
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm font-semibold mb-4">
            <Trophy className="w-4 h-4" /> Top elevi
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit" }}>
            Leaderboard
          </h1>
          <p className="text-lg text-slate-600">Câștigă puncte, ține un streak constant și colectează medalii!</p>
        </div>
        <WaveDivider color="#ffffff" />
      </section>

      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-full mb-6 max-w-xs mx-auto" data-testid="leaderboard-tabs">
            <button data-testid="tab-all" onClick={() => setTab("all")} className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              Total
            </button>
            <button data-testid="tab-weekly" onClick={() => setTab("weekly")} className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === "weekly" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
              Săptămânal
            </button>
          </div>

          {currentRows.length === 0 ? (
            <p className="text-center text-slate-500 py-16">Niciun rezultat încă. Fii primul!</p>
          ) : (
            <div className="space-y-3">
              {currentRows.map((r, i) => {
                const s = rankStyle(i);
                const isMe = user?.id === r.id;
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 ${s.bg} ${s.border} ${isMe ? "ring-2 ring-blue-400 ring-offset-2" : ""}`}
                    data-testid={`leaderboard-row-${i}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-700 shadow-sm">
                        {i + 1}
                      </div>
                      {s.icon}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.full_name} {isMe && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1">Tu</span>}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {tab === "all" && (
                            <span className="text-xs text-slate-500">{r.total_tests} teste • RO {r.score_romana}% • MAT {r.score_matematica}%</span>
                          )}
                          {r.current_streak > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold">
                              <Flame className="w-3 h-3" /> {r.current_streak}z
                            </span>
                          )}
                          {r.medals > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-600 font-semibold">
                              <Medal className="w-3 h-3" /> {r.medals}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-900" style={{ fontFamily: "Outfit" }}>{r[pointsKey] || 0}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Leaderboard;
