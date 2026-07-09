import React from "react";
import { motion } from "motion/react";
import { Sparkles, Search, TrendingUp, Calendar, Grid, ChevronRight } from "lucide-react";

interface HubViewProps {
  setView: (view: "hub" | "brand" | "home" | "step1" | "step2" | "quiz" | "result" | "admin" | "schedule" | "timetable") => void;
  isAdminAuthenticated?: boolean;
}

export default function HubView({ setView, isAdminAuthenticated }: HubViewProps) {
  return (
    <motion.div
      key="view_hub"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="py-6 md:py-10 max-w-5xl mx-auto space-y-12"
      id="section_hub"
    >
      {/* Premium Welcome Hero Card */}
      <div className="relative p-8 md:p-14 bg-gradient-to-br from-[#0B3B24] to-[#062416] rounded-3xl border-2 border-[#C5A059]/30 shadow-2xl overflow-hidden text-center text-white" id="hub_welcome_hero">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#C5A059]/20 to-transparent rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#C5A059]/10 to-transparent rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/35 text-[10px] tracking-widest text-[#C5A059] font-black uppercase mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PREMIUM ACADEMY CONSULTING SERVICE SYSTEM</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight mb-4">
          KY Academy Consulting
        </h1>

        <p className="text-base md:text-xl text-[#C5A059] font-medium tracking-wide mb-6">
          10년의 학원 개원 노하우를 집약한 스마트 원스톱 오퍼레이션 솔루션
        </p>

        <p className="text-white/70 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
          KY Academy는 고려대학교 교육협력 파트너사들과 함께 최첨단 AI 개원 진단 플랫폼(Opening Map)부터<br />
          가맹 브랜드 투어, 주차별 타임라인 스케줄링 및 수업 시간표 제작까지 원스톱으로 제공하여 학원 성공 가도를 보장합니다.
        </p>
      </div>

      {/* 4 Core Functions Grid */}
      <div>
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-[#0B3B24] tracking-wider uppercase bg-[#0B3B24]/5 px-3 py-1 rounded-full">CORE FEATURES</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 mt-2">원장님을 위한 4대 핵심 서비스</h2>
          <p className="text-slate-500 text-xs mt-1">원하시는 서비스를 클릭하여 맞춤 컨설팅 솔루션을 경험해보세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="hub_features_grid">
          
          {/* Card 1: 브랜드 알아보기 */}
          <button
            onClick={() => { setView("brand"); }}
            className="flex text-left p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#C5A059] hover:-translate-y-1 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A059]/5 rounded-bl-full group-hover:bg-[#C5A059]/10 transition-colors pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mr-5 transition-all group-hover:bg-[#0B3B24] group-hover:text-white shrink-0 shadow-sm">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[#0B3B24] font-black text-lg group-hover:text-[#C5A059] transition-colors">브랜드 알아보기</h3>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">INTRO</span>
              </div>
              <p className="text-[#C5A059] text-xs font-bold mt-0.5">가맹 브로슈어 & 브랜드 홍보 영상</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5 font-semibold">
                KY Academy의 독보적인 커리큘럼, 8단계 교재 수직 설계, 맞춤형 인테리어 및 본사 무상 마케팅 패키지를 확인하고 영상을 재생합니다.
              </p>
              <div className="flex items-center space-x-1 text-[11px] font-bold text-[#0B3B24] mt-4">
                <span>상세히 알아보기</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 2: 개원진단 */}
          <button
            onClick={() => { setView("home"); }}
            className="flex text-left p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#C5A059] hover:-translate-y-1 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A059]/5 rounded-bl-full group-hover:bg-[#C5A059]/10 transition-colors pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mr-5 transition-all group-hover:bg-[#0B3B24] group-hover:text-white shrink-0 shadow-sm">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[#0B3B24] font-black text-lg group-hover:text-[#C5A059] transition-colors">개원진단 (Opening Map)</h3>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">DIAGNOSTIC</span>
              </div>
              <p className="text-[#C5A059] text-xs font-bold mt-0.5">창업 적합도 & 정량 상권분석 AI 발급</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5 font-semibold">
                경력, 투자금, 인재 채용 역량 및 타겟 초교 인원 분석을 교차 매핑하여, 성공 입지 전략을 제안하는 오프닝맵 레포트를 생성합니다.
              </p>
              <div className="flex items-center space-x-1 text-[11px] font-bold text-[#0B3B24] mt-4">
                <span>즉시 진단 개시</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 3: 개원일정 */}
          <button
            onClick={() => { setView("schedule"); }}
            className="flex text-left p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#C5A059] hover:-translate-y-1 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A059]/5 rounded-bl-full group-hover:bg-[#C5A059]/10 transition-colors pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mr-5 transition-all group-hover:bg-[#0B3B24] group-hover:text-white shrink-0 shadow-sm">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[#0B3B24] font-black text-lg group-hover:text-[#C5A059] transition-colors">개원일정 스케줄러</h3>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">TIMELINE</span>
              </div>
              <p className="text-[#C5A059] text-xs font-bold mt-0.5">캠퍼스 보안 코드 기반 개원 8주차 진행사항</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5 font-semibold">
                부여받은 6자리 비밀번호로 로그인하여, 주차별 할 일 체크리스트를 정립하고 수강료 및 수업 횟수 등 결정사항을 기입합니다.
              </p>
              <div className="flex items-center space-x-1 text-[11px] font-bold text-[#0B3B24] mt-4">
                <span>보안 관리자 인증</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Card 4: 시간표제작 */}
          <button
            onClick={() => {
              if (isAdminAuthenticated) {
                setView("timetable");
              } else {
                alert("시간표 제작기 빌더는 본사 관리자 전용 솔루션입니다. 본사 관리자 계정(admin)으로 로그인하여 권한을 획득해 주십시오.");
                setView("admin");
              }
            }}
            className="flex text-left p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#C5A059] hover:-translate-y-1 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A059]/5 rounded-bl-full group-hover:bg-[#C5A059]/10 transition-colors pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mr-5 transition-all group-hover:bg-[#0B3B24] group-hover:text-white shrink-0 shadow-sm">
              <Grid className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[#0B3B24] font-black text-lg group-hover:text-[#C5A059] transition-colors">시간표제작</h3>
                <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">SCHEDULER</span>
              </div>
              <p className="text-[#C5A059] text-xs font-bold mt-0.5">스마트 영어학원 맞춤 주간 시간표 빌더</p>
              <p className="text-slate-500 text-xs leading-relaxed mt-2.5 font-semibold">
                수업명, 담당 강사, 대상 학년 및 강의실을 드래그-드롭하듯 손쉽게 레이아웃하고 배치하는 주간 관리 솔루션입니다.
              </p>
              <div className="flex items-center space-x-1 text-[11px] font-bold text-[#0B3B24] mt-4">
                <span>시간표 제작 시작</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

        </div>
      </div>
    </motion.div>
  );
}
