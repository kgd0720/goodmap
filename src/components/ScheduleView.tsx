import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, CheckCircle2, Clock, FileSpreadsheet, ArrowLeft } from "lucide-react";

interface ScheduleViewProps {
  setView: (view: "hub" | "brand" | "home" | "step1" | "step2" | "quiz" | "result" | "admin" | "schedule" | "timetable") => void;
}

export default function ScheduleView({ setView }: ScheduleViewProps) {
  const [schedulePassword, setSchedulePassword] = useState<string>("");
  const [isScheduleUnlocked, setIsScheduleUnlocked] = useState<boolean>(false);
  const [unlockedCampusName, setUnlockedCampusName] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string>("");

  // Loaded from LocalStorage
  const [scheduleCheckedWeeks, setScheduleCheckedWeeks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ky_schedule_checked");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [operationalDecisions, setOperationalDecisions] = useState(() => {
    try {
      const saved = localStorage.getItem("ky_operational_decisions");
      return saved ? JSON.parse(saved) : {
        primaryTuition: "",
        secondaryTuition: "",
        classFrequency: "주 3회 (회당 50분)",
        nativeClasses: "주 1회",
        promoDate: "",
        promoText: "",
        targetAges: "",
        targetStudents: "",
        additionalNotes: ""
      };
    } catch {
      return {
        primaryTuition: "",
        secondaryTuition: "",
        classFrequency: "주 3회 (회당 50분)",
        nativeClasses: "주 1회",
        promoDate: "",
        promoText: "",
        targetAges: "",
        targetStudents: "",
        additionalNotes: ""
      };
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("ky_schedule_checked", JSON.stringify(scheduleCheckedWeeks));
  }, [scheduleCheckedWeeks]);

  useEffect(() => {
    localStorage.setItem("ky_operational_decisions", JSON.stringify(operationalDecisions));
  }, [operationalDecisions]);

  const WEEKLY_SCHEDULE_DATA = [
    {
      week: 1,
      title: "Week 1: 입지 물색 & 본사 상권 정밀 분석",
      tasks: [
        { id: "w1_1", text: "개원 예정 핵심 지역 선정 및 본사 Opening Map 정량 적합도 진단" },
        { id: "w1_2", text: "인근 경쟁 학원(어학원, 보습소) 수 및 초등학교 학생 수 데이터 파악" }
      ]
    },
    {
      week: 2,
      title: "Week 2: 가맹 계약 체결 및 도면 확정",
      tasks: [
        { id: "w2_1", text: "상가 최종 계약 완료 및 KY Academy 공식 가맹 계약서 서명" },
        { id: "w2_2", text: "인테리어 전문팀 방문 실측 및 스마트 교실 배치 설계 도면 확정" }
      ]
    },
    {
      week: 3,
      title: "Week 3: 인테리어 공사 착수 & 핵심 자재 발주",
      tasks: [
        { id: "w3_1", text: "내부 칸막이, 전기 설비, 소방 안전 자재 인테리어 공사 개시" },
        { id: "w3_2", text: "스마트 클래스룸 전용 일체형 태블릿 컴퓨터 및 가구 세트 발주" }
      ]
    },
    {
      week: 4,
      title: "Week 4: 교육청 설립 신청 & 강사 초빙 공고",
      tasks: [
        { id: "w4_1", text: "관할 교육지원청 학원 설립·운영 등록 서류 일체 및 허가 신청서 제출" },
        { id: "w4_2", text: "주요 강사 채용 사이트 공고 및 이력서 검토 (KY 자격 기준 부합자)" }
      ]
    },
    {
      week: 5,
      title: "Week 5: 수강료 신고 완료 & 본사 입문 교육",
      tasks: [
        { id: "w5_1", text: "학원 설립 등록증 수령 및 교육청 수강료 기준 조정 심의·신고 완료" },
        { id: "w5_2", text: "원장님 및 정규 초빙 강사 대상 본사 핵심 교수법 및 LMS 전산 교육 이수" }
      ]
    },
    {
      week: 6,
      title: "Week 6: 외부 현수막 게시 & 1차 학부모 설명회",
      tasks: [
        { id: "w6_1", text: "상가 외부 홍보 현수막(가로형/세로형) 설치 및 전단 배포 착수" },
        { id: "w6_2", text: "설명회 예약 접수용 네이버 폼 오픈 및 1차 학부모 초청 사업설명회 개최" }
      ]
    },
    {
      week: 7,
      title: "Week 7: 모의 테스트 및 원생 예약 접수",
      tasks: [
        { id: "w7_1", text: "등원 희망생 대상 레벨테스트(AI 진단지 활용) 및 대기 등록자 접수" },
        { id: "w7_2", text: "교실 최종 정밀 청소, 실내외 로고 간판 설치 및 원생 스마트 태블릿 점검" }
      ]
    },
    {
      week: 8,
      title: "Week 8: 교재 수급 완료 & 학원 그랜드 오픈",
      tasks: [
        { id: "w8_1", text: "원생수 대비 초도 교수용 및 학생용 오프라인 교재 본사 주문 및 진열" },
        { id: "w8_2", text: "개원식 및 대기 학부모 최종 상담 후 정규 주차별 본격 수업 전원 개강" }
      ]
    }
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schedulePassword === "123456") {
      setIsScheduleUnlocked(true);
      setUnlockedCampusName("KY 대치 대치캠퍼스 (Daechi)");
      setScheduleError("");
    } else if (schedulePassword === "777888") {
      setIsScheduleUnlocked(true);
      setUnlockedCampusName("KY 마포 공덕캠퍼스 (Gongdeok)");
      setScheduleError("");
    } else if (schedulePassword.length === 6) {
      setIsScheduleUnlocked(true);
      setUnlockedCampusName(`KY 서울대입구 캠퍼스 (코드: ${schedulePassword})`);
      setScheduleError("");
    } else {
      setScheduleError("비밀번호는 숫자 6자리여야 합니다. (예: 123456 또는 777888)");
    }
  };

  const totalTasks = WEEKLY_SCHEDULE_DATA.reduce((acc, week) => acc + week.tasks.length, 0);
  const checkedTasks = WEEKLY_SCHEDULE_DATA.reduce((acc, week) => {
    return acc + week.tasks.filter(t => scheduleCheckedWeeks[t.id]).length;
  }, 0);
  const progressPercentage = totalTasks > 0 ? Math.round((checkedTasks / totalTasks) * 100) : 0;

  const handleToggleTask = (taskId: string) => {
    setScheduleCheckedWeeks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleDecisionSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("축하합니다! 운영 결정사항(수강료, 수업횟수, 원어민 시수, 홍보일정 등)이 로컬 시스템에 안전하게 저장 및 락 설정 완료되었습니다.");
  };

  // IF locked, show password screen
  if (!isScheduleUnlocked) {
    return (
      <motion.div
        key="view_schedule_locked"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-md mx-auto py-12"
      >
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mx-auto border-2 border-[#C5A059]">
            <Lock className="w-8 h-8 text-[#C5A059]" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-800 font-sans">캠퍼스 인증키 입력</h2>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed font-semibold">
              본사에서 각 지점 캠퍼스에 개별 배정한<br />
              <strong>숫자 6자리 비밀번호</strong>를 입력해 주세요.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                placeholder="숫자 6자리 입력"
                value={schedulePassword}
                onChange={(e) => setSchedulePassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center tracking-widest text-2xl font-black py-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0B3B24] focus:border-transparent focus:bg-white text-[#0B3B24]"
              />
              {scheduleError && (
                <p className="text-rose-500 text-xs font-bold text-center mt-1">
                  {scheduleError}
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg text-left text-[11px] text-amber-900 font-semibold leading-relaxed">
              💡 <strong>알림:</strong> 테스트용 승인 코드는 <strong>123456</strong> 또는 <strong>777888</strong> 입니다. (혹은 임의의 숫자 6자리를 적으셔도 가상 가맹점이 등록 및 언락됩니다.)
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#0B3B24] hover:bg-[#062919] text-[#C5A059] font-black rounded-xl text-sm tracking-wide shadow-md transition-colors"
            >
              캠퍼스 개원일정 확인하기
            </button>
          </form>

          <button
            onClick={() => setView("hub")}
            className="text-xs text-slate-400 hover:text-slate-600 font-black transition-colors inline-block"
          >
            ← Opening Map 메인 홈으로 돌아가기
          </button>
        </div>
      </motion.div>
    );
  }

  // UNLOCKED: Show schedule screen
  return (
    <motion.div
      key="view_schedule_unlocked"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Header Info */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#0B3B24]/5 text-[#0B3B24] rounded-full border border-[#C5A059] flex items-center justify-center font-black">
            KY
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">{unlockedCampusName}</h1>
              <span className="text-[10px] bg-[#0B3B24] text-[#C5A059] px-2 py-0.5 rounded font-black">정식 가맹지사</span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">캠퍼스에 인가된 8주 정밀 개원 프로세스 및 운영 설정 보드입니다.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => { setIsScheduleUnlocked(false); setSchedulePassword(""); }}
            className="px-3.5 py-2 border text-slate-500 hover:text-slate-800 text-xs font-bold rounded-lg bg-white hover:bg-slate-50 transition-colors"
          >
            캠퍼스 로그아웃
          </button>
          <button
            onClick={() => setView("hub")}
            className="px-3.5 py-2 bg-[#0B3B24] text-[#C5A059] hover:bg-[#062919] text-xs font-black rounded-lg transition-colors"
          >
            KY 메인으로
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-black text-slate-800 flex items-center">
            <CheckCircle2 className="w-4 h-4 text-[#C5A059] mr-1.5" />
            개원 준비 공정 진행률
          </span>
          <span className="font-mono text-sm font-black text-[#0B3B24]">{progressPercentage}% ({checkedTasks}/{totalTasks} 완료)</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#0B3B24] to-[#C5A059] transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-semibold">각 주차의 할 일을 모두 완료한 후 체크박스를 터치하여 진행 현황을 저장하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: 8-Week Timeline checklists */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center">
            <Clock className="w-5 h-5 text-[#0B3B24] mr-2" />
            주차별 개원 프로세스 로드맵
          </h3>

          <div className="space-y-4 border-l-2 border-[#0B3B24]/20 pl-4 ml-2">
            {WEEKLY_SCHEDULE_DATA.map((item) => {
              const isWeekCompleted = item.tasks.every(t => scheduleCheckedWeeks[t.id]);
              return (
                <div key={item.week} className="relative space-y-2">
                  <div className={`absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 transition-colors ${isWeekCompleted ? "bg-[#C5A059] border-[#0B3B24]" : "bg-white border-[#0B3B24]/40"
                    }`} />

                  <div className={`p-4 rounded-xl border transition-all ${isWeekCompleted ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-slate-200"
                    }`}>
                    <div className="flex justify-between items-center mb-2.5">
                      <h4 className="font-black text-sm text-[#0B3B24]">{item.title}</h4>
                      {isWeekCompleted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">주차 완료</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {item.tasks.map((task) => {
                        const isChecked = !!scheduleCheckedWeeks[task.id];
                        return (
                          <label
                            key={task.id}
                            className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isChecked ? "bg-emerald-50/10 text-slate-500" : "hover:bg-slate-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTask(task.id)}
                              className="mt-0.5 w-4 h-4 text-[#0B3B24] border-slate-300 rounded focus:ring-[#0B3B24]"
                            />
                            <span className={`text-xs font-semibold leading-relaxed ${isChecked ? "line-through text-slate-400" : "text-slate-700"}`}>
                              {task.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Operational Decision Form */}
        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center">
            <FileSpreadsheet className="w-5 h-5 text-[#0B3B24] mr-2" />
            캠퍼스 운영 결정사항 입력
          </h3>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleDecisionSave} className="space-y-5">

              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 block">💰 학원 수강료 설정 (월 기준)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">초등부 수강료</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={operationalDecisions.primaryTuition}
                        onChange={(e) => setOperationalDecisions({ ...operationalDecisions, primaryTuition: e.target.value.replace(/\D/g, "") })}
                        className="w-full pl-3 pr-8 py-2 border rounded-lg text-xs font-bold text-right"
                        placeholder="예: 240000"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">원</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">중등부 수강료</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={operationalDecisions.secondaryTuition}
                        onChange={(e) => setOperationalDecisions({ ...operationalDecisions, secondaryTuition: e.target.value.replace(/\D/g, "") })}
                        className="w-full pl-3 pr-8 py-2 border rounded-lg text-xs font-bold text-right"
                        placeholder="예: 310000"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">원</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">⏰ 주간 수업 횟수</label>
                <select
                  value={operationalDecisions.classFrequency}
                  onChange={(e) => setOperationalDecisions({ ...operationalDecisions, classFrequency: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="주 3회 (회당 50분)">주 3회 (회당 50분)</option>
                  <option value="주 5회 (회당 40분)">주 5회 (회당 40분)</option>
                  <option value="주 2회 (회당 90분)">주 2회 (회당 90분)</option>
                  <option value="기타 (자율 조율)">기타 (자율 조율)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">🗣️ 원어민 수업 횟수 (주당)</label>
                <div className="grid grid-cols-3 gap-2">
                  {["주 1회", "주 2회", "없음"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setOperationalDecisions({ ...operationalDecisions, nativeClasses: opt })}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${operationalDecisions.nativeClasses === opt
                          ? "border-[#0B3B24] bg-[#0B3B24]/5 text-[#0B3B24]"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 block">📢 학부모 대면 홍보 및 설명회 일정</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">홍보 개시 예정일</span>
                    <input
                      type="date"
                      value={operationalDecisions.promoDate}
                      onChange={(e) => setOperationalDecisions({ ...operationalDecisions, promoDate: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold text-slate-600"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">설명회 상세 및 홍보 슬로건</span>
                    <input
                      type="text"
                      value={operationalDecisions.promoText}
                      onChange={(e) => setOperationalDecisions({ ...operationalDecisions, promoText: e.target.value })}
                      className="w-full p-2.5 border rounded-lg text-xs font-bold text-slate-700"
                      placeholder="예: 초교 사거리 앞 대규모 웰컴 전단배포 및 소설명회 개최"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 block mb-1">모집 타겟 연령</label>
                  <input
                    type="text"
                    value={operationalDecisions.targetAges}
                    onChange={(e) => setOperationalDecisions({ ...operationalDecisions, targetAges: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-xs font-bold"
                    placeholder="예: 초등 1-6학년"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 block mb-1">첫달 목표 원생수</label>
                  <input
                    type="text"
                    value={operationalDecisions.targetStudents}
                    onChange={(e) => setOperationalDecisions({ ...operationalDecisions, targetStudents: e.target.value })}
                    className="w-full p-2.5 border rounded-lg text-xs font-bold"
                    placeholder="예: 80명"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">📝 개원 비고 및 특이 결정사항</label>
                <textarea
                  value={operationalDecisions.additionalNotes}
                  onChange={(e) => setOperationalDecisions({ ...operationalDecisions, additionalNotes: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-xs font-bold h-20 text-slate-700"
                  placeholder="강사 인력 구인 현황 및 개별 상권 인테리어 조율사항 작성"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0B3B24] hover:bg-[#062919] text-[#C5A059] font-black text-xs rounded-xl shadow-md transition-colors"
              >
                결정사항 저장 및 락 설정
              </button>

            </form>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
