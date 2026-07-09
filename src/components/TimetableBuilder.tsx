import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Grid, RefreshCw, Trash2, Plus, Printer, ArrowLeft } from "lucide-react";

interface TimetableBuilderProps {
  setView: (view: "hub" | "brand" | "home" | "step1" | "step2" | "quiz" | "result" | "admin" | "schedule" | "timetable") => void;
}

export default function TimetableBuilder({ setView }: TimetableBuilderProps) {
  const [timetableClasses, setTimetableClasses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("ky_timetable_classes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddClassOpen, setIsAddClassOpen] = useState<boolean>(false);
  const [newClass, setNewClass] = useState({
    name: "",
    teacher: "Chloe 김",
    grade: "초등 전학년",
    day: "월",
    time: "14:00 - 14:50",
    classroom: "A강의실",
    color: "emerald"
  });

  useEffect(() => {
    localStorage.setItem("ky_timetable_classes", JSON.stringify(timetableClasses));
  }, [timetableClasses]);

  const days = ["월", "화", "수", "목", "금"];
  const periods = [
    "14:00 - 14:50",
    "15:00 - 15:50",
    "16:00 - 16:50",
    "17:00 - 17:50",
    "18:00 - 18:50",
    "19:00 - 19:50",
    "20:00 - 20:50"
  ];

  const colorsMap: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-800",
    blue: "bg-blue-50 border-blue-300 text-blue-800",
    amber: "bg-amber-50 border-amber-300 text-amber-800",
    rose: "bg-rose-50 border-rose-300 text-rose-800",
    indigo: "bg-indigo-50 border-indigo-300 text-indigo-800"
  };

  const colorsText: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-50",
    blue: "text-blue-500 bg-blue-50",
    amber: "text-amber-500 bg-amber-50",
    rose: "text-rose-500 bg-rose-50",
    indigo: "text-indigo-500 bg-indigo-50"
  };

  const handleDeleteClass = (id: string) => {
    setTimetableClasses(prev => prev.filter(c => c.id !== id));
  };

  const handleAddClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) {
      alert("과목명을 명시해주세요.");
      return;
    }
    const created = {
      id: Date.now().toString(),
      ...newClass
    };
    setTimetableClasses(prev => [...prev, created]);
    setIsAddClassOpen(false);
    setNewClass({
      name: "",
      teacher: "Chloe 김",
      grade: "초등 전학년",
      day: "월",
      time: "14:00 - 14:50",
      classroom: "A강의실",
      color: "emerald"
    });
  };

  const handleLoadTemplate = () => {
    if (window.confirm("기존 시간표를 초기화하고 KY 표준 영어 학원 주간 시간표 템플릿을 자동으로 세팅하시겠습니까?")) {
      const standardTemplate = [
        { id: "1", name: "Phonics Starters", teacher: "Chloe 김", grade: "초1-2", day: "월", time: "14:00 - 14:50", classroom: "A강의실", color: "emerald" },
        { id: "2", name: "Phonics Starters", teacher: "Chloe 김", grade: "초1-2", day: "수", time: "14:00 - 14:50", classroom: "A강의실", color: "emerald" },
        { id: "3", name: "Phonics Starters", teacher: "Chloe 김", grade: "초1-2", day: "금", time: "14:00 - 14:50", classroom: "A강의실", color: "emerald" },
        { id: "4", name: "Reading Elite A", teacher: "David 박", grade: "초3-4", day: "월", time: "15:00 - 15:50", classroom: "B강의실", color: "blue" },
        { id: "5", name: "Reading Elite A", teacher: "David 박", grade: "초3-4", day: "수", time: "15:00 - 15:50", classroom: "B강의실", color: "blue" },
        { id: "6", name: "Reading Elite A", teacher: "David 박", grade: "초3-4", day: "금", time: "15:00 - 15:50", classroom: "B강의실", color: "blue" },
        { id: "7", name: "Debate & Speaking", teacher: "Clara 조", grade: "중1-2", day: "화", time: "16:00 - 16:50", classroom: "C강의실", color: "amber" },
        { id: "8", name: "Debate & Speaking", teacher: "Clara 조", grade: "중1-2", day: "목", time: "16:00 - 16:50", classroom: "C강의실", color: "amber" },
        { id: "9", name: "Grammar Intensive", teacher: "John 송", grade: "중2-3", day: "화", time: "18:00 - 18:50", classroom: "A강의실", color: "rose" },
        { id: "10", name: "Grammar Intensive", teacher: "John 송", grade: "중2-3", day: "목", time: "18:00 - 18:50", classroom: "A강의실", color: "rose" },
      ];
      setTimetableClasses(standardTemplate);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("시간표의 모든 과목을 삭제하시겠습니까?")) {
      setTimetableClasses([]);
    }
  };

  return (
    <motion.div
      key="view_timetable"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Header Section */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 no-print">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView("hub")}
            className="p-2 bg-white hover:bg-slate-50 border rounded-lg text-[#0B3B24] transition-all shadow-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">시간표제작</h1>
            <p className="text-slate-500 text-xs mt-0.5">캠퍼스의 주간 강의 계획 및 강의실, 강사 배정을 한눈에 조망 및 편집합니다.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleLoadTemplate}
            className="px-3.5 py-2 border text-amber-700 hover:text-amber-800 text-xs font-black rounded-lg bg-amber-50 hover:bg-amber-100/70 transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>기본 템플릿 로드</span>
          </button>
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 border text-rose-700 hover:text-rose-800 text-xs font-black rounded-lg bg-rose-50 hover:bg-rose-100/70 transition-colors flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>전체 초기화</span>
          </button>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="px-4 py-2 bg-[#0B3B24] hover:bg-[#062919] text-[#C5A059] text-xs font-black rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>수업 등록</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 border text-[#0B3B24] border-[#0B3B24]/30 text-xs font-black rounded-lg bg-white hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>시간표 인쇄</span>
          </button>
        </div>
      </div>

      {/* Main Timetable Matrix Board */}
      <div className="bg-white border rounded-2xl shadow-md overflow-hidden print:shadow-none print:border-none">
        
        {/* Printing Only Title Header */}
        <div className="hidden print:block text-center py-6 border-b-2 mb-6">
          <h1 className="text-3xl font-black text-[#0B3B24] tracking-wider uppercase">KY Academy Weekly Timetable</h1>
          <p className="text-slate-500 text-sm mt-1">캠퍼스 배정 주간 수업 일람표</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse table-fixed">
            
            <thead>
              <tr className="bg-[#0B3B24] text-white">
                <th className="w-32 border border-emerald-950 p-4 font-black text-xs text-[#C5A059] uppercase tracking-wider bg-[#062516]">시간대</th>
                {days.map(day => (
                  <th key={day} className="border border-emerald-950 p-4 font-black text-sm uppercase tracking-wider">
                    {day}요일
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {periods.map(period => (
                <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Left Time label */}
                  <td className="border border-slate-100 p-3 bg-slate-50/70 text-center font-bold text-slate-500 text-xs font-mono">
                    <div className="flex flex-col items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-[#C5A059] mb-1" />
                      <span>{period}</span>
                    </div>
                  </td>

                  {/* Daily Cell Mapping */}
                  {days.map(day => {
                    const matchingClasses = timetableClasses.filter(
                      c => c.day === day && c.time === period
                    );

                    return (
                      <td key={day} className="border border-slate-100 p-2.5 min-h-[90px] relative align-top">
                        
                        {matchingClasses.length > 0 ? (
                          <div className="space-y-2">
                            {matchingClasses.map(c => {
                              const colorStyle = colorsMap[c.color] || colorsMap.emerald;
                              return (
                                <div
                                  key={c.id}
                                  className={`p-2.5 rounded-xl border ${colorStyle} transition-all relative group flex flex-col justify-between`}
                                >
                                  {/* Hover Delete Button */}
                                  <button
                                    onClick={() => handleDeleteClass(c.id)}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-white/80 hover:bg-white text-rose-500 opacity-0 group-hover:opacity-100 transition-all no-print shadow-sm"
                                    title="수업 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>

                                  <div>
                                    <div className="font-black text-xs text-slate-800 line-clamp-1 pr-4">{c.name}</div>
                                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center space-x-1">
                                      <span>강사: {c.teacher}</span>
                                      <span>•</span>
                                      <span>{c.grade}</span>
                                    </div>
                                  </div>

                                  <div className="mt-2 flex justify-between items-center border-t border-slate-200/50 pt-1.5">
                                    <span className="text-[9px] font-bold text-[#0B3B24]">{c.classroom}</span>
                                    <span className="text-[8px] bg-[#0B3B24]/5 text-slate-400 font-mono tracking-tight">{day}요반</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setNewClass({
                                name: "",
                                teacher: "Chloe 김",
                                grade: "초등 전학년",
                                day: day,
                                time: period,
                                classroom: "A강의실",
                                color: "emerald"
                              });
                              setIsAddClassOpen(true);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-slate-50/60 text-slate-400 text-[10px] font-bold flex items-center justify-center border-2 border-dashed border-[#0B3B24]/10 rounded-xl no-print"
                          >
                            + 수업 등록
                          </button>
                        )}

                      </td>
                    );
                  })}

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

      {/* ADD CLASS MODAL DRAWER */}
      <AnimatePresence>
        {isAddClassOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClassOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] no-print"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[101] p-6 no-print max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-black text-[#0B3B24] text-base flex items-center">
                  <Plus className="w-5 h-5 text-[#C5A059] mr-1.5" />
                  신규 수업 정보 등록
                </h3>
                <button
                  onClick={() => setIsAddClassOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddClassSubmit} className="space-y-4 text-left">
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">과목명 / 반이름</label>
                  <input
                    type="text"
                    required
                    placeholder="예: Phonics Starters, Reading Master A"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">담당 강사명</label>
                    <input
                      type="text"
                      required
                      placeholder="예: Chloe 김"
                      value={newClass.teacher}
                      onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">대상 학년</label>
                    <input
                      type="text"
                      required
                      placeholder="예: 초1-2, 중등전체"
                      value={newClass.grade}
                      onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">진행 요일</label>
                    <select
                      value={newClass.day}
                      onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      {days.map(d => (
                        <option key={d} value={d}>{d}요일</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">배정 강의실</label>
                    <select
                      value={newClass.classroom}
                      onChange={(e) => setNewClass({ ...newClass, classroom: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold bg-white"
                    >
                      <option value="A강의실">A강의실 (Smart Lab)</option>
                      <option value="B강의실">B강의실 (Debate Hall)</option>
                      <option value="C강의실">C강의실 (Phonics Room)</option>
                      <option value="D강의실">D강의실 (Multimedia Studio)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">수업 진행 시간대</label>
                  <select
                    value={newClass.time}
                    onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-xs font-bold bg-white"
                  >
                    {periods.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">카드 배경 색상 테마</label>
                  <div className="flex space-x-2">
                    {["emerald", "blue", "amber", "rose", "indigo"].map((color) => {
                      const cls = colorsText[color] || colorsText.emerald;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewClass({ ...newClass, color })}
                          className={`flex-1 py-2 text-xs font-bold border rounded-lg uppercase ${cls} ${
                            newClass.color === color ? "ring-2 ring-[#0B3B24]" : "opacity-80"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4 flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddClassOpen(false)}
                    className="flex-1 py-3 border text-slate-500 hover:bg-slate-50 text-xs font-black rounded-xl transition-all"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0B3B24] hover:bg-[#062919] text-[#C5A059] text-xs font-black rounded-xl transition-all shadow-md"
                  >
                    수업 확정 등록
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
