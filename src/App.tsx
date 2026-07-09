import React, { useState, useEffect, useRef, useTransition, startTransition } from "react";
import { supabase } from "./lib/supabaseClient";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Sparkles,
  Lock,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Phone,
  MapPin,
  RefreshCw,
  LayoutDashboard,
  FileSpreadsheet,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  PieChart,
  Grid,
  Check,
  ChevronDown,
  Users,
  Plus,
  Trash2,
  Printer,
  Menu,
  X,
  Upload,
  Edit2,
  Save,
  Image as ImageIcon,
  MessageSquare,
  RotateCcw,
  Eye,
  Play,
  ExternalLink
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as XLSX from "xlsx";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Applicant, Question } from "./types";
import LeadQualityTrendChart from "./components/LeadQualityTrendChart";
import {
  NEW_FRANCHISE_QUESTIONS,
  BRAND_SWITCH_QUESTIONS,
  COMPETENCY_GRADES,
  LEAD_GRADES
} from "./data/questionsData";
import { calculateAnalysis, getQuestionFeedback, generateCounselorOpinion, getFullStatusHistory, isStagnated } from "./utils/analysis";
import HubView from "./components/HubView";
import BrandView from "./components/BrandView";
import ScheduleView from "./components/ScheduleView";
import TimetableBuilder from "./components/TimetableBuilder";
import OpeningMapResult from "./components/OpeningMapResult";
import { BudgetSimulator } from "./components/BudgetSimulator";


// Helper functions for safe typed dictionary lookups in TSX templates
const getCompetencyLabelAndDesc = (rank: "S" | "A" | "B" | "C" | "D" | undefined, franchiseType?: string): string => {
  if (!rank) return "";
  const isBrand = franchiseType === "브랜드 전환" || franchiseType === "브랜드전환";
  const map: Record<string, string> = {
    S: "즉시 개원 가능, 최상위 준비 완료",
    A: "일부 보완 후 개원 가능",
    B: "핵심 영역 보완 필요, 본사 지원 필수",
    C: isBrand ? "전반적 준비 부족, 저비용 개원 검토" : "전반적 준비 부족, 소형·저비용 개원 검토",
    D: "개원 재검토 단계, 역량 강화 우선"
  };
  return map[rank] || "";
};

const getCompetencyFlowText = (rank: "S" | "A" | "B" | "C" | "D" | undefined): string => {
  if (!rank) return "";
  const map: Record<string, string> = {
    S: "영어학원 가맹/전환을 위한 역량이 매우 우수합니다. 수업, 운영, 상담 및 기지 관리가 최상위 수준으로 즉시 추진이 가능합니다.",
    A: "개설 역량이 전반적으로 우수합니다. 일부 국소 영역 보완을 진행하여 안정적인 신학기 개원 로드맵 구축이 권장됩니다.",
    B: "학습 성과나 경영 부무의 핵심 보완이 수반되어야 승산이 높으며, 본사 아카데미 교육 및 슈퍼바이징 집중 관리가 필수적입니다.",
    C: "원장 전반 정밀 실무 준비 도가 다소 낮으므로, 저비용 실속형 창업 구조를 매치하거나 세부 상권 입지 필터링을 거치시길 제안합니다.",
    D: "현재 단계 지표 기준으로는 무리한 매입/계약보다 충분한 실전 티칭 및 상담 교육을 선행 이수하여 기초 역량을 갖춘 후 재검포를 권장합니다."
  };
  return map[rank] || "";
};

const getLeadGradeDescText = (rank: "S" | "A" | "B" | "C" | undefined): string => {
  if (!rank) return "";
  const map: Record<string, string> = {
    S: "개원 초읽기 단계 - 즉각 집중 컨설팅 착수 추천",
    A: "최적 준비 착수 단계 - 상세 지역 상권분석 및 입지선정 진행",
    B: "선행 준비 단계 - 본사 사업설명회 참석 및 자본 가이드라인 컨설팅",
    C: "장기 탐색 단계 - 지속적 유대 형성 및 개원 정기 정보 메일 전송"
  };
  return map[rank] || "";
};

const calculateKoreanAge = (birthStr: string): number | null => {
  if (!birthStr) return null;
  const parts = birthStr.split("-");
  if (parts.length < 2) return null;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);

  if (isNaN(birthYear) || isNaN(birthMonth)) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const formatAppliedAt = (dateStr?: string): string => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
};

const getMajorRegion = (regionStr: string): string => {
  if (!regionStr || regionStr.trim() === "" || regionStr.includes("미정")) return "미정/기타";
  const trimmed = regionStr.trim();

  if (trimmed.startsWith("서울")) return "서울";
  if (trimmed.startsWith("경기")) return "경기/인천";
  if (trimmed.startsWith("인천")) return "경기/인천";
  if (trimmed.startsWith("부산")) return "부산/울산/경남";
  if (trimmed.startsWith("울산")) return "부산/울산/경남";
  if (trimmed.startsWith("경남")) return "부산/울산/경남";
  if (trimmed.startsWith("대구")) return "대구/경북";
  if (trimmed.startsWith("경북")) return "대구/경북";
  if (trimmed.startsWith("광주")) return "광주/전라";
  if (trimmed.startsWith("전남")) return "광주/전라";
  if (trimmed.startsWith("전북")) return "광주/전라";
  if (trimmed.startsWith("대전")) return "대전/세종/충청";
  if (trimmed.startsWith("세종")) return "대전/세종/충청";
  if (trimmed.startsWith("충남")) return "대전/세종/충청";
  if (trimmed.startsWith("충북")) return "대전/세종/충청";
  if (trimmed.startsWith("강원")) return "강원";
  if (trimmed.startsWith("제주")) return "제주";

  const firstWord = trimmed.split(" ")[0];
  if (firstWord.length <= 4) return firstWord;

  return "미정/기타";
};

const getCustomItemTitle = (label: string, score: number, isStr: boolean): string => {
  if (score >= 4) return "우수";
  if (score === 3) return "준수";
  return "검토필요";
};

// Configure PDF.js worker
if (typeof window !== "undefined" && "pdfjsLib" in window === false) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

const generatePdfThumbnail = async (pdfUrl: string): Promise<string | null> => {
  try {
    const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const scale = 0.5; // low res for thumbnail
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext: any = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch (error) {
    console.error("Failed to generate PDF thumbnail:", error);
    return null;
  }
};

export default function App() {
  const [view, setView] = useState<"hub" | "brand" | "home" | "step1" | "step2" | "quiz" | "result" | "admin" | "schedule" | "timetable">("hub");

  // BRAND TAB State
  const [brandTab, setBrandTab] = useState<"brochure" | "video">("brochure");
  const [brochurePage, setBrochurePage] = useState<number>(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // SCHEDULE State
  const [schedulePassword, setSchedulePassword] = useState<string>("");
  const [isScheduleUnlocked, setIsScheduleUnlocked] = useState<boolean>(false);
  const [unlockedCampusName, setUnlockedCampusName] = useState<string>("");
  const [scheduleError, setScheduleError] = useState<string>("");
  const [scheduleCheckedWeeks, setScheduleCheckedWeeks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("ky_schedule_weeks");
    return saved ? JSON.parse(saved) : {};
  });
  const [operationalDecisions, setOperationalDecisions] = useState(() => {
    const saved = localStorage.getItem("ky_operational_decisions");
    return saved ? JSON.parse(saved) : {
      primaryTuition: "240000",
      secondaryTuition: "310000",
      classFrequency: "주 3회 (회당 50분)",
      nativeClasses: "주 1회",
      promoDate: "2026-08-15",
      promoText: "개원 학부모 1차 사업설명회 개최",
      targetAges: "초등 전학년 및 중등 1학년",
      targetStudents: "100명",
      additionalNotes: "고급 인테리어 컨셉과 차별화된 멀티미디어 교실 적극 마케팅 예정"
    };
  });

  // TIMETABLE State
  const [timetableClasses, setTimetableClasses] = useState(() => {
    const saved = localStorage.getItem("ky_timetable_classes");
    const defaultClasses = [
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
    return saved ? JSON.parse(saved) : defaultClasses;
  });
  const [isAddClassOpen, setIsAddClassOpen] = useState<boolean>(false);
  const [newClass, setNewClass] = useState({
    name: "",
    teacher: "",
    grade: "",
    day: "월",
    time: "14:00 - 14:50",
    classroom: "A강의실",
    color: "emerald"
  });

  // Local Storage Sync Effects
  useEffect(() => {
    localStorage.setItem("ky_schedule_weeks", JSON.stringify(scheduleCheckedWeeks));
  }, [scheduleCheckedWeeks]);

  useEffect(() => {
    localStorage.setItem("ky_operational_decisions", JSON.stringify(operationalDecisions));
  }, [operationalDecisions]);

  useEffect(() => {
    localStorage.setItem("ky_timetable_classes", JSON.stringify(timetableClasses));
  }, [timetableClasses]);

  // Simulated Video Player Play/Scrub Timer
  useEffect(() => {
    let timer: any;
    if (videoPlaying) {
      timer = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 100) {
            setVideoPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [videoPlaying]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newQuestions, setNewQuestions] = useState<Question[]>(NEW_FRANCHISE_QUESTIONS);
  const [brandQuestions, setNewBrandQuestions] = useState<Question[]>(BRAND_SWITCH_QUESTIONS);

  // STEP 1 State: Verification Code
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [counselorMatched, setCounselorMatched] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  // STEP 2 State: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    birth: "",
    phone: "",
    region: "",
    openingMonth: "2026-09", // Default
    franchiseType: "신규 창업" as "신규 창업" | "브랜드 전환",
    operationType: "개인사업" as "개인사업" | "동업" | "법인",
    englishMajor: "전공" as "전공" | "비전공",
    englishSpeaking: "유창" as "유창" | "기본" | "불가",
    personality: "외향형" as "내향형" | "외향형",
    inflowRoute: "인터넷검색" as "인터넷검색" | "지인추천" | "인스타그램" | "사업설명회" | "기타",
    mainConcern: "",
    // Budget Simulator integrations
    desiredArea: 30,
    regionalTier: "Tier 2",
    calculatedBudget: 11000,
    myCapital: 8000
  });

  // Helper functions for birthday Year/Month dual inputs helper
  const [birthYearStr, birthMonthStr] = (basicInfo.birth || "").split("-");
  const handleBirthYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    const m = birthMonthStr || "01";
    setBasicInfo(prev => ({ ...prev, birth: cleaned ? `${cleaned}-${m}` : `-${m}` }));
    if (cleaned.length === 4) {
      setTimeout(() => {
        const monthInput = document.getElementById("birth_month_input");
        if (monthInput) monthInput.focus();
      }, 10);
    }
  };
  const handleBirthMonthChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 2);
    let formattedM = cleaned;
    if (cleaned) {
      const num = parseInt(cleaned, 10);
      if (num > 12) formattedM = "12";
    }
    const y = birthYearStr || "1985";
    setBasicInfo(prev => ({ ...prev, birth: formattedM ? `${y}-${formattedM.padStart(2, '0')}` : `${y}-` }));
  };

  // STEP 3 State: Quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([0, 0, 0, 0, 0, 0]); // 0 means unselected, options range 1 to 5

  // STEP 4/Result state
  const [diagnosisResult, setDiagnosisResult] = useState<Applicant | null>(null);
  const [aiReportLoading, setAiReportLoading] = useState<boolean>(false);
  const [resultActiveTab, setResultActiveTab] = useState<"page1" | "page2">("page1");
  const [selectedMapHotspotIndex, setSelectedMapHotspotIndex] = useState<number>(0);
  const [localOpinion, setLocalOpinion] = useState<string>("");
  const [savingOpinion, setSavingOpinion] = useState<boolean>(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);

  useEffect(() => {
    if (diagnosisResult) {
      setLocalOpinion(diagnosisResult.counselorOpinion || "");
    }
  }, [diagnosisResult]);

  const diagnosisResultAnalysis = diagnosisResult ? calculateAnalysis(diagnosisResult) : null;

  const renderStructuredOpinion = (opinion: string) => {
    if (!opinion) return null;

    const hasSections = opinion.includes("[1. ") || opinion.includes("[1.");
    if (!hasSections) {
      return (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">{opinion}</p>
        </div>
      );
    }

    const sections: { [key: string]: string[] } = {
      summary: [],
      strengths: [],
      challenges: [],
      roadmap: [],
      comment: [],
    };

    let currentSection = "";
    const lines = opinion.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.includes("1. 진단 총평") || trimmed.includes("1.진단 총평") || trimmed.includes("1. 진단총평")) {
        currentSection = "summary";
      } else if (trimmed.includes("2. 강점 분석") || trimmed.includes("2.강점 분석") || trimmed.includes("2. 강점분석")) {
        currentSection = "strengths";
      } else if (trimmed.includes("3. 핵심 보완 과제") || trimmed.includes("3.핵심 보완 과제") || trimmed.includes("3. 핵심보완과제") || trimmed.includes("3. 핵심 보완과제")) {
        currentSection = "challenges";
      } else if (trimmed.includes("4. 개원 로드맵") || trimmed.includes("4.개원 로드맵") || trimmed.includes("4. 개원로드맵")) {
        currentSection = "roadmap";
      } else if (trimmed.includes("5. 컨설턴트 코멘트") || trimmed.includes("5.컨설턴트 코멘트") || trimmed.includes("5. 컨설턴트코멘트")) {
        currentSection = "comment";
      } else {
        if (currentSection) {
          sections[currentSection].push(trimmed);
        } else {
          sections["summary"].push(trimmed);
        }
      }
    }

    return (
      <div className="space-y-6 text-slate-800">
        {/* 1. 진단 총평 */}
        {sections.summary.length > 0 && (
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 shadow-2xs">
            <div className="text-[#0B3B24] font-extrabold text-[14px] sm:text-base mb-2 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
              <span className="w-5 h-5 rounded bg-[#0B3B24] text-[#C5A059] flex items-center justify-center text-xs font-bold font-mono shrink-0">1</span>
              <span>진단 총평</span>
            </div>
            <p className="text-xs sm:text-sm text-[#0B3B24] leading-relaxed font-black font-sans">
              {sections.summary.join("\n")}
            </p>
          </div>
        )}

        {/* 2. 강점 분석 */}
        {sections.strengths.length > 0 && (
          <div className="bg-emerald-50/20 border border-emerald-105 rounded-xl p-5 shadow-2xs">
            <div className="text-[#0B3B24] font-extrabold text-[14px] sm:text-base mb-3 flex items-center gap-1.5 border-b border-emerald-100/60 pb-2">
              <span className="w-5 h-5 rounded bg-[#0B3B24] text-[#C5A059] flex items-center justify-center text-xs font-bold font-mono shrink-0">2</span>
              <span>강점 분석</span>
            </div>
            <ul className="space-y-2.5 pl-1">
              {sections.strengths.map((str, i) => {
                const cleaned = str.replace(/^-\s*/, "");
                return (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✔</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 3. 핵심 보완 과제 */}
        {sections.challenges.length > 0 && (
          <div className="bg-rose-50/20 border border-rose-100/80 rounded-xl p-5 shadow-2xs">
            <div className="text-rose-800 font-extrabold text-[14px] sm:text-base mb-3 flex items-center gap-1.5 border-b border-rose-100/60 pb-2">
              <span className="w-5 h-5 rounded bg-rose-700 text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">3</span>
              <span>핵심 보완 과제</span>
            </div>
            <ul className="space-y-2.5 pl-1">
              {sections.challenges.map((str, i) => {
                const cleaned = str.replace(/^-\s*/, "");
                return (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="text-rose-500 font-black shrink-0 mt-0.5">⚠️</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 4. 개원 로드맵 */}
        {sections.roadmap.length > 0 && (
          <div className="bg-[#0B3B24]/5 border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="text-[#0B3B24] font-extrabold text-[14px] sm:text-base mb-4 flex items-center gap-1.5 border-b border-[#0B3B24]/10 pb-2">
              <span className="w-5 h-5 rounded bg-[#0B3B24] text-[#C5A059] flex items-center justify-center text-xs font-bold font-mono shrink-0">4</span>
              <span>개원 로드맵</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {sections.roadmap.map((str, i) => {
                const cleaned = str.replace(/^-\s*/, "");
                const isNumbered = cleaned.match(/^([1-4]+단계)\s*\(([^)]+)\):\s*(.*)/);
                if (isNumbered) {
                  const [, step, period, details] = isNumbered;
                  return (
                    <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 flex gap-3 shadow-3xs items-start">
                      <span className="bg-[#0B3B24] text-[#C5A059] text-[10px] font-bold px-2 py-0.5 rounded shrink-0 font-mono mt-0.5">{step} &middot; {period}</span>
                      <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed m-0">{details}</p>
                    </div>
                  );
                }
                return (
                  <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 flex gap-2 shadow-3xs items-start">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059] shrink-0 mt-2" />
                    <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed m-0">{cleaned}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. 컨설턴트 코멘트 */}
        {sections.comment.length > 0 && (
          <div className="bg-amber-50/10 border-l-4 border-[#C5A059] bg-white border-y border-r border-[#C5A059]/20 rounded-r-xl p-5 shadow-2xs">
            <div className="text-amber-800 font-bold text-[14px] sm:text-[15px] mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#C5A059] text-white flex items-center justify-center text-xs font-bold font-mono shrink-0">5</span>
              <span>컨설턴트 코멘트</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold pl-6 whitespace-pre-wrap">
              {sections.comment.join("\n")}
            </p>
          </div>
        )}
      </div>
    );
  };

  const getCategoryActionTags = (category: string, score: number) => {
    const norm = (category === "원장경험" || category === "원장 경영" || category === "원장 경력") ? "원장경험" :
      (category === "강사경험" || category === "영어 교수") ? "강사경험" :
        (category === "재정성" || category === "투자 가용" || category === "자본 준비") ? "재정성" :
          (category === "지역분석" || category === "운영 형태" || category === "상담 역량") ? "지역분석" :
            (category === "학부모소득" || category === "원내 공간" || category === "학사 행정") ? "학부모소득" :
              "회의역량";

    if (norm === "원장경험") {
      return score >= 4 ? ["경영 최고 경쟁력 활용", "프리미엄 학사 세무 세팅"] :
        score === 3 ? ["본사 임원 회계 단기 연수", "행정 매뉴얼 정독 권장"] :
          ["본사 신임 원장 경영 필수 이수", "현장 가상 행정 시뮬레이션 참가"];
    }
    if (norm === "강사경험") {
      return score >= 4 ? ["차별화 직강 홍보 극대화", "자체 티칭 노하우 세부 전수"] :
        score === 3 ? ["티칭 클리닉 3회 참관", "교수법 모의 피드백 검토"] :
          ["오프닝맵 티칭 인큐베이팅 필수 신청", "본사 인증 전임 강사 우선 배정"];
    }
    if (norm === "재정성") {
      return score >= 4 ? ["공격적 마케팅 툴 조기 도입", "프리미엄 인테리어 구성"] :
        score === 3 ? ["예비 가용 예비비 소폭 조정", "임차 보증금 일부 조율"] :
          ["인테리어 협정 렌탈 론 활용", "교습소형 저지출 특화 개설안 연계"];
    }
    if (norm === "지역분석") {
      return score >= 4 ? ["로컬 대인 설명회 선제 추진", "인근 초교 3곳 연중 타겟팅"] :
        score === 3 ? ["현장 아파트 상권 정밀 실사", "본사 상업지 홍보기 배포"] :
          ["컨설턴트 동반 상권 실사 세션", "본사 신학기 설명회 무상 접수"];
    }
    if (norm === "학부모소득") {
      return score >= 4 ? ["스피킹 고급 단과반 우선 구성", "프리미엄 교육비 수가 산정"] :
        score === 3 ? ["학부모 가계 지시 분포 수렴", "수강 구성 가성비 배점 보완"] :
          ["안심 교육비 한도 조정안 협의", "학부모 초빙 지원 프로모션 배부"];
    }
    // 회의역량
    return score >= 4 ? ["성과급 연동 강사풀 구축", "스탭 조직 관리 매뉴얼 배점"] :
      score === 3 ? ["기획 타임테이블 구성 연수", "인력 수급 매칭 가이드라인"] :
        ["파트타임 강사 통솔 단기 훈력", "본사 수강 시간표 무상 템플릿 참조"];
  };

  // ADMIN state
  const [adminSearch, setAdminSearch] = useState<string>("");
  const [adminFilterFranchise, setAdminFilterFranchise] = useState<string>("All");
  const [adminFilterCompetency, setAdminFilterCompetency] = useState<string>("All");
  const [adminFilterLead, setAdminFilterLead] = useState<string>("All");
  const [adminFilterStatus, setAdminFilterStatus] = useState<string>("All");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminId, setAdminId] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminAuthError, setAdminAuthError] = useState<string>("");
  const [adminCategoryTab, setAdminCategoryTab] = useState<string>("dashboard");
  const [adminClassificationGroup, setAdminClassificationGroup] = useState<string>("status");

  // Brand Configuration Manager Form States
  const [adminBrochures, setAdminBrochures] = useState<any[]>([]);
  const [editingBrochureId, setEditingBrochureId] = useState<string | null>(null);
  const [editBrochureData, setEditBrochureData] = useState<{ title: string, description: string, allowDownload: boolean }>({ title: "", description: "", allowDownload: true });

  const [adminVideos, setAdminVideos] = useState<any[]>([]);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<any | null>(null);

  // Custom dialog modal state to avoid iframe sandboxing blocking issues
  const [modalDialog, setModalDialog] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  // iFrame safety helper for window dialogs (avoids crashing in sandboxed containers)
  const safeConfirm = (msg: string, title = "확인 요청"): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalDialog({
        isOpen: true,
        type: "confirm",
        title,
        message: msg,
        confirmText: "예",
        cancelText: "아니오",
        onConfirm: () => {
          setModalDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setModalDialog(null);
          resolve(false);
        }
      });
    });
  };

  const safeAlert = (msg: string, title = "알림"): Promise<void> => {
    return new Promise((resolve) => {
      setModalDialog({
        isOpen: true,
        type: "alert",
        title,
        message: msg,
        confirmText: "확인",
        onConfirm: () => {
          setModalDialog(null);
          resolve();
        }
      });
    });
  };

  const [brochureTitle, setBrochureTitle] = useState<string>("");
  const [brochureDesc, setBrochureDesc] = useState<string>("");
  const [brochureAllowDownload, setBrochureAllowDownload] = useState<boolean>(true);
  const [brochureFiles, setBrochureFiles] = useState<File[]>([]);
  const [draggedFileIndex, setDraggedFileIndex] = useState<number | null>(null);
  const [dragOverFileIndex, setDragOverFileIndex] = useState<number | null>(null);
  const [brochureDirectUrl, setBrochureDirectUrl] = useState<string>("");

  const [brochureUploading, setBrochureUploading] = useState<boolean>(false);
  const [isDraggingBrochure, setIsDraggingBrochure] = useState<boolean>(false);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  // Custom Toast System
  const [toasts, setToasts] = useState<{ id: string; type: "success" | "info" | "error"; message: string }[]>([]);
  const addToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Upload feedback state for brochure
  const [brochureUploadFeedback, setBrochureUploadFeedback] = useState<{ status: "idle" | "uploading" | "success" | "error"; message?: string }>({ status: "idle" });

  const handleBrochureFileSelection = async (files: File[]) => {
    const MAX_SIZE = 200 * 1024 * 1024;
    const oversized = files.find(f => f.size > MAX_SIZE);
    if (oversized) {
      addToast(`200MB를 초과하는 파일은 등록할 수 없습니다. (${oversized.name})`, "error");
      return;
    }

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf')) {
      setBrochureFiles(files);
      setBrochureDirectUrl("");
      if (!brochureTitle.trim()) {
        setBrochureTitle(files[0].name.replace(/\.[^/.]+$/, ""));
      }
      addToast(`PDF 파일이 첨부되었습니다.`, "success");
    } else {
      // Normal images
      setBrochureFiles(files);
      setBrochureDirectUrl("");
      if (!brochureTitle.trim()) {
        const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, "");
        setBrochureTitle(nameWithoutExt + (files.length > 1 ? ` 외 ${files.length - 1}건` : ""));
      }
      addToast(`파일 ${files.length}개가 첨부되었습니다.`, "success");
    }
  };

  const [videoTitle, setVideoTitle] = useState<string>("");
  const [videoDesc, setVideoDesc] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<string>("");

  // Brand Content Bulk Registration States
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [bulkType, setBulkType] = useState<"brochure" | "video">("brochure");
  const [bulkInputText, setBulkInputText] = useState<string>("");
  const [bulkBrochures, setBulkBrochures] = useState<any[]>([]);
  const [bulkVideos, setBulkVideos] = useState<any[]>([]);
  const [bulkProgressCurrent, setBulkProgressCurrent] = useState<number>(0);
  const [bulkProgressTotal, setBulkProgressTotal] = useState<number>(0);
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);

  // Consultant management form state
  const [newConsultantCode, setNewConsultantCode] = useState<string>("");
  const [newConsultantName, setNewConsultantName] = useState<string>("");
  const [consultantUpdateMessage, setConsultantUpdateMessage] = useState<string>("");
  const [consultantUpdateError, setConsultantUpdateError] = useState<string>("");

  // Edit Consultant State
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editCodeValue, setEditCodeValue] = useState<string>("");
  const [editNameValue, setEditNameValue] = useState<string>("");

  const handleStartEditConsultant = (code: string, name: string) => {
    setEditingCode(code);
    setEditCodeValue(code);
    setEditNameValue(name);
  };

  const handleCancelEditConsultant = () => {
    setEditingCode(null);
    setEditCodeValue("");
    setEditNameValue("");
  };

  const handleSaveEditConsultant = (originalCode: string) => {
    const trimmedCode = editCodeValue.trim();
    const trimmedName = editNameValue.trim();

    if (trimmedCode.length !== 4 || isNaN(Number(trimmedCode))) {
      alert("컨설턴트 코드는 반드시 4자리 숫자여야 합니다.");
      return;
    }
    if (!trimmedName) {
      alert("컨설턴트 이름을 입력해 주세요.");
      return;
    }

    if (trimmedCode !== originalCode && consultantCodes[trimmedCode]) {
      alert("이미 등록된 다른 컨설턴트의 고유 코드입니다. 다른 코드를 사용해 주세요.");
      return;
    }

    const updated = { ...consultantCodes };
    if (trimmedCode !== originalCode) {
      delete updated[originalCode];
    }
    updated[trimmedCode] = trimmedName;

    setConsultantCodes(updated);
    handleSaveConsultants(updated);
    setEditingCode(null);
    setEditCodeValue("");
    setEditNameValue("");
  };

  const handleSaveConsultants = async (updatedCodes: Record<string, string>) => {
    try {
      setConsultantUpdateMessage("");
      setConsultantUpdateError("");
      const res = await fetch("/api/consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: updatedCodes })
      });
      const data = await res.json();
      if (data.success) {
        setConsultantCodes(data.codes);
        setConsultantUpdateMessage("컨설턴트 고유 코드가 본사 서버에 안전하게 적용되었습니다!");
        setTimeout(() => setConsultantUpdateMessage(""), 4000);
      } else {
        setConsultantUpdateError(data.error || "컨설턴트 저장 실패");
      }
    } catch (err) {
      console.error("Consultant save error:", err);
      setConsultantUpdateError("상담사 동기화 중 네트워크 통신 실패가 발생했습니다.");
    }
  };

  const handleAddConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = newConsultantCode.trim();
    const normalizedName = newConsultantName.trim();

    if (normalizedCode.length !== 4 || isNaN(Number(normalizedCode))) {
      alert("컨설턴트 코드는 반드시 4자리 숫자여야 합니다.");
      return;
    }
    if (!normalizedName) {
      alert("컨설턴트 이름을 입력해 주세요.");
      return;
    }

    const updated = { ...consultantCodes, [normalizedCode]: normalizedName };
    setConsultantCodes(updated);
    handleSaveConsultants(updated);
    setNewConsultantCode("");
    setNewConsultantName("");
  };

  const [deletingConsultantCode, setDeletingConsultantCode] = useState<string | null>(null);

  const handleDeleteConsultant = (codeToDelete: string) => {
    // Instead of window.confirm which is blocked by standard iFrame sandbox policies, 
    // we use a clean inline confirmation state to avoid browser blocks.
    setDeletingConsultantCode(codeToDelete);
  };

  const handleConfirmDeleteConsultant = (codeToDelete: string) => {
    const updated = { ...consultantCodes };
    delete updated[codeToDelete];
    setConsultantCodes(updated);
    handleSaveConsultants(updated);
    setDeletingConsultantCode(null);
  };

  const handleToggleConsultantActive = (codeToToggle: string) => {
    const currentName = consultantCodes[codeToToggle];
    if (!currentName) return;

    let updatedName = "";
    if (currentName.endsWith(" (비활성)")) {
      updatedName = currentName.replace(/\s*\(비활성\)$/, "");
    } else {
      updatedName = currentName + " (비활성)";
    }

    const updated = { ...consultantCodes, [codeToToggle]: updatedName };
    setConsultantCodes(updated);
    handleSaveConsultants(updated);
  };

  // Consultant list mappings matching mock codes
  const [consultantCodes, setConsultantCodes] = useState<Record<string, string>>({
    "1004": "김고려 컨설턴트",
    "2026": "이오픈 컨설턴트",
    "7777": "박성공 팀장",
    "1234": "김진단 전임 컨설턴트",
    "9999": "우수창업 전임 팀장"
  });

  // Option comments state & fetching
  const [optionComments, setOptionComments] = useState<any[]>([]);

  
  const saveToSupabase = async (bList: any[], vList: any[], delType?: string, delId?: string) => {
    try {
      if (delType === 'brochures' && delId) {
        await supabase.from('brochures').delete().eq('id', delId);
      }
      if (delType === 'videos' && delId) {
        await supabase.from('videos').delete().eq('id', delId);
      }
      
      for (let i = 0; i < bList.length; i++) {
        const item = { ...bList[i], sort_order: i }; 
        if (item.is_visible === undefined) item.is_visible = true; 
        delete item.urls; 
        await supabase.from('brochures').upsert(item);
      }
      for (let i = 0; i < vList.length; i++) {
        const item = { ...vList[i], sort_order: i }; 
        if (item.is_visible === undefined) item.is_visible = true; 
        delete item.uploadedAt; 
        await supabase.from('videos').upsert(item);
      }
      return { success: true };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };
  const fetchBrandConfig = async () => {
    try {
      const { data: bData, error: bError } = await supabase
        .from('brochures')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!bError && bData) setAdminBrochures(bData);

      const { data: vData, error: vError } = await supabase
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!vError && vData) setAdminVideos(vData);
    } catch (e) {
      console.error("Failed to fetch brand config from Supabase", e);
    }
  };

  // Excel registration popup modal state
  const [uploadModalResult, setUploadModalResult] = useState<{
    isOpen: boolean;
    type: "applicants" | "questions" | "comments" | "error";
    success: boolean;
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  // States to persist multi-row selection & custom safe delete confirmations (immune to iframe restrictions)
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    isBatch: boolean;
    targetId?: string;
    targetName?: string;
    targetIds?: string[];
  } | null>(null);

  // Excel registration status feedback
  const [excelStatus, setExcelStatus] = useState<{
    applicants?: { success: boolean; count?: number; time: string; error?: string };
    questions?: { success: boolean; newFranchiseCount?: number; brandSwitchCount?: number; time: string; error?: string };
    comments?: { success: boolean; count?: number; time: string; error?: string };
  }>({});

  // High-fidelity printable report visual preview modal state
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const fetchOptionComments = async () => {
    try {
      const res = await fetch("/api/comments");
      const data = await res.json();
      if (data.success && data.comments) {
        setOptionComments(data.comments);
      }
    } catch (e) {
      console.error("Failed to fetch option comments", e);
    }
  };

  const resolveQuestionFeedback = (
    franchiseTypeRaw: string,
    questionIndex: number,
    score: number
  ) => {
    const franchiseType = (franchiseTypeRaw === "브랜드전환" || franchiseTypeRaw === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
    const matched = optionComments.find(
      c => (c.franchiseType === franchiseType || (franchiseType === "브랜드 전환" && (c.franchiseType === "브랜드전환" || c.franchiseType === "브랜드 전환"))) &&
        c.questionIndex === questionIndex &&
        c.score === score
    );
    if (matched) {
      return {
        scoreText: score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요",
        comment: matched.comment
      };
    }
    const fallback = getQuestionFeedback(franchiseType, questionIndex, score);
    return {
      scoreText: score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요",
      comment: fallback.comment
    };
  };

  // Fetch applicants from server
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/applicants");
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applicants);
      }
    } catch (e) {
      console.error("Failed to fetch applicants list", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch consultants from server
  const fetchConsultantCodes = async () => {
    try {
      const res = await fetch("/api/consultants");
      const data = await res.json();
      if (data.success) {
        setConsultantCodes(data.codes);
      }
    } catch (e) {
      console.error("Failed to fetch consultant codes", e);
    }
  };

  

  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions");
      const data = await res.json();
      if (data.success) {
        if (data.newFranchise && data.newFranchise.length > 0) {
          setNewQuestions(data.newFranchise);
        }
        if (data.brandSwitch && data.brandSwitch.length > 0) {
          setNewBrandQuestions(data.brandSwitch);
        }
      }
    } catch (e) {
      console.error("Failed to fetch questions", e);
    }
  };

  const handleDownloadPdfOrPrint = () => {
    if (!diagnosisResult) return;
    setShowPrintPreview(true);
  };

  const handleTriggerPdfDownloadDirectly = async () => {
    if (!diagnosisResult) return;
    setIsGeneratingPdf(true);

    // Give state/DOM time to render the off-screen element
    setTimeout(async () => {
      // Backup original getComputedStyle to safely intercept oklch color parsing errors in html2canvas
      const originalGetComputedStyle = window.getComputedStyle;

      try {
        const element = document.getElementById("printable_report_wrapper");
        if (!element) {
          throw new Error("Report element not found");
        }

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `OpeningMap_개원진단보고서_${diagnosisResult.name}원장님.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };

        // Helper to resolve oklch/oklab colors standard format
        const resolveColorStyle = (colorStr: string): string => {
          if (!colorStr || typeof colorStr !== 'string') return colorStr;
          const hasOklch = colorStr.includes('oklch');
          const hasOklab = colorStr.includes('oklab');
          if (!hasOklch && !hasOklab) return colorStr;

          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = colorStr;
              const standardColor = ctx.fillStyle;
              if (standardColor && !standardColor.includes('oklch') && !standardColor.includes('oklab')) {
                return standardColor;
              }
            }
          } catch (e) {
            // ignore
          }

          // Regex fallback parsing for oklch or oklab colors
          const targetFunc = hasOklch ? 'oklch' : 'oklab';
          const rx = new RegExp(`${targetFunc}\\(\\s*([\\d.]+)`);
          const match = colorStr.match(rx);
          if (match) {
            const lightness = parseFloat(match[1]);
            if (lightness > 0.8) return 'rgba(248, 250, 252, 1)'; // light bg
            if (lightness < 0.3) return 'rgba(15, 23, 42, 1)';   // dark text
          }
          return 'rgba(11, 59, 36, 1)'; // default green
        };

        // Override standard getComputedStyle with high precision proxy hook
        window.getComputedStyle = function (el: Element, pseudoElt?: string) {
          const style = originalGetComputedStyle.call(this, el, pseudoElt);
          return new Proxy(style, {
            get(target, prop) {
              if (prop === 'getPropertyValue') {
                return function (propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
                    return resolveColorStyle(val);
                  }
                  return val;
                };
              }

              const value = Reflect.get(target, prop);
              if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
                return resolveColorStyle(value);
              }
              if (typeof value === 'function') {
                return value.bind(target);
              }
              return value;
            }
          }) as CSSStyleDeclaration;
        };

        // Attempt to dynamically load html2pdf if it isn't defined globally yet
        let html2pdfLib = (window as any).html2pdf;
        if (!html2pdfLib) {
          console.warn("html2pdf not found on window, attempting to load dynamically...");
          html2pdfLib = await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = () => {
              resolve((window as any).html2pdf);
            };
            script.onerror = () => {
              resolve(null);
            };
            document.head.appendChild(script);
          });
        }

        if (html2pdfLib) {
          await html2pdfLib().set(opt).from(element).save();
        } else {
          throw new Error("html2pdf library load failed");
        }
      } catch (error) {
        console.error("PDF generation via library failed. Falling back to native print:", error);

        // Show fallback print optimizations
        const wrapper = document.getElementById("printable_report_wrapper");
        if (wrapper) {
          wrapper.classList.remove("hidden");
          wrapper.classList.add("print-active-fallback");
        }

        // Let state flush then print the focused window element
        setTimeout(() => {
          window.focus();
          window.print();

          if (wrapper) {
            wrapper.classList.remove("print-active-fallback");
            wrapper.classList.add("hidden");
          }
        }, 100);
      } finally {
        window.getComputedStyle = originalGetComputedStyle;
        setIsGeneratingPdf(false);
      }
    }, 500);
  };

  const renderPrintableReportContent = () => {
    if (!diagnosisResult) return null;
    return (
      <>
        {/* PAGE 1: BASIC DETAILS & STRUCTURAL RECOMMENDATIONS */}
        <div className="print-page-break p-8 border-4 border-[#0B3B24] rounded-xl relative bg-white mx-auto" style={{ minHeight: "1050px", width: "100%", maxWidth: "850px", boxSizing: "border-box" }}>
          {/* Header Emblem */}
          <div className="flex justify-between items-start border-b pb-4 mb-6 border-slate-200">
            <div className="text-left animate-fade-in">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-[#C5A059] flex items-center justify-center font-black text-white text-sm shrink-0">O</div>
                <span className="font-extrabold text-slate-800 text-lg uppercase tracking-wider">Opening Map</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">고려대 협약 파트너 영어학원 창업 정밀 개설 진단 보고서</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-[#0B3B24] text-white px-2 py-0.5 rounded font-extrabold font-mono border border-[#C5A059]/40">
                SESSION CODE: {diagnosisResult.verificationCode}
              </span>
              <p className="text-[9px] text-slate-400 mt-1 font-mono">발행일: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="text-center bg-[#0B3B24] text-white py-6 px-4 rounded-lg mb-6 relative shadow-sm">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
              영어전문학원 PREMIUM 개원진단 보고서 (1P: 진단/추천부)
            </h1>
            <p className="text-[10px] text-[#C5A059] font-mono tracking-widest uppercase font-bold">
              PROPORTIONAL METRICS & CONSULTING ROADMAP FOR PARTNER
            </p>
          </div>

          {/* [상단] 1. 예비 원장님 기본 정보 및 기입 정보 */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-[#0B3B24] border-b pb-1 mb-2">1. 예비 원장님 기본 정보 및 기입 내용 (Profile Checklist)</h3>
            <table className="w-full text-xs border border-collapse border-slate-300">
              <tbody>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold w-1/4 text-slate-700">성 명</td>
                  <td className="border border-slate-300 px-3 py-2 w-1/4 font-semibold text-slate-800">
                    {diagnosisResult.name} 예비원장님 {diagnosisResult.birth ? `(만 ${calculateKoreanAge(diagnosisResult.birth)}세)` : ""}
                  </td>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold w-1/4 text-slate-700">연락처 및 회신처</td>
                  <td className="border border-slate-300 px-3 py-2 w-1/4 font-mono text-slate-800">{diagnosisResult.phone}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-700">희망 개원지역</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-[#0B3B24]">{diagnosisResult.region || "기재안함 (상권 유선 협상)"}</td>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-700">권장 개원 시기</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-[#0B3B24]">{diagnosisResultAnalysis?.recOpeningMonth || (diagnosisResult.openingMonth === "없음" ? "개원시기 미정" : `${diagnosisResult.openingMonth} 예정`)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-700">가맹 신청 유형 (유입경로)</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800">{diagnosisResult.franchiseType} {diagnosisResult.inflowRoute ? `(${diagnosisResult.inflowRoute})` : ""}</td>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-700">배정 담당 상담사</td>
                  <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800">{diagnosisResult.counselorName || "본사 영업 담당관"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold text-slate-700">주된 고민사항</td>
                  <td colSpan={3} className="border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-pre-line leading-relaxed text-left">
                    {diagnosisResult.mainConcern || "기재하지 않음 (상담 시 유선 확인 예정)"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Core Scorecard Grid Summary */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
              <span className="text-[10px] text-slate-500 font-bold block">통합 준비 역량 레벨</span>
              <span className="text-base font-black text-[#0B3B24] block mt-1">{diagnosisResult.competencyRank}등급</span>
              <span className="text-[10px] text-[#C5A059] font-bold block">
                ({getCompetencyLabelAndDesc(diagnosisResult.competencyRank, diagnosisResult.franchiseType)})
              </span>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
              <span className="text-[10px] text-slate-500 font-bold block">자가진단 합산 총점</span>
              <span className="text-xl font-black text-[#0B3B24] block mt-0.5">{diagnosisResult.totalScore}점</span>
              <span className="text-[9px] text-slate-550 block font-bold mt-0.5">
                {diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환" ? "40" : "30"}점 만점 기준
              </span>
            </div>
            <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
              <span className="text-[10px] text-slate-500 font-bold block">원장 정서 및 성향 기질</span>
              <span className="text-base font-black text-[#C5A059] block mt-1">{diagnosisResult.personality}</span>
              <span className="text-[9px] text-slate-550 block font-bold mt-0.5">
                {diagnosisResult.personality === "외향형" ? "설명회 / 대외영업 최적" : "직강 원장 / 관리경영 최적"}
              </span>
            </div>
          </div>

          {/* Conditional detailed views for admin, locked security notice for clients */}
          {isAdminAuthenticated ? (
            <>
              {/* [중간 1부] 다차원 역량 분석 육각형 결과 */}
              <div className="mb-6 text-left">
                <h3 className="text-xs font-black text-[#0B3B24] border-b pb-1 mb-3">2. 다차원 역량 분석 육각형 진단 지표 (Competency Hexagon Charts)</h3>

                <div className="grid grid-cols-12 gap-4 border border-slate-200 p-4 bg-slate-50/40 rounded-lg print-avoid-break items-center">
                  {/* Printable Radar Chart */}
                  <div className="col-span-12 md:col-span-5 h-[180px] flex items-center justify-center bg-white rounded-lg border border-slate-100 p-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="62%" data={
                        (diagnosisResult.franchiseType === "신규 창업"
                          ? ["원장 경영", "영어 교수", "자본 준비", "상담 역량", "학사 행정", "조직 관리"]
                          : ["운영 형태", "원내 공간", "기존 원생", "원장 경력", "영어 교수", "투자 가용", "소득분류", "초등인원"]
                        ).map((subject, idx) => ({
                          subject,
                          score: diagnosisResult.answers[idx] || 3
                        }))
                      }>
                        <PolarGrid stroke="#CBD5E1" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#334155', fontSize: 7, fontWeight: 820 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 5]}
                          tick={{ fill: '#94A3B8', fontSize: 7 }}
                          tickCount={6}
                        />
                        <Radar
                          name="평가 점수"
                          dataKey="score"
                          stroke="#0B3B24"
                          fill="#C5A059"
                          fillOpacity={0.35}
                          strokeWidth={1.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="col-span-12 md:col-span-7 flex flex-col justify-center text-left">
                    <h4 className="text-[11px] font-extrabold text-[#0B3B24] uppercase tracking-wider mb-2">✦ 자가 역량 부문별 점수 현황</h4>
                    <p className="text-[10px] text-slate-600 leading-normal mb-2 font-semibold">
                      원장님의 자가 진단 각 항목 수치 밸런스입니다. 수치가 4점 이상인 범위는 본사 제안 프리미엄 지표에서 즉각 추진이 우수한 강점이며, 3점 이하의 범위는 보완 처방 영역입니다.
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                      {(diagnosisResult.franchiseType === "신규 창업"
                        ? ["원장 경영", "영어 교수", "자본 준비", "상담 역량", "학사 행정", "조직 관리"]
                        : ["운영 형태", "원내 공간", "기존 원생", "원장 경력", "영어 교수", "투자 가용", "소득분류", "초등인원"]
                      ).map((subject, idx) => ({
                        label: subject,
                        val: diagnosisResult.answers[idx] || 3
                      })).map((x, idx) => (
                        <div key={idx} className="bg-white/80 border border-slate-200 p-1 rounded flex justify-between font-bold">
                          <span className="text-slate-500 scale-[0.88] origin-left truncate font-semibold">{x.label}</span>
                          <span className="text-[#0B3B24] font-mono font-extrabold">{x.val}점</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* [중간 2부] 추천 학원 상권, 추천 규모, 인력 구성 */}
              {diagnosisResultAnalysis && (
                <div className="mb-6 space-y-4 text-left">
                  <h3 className="text-xs font-black text-[#0B3B24] border-b pb-1 mb-2">3. 고려대 파트너 연계 추천 상권 및 가이드라인 (Opening Map Solutions)</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 print-avoid-break">
                      <h5 className="text-[11px] font-extrabold text-[#0B3B24] border-b pb-1 mb-2">✓ 추천 학원 상권 입지 구역</h5>
                      <p className="text-[10.5px] text-slate-700 font-semibold mb-2">
                        희망지({diagnosisResult.region || "기재지"}) 분석에 인근 세대수와 보행 밀도를 기획 결합한 매칭 지역:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisResultAnalysis.recRegions.map((region, i) => (
                          <span key={i} className="bg-[#0B3B24] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                            {region}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 print-avoid-break">
                      <h5 className="text-[11px] font-extrabold text-[#0B3B24] border-b pb-1 mb-2">✓ 추천 개원 형태 및 공간 규모</h5>
                      <p className="text-[10.5px] text-slate-700 leading-relaxed font-semibold">
                        • <strong>권장 형태</strong>: {diagnosisResultAnalysis.capitalRec}<br />
                        • <strong>공간 권장 규격</strong>: {diagnosisResultAnalysis.capitalRecSize}
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/35 print-avoid-break text-left">
                    <h5 className="text-[11px] font-extrabold text-[#0B3B24] flex items-center space-x-1 mb-1.5">
                      <span>✓ 추천 연계 인력 조직 구성</span>
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {diagnosisResultAnalysis.recStaffSetup.map((staff, i) => (
                        <span key={i} className="border border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded text-[10px] font-extrabold">
                          {staff}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                      원장님의 성향 점수 자가 분석과 준비 총점을 교차 평가하여 초기 투입 대비 효율성이 우수한 연계 조직 모델입니다.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-8 border border-slate-300 rounded-lg p-6 bg-slate-50/50 print-avoid-break text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#0B3B24]/10 border border-[#0B3B24]/20 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 text-[#C5A059]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#0B3B24]">상세 데이터 및 전문 소견 보안 안전 잠금 소정</h4>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider">APPLICANT PROFILE DATA SYSTEM SECURITY</p>
              </div>
              <p className="text-xs text-slate-650 leading-relaxed max-w-lg mx-auto font-bold text-center">
                원장님의 자가진단 문항세부 배점, 8대 부문별 세부 심사 역량 그래프, 개원 타당 특수 KPI 지표, 본사 추천 상권 입지 의견은 오프닝맵 본사 전용 관리자 시스템에 안전하게 기록되었습니다.
              </p>
              <p className="text-xs text-slate-650 leading-relaxed max-w-lg mx-auto font-bold text-center">
                본 서류 심사가 완결됨에 따라 본사 매칭 전임 담당관(<b>{diagnosisResult.counselorName}</b>)이 원장님 연락처로 직접 신속히 전화를 드리고 상세 개설 심사 통보 유선 상담 및 입지 로드맵 브리핑을 지원해 드립니다.
              </p>

              {/* Official Stamp Box for high fidelity */}
              <div className="pt-6 flex justify-center items-center gap-12 select-none">
                <div className="text-left font-sans">
                  <p className="text-[9px] text-[#0B3B24] font-black tracking-wider uppercase">고려대학교 협력 파트너십</p>
                  <p className="text-[12px] font-extrabold text-slate-805 tracking-tight">오프닝맵(Opening Map) 개원심사처</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#0B3B24]/30 flex items-center justify-center relative rotate-12 shrink-0">
                  <div className="w-12 h-12 rounded-full border border-dashed border-[#0B3B24]/50 flex flex-col items-center justify-center text-center">
                    <span className="text-[7px] text-[#0B3B24]/80 font-black leading-none">오프닝맵</span>
                    <span className="text-[9px] text-red-500 font-black mt-0.5 leading-none">심사인인</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seal and page footer */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[9px] text-slate-400 border-t pt-2 w-full max-w-[800px]">
            <span className="font-semibold">오프닝맵 창업진단 PREMIUM 레포트 • Page 1 of {isAdminAuthenticated ? "2" : "1"}</span>
            <span className="font-semibold text-right">본 진단결과지는 인공지능에 기반한 경영 자치 분석지로 법적 효력을 대체할 수 없습니다.</span>
          </div>
        </div>

        {/* PAGE 2: Q&A FEEDBACK & AI ROADMAP COMMENTARY */}
        {isAdminAuthenticated && (
          <div className="p-8 border-4 border-[#0B3B24] rounded-xl relative mt-8 bg-white mx-auto" style={{ minHeight: "1050px", width: "100%", maxWidth: "850px", boxSizing: "border-box" }}>
            <div className="flex justify-between items-start border-b pb-3 mb-4 border-slate-200">
              <div className="text-left">
                <span className="text-xs font-bold text-[#0B3B24]">Opening Map Premium Report</span>
                <p className="text-[10px] text-slate-400 font-bold">자가진단 문항세부 배점 및 전문가 입시/경영 처방전 (2P: 보완/총평부)</p>
              </div>
              <span className="text-[10px] text-[#C5A059] font-bold">APPLICANT: {diagnosisResult.name} 원장님</span>
            </div>

            {/* [중간 3부] 보완사항 (Detail questions loop) */}
            <div className="mb-6 space-y-3.5 text-left">
              <h3 className="text-xs font-black text-[#0B3B24] border-b pb-1 mb-2">4. 자가진단 문항별 세부 보완 및 처방 솔루션 (Prescription Details)</h3>

              <div className="space-y-3">
                {(diagnosisResult.franchiseType === "신규 창업" ? newQuestions : brandQuestions).map((q, idx) => {
                  const score = diagnosisResult.answers[idx] || 3;
                  const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, idx, score);
                  const selectedOptionText = q.options.find(o => o.value === score)?.text || "미답변";

                  return (
                    <div key={q.id} className="border border-slate-250 rounded p-2.5 bg-slate-50/20 shrink-0 print-avoid-break text-left">
                      <div className="flex items-start space-x-2">
                        <span className="bg-[#0B3B24] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                          Q0{idx + 1}
                        </span>
                        <div className="w-full text-[10.5px] text-left">
                          <h4 className="font-extrabold text-slate-800 leading-tight text-left">{q.text}</h4>

                          <div className="grid grid-cols-12 gap-2 mt-1.5 pt-1.5 border-t border-slate-200/50 text-[10px]">
                            <div className="col-span-4 bg-slate-50 px-2 py-1 rounded text-left">
                              <span className="text-[8px] text-slate-400 block font-bold">나의 답변</span>
                              <span className="text-slate-700 font-bold block truncate">{selectedOptionText}</span>
                            </div>

                            <div className="col-span-2 bg-slate-50 px-2 py-1 rounded text-center">
                              <span className="text-[8px] text-slate-400 block font-bold">평가수준</span>
                              <span className="text-[#C5A059] font-black block">{feedback.scoreText} ({score}점)</span>
                            </div>

                            <div className="col-span-6 bg-slate-50 px-2 py-1 rounded text-left">
                              <span className="text-[8px] text-[#C5A059] font-extrabold block">본사 개원 보완 권고사항</span>
                              <p className="text-slate-600 font-semibold leading-normal mt-0.5 text-[9.5px]">
                                {feedback.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* [마지막] 各領域別結果に対する総評 */}
            <div className="mb-4 print-avoid-break text-left">
              <h3 className="text-xs font-black text-[#0B3B24] border-b pb-1 mb-2">5. 인공지능 정량 분석 종합 총평</h3>
              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 text-left">
                <p className="text-[11px] text-slate-700 leading-relaxed font-semibold font-sans whitespace-pre-line text-left">
                  {diagnosisResult.aiReport || (diagnosisResultAnalysis ? diagnosisResultAnalysis.aiReport : "원장님의 영역별 분석 결과에 대한 본사 컨설팅 종합 로드맵 레포트가 성공적으로 귀결되었습니다. 고려대학교 영어전문학원 상표 사용 허가 및 타겟 마케팅을 위해 본사 담당 컨설턴트와의 1:1 세미나 미팅을 접수할 것을 권유드립니다.")}
                </p>
              </div>
            </div>

            {/* Official seal or sign section */}
            <div className="mt-6 pt-5 border-t border-slate-200 flex justify-between items-end print-avoid-break text-left">
              <div className="space-y-0.5 text-[11px] text-left">
                <p className="text-[#0B3B24] font-extrabold">고려대 프랜차이즈 개원 매칭 전문 분석처</p>
                <p className="text-slate-600 font-medium">원장님의 성공적인 프리미엄 어학 클래스 개설과 안정적 초기 자립 영업을 축원합니다.</p>
              </div>
              <div className="text-right flex items-center space-x-4">
                <div className="font-serif italic text-slate-500 text-[10px] text-left">
                  Opening Map <br />
                  Consulting Group
                </div>
                {/* Simulated Official Seal Stamp in Gold CSS */}
                <div className="w-14 h-14 rounded-full border-4 border-double border-[#C5A059] text-[#C5A059] font-black text-[9px] flex flex-col items-center justify-center font-sans uppercase tracking-tighter transform rotate-12 select-none shrink-0 bg-white shadow-2xs">
                  <span>OFFICIAL</span>
                  <span className="border-t border-b py-0.5 text-[#0B3B24] border-[#C5A059]">SEAL</span>
                  <span>OPENING</span>
                </div>
              </div>
            </div>

            {/* Sheet Page Margin seal */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[9px] text-slate-400 border-t pt-2 w-full max-w-[800px]">
              <span className="font-semibold">오프닝맵 창업진단 PREMIUM 레포트 • Page 2 of 2</span>
              <span className="font-semibold">© 2016 - 2026 Opening Map Corp. Registered partner with Korea University.</span>
            </div>
          </div>
        )}
      </>
    );
  };


  useEffect(() => {
    fetchApplicants();
    fetchConsultantCodes();
    fetchQuestions();
    fetchOptionComments();
    fetchBrandConfig();
  }, []);

  // Sync matched consultant on code change
  useEffect(() => {
    if (verificationCode.length === 4) {
      const match = consultantCodes[verificationCode];
      if (match) {
        if (match.endsWith(" (비활성)")) {
          setCounselorMatched(null);
          setCodeError("해당 컨설턴트 코드는 현재 비활성화 상태입니다. 다른 코드를 입력해주세요.");
        } else {
          setCounselorMatched(match);
          setCodeError(null);
        }
      } else {
        setCounselorMatched("본사 매칭 컨설턴트 (무작위 배정)");
        setCodeError(null);
      }
    } else {
      setCounselorMatched(null);
    }
  }, [verificationCode, consultantCodes]);

  // Handle Code verification validation
  const handleVerifyCode = () => {
    if (verificationCode.trim().length !== 4) {
      setCodeError("담당자로부터 넘겨받은 올바른 4자리 코드를 입력해주세요.");
      return;
    }
    const match = consultantCodes[verificationCode];
    if (match && match.endsWith(" (비활성)")) {
      setCodeError("해당 컨설턴트 코드는 현재 비활성화 상태입니다. 다른 코드를 사용하시거나 담당자에게 문의해 주세요.");
      return;
    }
    setView("step2");
  };

  // Handle step 2 validation
  const handleBasicInfoSubmit = () => {
    if (!basicInfo.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!basicInfo.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    const cleanedPhone = basicInfo.phone.replace(/\D/g, "");
    if (!cleanedPhone.startsWith("010")) {
      alert("연락처는 반드시 '010'으로 시작해야 합니다.");
      return;
    }
    if (cleanedPhone.length !== 11) {
      alert("연락처는 '010'을 제외하고 남은 숫자가 정확히 8자리여야 합니다. (총 11자리)");
      return;
    }

    if (!basicInfo.region.trim()) {
      alert("희망지역을 입력해주세요.");
      return;
    }
    // Proceed to quiz step
    setCurrentQuestionIndex(0);
    // Reset answers with unselected values (0) to allow manual selection
    const targetQuestions = basicInfo.franchiseType === "신규 창업" ? newQuestions : brandQuestions;
    setAnswers(Array(targetQuestions.length).fill(0));
    setView("quiz");
  };

  // Switch questions array based on selection
  const activeQuestionsList = basicInfo.franchiseType === "신규 창업"
    ? newQuestions
    : brandQuestions;

  // Handle single question raw selection
  const handleAnswerSelect = (optionScore: number) => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = optionScore;
    setAnswers(updatedAnswers);
  };

  // Submit complete diagnosis results
  const handleSubmitDiagnosis = async () => {
    setAiReportLoading(true);
    setView("result"); // Load result view but show loading spinner where appropriate

    const payload = {
      ...basicInfo,
      verificationCode: verificationCode || "1004",
      answers
    };

    try {
      const response = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setDiagnosisResult(data.applicant);
        // Refresh local memory table
        fetchApplicants();
      } else {
        alert("진단 결과 저장 중 오류 수수");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiReportLoading(false);
    }
  };

  const handleSaveOpinion = async () => {
    if (!diagnosisResult) return;
    try {
      setSavingOpinion(true);
      const res = await fetch(`/api/applicants/${diagnosisResult.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counselorOpinion: localOpinion })
      });
      const data = await res.json();
      if (data.success && data.applicant) {
        setDiagnosisResult(data.applicant);
        setApplicants(prev => prev.map(a => a.id === data.applicant.id ? data.applicant : a));
        alert("담당 컨설턴트 보안 의견이 성공적으로 일치 저장되었습니다.");
      } else {
        alert("담당 컨설턴트 의견 저장 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("전송 중 네트워크 연결 무효화 또는 타임아웃이 발생했습니다.");
    } finally {
      setSavingOpinion(false);
    }
  };

  const handleRequestConsultantInquiry = async () => {
    if (!diagnosisResult) return;
    try {
      setSubmittingInquiry(true);
      const res = await fetch(`/api/applicants/${diagnosisResult.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantInquiryRequested: true })
      });
      const data = await res.json();
      if (data.success && data.applicant) {
        setDiagnosisResult(data.applicant);
        setApplicants(prev => prev.map(a => a.id === data.applicant.id ? data.applicant : a));
        alert("컨설턴트 진단결과 문의접수가 완료되었습니다. 담당 컨설턴트(본사) 계정에서 실시간으로 확인이 가능하며, 1:1 세밀한 컨설팅 피드백이 전수될 예정입니다.");
      } else {
        alert("진단결과 문의 요청 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("전송 중 오류 발생: 네트워크를 확인해 주세요.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleImportAllPrescriptions = () => {
    if (!diagnosisResult) return;
    const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
    const answers = diagnosisResult.answers || (isBrand ? [3, 3, 3, 3, 3, 3, 3, 3] : [3, 3, 3, 3, 3, 3]);

    if (!isBrand) {
      const q1Score = answers[0] || 3;
      const q2Score = answers[1] || 3;
      const q3Score = answers[2] || 3;
      const q4Score = answers[3] || 3;
      const q5Score = answers[4] || 3;
      const q6Score = answers[5] || 3;

      const f1 = resolveQuestionFeedback("신규 창업", 0, q1Score);
      const f2 = resolveQuestionFeedback("신규 창업", 1, q2Score);
      const f3 = resolveQuestionFeedback("신규 창업", 2, q3Score);
      const f4 = resolveQuestionFeedback("신규 창업", 3, q4Score);
      const f5 = resolveQuestionFeedback("신규 창업", 4, q5Score);
      const f6 = resolveQuestionFeedback("신규 창업", 5, q6Score);

      const generated = `[오프닝맵 전문가 전임 컨설턴트 밀착 정밀 분석 및 영역별 통합 처방 소견]

원장님께서 진행하신 다차원 자가 역량 스코어 진단 결과를 토대로, 본사 전임 시니어 컨설팅 전문가단이 분석한 영역별 처방의견을 문맥상 자연스럽게 연계하여 아래와 같이 종합 마스터 처방전을 전달드립니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 1. 교육 및 원학 경영 역량 부문 (원장 경영 및 영어 교수)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 원무 경영 및 학사 지도 경력 (진단: ${f1.scoreText})
  - 전문가 제언: "${f1.comment}"
• 실전 교수 역량 및 영어 강의 완숙도 (진단: ${f2.scoreText})
  - 전문가 제언: "${f2.comment}"

☞ [통합 의견]: 원장님의 원학 경영 정체성과 교수 자산을 교차 종합해 볼 때, 해당 기반은 원생 상담 및 실전 정착에 훌륭한 디딤돌이 될 것입니다. 본사 프로그램을 조속히 이식함으로써 초기 흡입력을 최고 수준으로 견인해 내시는 방향을 처방합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 2. 예산 및 입지 상담력 부문 (자본력 및 포지셔닝 상담)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 개원 자본력 투자 예산 대역 (진단: ${f3.scoreText})
  - 전문가 제언: "${f3.comment}"
• 학부모 포지셔닝 상담 노하우 (진단: ${f4.scoreText})
  - 전문가 제언: "${f4.comment}"

☞ [통합 의견]: 준비 자본 규모에 따른 최적화된 하드웨어 세팅과 학부모 눈높이에 부합하는 타겟 마케팅 상담을 융합시켜 고정 지출 부담은 억제하면서 효율을 극대화할 수 있는 안전지대 접근법을 최우선적으로 추천드립니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 3. 학사 운영정형화 및 노무 조직 부문 (시간표 자립 및 구성원 리더십)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 수업계획 수립 및 정형 시간표 활용체계 (진단: ${f5.scoreText})
  - 전문가 제언: "${f5.comment}"
• 강사진 협조 및 행정 조력 근로 노무 구성 (진단: ${f6.scoreText})
  - 전문가 제언: "${f6.comment}"

☞ [통합 의견]: 빈틈없는 교직 세팅과 마찰 없는 인력 자산 통솔은 장기 생존의 필수 키워드입니다. 체계적인 시간표 공용화 및 업무 규격화를 본사 매니지먼트 패키지와 조율하여 인적 위험 요소를 초기에 완벽 차단해 주십시오.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 4. 오프닝맵 추천 개원 로드맵
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 1단계 (즉시 진행): 고려대학교 브랜드 연계 명품 정규 교육과정 브리핑 마스터 1:1 트레이닝 라이선스 과정 이수
- 2단계 (2개월 차): 아파트 3,000세대 안심 가처분 동선 지도 분석에 기반한 상권 최다 노출 1급 입지 최종 매칭
- 3단계 (3~4개월 차): 프리미엄 학원 인허가 지원 및 타겟 평수 기준 표준 안심 칸막이/인테리어 시공 
- 4단계 (5~6개월 차): 그랜드 대강당 학부모 설명회 연계, 본사 인찰 지원 패키지 전적 가동 및 1차 마감반 선결제 유치 프로모션 전개

본 분석처의 비공개 특별 상권 회람회에 입회하시어 전임 상담관과의 심도 깊은 1:1 미팅을 통해 상권 내 지배력 확보를 위한 최상의 의사결정을 실현하시기 바랍니다.`;

      setLocalOpinion(generated);
    } else {
      const q1Score = answers[0] || 3;
      const q2Score = answers[1] || 3;
      const q3Score = answers[2] || 3;
      const q4Score = answers[3] || 3;
      const q5Score = answers[4] || 3;
      const q6Score = answers[5] || 3;
      const q7Score = answers[6] || 3;
      const q8Score = answers[7] || 3;

      const f1 = resolveQuestionFeedback("브랜드 전환", 0, q1Score);
      const f2 = resolveQuestionFeedback("브랜드 전환", 1, q2Score);
      const f3 = resolveQuestionFeedback("브랜드 전환", 2, q3Score);
      const f4 = resolveQuestionFeedback("브랜드 전환", 3, q4Score);
      const f5 = resolveQuestionFeedback("브랜드 전환", 4, q5Score);
      const f6 = resolveQuestionFeedback("브랜드 전환", 5, q6Score);
      const f7 = resolveQuestionFeedback("브랜드 전환", 6, q7Score);
      const f8 = resolveQuestionFeedback("브랜드 전환", 7, q8Score);

      const generated = `[오프닝맵 전문가 전임 컨설턴트 밀착 정밀 분석 및 영역별 통합 처방 소견]

원장님께서 진행하신 브랜드 전환용 정밀 자가 역량 진단 결과를 토대로, 본사 컨설팅 전문가단의 공간·학사 결합 진단과 처방의견을 영역별로 묶어 문맥과 구성 모두 정밀 조율된 마스터 종합의견으로 제시해 드립니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 1. 기존 학원 형태 및 물리 공간 영역 (운영 형태 및 입지 구조)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 현재 기존 학원 운영 형태 (진단: ${f1.scoreText})
  - 전문가 제언: "${f1.comment}"
• 학원 전용 한계 실내 공간 규격 (진단: ${f2.scoreText})
  - 전문가 제언: "${f2.comment}"

☞ [통합 의견]: 전용 면적 가용 수용성을 최대치로 확보하고 고려대학교 프리미엄 브랜딩 사인물 및 마감재 레이아웃 규칙을 최적으로 이식하여 교육적 위엄을 대폭 쇄신해야 합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 2. 재원 승계 및 원무 지배 구조 영역 (원생 수급 및 경영 숙련도)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 보유 재원생 규모 및 전환 안정성 (진단: ${f3.scoreText})
  - 전문가 제언: "${f3.comment}"
• 영어학원 원장 운영 노련미 및 리더십 (진단: ${f4.scoreText})
  - 전문가 제언: "${f4.comment}"

☞ [통합 의견]: 원장님의 풍부한 실무 장악력을 발판 삼아, 기존 재원생의 이탈률을 0%에 수렴하게 만드는 스마트 전환 패스 시스템 및 브랜드 업그레이드 전산 승계를 순차 전개할 것을 강력 조언합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 3. 교육 콘텐츠 이식 및 가용 자본 영역 (수업 품질 및 자금 계획)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 수업 품질 및 실전 영어 강의 역량 (진단: ${f5.scoreText})
  - 전문가 제언: "${f5.comment}"
• 브랜드 전환 가상 자본금 범위 (진단: ${f6.scoreText})
  - 전문가 제언: "${f6.comment}"

☞ [통합 의견]: 고려대학교의 고품격 입시 영어 핵심 교과 콘텐츠를 원장님의 높은 강의 스펙트럼과 자연스럽게 결합하고, 전환 자금력 기준에 정밀 밀착되는 실속형 예산 설계를 접목하여 투자 대비 효율을 극대화시켜 나갑니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 4. 학부모 성향 및 배후 환경 영역 (주민 소득 및 학령인구 환경)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 주변 타겟 학부모 소득 대역 (진단: ${f7.scoreText})
  - 전문가 제언: "${f7.comment}"
• 초등 학령인구 환경 및 지역 잠재도 (진단: ${f8.scoreText})
  - 전문가 제언: "${f8.comment}"

☞ [통합 의견]: 입지의 타겟 소득 점유율과 대상 초등 학령 유동층을 효과적으로 선점하기 위한 본사의 핵심 랜드마크 마케팅 공용 기획을 병합 활용하여 흔들림 없는 중심 거점 구역으로 입지를 재포지셔닝하게 됩니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 5. 본사 단계별 승계 전환 로드맵
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 1단계 (즉시 진행): 기존 재원생 가치 고도화 선언 - 고려대 어학 브랜드 시스템 설명회 및 마케팅 도구 비공개 간담회 준비
- 2단계 (2개월 차): 강의실 정밀 실측 기반 맞춤형 동선 배치 및 고려대 정품 현판/사인월 리노베이션 시공
- 3단계 (3개월 차): 고품격 전문 교육 프로그램 신속 입식 및 교육지원청 승인 정식 학원명 변경 행정 종결
- 4단계 (4개월 차): 명문 브랜드 전환 웅장한 런칭 광고 인입 마케팅 실행 및 신규 수강 유입 프로모션 동시 집행

본사 시니어 전임 카운셀러와의 자금 및 상권 1:1 심층 매칭 미팅을 연계 이수하시어 랜드마크 학원의 탄탄한 지위를 선점해 보시길 권장드립니다.`;

      setLocalOpinion(generated);
    }
  };

  // Render client status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "신규접수": "bg-blue-50 text-blue-700 border-blue-200",
      "1차상담": "bg-amber-50 text-amber-700 border-amber-200",
      "상권분석": "bg-orange-50 text-orange-700 border-orange-200",
      "설명회참석": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "계약진행": "bg-teal-50 text-teal-700 border-teal-200",
      "계약완료": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "보류": "bg-rose-50 text-rose-700 border-rose-200"
    };
    return colors[status] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Inline status updates in administration dashboard
  const handleUpdateApplicantStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counselorStatus: newStatus })
      });
      const data = await res.json();
      if (data.success && data.applicant) {
        setApplicants(prev => prev.map(item => item.id === id ? { ...item, ...data.applicant } : item));
      } else if (data.success) {
        setApplicants(prev => prev.map(item => item.id === id ? { ...item, counselorStatus: newStatus } : item));
      }
    } catch (e) {
      console.error("Status update error", e);
    }
  };

  // Filtering applicant list
  const filteredApplicants = applicants.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      app.phone.includes(adminSearch) ||
      app.region.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (app.counselorName && app.counselorName.toLowerCase().includes(adminSearch.toLowerCase()));

    const matchesFranchise = adminFilterFranchise === "All" || app.franchiseType === adminFilterFranchise;
    const matchesCompetency = adminFilterCompetency === "All" || app.competencyRank === adminFilterCompetency;
    const matchesLead = adminFilterLead === "All" || app.leadRank === adminFilterLead;
    const matchesStatus = adminFilterStatus === "All" || app.counselorStatus === adminFilterStatus;

    return matchesSearch && matchesFranchise && matchesCompetency && matchesLead && matchesStatus;
  });

  // Statistics calculation for the dashboards
  const totalCount = applicants.length;
  const todayCount = applicants.filter(app => {
    if (!app.appliedAt) return false;
    const appDate = new Date(app.appliedAt).toDateString();
    const todayDate = new Date("2026-06-13").toDateString(); // Fixed current metadata clock anchor
    return appDate === todayDate;
  }).length;

  const newStartupCount = applicants.filter(app => app.franchiseType === "신규 창업").length;
  const brandSwitchCount = applicants.filter(app => app.franchiseType === "브랜드 전환").length;
  const sLeadCount = applicants.filter(app => app.leadRank === "S").length;

  const completedContractCount = applicants.filter(app => app.counselorStatus === "계약완료").length;
  const draftPercent = totalCount > 0 ? Math.round((completedContractCount / totalCount) * 100) : 0;

  // XLS spreadsheet downloading function using SheetsJS
  const handleDownloadXlsx = () => {
    const exportData = filteredApplicants.map((app, index) => {
      const analysis = calculateAnalysis(app);
      return {
        "번호": index + 1,
        "아이디": app.id,
        "신청일시": app.appliedAt ? new Date(app.appliedAt).toLocaleString("ko-KR") : "N/A",
        "이름": app.name,
        "출생월": app.birth,
        "연락처": app.phone,
        "희망지역": app.region,
        "가맹유형": app.franchiseType,
        "운영형태": app.operationType,
        "영어전공": app.englishMajor,
        "회화역량": app.englishSpeaking || "유창",
        "원장성향": app.personality,
        "개원예정달": app.openingMonth,
        "총점": `${app.totalScore}점`,
        "역량등급": `${app.competencyRank}등급`,
        "리드등급": `${app.leadRank}급 리드`,
        "추천유형": analysis.typeName,
        "추천지역": analysis.recRegions.join(", "),
        "추천개원형태": analysis.capitalRec,
        "추천규모": analysis.capitalRecSize,
        "추천인력구성": analysis.recStaffSetup.join(", "),
        "담당자": app.counselorName,
        "담당자코드": app.verificationCode || "1004",
        "상담상태": app.counselorStatus,
        "주된고민": app.mainConcern || "",
        "답변1": app.answers[0] !== undefined ? app.answers[0] : 3,
        "답변2": app.answers[1] !== undefined ? app.answers[1] : 3,
        "답변3": app.answers[2] !== undefined ? app.answers[2] : 3,
        "답변4": app.answers[3] !== undefined ? app.answers[3] : 3,
        "답변5": app.answers[4] !== undefined ? app.answers[4] : 3,
        "답변6": app.answers[5] !== undefined ? app.answers[5] : 3,
        "답변7": app.answers[6] !== undefined ? app.answers[6] : "",
        "답변8": app.answers[7] !== undefined ? app.answers[7] : "",
        "본사의견": app.aiReport || analysis.aiReport
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "창업 신청자 DB");

    // Set column widths elegantly
    worksheet["!cols"] = [
      { wch: 6 },  // 번호
      { wch: 15 }, // 아이디
      { wch: 22 }, // 신청일시
      { wch: 10 }, // 이름
      { wch: 10 }, // 출생월
      { wch: 15 }, // 연락처
      { wch: 18 }, // 희망지역
      { wch: 12 }, // 가맹유형
      { wch: 10 }, // 운영형태
      { wch: 10 }, // 영어전공
      { wch: 10 }, // 회화역량
      { wch: 10 }, // 원장성향
      { wch: 12 }, // 개원예정달
      { wch: 8 },  // 총점
      { wch: 10 }, // 역량등급
      { wch: 12 }, // 리드등급
      { wch: 15 }, // 추천유형
      { wch: 25 }, // 추천지역
      { wch: 20 }, // 추천개원형태
      { wch: 12 }, // 추천규모
      { wch: 25 }, // 추천인력구성
      { wch: 18 }, // 담당자
      { wch: 12 }, // 담당자코드
      { wch: 12 }, // 상담상태
      { wch: 30 }, // 주된고민
      { wch: 8 },  // 답변1
      { wch: 8 },  // 답변2
      { wch: 8 },  // 답변3
      { wch: 8 },  // 답변4
      { wch: 8 },  // 답변5
      { wch: 8 },  // 답변6
      { wch: 8 },  // 답변7
      { wch: 8 },  // 답변8
      { wch: 60 }, // 본사의견
    ];

    XLSX.writeFile(workbook, `오프닝맵_영어학원_창업진단_데이터베이스_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download Dinagostic Questions to Excel format
  const handleDownloadQuestionsXlsx = () => {
    const exportData: any[] = [];

    // Add New Franchise questions
    newQuestions.forEach((q, qIndex) => {
      q.options.forEach((opt) => {
        // Find matching comment if exists
        const matched = optionComments.find(
          (c) =>
            (c.franchiseType === "신규 창업" || c.franchiseType === "신규창업") &&
            c.questionIndex === qIndex &&
            c.score === opt.value
        );
        exportData.push({
          "가맹유형": "신규 창업",
          "문항순서": qIndex + 1,
          "문항내용": q.text,
          "선택지점수": opt.value,
          "선택지내용": opt.text,
          "처방코멘트": matched ? matched.comment : ""
        });
      });
    });

    // Add Brand Switch questions
    brandQuestions.forEach((q, qIndex) => {
      q.options.forEach((opt) => {
        // Find matching comment if exists
        const matched = optionComments.find(
          (c) =>
            (c.franchiseType === "브랜드 전환" || c.franchiseType === "브랜드전환") &&
            c.questionIndex === qIndex &&
            c.score === opt.value
        );
        exportData.push({
          "가맹유형": "브랜드 전환",
          "문항순서": qIndex + 1,
          "문항내용": q.text,
          "선택지점수": opt.value,
          "선택지내용": opt.text,
          "처방코멘트": matched ? matched.comment : ""
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "진단문항 설정");

    worksheet["!cols"] = [
      { wch: 15 }, // 가맹유형
      { wch: 10 }, // 문항순서
      { wch: 35 }, // 문항내용
      { wch: 12 }, // 선택지점수
      { wch: 25 }, // 선택지내용
      { wch: 70 }, // 처방코멘트
    ];

    XLSX.writeFile(workbook, `오프닝맵_진단문항_설정_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Upload/Register Diagnostic Questions from Excel format
  const handleUploadQuestionsXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        const newFranchiseMap: Record<number, { text: string; options: { value: number; text: string }[] }> = {};
        const brandSwitchMap: Record<number, { text: string; options: { value: number; text: string }[] }> = {};

        rawJson.forEach((row: any) => {
          const type = (row["가맹유형"] || "").toString().trim();
          const questionNum = Number(row["문항순서"]);
          const text = (row["문항내용"] || "").toString().trim();
          const optVal = row["선택지점수"];
          const optText = row["선택지내용"];

          if (isNaN(questionNum) || !text) return;

          const isBrand = type === "브랜드 전환" || type.includes("브랜드");
          const map = isBrand ? brandSwitchMap : newFranchiseMap;

          if (!map[questionNum]) {
            map[questionNum] = {
              text,
              options: []
            };
          }

          if (optText !== undefined && optVal !== undefined) {
            map[questionNum].options.push({
              value: Number(optVal),
              text: String(optText)
            });
          }
        });

        const newFranchiseParsed = Object.keys(newFranchiseMap)
          .map(numStr => Number(numStr))
          .sort((a, b) => a - b)
          .map((num, idx) => ({
            id: `new-q-${num}-${idx + 1}`,
            text: newFranchiseMap[num].text,
            options: newFranchiseMap[num].options.sort((a, b) => a.value - b.value)
          }));

        const brandSwitchParsed = Object.keys(brandSwitchMap)
          .map(numStr => Number(numStr))
          .sort((a, b) => a - b)
          .map((num, idx) => ({
            id: `brand-q-${num}-${idx + 1}`,
            text: brandSwitchMap[num].text,
            options: brandSwitchMap[num].options.sort((a, b) => a.value - b.value)
          }));

        if (newFranchiseParsed.length === 0 && brandSwitchParsed.length === 0) {
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "가맹유형/진단문항 부족",
            message: "가맹유형이나 문항 내용이 비어있는 비적합한 엑셀 파일 형식입니다.",
            details: "가맹유형 컬럼(신규 창업/브랜드 전환) 및 문항내용 컬럼이 올바른지 확인해 주세요."
          });
          return;
        }

        // Save on the server
        const res = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newFranchise: newFranchiseParsed,
            brandSwitch: brandSwitchParsed
          })
        });

        const data = await res.json();
        if (data.success) {
          setNewQuestions(newFranchiseParsed);
          setNewBrandQuestions(brandSwitchParsed);
          setExcelStatus(prev => ({
            ...prev,
            questions: {
              success: true,
              newFranchiseCount: newFranchiseParsed.length,
              brandSwitchCount: brandSwitchParsed.length,
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "questions",
            success: true,
            title: "진단문항 일괄 등록 완료",
            message: `진단문항이 성공적으로 업로드 및 등록되었습니다.`,
            details: `신규 창업 문항: ${newFranchiseParsed.length}개\n브랜드 전환 문항: ${brandSwitchParsed.length}개\n\n모든 정보가 서버에 기록되었으며 실시간 진단 도구에 바로 피딩됩니다.`
          });
        } else {
          setExcelStatus(prev => ({
            ...prev,
            questions: {
              success: false,
              error: data.error || "문항 등록 과정에 서버 오류가 발생했습니다.",
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "진단문항 등록 오류",
            message: "진단문항 업로드 등록 실패",
            details: data.error || "서버 혹은 데이터베이스 저장 중 거절되었습니다."
          });
        }
      } catch (err: any) {
        console.error(err);
        setExcelStatus(prev => ({
          ...prev,
          questions: {
            success: false,
            error: err.message || "파일 해독 오류",
            time: new Date().toLocaleTimeString()
          }
        }));
        setUploadModalResult({
          isOpen: true,
          type: "error",
          success: false,
          title: "파일 해독 오류",
          message: "엑셀 파일 해독 중 치명적인 오류가 발생했습니다.",
          details: err.message || "파일 양식 혹은 손상 여부를 확인하세요."
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  // Download Dinagostic Option prescriptive comments to Excel format
  const handleDownloadCommentsXlsx = async () => {
    let currentComments = optionComments;
    if (!currentComments || currentComments.length === 0) {
      try {
        const res = await fetch("/api/comments");
        const data = await res.json();
        if (data.success && data.comments) {
          currentComments = data.comments;
        }
      } catch (err) {
        console.error("Failed to load comments before export:", err);
      }
    }

    const exportData = currentComments.map((c) => ({
      "가맹유형": c.franchiseType,
      "문항순서": c.questionIndex + 1,
      "문항내용": c.questionText,
      "선택지점수": c.score,
      "선택지내용": c.scoreText,
      "처방코멘트": c.comment
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "처방 코멘트 설정");

    worksheet["!cols"] = [
      { wch: 15 }, // 가맹유형
      { wch: 10 }, // 문항순서
      { wch: 35 }, // 문항내용
      { wch: 12 }, // 선택지점수
      { wch: 25 }, // 선택지내용
      { wch: 70 }, // 처방코멘트
    ];

    XLSX.writeFile(workbook, `오프닝맵_선택처방_코멘트설정_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Upload/Register Option comments from Excel format
  const handleUploadCommentsXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "빈 엑셀 파일",
            message: "가맹유형이나 코멘트 내용이 비어있는 빈 엑셀 파일입니다.",
            details: "분석을 위한 데이터 행이 존재하지 않습니다. 정상적인 양식 파일을 올려주세요."
          });
          return;
        }

        const matchedComments: any[] = [];

        rawJson.forEach((row: any) => {
          let franchiseTypeRaw = (row["가맹유형"] || "").toString().trim();
          let franchiseType = "";
          if (franchiseTypeRaw === "신규 창업" || franchiseTypeRaw === "신규창업") {
            franchiseType = "신규 창업";
          } else if (franchiseTypeRaw === "브랜드 전환" || franchiseTypeRaw === "브랜드전환") {
            franchiseType = "브랜드 전환";
          } else {
            return;
          }

          const questionNum = Number(row["문항순서"]);
          const questionText = row["문항내용"] || "";
          const score = Number(row["선택지점수"]);
          const scoreText = row["선택지내용"] || "";
          const comment = row["처방코멘트"] || "";

          if (isNaN(questionNum) || isNaN(score)) {
            return;
          }

          matchedComments.push({
            franchiseType,
            questionIndex: questionNum - 1,
            questionText,
            score,
            scoreText,
            comment
          });
        });

        if (matchedComments.length === 0) {
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "잘못된 컬럼 구조",
            message: "올바른 처방코멘트 엑셀 속성 컬럼명이 확인되지 않았습니다.",
            details: "기본 내려받기 양식을 사용하고 계신지 확인해 주세요. (가맹유형, 문항순서, 문항내용, 선택지점수, 선택지내용, 처방코멘트 컬럼이 필요합니다.)"
          });
          return;
        }

        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: matchedComments })
        });
        const data = await res.json();
        if (data.success) {
          setOptionComments(matchedComments);
          setExcelStatus(prev => ({
            ...prev,
            comments: {
              success: true,
              count: matchedComments.length,
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "comments",
            success: true,
            title: "처방 코멘트 등록 완료",
            message: "선택 항목별 전문가 처방 코멘트 일괄 교체 및 성공등록 완료!",
            details: `총 ${matchedComments.length}개의 전문가 점수별 분석 처방 코멘트가 영구 교체되었습니다.\n모든 신청자의 과거 및 신규 진단서 발급과 인쇄 시 변경된 코멘트 데이터가 즉시 실시간 바인딩됩니다.`
          });
        } else {
          setExcelStatus(prev => ({
            ...prev,
            comments: {
              success: false,
              error: data.error || "코멘트 저장 오류가 발생했습니다.",
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "처방 코멘트 저장 실패",
            message: "서버가 코멘트 수정을 거절했습니다.",
            details: data.error || "알 수 없는 백엔드 전송 오류가 확인되었습니다."
          });
        }
      } catch (err: any) {
        console.error("Excel import failed:", err);
        setExcelStatus(prev => ({
          ...prev,
          comments: {
            success: false,
            error: err.message || "파일 해독 오류",
            time: new Date().toLocaleTimeString()
          }
        }));
        setUploadModalResult({
          isOpen: true,
          type: "error",
          success: false,
          title: "파일 오류",
          message: "엑셀 파일 해독 중 오류가 발생했습니다.",
          details: err.message || "엑셀 파일의 정합성 또는 형식을 변경하셨는지 확인하세요."
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Upload/Register Applicant (Diagnostic Evaluation Results) from Excel
  const handleUploadApplicantsXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "데이터 단락 부족",
            message: "등록할 행 데이터가 편재하지 않는 비어있는 파일입니다.",
            details: "업로드할 엑셀 파일 내부에 채워진 데이터가 존재하는지 미리 확인하고 업로드해 주세요."
          });
          return;
        }

        const applicantsParsed = rawJson.map((row: any) => {
          const franchiseTypeRaw = row["가맹유형"] || row["진단유형"] || row["franchiseType"] || "신규 창업";
          const franchiseType = (franchiseTypeRaw === "브랜드전환" || franchiseTypeRaw === "브랜드 전환") ? "브랜드 전환" : "신규 창업";
          const expectedAnswersCount = franchiseType === "브랜드 전환" ? 8 : 6;
          const answers: number[] = [];
          for (let i = 1; i <= expectedAnswersCount; i++) {
            answers.push(row[`답변${i}`] !== undefined ? Number(row[`답변${i}`]) : 3);
          }

          return {
            id: row["아이디"] || row["ID"] || row["id"] || undefined,
            name: row["이름"] || row["성함"] || row["name"] || "이름없음",
            birth: row["출생월"] || row["생년월일"] || row["birth"] || "1985-01",
            phone: row["연락처"] || row["전화번호"] || row["phone"] || "010-0000-0000",
            region: row["희망지역"] || row["지역"] || row["region"] || "",
            openingMonth: row["개원예정달"] || row["희망시기"] || row["openingMonth"] || "2026-09",
            franchiseType: row["가맹유형"] || row["진단유형"] || row["franchiseType"] || "신규 창업",
            operationType: row["운영형태"] || row["사업자구분"] || row["operationType"] || "개인사업",
            englishMajor: row["영어전공"] || row["전공여부"] || row["englishMajor"] || "비전공",
            englishSpeaking: row["회화역량"] || row["회화여부"] || row["englishSpeaking"] || "유창",
            personality: row["원장성향"] || row["성향"] || row["personality"] || "외향형",
            verificationCode: row["담당자코드"] || row["인증코드"] || row["verificationCode"] || "1004",
            counselorStatus: row["상담상태"] || row["상태"] || row["counselorStatus"] || "신규접수",
            appliedAt: row["신청일시"] || row["appliedAt"] || undefined,
            aiReport: row["본사의견"] || row["AI레포트"] || row["aiReport"] || undefined,
            mainConcern: row["주된고민"] || row["고민사항"] || row["mainConcern"] || "",
            answers
          };
        });

        // Prompt user for Overwrite/Merge choice to prevent accumulating files
        const overwrite = window.confirm(
          "엑셀 데이터 일괄등록 형식을 결정해 주세요.\n\n" +
          "[확인 / Yes] : 기존 데이터베이스를 완전히 '전체삭제'하고 새로 깨끗이 오버라이트 등록합니다. (추천)\n" +
          "[취소 / No] : 기존에 등록된 행들을 보존하면서, 엑셀 데이터를 뒤에 '추가 누적'합니다."
        );

        // Post to bulk endpoint
        const res = await fetch("/api/applicants/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ list: applicantsParsed, overwrite })
        });

        const data = await res.json();
        if (data.success) {
          setExcelStatus(prev => ({
            ...prev,
            applicants: {
              success: true,
              count: data.count,
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "applicants",
            success: true,
            title: data.cleared ? "신청자 데이터 전체삭제 후 덮어쓰기 완료" : "신청자 데이터 누적 등록 완료",
            message: `진단평가(신청자) 데이터가 성공적으로 ${data.cleared ? "전체 데이터 삭제 후 깔끔하게 덮어쓰기" : "누적 추가"} 등록되었습니다.`,
            details: `정상적으로 총 ${data.count}건의 예비원장 신청 정보가 데이터베이스에 반영되었습니다.\n대시보드 통계와 실시간 데이터 목록에 즉각 동기화 연동됩니다.`
          });
          fetchApplicants(); // Refresh list on dashboard!
        } else {
          setExcelStatus(prev => ({
            ...prev,
            applicants: {
              success: false,
              error: data.error || "서버에서 일괄 저장을 거절했습니다.",
              time: new Date().toLocaleTimeString()
            }
          }));
          setUploadModalResult({
            isOpen: true,
            type: "error",
            success: false,
            title: "신청자 데이터 저장 실패",
            message: "진단평가 데이터 업로드 실패",
            details: data.error || "서버 통신에 장애가 생겼거나 컬럼 형식이 유효하지 않습니다."
          });
        }
      } catch (err: any) {
        console.error(err);
        setExcelStatus(prev => ({
          ...prev,
          applicants: {
            success: false,
            error: err.message || "파일 해독 오류",
            time: new Date().toLocaleTimeString()
          }
        }));
        setUploadModalResult({
          isOpen: true,
          type: "error",
          success: false,
          title: "파일 해독 실패",
          message: "엑셀 파일 해독 중 오류가 발생했습니다.",
          details: err.message || "엑셀 워크북 포맷이 올바른 통합문서(*.xlsx) 형식인지 확인해 주시기 바랍니다."
        });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  // Clear/Delete Applicants (Submissions)
  const handleClearApplicants = async () => {
    if (!window.confirm("정말로 모든 신청자(자가진단 결과) 데이터를 데이터베이스에서 일체 삭제하시겠습니까?\n이 작업은 복구가 불가능합니다.")) {
      return;
    }
    try {
      const res = await fetch("/api/applicants", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUploadModalResult({
          isOpen: true,
          type: "applicants",
          success: true,
          title: "신청자 데이터 삭제 완료",
          message: "모든 신청정보가 완전히 삭제되었습니다.",
          details: "등록된 예비원장 신청 정보가 전체 비워졌습니다. 실시간 대시보드 리스트가 초기화됩니다."
        });
        fetchApplicants(); // Reload/refresh (will be empty)
      } else {
        alert("신청자 삭제 실패: " + data.error);
      }
    } catch (err: any) {
      alert("서버 통신 실패: " + err.message);
    }
  };

  const handleDeleteApplicant = (id: string, name: string) => {
    setDeleteConfirmState({
      isOpen: true,
      isBatch: false,
      targetId: id,
      targetName: name
    });
  };

  const handleBatchDeleteApplicants = () => {
    if (selectedApplicantIds.length === 0) return;
    setDeleteConfirmState({
      isOpen: true,
      isBatch: true,
      targetIds: selectedApplicantIds
    });
  };

  const executeSingleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/applicants/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        // Remove from selection if it was selected
        setSelectedApplicantIds(prev => prev.filter(item => item !== id));
        setUploadModalResult({
          isOpen: true,
          type: "applicants",
          success: true,
          title: "신청자 삭제 완료",
          message: `'${name}' 원장님의 데이터가 성공적으로 삭제되었습니다.`,
          details: "성공적으로 해당 신청자의 DB 기록을 영구 파기 완료함에 따라 대시보드 리스트와 실시간 통계 카운트에서 제외되었습니다."
        });
        fetchApplicants(); // Reload/refresh list
      } else {
        alert("신청자 삭제 실패: " + data.error);
      }
    } catch (err: any) {
      alert("서버 통신 실패: " + err.message);
    } finally {
      setDeleteConfirmState(null);
    }
  };

  const executeBatchDelete = async (ids: string[]) => {
    try {
      const res = await fetch("/api/applicants/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedApplicantIds([]); // Clear selection
        setUploadModalResult({
          isOpen: true,
          type: "applicants",
          success: true,
          title: "선택 항목 일괄 삭제 완료",
          message: `선택하신 ${data.count}명의 신청자 데이터가 성공적으로 일괄 삭제되었습니다.`,
          details: "성공적으로 데이터베이스 내에서 일괄 삭제 처리되었으며, 대시보드의 실시간 목록 및 카운터 통계에 반영되었습니다."
        });
        fetchApplicants();
      } else {
        alert("일괄 삭제 실패: " + data.error);
      }
    } catch (err: any) {
      alert("서버 통신 실패: " + err.message);
    } finally {
      setDeleteConfirmState(null);
    }
  };

  // Reset Questions to defaultseed
  const handleClearQuestions = async () => {
    if (!window.confirm("정말로 커스텀 등록된 질문들을 삭제하고, 공지된 초기 기본 질문 세트로 복원하시겠습니까?")) {
      return;
    }
    try {
      const res = await fetch("/api/questions", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
        setUploadModalResult({
          isOpen: true,
          type: "questions",
          success: true,
          title: "질문 데이터 초기화 완료",
          message: "질문 템플릿이 성공적으로 초기 복구되었습니다.",
          details: "커스텀으로 올렸던 시트 질문지가 모두 제거되고 본사 프리미엄 기본형 질문 셋으로 원상복귀 완료되었습니다."
        });
      } else {
        alert("질문 비우기 실패: " + data.error);
      }
    } catch (err: any) {
      alert("서버 통신 실패: " + err.message);
    }
  };

  // Handle adding a brochure
  const handleAddBrochure = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = brochureTitle.trim();
    const trimmedDesc = brochureDesc.trim();
    const trimmedUrl = brochureDirectUrl.trim();

    if (!trimmedTitle) {
      await safeAlert("브로슈어 제목을 입력해주세요.", "입력 오류");
      return;
    }

    setBrochureUploading(true);
    setBrochureUploadFeedback({ status: "uploading", message: "서버 연결 및 전송 시작..." });
    try {
      let finalUrls: string[] = [trimmedUrl].filter(Boolean);
      let isPdf = false;
      let filename = trimmedUrl.split("/").pop() || "brochure";

      // If they selected local files, let's upload them
      if (brochureFiles.length > 0) {
        setBrochureUploadFeedback({ status: "uploading", message: `파일(${brochureFiles.length}개)을 서버로 전송 중...` });

        const uploadedUrls: string[] = [];

        for (let i = 0; i < brochureFiles.length; i++) {
          const file = brochureFiles[i];
          let uploadSuccess = false;
          let uploadData: any = null;

          try {
            const { data, error } = await supabase.storage
              .from('brand_assets')
              .upload(`brochures/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${file.name.split('.').pop()}`, file, { upsert: true });
            
            if (!error && data) {
              const { data: publicUrlData } = supabase.storage.from('brand_assets').getPublicUrl(data.path);
              uploadData = { success: true, url: publicUrlData.publicUrl };
              uploadSuccess = true;
            } else {
              console.error('Supabase upload error:', error);
            }
          } catch (err) {
            console.error('Upload exception:', err);
          }

          if (uploadSuccess && uploadData) {
            uploadedUrls.push(uploadData.url);
          } else {
            throw new Error(`'${file.name}' 업로드 실패`);
          }
        }

        finalUrls = uploadedUrls;
        isPdf = brochureFiles.length === 1 && brochureFiles[0].name.toLowerCase().endsWith(".pdf");
        filename = brochureFiles[0].name;

        setBrochureUploadFeedback({ status: "success", message: "서버 파일 업로드 완료!" });
        addToast("가맹 브로슈어 파일이 서버에 완벽히 업로드되었습니다!", "success");
      } else {
        isPdf = finalUrls[0]?.toLowerCase().endsWith(".pdf") || false;
      }

      if (finalUrls.length === 0) {
        await safeAlert("브로슈어 파일 첨부 또는 다운로드 URL을 제공해야 합니다.", "입력 오류");
        setBrochureUploading(false);
        setBrochureUploadFeedback({ status: "idle" });
        return;
      }

      // Generate thumbnail if PDF
      let thumbnailUrl = "";
      if (isPdf && finalUrls[0]) {
        try {
          const thumb = await generatePdfThumbnail(finalUrls[0]);
          if (thumb) thumbnailUrl = thumb;
        } catch (e) {
          console.warn("Could not generate thumbnail", e);
        }
      }

      // Create brochure object
      const newBrochure = {
        id: "b-" + Date.now(),
        title: trimmedTitle,
        description: trimmedDesc,
        filename: filename,
        url: finalUrls[0], // fallback for backward compatibility
        urls: finalUrls,
        type: isPdf ? 'pdf' : 'images',
        allowDownload: brochureAllowDownload,
        thumbnailUrl: thumbnailUrl,
        uploadedAt: new Date().toISOString()
      };

      const updatedBrochures = [...adminBrochures, newBrochure];

      // Save to server
      const saveData = await saveToSupabase(updatedBrochures, adminVideos, typeof id !== 'undefined' ? 'brochures' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminBrochures(updatedBrochures);
        setBrochureTitle("");
        setBrochureDesc("");
        setBrochureAllowDownload(true);
        setBrochureFiles([]);
        setBrochureDirectUrl("");
        addToast(`'${trimmedTitle}' 브로슈어가 성공적으로 동기화 및 등록되었습니다.`, "success");
        await safeAlert("새 가맹 브로슈어가 성공적으로 등록되었습니다!", "등록 완료");
      } else {
        setBrochureUploadFeedback({ status: "error", message: "저장 실패" });
        await safeAlert("브로슈어 저장에 실패했습니다: " + saveData.error, "등록 실패");
      }
    } catch (err: any) {
      setBrochureUploadFeedback({ status: "error", message: "오류 발생" });
      await safeAlert("브로슈어 등록 중 오류가 발생했습니다: " + err.message, "오류 발생");
    } finally {
      setBrochureUploading(false);
      // Let success state linger slightly for visual effect, then reset
      setTimeout(() => {
        setBrochureUploadFeedback(prev => prev.status === "success" ? { status: "idle" } : prev);
      }, 3000);
    }
  };

  // Handle editing a brochure
  const handleSaveBrochureEdit = async (id: string) => {
    if (!editBrochureData.title.trim()) {
      await safeAlert("브로슈어 제목을 입력해주세요.", "입력 오류");
      return;
    }

    const updatedBrochures = adminBrochures.map(b =>
      String(b.id) === String(id)
        ? { ...b, title: editBrochureData.title, description: editBrochureData.description, allowDownload: editBrochureData.allowDownload }
        : b
    );

    try {
      const saveData = await saveToSupabase(updatedBrochures, adminVideos, typeof id !== 'undefined' ? 'brochures' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminBrochures(updatedBrochures);
        setEditingBrochureId(null);
        addToast("브로슈어 정보가 수정되었습니다.", "success");
      } else {
        await safeAlert("수정 실패: " + saveData.error, "오류");
      }
    } catch (err: any) {
      await safeAlert("수정 중 오류가 발생했습니다.", "오류 발생");
    }
  };

  // Handle deleting a brochure
  const handleDeleteBrochure = async (id: string) => {
    if (!(await safeConfirm("선택하신 브로슈어를 정말 삭제하시겠습니까?", "브로슈어 삭제"))) return;
    const updatedBrochures = adminBrochures.filter(b => String(b.id).trim() !== String(id).trim());
    try {
      const saveData = await saveToSupabase(updatedBrochures, adminVideos, typeof id !== 'undefined' ? 'brochures' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminBrochures(updatedBrochures);
        await safeAlert("브로슈어가 정상적으로 삭제되었습니다.", "삭제 완료");
      } else {
        await safeAlert("삭제 처리에 실패했습니다: " + saveData.error, "삭제 실패");
      }
    } catch (err: any) {
      await safeAlert("통신 중 오류가 발생했습니다: " + err.message, "오류 발생");
    }
  };

  // Helper to safely extract YouTube video ID from standard links
  const extractYoutubeId = (url: string): string => {
    if (!url) return "";
    const trimmed = url.trim();

    // 1. If it's already an 11-character ID
    if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // 2. Parse using standard URL if possible to extract 'v' parameter
    try {
      const urlObj = new URL(trimmed);
      if (urlObj.hostname.includes("youtube.com")) {
        const v = urlObj.searchParams.get("v");
        if (v && v.length === 11) return v;
      }
    } catch (e) {
      // ignore URL parsing error and fallback to regex
    }

    // 3. Regex patterns for different youtube URL styles
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }

    return "";
  };

  // Handle adding a video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = videoTitle.trim();
    const trimmedDesc = videoDesc.trim();
    const trimmedUrl = videoUrl.trim();
    const trimmedDuration = videoDuration.trim() || "3:00";

    if (!trimmedTitle || !trimmedUrl) {
      await safeAlert("영상 제목과 유튜브 URL 주소를 모두 입력해주세요.", "입력 오류");
      return;
    }

    const newVideo = {
      id: "v-" + Date.now(),
      title: trimmedTitle,
      desc: trimmedDesc,
      youtubeUrl: trimmedUrl,
      duration: trimmedDuration
    };

    const updatedVideos = [...adminVideos, newVideo];

    try {
      const saveData = await saveToSupabase(adminBrochures, updatedVideos, typeof id !== 'undefined' ? 'videos' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminVideos(updatedVideos);
        setVideoTitle("");
        setVideoDesc("");
        setVideoUrl("");
        setVideoDuration("");
        await safeAlert("새 브랜드 홍보 영상이 등록되었습니다!", "등록 완료");
      } else {
        await safeAlert("영상 저장에 실패했습니다: " + saveData.error, "등록 실패");
      }
    } catch (err: any) {
      await safeAlert("영상 등록 중 오류가 발생했습니다: " + err.message, "오류 발생");
    }
  };

  // Handle deleting a video
  const handleDeleteVideo = async (id: string) => {
    if (!(await safeConfirm("선택하신 동영상을 정말 삭제하시겠습니까?", "동영상 삭제"))) return;
    const updatedVideos = adminVideos.filter(v => String(v.id).trim() !== String(id).trim());
    try {
      const saveData = await saveToSupabase(adminBrochures, updatedVideos, typeof id !== 'undefined' ? 'videos' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminVideos(updatedVideos);
        await safeAlert("홍보 동영상이 삭제되었습니다.", "삭제 완료");
      } else {
        await safeAlert("삭제 처리에 실패했습니다: " + saveData.error, "삭제 실패");
      }
    } catch (err: any) {
      await safeAlert("통신 중 오류가 발생했습니다: " + err.message, "오류 발생");
    }
  };

  // ==========================================
  // Brand Content BULK REGISTRATION LOGICS
  // ==========================================

  // 1. Handle multi-file selection for brochures
  const handleBulkBrochuresFilesSelect = (files: FileList | null) => {
    if (!files) return;
    const rows = Array.from(files).map((f, idx) => ({
      id: "bulk-b-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 5),
      file: f,
      title: f.name.replace(/\.[^/.]+$/, ""), // file name without extension
      description: "",
      url: "",
      filename: f.name
    }));
    setBulkBrochures(prev => [...prev, ...rows]);
  };

  // 2. Add empty brochure row manually
  const handleBulkBrochuresAddRow = () => {
    setBulkBrochures(prev => [
      ...prev,
      {
        id: "bulk-b-manual-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
        title: "",
        description: "",
        url: "",
        filename: ""
      }
    ]);
  };

  // 3. Delete brochure row
  const handleBulkBrochuresDeleteRow = (id: string) => {
    setBulkBrochures(prev => prev.filter(row => row.id !== id));
  };

  // 4. Update bulk brochure field
  const handleUpdateBulkBrochureField = (id: string, field: string, value: any) => {
    setBulkBrochures(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // 5. Submit bulk brochures
  const handleBulkBrochuresSubmit = async () => {
    if (bulkBrochures.length === 0) {
      safeAlert("일괄 등록할 브로슈어 항목이 존재하지 않습니다.");
      return;
    }

    // Validation
    const invalidRow = bulkBrochures.find(b => !b.title.trim());
    if (invalidRow) {
      safeAlert("모든 항목의 제목을 입력해주세요.");
      return;
    }

    const missingFileOrUrl = bulkBrochures.find(b => !b.file && !b.url.trim());
    if (missingFileOrUrl) {
      safeAlert(`'${missingFileOrUrl.title}' 항목에 첨부파일 또는 URL 주소를 입력해주세요.`);
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgressTotal(bulkBrochures.length);
    setBulkProgressCurrent(0);

    try {
      const uploadedItems: any[] = [];

      for (let i = 0; i < bulkBrochures.length; i++) {
        const row = bulkBrochures[i];
        setBulkProgressCurrent(i + 1);
        let finalUrl = row.url ? row.url.trim() : "";

        if (row.file) {
          let uploadSuccess = false;
          let uploadData: any = null;

          try {
            // Upload file using FormData
            const formData = new FormData();
            formData.append("file", row.file);

            const uploadRes = await fetch("/api/upload-brochure", {
              method: "POST",
              body: formData,
            });

            if (uploadRes.ok) {
              uploadData = await uploadRes.json();
              if (uploadData.success) {
                uploadSuccess = true;
              }
            }
          } catch (multipartErr) {
            console.warn(`[${row.title}] Multipart upload failed, trying base64...`, multipartErr);
          }

          if (!uploadSuccess) {
            try {
              const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(row.file);
              });

              const uploadRes = await fetch("/api/upload-brochure-base64", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  filename: row.file.name,
                  base64Data: base64Data
                })
              });

              if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                throw new Error(`우회 전송 실패 (${uploadRes.status}): ${errText.substring(0, 100)}`);
              }

              uploadData = await uploadRes.json();
              if (uploadData.success) {
                uploadSuccess = true;
              } else {
                throw new Error(uploadData.error || "우회 업로드 실패");
              }
            } catch (fallbackErr: any) {
              throw new Error(`[${row.title}] 파일 업로드 실패: ${fallbackErr.message}`);
            }
          }

          if (uploadSuccess && uploadData) {
            finalUrl = uploadData.url;
          } else {
            throw new Error(`[${row.title}] 업로드 실패`);
          }
        }
        const isRowPdf = row.file ? row.file.name.toLowerCase().endsWith(".pdf") : finalUrl.toLowerCase().endsWith(".pdf");

        let rowThumbnailUrl = "";
        if (isRowPdf && finalUrl) {
          try {
            const thumb = await generatePdfThumbnail(finalUrl);
            if (thumb) rowThumbnailUrl = thumb;
          } catch (e) {
            console.warn("Could not generate thumbnail for bulk row", e);
          }
        }

        uploadedItems.push({
          id: "b-" + (Date.now() + i),
          title: row.title.trim(),
          description: row.description ? row.description.trim() : "",
          filename: row.file ? row.file.name : (finalUrl.split("/").pop() || "brochure.pdf"),
          url: finalUrl,
          urls: [finalUrl],
          type: isRowPdf ? 'pdf' : 'images',
          allowDownload: true,
          thumbnailUrl: rowThumbnailUrl,
          uploadedAt: new Date().toISOString()
        });
      }

      const updatedBrochures = [...adminBrochures, ...uploadedItems];

      const saveData = await saveToSupabase(updatedBrochures, adminVideos, typeof id !== 'undefined' ? 'brochures' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminBrochures(updatedBrochures);
        setBulkBrochures([]);
        setBulkInputText("");
        safeAlert(`총 ${uploadedItems.length}개의 가맹 브로슈어가 일괄 등록되었습니다!`);
      } else {
        throw new Error("서버 저장 실패: " + saveData.error);
      }
    } catch (err: any) {
      safeAlert("일괄 브로슈어 등록 중 오류가 발생했습니다:\n" + err.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 6. Add empty video row manually
  const handleBulkVideoAddRow = () => {
    setBulkVideos(prev => [
      ...prev,
      {
        id: "bulk-v-manual-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5),
        title: "",
        youtubeUrl: "",
        duration: "3:00",
        desc: ""
      }
    ]);
  };

  // 7. Delete video row
  const handleBulkVideoDeleteRow = (id: string) => {
    setBulkVideos(prev => prev.filter(row => row.id !== id));
  };

  // 8. Update bulk video field
  const handleUpdateBulkVideoField = (id: string, field: string, value: any) => {
    setBulkVideos(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // 9. Submit bulk videos
  const handleBulkVideoSubmit = async () => {
    if (bulkVideos.length === 0) {
      safeAlert("일괄 등록할 홍보 동영상 항목이 존재하지 않습니다.");
      return;
    }

    const invalidRow = bulkVideos.find(v => !v.title.trim() || !v.youtubeUrl.trim());
    if (invalidRow) {
      safeAlert("모든 항목의 제목과 유튜브 링크/ID를 입력해주세요.");
      return;
    }

    setIsBulkProcessing(true);
    setBulkProgressTotal(bulkVideos.length);
    setBulkProgressCurrent(0);

    try {
      const newItems = bulkVideos.map((row, idx) => ({
        id: "v-" + (Date.now() + idx),
        title: row.title.trim(),
        desc: row.desc ? row.desc.trim() : "",
        youtubeUrl: row.youtubeUrl.trim(),
        duration: row.duration ? row.duration.trim() || "3:00" : "3:00"
      }));

      const updatedVideos = [...adminVideos, ...newItems];

      const saveData = await saveToSupabase(adminBrochures, updatedVideos, typeof id !== 'undefined' ? 'videos' : undefined, typeof id !== 'undefined' ? id : undefined);
      if (saveData.success) {
        setAdminVideos(updatedVideos);
        setBulkVideos([]);
        setBulkInputText("");
        safeAlert(`총 ${newItems.length}개의 홍보 동영상이 일괄 등록되었습니다!`);
      } else {
        throw new Error("서버 저장 실패: " + saveData.error);
      }
    } catch (err: any) {
      safeAlert("일괄 동영상 등록 중 오류가 발생했습니다:\n" + err.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // 10. Parse raw text lines to bulk list
  const handleParseBulkText = () => {
    const rawText = bulkInputText.trim();
    if (!rawText) {
      safeAlert("파싱할 텍스트를 입력창에 먼저 작성해주세요.");
      return;
    }

    const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    let parsedCount = 0;

    if (bulkType === "brochure") {
      const parsedRows: any[] = [];
      lines.forEach((line, idx) => {
        let parts = line.split("|").map(p => p.trim());
        if (parts.length < 2) {
          parts = line.split(",").map(p => p.trim());
        }

        if (parts.length >= 2) {
          parsedRows.push({
            id: "bulk-b-parsed-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 5),
            title: parts[0],
            url: parts[1],
            description: parts[2] || "",
            filename: parts[1].split("/").pop() || "brochure.pdf"
          });
          parsedCount++;
        }
      });

      if (parsedRows.length > 0) {
        setBulkBrochures(prev => [...prev, ...parsedRows]);
        safeAlert(`텍스트 분석 완료: 총 ${parsedCount}개의 브로슈어 항목이 아래 편집 테이블에 추가되었습니다.`);
      } else {
        safeAlert("올바른 포맷의 라인을 찾지 못했습니다.\n예시 포맷: 제목 | 다운로드URL | 설명");
      }
    } else {
      const parsedRows: any[] = [];
      lines.forEach((line, idx) => {
        let parts = line.split("|").map(p => p.trim());
        if (parts.length < 2) {
          parts = line.split(",").map(p => p.trim());
        }

        if (parts.length >= 2) {
          parsedRows.push({
            id: "bulk-v-parsed-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 5),
            title: parts[0],
            youtubeUrl: parts[1],
            duration: parts[2] || "3:00",
            desc: parts[3] || ""
          });
          parsedCount++;
        }
      });

      if (parsedRows.length > 0) {
        setBulkVideos(prev => [...prev, ...parsedRows]);
        safeAlert(`텍스트 분석 완료: 총 ${parsedCount}개의 홍보 동영상 항목이 아래 편집 테이블에 추가되었습니다.`);
      } else {
        safeAlert("올바른 포맷의 라인을 찾지 못했습니다.\n예시 포맷: 제목 | 유튜브주소 | 상영시간 | 상세설명");
      }
    }
  };

  // Reset Comments to defaultseed
  const handleClearComments = async () => {
    if (!window.confirm("정말로 일괄 등록된 처방 코멘트를 일체 삭제하고 본사 초안 기본값으로 복귀시키겠습니까?")) {
      return;
    }
    try {
      const res = await fetch("/api/comments", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchOptionComments();
        setUploadModalResult({
          isOpen: true,
          type: "comments",
          success: true,
          title: "처방 코멘트 초기화 완료",
          message: "처방 분석 코멘트가 본사 기본값으로 원상 복구되었습니다.",
          details: "엑셀로 덧씌웠던 코멘트 60개가 모두 소멸되고, 본사 정식 출간형 점수 매트릭스 기본 코멘트 구조가 즉시 재바인딩됩니다."
        });
      } else {
        alert("코멘트 비우기 실패: " + data.error);
      }
    } catch (err: any) {
      alert("서버 통신 실패: " + err.message);
    }
  };

  // Demo Admin access trigger bypass with ID and Password validation
  const handleAdminVerify = () => {
    const trimmedId = adminId.trim();
    if (trimmedId === "admin2026" && adminPassword === "admin2026") {
      startTransition(() => {
        setIsAdminAuthenticated(true);
        setAdminAuthError("");
      });
    } else if (trimmedId === "admin" && (adminPassword === "2026" || adminPassword === "admin" || adminPassword === "1234")) {
      startTransition(() => {
        setIsAdminAuthenticated(true);
        setAdminAuthError("");
      });
    } else {
      setAdminAuthError("아이디 또는 비밀번호가 일치하지 않습니다. 올바른 계정 정보를 입력해주세요.");
    }
  };

  return (
    <div className="min-h-screen text-[#1A1A1A] selection:bg-[#C5A059] selection:text-white bg-[#F4F4F7] relative overflow-x-hidden" id="main_root">
      {/* Decorative Brand Header */}
      <header className="h-20 bg-[#0B3B24] border-b-4 border-[#C5A059] sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between" id="app_header">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setView("hub"); }}>
          <div className="w-9 h-9 rounded bg-[#C5A059] flex items-center justify-center font-black text-[#0B3B24] text-xl font-sans" id="gold_badge">
            KY
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-extrabold text-white text-lg sm:text-xl tracking-wider uppercase">KY Academy Consulting</span>
              <span className="hidden sm:inline-block text-[9px] bg-[#C5A059]/15 text-[#C5A059] px-1.5 py-0.5 rounded font-medium border border-[#C5A059]/30">PARTNERS</span>
            </div>
            <p className="text-[10px] text-white/60 font-mono tracking-tight">10년 경력 개원전문가 컨설팅 & 맞춤 진단 플랫폼</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-3">
          {view !== "hub" && (
            <button
              onClick={() => { setView("hub"); }}
              className="text-xs bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] font-black px-3 py-2 rounded border border-[#C5A059]/30 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>통합 홈으로</span>
            </button>
          )}

          {view === "admin" ? (
            <button
              id="exit_admin_btn"
              onClick={() => { setView("home"); }}
              className="text-xs bg-[#0B3B24]/30 hover:bg-[#062919] text-white font-medium px-4 py-2.5 rounded border border-white/20 transition-all flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>진단 홈으로</span>
            </button>
          ) : (
            <button
              id="admin_entry_btn"
              onClick={() => {
                if (isAdminAuthenticated) {
                  setView("admin");
                } else {
                  setAdminId("");
                  setAdminPassword("");
                  setAdminAuthError("");
                  setView("admin");
                }
              }}
              className="text-xs bg-transparent hover:bg-white/10 text-white font-medium px-4 py-2.5 rounded transition-all flex items-center space-x-1.5 border border-white/20"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">본사 전용 관리자</span>
            </button>
          )}
        </nav>

        {/* Mobile Navigation Toggle Button */}
        <motion.button
          id="mobile_menu_toggle_btn"
          onClick={() => setIsMobileMenuOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.90, rotate: -4 }}
          className="sm:hidden text-white hover:bg-white/10 p-2 rounded transition-all focus:outline-none flex items-center justify-center border border-white/15"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5 text-[#C5A059]" />
        </motion.button>
      </header>

      {/* Collapsible Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
              id="mobile_menu_overlay"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-72 bg-[#0B3B24] border-l-4 border-[#C5A059] shadow-2xl z-50 p-6 flex flex-col justify-between"
              id="mobile_menu_drawer"
            >
              <div className="space-y-8">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded bg-[#C5A059] flex items-center justify-center font-black text-[#0B3B24] text-md">
                      KY
                    </div>
                    <span className="font-display font-extrabold text-white text-base tracking-wider uppercase">KY Academy</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                    aria-label="메뉴 닫기"
                    id="mobile_menu_close_btn"
                  >
                    <X className="w-5 h-5 text-[#C5A059]" />
                  </button>
                </div>

                {/* Drawer Navigation Links */}
                <div className="space-y-2" id="mobile_menu_links">
                  <button
                    onClick={() => {
                      setView("hub");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "hub"
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Opening Map 메인 홈</span>
                  </button>

                  <button
                    onClick={() => {
                      setView("brand");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "brand"
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>브랜드 알아보기</span>
                  </button>

                  <button
                    onClick={() => {
                      setView("home");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "home" || ["step1", "step2", "quiz", "result"].includes(view)
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                    id="mobile_menu_home_btn"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>개원진단 (Opening Map)</span>
                  </button>

                  <button
                    onClick={() => {
                      setView("schedule");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "schedule"
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>개원일정 스케줄러</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isAdminAuthenticated) {
                        setView("timetable");
                      } else {
                        alert("시간표 제작기 빌더는 본사 관리자 전용 솔루션입니다. 본사 관리자 계정(admin)으로 로그인하여 권한을 획득해 주십시오.");
                        setView("admin");
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "timetable"
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                    <span>시간표 제작기</span>
                  </button>

                  <div className="border-t border-white/10 my-2 pt-2" />

                  <button
                    onClick={() => {
                      if (isAdminAuthenticated) {
                        setView("admin");
                      } else {
                        setAdminId("");
                        setAdminPassword("");
                        setAdminAuthError("");
                        setView("admin");
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${view === "admin"
                        ? "bg-[#C5A059] text-[#0B3B24]"
                        : "text-white/90 hover:bg-white/10"
                      }`}
                    id="mobile_menu_admin_btn"
                  >
                    <Lock className="w-4 h-4" />
                    <span>본사 전용 관리자</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer Status */}
              <div className="border-t border-white/10 pt-4 text-[10px] text-white/50 font-mono space-y-1">
                <p>KY Academy Consulting v2.0</p>
                <p className="tracking-tight">10년 경력 개원컨설팅 전문가 맞춤진단</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container Layout */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12" id="main_content_body">
        {["home", "step1", "step2", "quiz", "result"].includes(view) && (
          <div className="mb-8 md:mb-10 no-print" id="diagnostic_stepper_header">
            {/* Elegant Horizontal Progress Stepper Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-3">
              <div className="relative flex items-center justify-between mx-auto max-w-4xl px-2">

                {/* Horizontal Background Track (Grey) */}
                <div className="absolute left-[24px] right-[24px] top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 z-0" />

                {/* Active Dynamic Track (Navy & Gold Gradient) */}
                <div
                  className="absolute left-[24px] top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#0B3B24] to-[#C5A059] transition-all duration-500 ease-out z-0"
                  style={{
                    width: `${view === "home" ? "0%" :
                        view === "step1" ? "25%" :
                          view === "step2" ? "50%" :
                            view === "quiz" ? "75%" :
                              "100%"
                      }`
                  }}
                />

                {[
                  { id: "home", label: "진단 시작", desc: "Intro", stepNum: 1 },
                  { id: "step1", label: "컨설턴트 인증", desc: "Code", stepNum: 2 },
                  { id: "step2", label: "기본 정보 입력", desc: "Profile", stepNum: 3 },
                  { id: "quiz", label: "창업역량 진단", desc: "Diagnostic", stepNum: 4 },
                  { id: "result", label: "진단결과 리포트", desc: "Report", stepNum: 5 }
                ].map((step, index) => {
                  const viewOrder = ["home", "step1", "step2", "quiz", "result"];
                  const currentIndex = viewOrder.indexOf(view);

                  const isActive = view === step.id;
                  const isCompleted = currentIndex > index;
                  const isUnlocked = index === 0 ||
                    (step.id === "step1") ||
                    (step.id === "step2" && verificationCode.trim().length === 4) ||
                    (step.id === "quiz" &&
                      verificationCode.trim().length === 4 &&
                      basicInfo.name.trim() &&
                      basicInfo.phone.trim() &&
                      basicInfo.region.trim() &&
                      basicInfo.phone.replace(/\D/g, "").startsWith("010") &&
                      basicInfo.phone.replace(/\D/g, "").length === 11) ||
                    (step.id === "result" && diagnosisResult !== null);

                  // Helper function to handle step clicking safely
                  const handleStepClick = () => {
                    if (step.id === "home") {
                      setView("home");
                    } else if (step.id === "step1") {
                      setView("step1");
                    } else if (step.id === "step2") {
                      if (verificationCode.trim().length === 4) {
                        setView("step2");
                      } else {
                        alert("담당 컨설턴트 4자리 인증코드를 먼저 기입 및 연결해주세요.");
                      }
                    } else if (step.id === "quiz") {
                      if (verificationCode.trim().length !== 4) {
                        alert("컨설턴트 인증을 먼저 완료해주세요.");
                      } else if (!basicInfo.name.trim() || !basicInfo.phone.trim() || !basicInfo.region.trim()) {
                        alert("예비 원장님의 성명, 연락처, 희망 개원지역 정보를 모두 입력해주세요.");
                      } else {
                        const cleanedPhone = basicInfo.phone.replace(/\D/g, "");
                        if (!cleanedPhone.startsWith("010")) {
                          alert("연락처는 반드시 앞자리가 '010'으로 시작해야 합니다.");
                        } else if (cleanedPhone.length !== 11) {
                          alert("연락처는 '010'을 제외하고 남은 숫자가 정확히 8자리여야 합니다. (총 11자리)");
                        } else {
                          setView("quiz");
                        }
                      }
                    } else if (step.id === "result") {
                      if (diagnosisResult) {
                        setView("result");
                      } else {
                        alert("6문항 학부모 상담 및 경영 역량 자가진단을 최종 제출하셔야 분석결과 리포트가 도출됩니다.");
                      }
                    }
                  };

                  return (
                    <div
                      key={step.id}
                      className={`relative flex flex-col items-center text-center z-10 select-none ${isUnlocked ? "cursor-pointer group" : "cursor-not-allowed"
                        }`}
                      onClick={isUnlocked ? handleStepClick : undefined}
                    >
                      {/* Circle indicator node (compact sizes) */}
                      <div
                        className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-extrabold text-xs md:text-sm border transition-all duration-300 ${isActive
                            ? "bg-[#0B3B24] text-white border-[#C5A059] shadow-[0_0_8px_rgba(197,160,89,0.3)] scale-105"
                            : isCompleted
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : isUnlocked
                                ? "bg-white text-[#0B3B24] border-slate-200 hover:border-[#0B3B24] hover:bg-slate-50"
                                : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}
                      >
                        {isCompleted ? "✓" : step.stepNum}
                      </div>

                      {/* Step responsive labels (tight layout) */}
                      <div className="mt-1 flex flex-col items-center">
                        <span
                          className={`text-[8.5px] sm:text-[11px] font-bold leading-tight font-sans tracking-tight text-center max-w-[65px] sm:max-w-none ${isActive
                              ? "text-[#0B3B24] block"
                              : "text-slate-500 hidden sm:block"
                            }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* VIEW: HUB PORTAL */}
          {view === "hub" && (
            <HubView setView={setView} isAdminAuthenticated={isAdminAuthenticated} />
          )}

          {/* VIEW: BRAND INTRODUCTION */}
          {view === "brand" && (
            <BrandView setView={setView} />
          )}

          {/* VIEW: OPENING SCHEDULE TIMELINE */}
          {view === "schedule" && (
            <ScheduleView setView={setView} />
          )}

          {/* VIEW: TIMETABLE BUILDER */}
          {view === "timetable" && (
            <TimetableBuilder setView={setView} />
          )}

          {/* VIEW: HOME LANDING */}
          {view === "home" && (
            <motion.div
              key="view_home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-center py-8 md:py-20 max-w-4xl mx-auto"
              id="section_home"
            >
              <div className="relative mb-12 p-8 md:p-14 bg-white rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden" id="premium_welcome_hero">
                {/* Visual Accent Corner Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#C5A059]/10 to-transparent rounded-full filter blur-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#0B3B24]/5 to-transparent rounded-full filter blur-xl pointer-events-none" />

                {/* High class Badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#0B3B24]/5 rounded-full border border-[#0B3B24]/10 text-[11px] tracking-widest text-[#0B3B24] font-extrabold uppercase mb-8">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  <span>PREMIUM CONSULTING SYSTEM &nbsp;|&nbsp; KOREA UNIV PARTNERS</span>
                </div>

                {/* Extremely prominent brand name: "Opening Map" */}
                <h1 className="text-5xl md:text-7xl font-sans font-black tracking-tight text-[#0B3B24] select-none uppercase mb-4" id="main_title">
                  OPENING MAP
                </h1>

                {/* Tailored subtitle request: "원장님의 개원진단을 해드립니다." */}
                <p className="text-xl md:text-2xl font-serif text-[#C5A059] font-medium tracking-wide mb-6" id="consulting_tagline">
                  원장님의 개원진단을 해드립니다.
                </p>

                <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed mb-10" id="sub_title">
                  원장의 정량적 창업 적합성(경력·자본·성향·시기)을 정밀 진단하여<br />
                  성공적인 프랜차이즈 개원 로드맵과 입지 전략을 제안합니다.
                </p>

                {/* Action button request: "진단받기" */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => { setView("hub"); }}
                    className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-[#0B3B24] hover:bg-slate-50 text-[#0B3B24] font-black text-lg rounded-xl shadow-md transition-all flex items-center justify-center space-x-3.5"
                  >
                    <span>← Opening Map 메인 홈</span>
                  </button>
                  <button
                    id="cta_diagnose_start_btn"
                    onClick={() => { setView("step1"); }}
                    className="w-full sm:w-auto px-10 py-5 bg-[#0B3B24] hover:bg-[#062919] text-white font-black text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-3.5 group"
                  >
                    <span>진단받기</span>
                    <ArrowRight className="w-5 h-5 text-[#C5A059] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* USP (Unique Selling Points) Bento Grid with Consulting Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left" id="usp_grid">
                <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#C5A059]/40 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mb-4 transition-colors group-hover:bg-[#0B3B24] group-hover:text-white">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-[#0B3B24] font-extrabold text-base mb-2">1단계: 유형 분석</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    영어지도 및 학원경영 경력을 정교하게 교차 매핑하여 '운영전문가형', '교육전문가형' 등 최적의 맞춤유형을 분류합니다.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#C5A059]/40 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mb-4 transition-colors group-hover:bg-[#0B3B24] group-hover:text-white">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <h3 className="text-[#0B3B24] font-extrabold text-base mb-2">2단계: 자본/성향 컨설팅</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    투자 가능한 자본 밴드별로 적합한 공간 평수(10평~70평형)와 원장 성향 기반 1대1 인사 채용 가이드라인을 동시 처방합니다.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[#C5A059]/40 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#0B3B24]/5 text-[#0B3B24] flex items-center justify-center mb-4 transition-colors group-hover:bg-[#0B3B24] group-hover:text-white">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-[#0B3B24] font-extrabold text-base mb-2">3단계: AI 영업 우선순위</h3>
                  <p className="text-slate-500 text-xs leading-relaxed font-semibold">
                    원장님의 예정연월 기반 리드 우선순위와 함께 고려대 교육협력 파트너 프리미엄 AI 종합 전문의견을 실시간 생성합니다.
                  </p>
                </div>
              </div>
            </motion.div>
          )}


          {/* VIEW: STEP 1 - Code Entry */}
          {view === "step1" && (
            <motion.div
              key="view_step1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto"
              id="section_step1"
            >
              <div className="p-8 rounded-xl bg-white border border-[#E5E7EB] shadow-lg relative overflow-hidden border-t-8 border-t-[#C5A059]">

                <h2 className="text-2xl font-bold text-[#0B3B24] mb-2 text-center">컨설턴트 코드 입력</h2>
                <p className="text-[#4B5563] text-sm text-center mb-6">
                  개원 상담 신청 혹은 담당 컨설턴트로부터 부여받은 4자리 고유 인증 코드를 기재해주세요.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[#0B3B24] text-xs font-bold mb-2 uppercase" htmlFor="verification_code_input">
                      인증코드 (4자리)
                    </label>
                    <input
                      id="verification_code_input"
                      type="text"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="인증코드 4자리를 비공개 입력해주세요"
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold font-mono bg-slate-50 border-2 border-[#E5E7EB] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] text-[#0B3B24]"
                    />
                  </div>

                  {/* Dynamic Match Feedback */}
                  {counselorMatched && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2"
                      id="counselor_match_banner"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        확인됨: <strong className="text-emerald-950">{counselorMatched}</strong> 배정 진단 세션
                      </span>
                    </motion.div>
                  )}

                  {codeError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <span>{codeError}</span>
                    </div>
                  )}

                  <button
                    id="verify_code_submit_btn"
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 4}
                    className="w-full py-4 rounded bg-[#0B3B24] hover:bg-[#062919] text-white font-bold text-base transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                  >
                    <span>기본정보 입력하기</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: STEP 2 - Basic Info Form */}
          {view === "step2" && (
            <motion.div
              key="view_step2"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="max-w-4xl mx-auto"
              id="section_step2"
            >
              <div className="p-5 md:p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative border-t-8 border-t-[#C5A059]">

                <div className="flex items-center justify-between mb-5 border-b pb-4 border-slate-100">
                  <div>
                    <span className="text-[10px] md:text-xs text-[#C5A059] font-black uppercase tracking-wider">STEP 2 of 4</span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0B3B24]">진단 희망인 기본정보 입력</h2>
                  </div>
                  <button
                    onClick={() => { setView("step1"); }}
                    className="text-slate-500 hover:text-[#0B3B24] text-xs flex items-center space-x-1 font-semibold transition-colors duration-150"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>이전</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-5" id="basic_info_form_grid">

                  {/* --- Row 1 --- */}
                  {/* Name input */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" htmlFor="applicant_name">
                      이름 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-[9px] w-3.5 h-3.5 text-[#C5A059]" />
                      <input
                        id="applicant_name"
                        type="text"
                        required
                        value={basicInfo.name}
                        onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                        placeholder="이름 입력 (예: 홍길동)"
                        className="w-full bg-white border-2 border-[#E5E7EB] rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs shadow-sm focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>
                  </div>

                  {/* Phone input */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" htmlFor="applicant_phone">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative font-sans animate-fade">
                      <Phone className="absolute left-3 top-[9px] w-3.5 h-3.5 text-[#C5A059]" />
                      <input
                        id="applicant_phone"
                        type="tel"
                        required
                        value={basicInfo.phone}
                        onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                        placeholder="010-0000-0000"
                        className="w-full bg-white border-2 border-[#E5E7EB] rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs shadow-sm focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>
                    {basicInfo.phone && (() => {
                      const cleaned = basicInfo.phone.replace(/\D/g, "");
                      if (!cleaned.startsWith("010")) {
                        return (
                          <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                            <span>⚠️ '010' 필수</span>
                          </p>
                        );
                      }
                      if (cleaned.length !== 11) {
                        return (
                          <p className="text-amber-600 text-[10px] mt-1 font-semibold flex items-center gap-1">
                            <span>⚠️ 11자리 입력</span>
                          </p>
                        );
                      }
                      return (
                        <p className="text-emerald-600 text-[10px] mt-1 font-semibold flex items-center gap-1">
                          <span>✓ 올바른 번호</span>
                        </p>
                      );
                    })()}
                  </div>

                  {/* Birth month (Separated Year and Month Boxes) */}
                  <div className="md:col-span-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[#0B3B24] text-xs font-bold uppercase">
                        출생연월 <span className="text-red-500">*</span>
                      </label>
                      {basicInfo.birth && (() => {
                        const age = calculateKoreanAge(basicInfo.birth);
                        return age !== null ? (
                          <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-full">
                            만 {age}세
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-2.5 top-[9px] w-3.5 h-3.5 text-[#C5A059]" />
                        <input
                          id="birth_year_input"
                          type="text"
                          maxLength={4}
                          required
                          value={birthYearStr || ""}
                          onChange={(e) => handleBirthYearChange(e.target.value)}
                          placeholder="년 (YYYY)"
                          className="w-full bg-white border-2 border-[#E5E7EB] rounded-lg pl-8 pr-1 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs shadow-sm focus:ring-1 focus:ring-[#C5A059]"
                        />
                      </div>
                      <div className="relative flex-1">
                        <input
                          id="birth_month_input"
                          type="text"
                          maxLength={2}
                          required
                          value={birthMonthStr || ""}
                          onChange={(e) => handleBirthMonthChange(e.target.value)}
                          placeholder="월 (MM)"
                          className="w-full bg-white border-2 border-[#E5E7EB] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs shadow-sm focus:ring-1 focus:ring-[#C5A059]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Row 2 --- */}
                  {/* Target Area */}
                  <div className="md:col-span-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[#0B3B24] text-xs font-bold uppercase" htmlFor="applicant_region">
                        희망 개원 지역 <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, region: basicInfo.region === "없음 (미정)" ? "" : "없음 (미정)" })}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all border cursor-pointer ${basicInfo.region === "없음 (미정)"
                            ? "bg-[#C5A059] text-white border-[#C5A059]"
                            : "bg-slate-50 text-slate-500 hover:text-[#C5A059] hover:bg-slate-100 border-[#E5E7EB]"
                          }`}
                      >
                        미정 선택
                      </button>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-[9px] w-3.5 h-3.5 text-[#C5A059]" />
                      <input
                        id="applicant_region"
                        type="text"
                        required
                        value={basicInfo.region}
                        onChange={(e) => setBasicInfo({ ...basicInfo, region: e.target.value })}
                        placeholder="예) 서울 강남구 대치동"
                        className="w-full bg-white border-2 border-[#E5E7EB] rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs shadow-sm focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>
                  </div>

                  {/* Target opening month and 미정 checkbox INLINE */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" htmlFor="applicant_openingMonth">
                      개원 예정연월 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-[9px] w-3.5 h-3.5 text-[#C5A059]" />
                        <input
                          id="applicant_openingMonth"
                          type="month"
                          required={basicInfo.openingMonth !== "없음"}
                          disabled={basicInfo.openingMonth === "없음"}
                          value={basicInfo.openingMonth === "없음" ? "" : basicInfo.openingMonth}
                          min="2026-06"
                          onChange={(e) => setBasicInfo({ ...basicInfo, openingMonth: e.target.value })}
                          className={`w-full bg-white border-2 border-[#E5E7EB] rounded-lg pl-9 pr-1 py-1.5 focus:outline-none focus:border-[#C5A059] text-slate-800 text-xs cursor-pointer shadow-sm focus:ring-1 focus:ring-[#C5A059] ${basicInfo.openingMonth === "없음" ? "opacity-60 bg-slate-50" : ""}`}
                        />
                      </div>
                      <div className="flex items-center shrink-0">
                        <input
                          type="checkbox"
                          id="no_opening_month"
                          checked={basicInfo.openingMonth === "없음"}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBasicInfo({ ...basicInfo, openingMonth: "없음" });
                            } else {
                              setBasicInfo({ ...basicInfo, openingMonth: "2026-09" });
                            }
                          }}
                          className="rounded border-[#E5E7EB] text-[#0B3B24] focus:ring-[#C5A059] mr-1 h-3.5 w-3.5 cursor-pointer"
                        />
                        <label htmlFor="no_opening_month" className="text-xs text-slate-600 select-none cursor-pointer font-bold">
                          미정
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Franchise type selection */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" htmlFor="franchise_type_group">
                      가맹 유형
                    </label>
                    <div className="grid grid-cols-2 gap-2" id="franchise_type_group">
                      <button
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, franchiseType: "신규 창업" })}
                        className={`py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.franchiseType === "신규 창업"
                            ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                            : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                          }`}
                      >
                        신규 창업
                      </button>
                      <button
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, franchiseType: "브랜드 전환" })}
                        className={`py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.franchiseType === "브랜드 전환"
                            ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                            : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                          }`}
                      >
                        브랜드 전환
                      </button>
                    </div>
                  </div>

                  {/* --- Row 3 --- */}
                  {/* Operation Type selection */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" id="operation_type_lbl">
                      운영 유형
                    </label>
                    <div className="grid grid-cols-3 gap-1.5" aria-labelledby="operation_type_lbl">
                      {(["개인사업", "동업", "법인"] as const).map(op => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setBasicInfo({ ...basicInfo, operationType: op })}
                          className={`py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.operationType === op
                              ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                              : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                            }`}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* English Major selection */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" id="english_major_lbl">
                      영어전공 여부
                    </label>
                    <div className="grid grid-cols-2 gap-2" aria-labelledby="english_major_lbl">
                      {(["전공", "비전공"] as const).map(maj => (
                        <button
                          key={maj}
                          type="button"
                          onClick={() => setBasicInfo({ ...basicInfo, englishMajor: maj })}
                          className={`py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.englishMajor === maj
                              ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                              : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                            }`}
                        >
                          {maj}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* English Speaking selection */}
                  <div className="md:col-span-1">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-1.5 uppercase" id="english_speaking_lbl">
                      회화역량
                    </label>
                    <div className="grid grid-cols-3 gap-1.5" aria-labelledby="english_speaking_lbl">
                      {(["유창", "기본", "불가"] as const).map(spe => (
                        <button
                          key={spe}
                          type="button"
                          onClick={() => setBasicInfo({ ...basicInfo, englishSpeaking: spe })}
                          className={`py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.englishSpeaking === spe
                              ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                              : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                            }`}
                        >
                          {spe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* --- Row 4 --- */}
                  {/* Personality selection - spans full width */}
                  <div className="col-span-1 md:col-span-3 border-t pt-4 border-slate-100">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-2 uppercase" id="personality_lbl">
                      원장 성향
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-labelledby="personality_lbl">
                      <button
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, personality: "내향형" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-sm ${basicInfo.personality === "내향형"
                            ? "bg-[#0B3B24]/5 border-2 border-[#C5A059] text-[#0B3B24] shadow-md scale-[1.01]"
                            : "bg-white border-2 border-[#E5E7EB] hover:border-slate-300 text-slate-600 hover:text-slate-800"
                          }`}
                      >
                        <span className="block font-extrabold text-sm mb-1 text-[#0B3B24]">인내와 디테일형 (내향형)</span>
                        <span className="block text-[11px] text-slate-500 leading-relaxed">조용하고 디테일하며 꼼꼼한 관리 지향 타입</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, personality: "외향형" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer shadow-sm ${basicInfo.personality === "외향형"
                            ? "bg-[#0B3B24]/5 border-2 border-[#C5A059] text-[#0B3B24] shadow-md scale-[1.01]"
                            : "bg-white border-2 border-[#E5E7EB] hover:border-slate-300 text-slate-600 hover:text-slate-800"
                          }`}
                      >
                        <span className="block font-extrabold text-sm mb-1 text-[#0B3B24]">열정과 커뮤니케이션형 (외향형)</span>
                        <span className="block text-[11px] text-slate-500 leading-relaxed">활기찬 학부모 대면 설명회 및 강사진 주도형 타입</span>
                      </button>
                    </div>
                  </div>

                  {/* --- Row 5 --- */}
                  <div className="col-span-1 md:col-span-3 border-t pt-4 border-slate-100">
                    <label className="block text-[#0B3B24] text-xs font-bold mb-2 uppercase" id="inflow_route_lbl">
                      유입 경로 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" aria-labelledby="inflow_route_lbl">
                      {(["인터넷검색", "지인추천", "인스타그램", "사업설명회", "기타"] as const).map(route => (
                        <button
                          key={route}
                          type="button"
                          onClick={() => setBasicInfo({ ...basicInfo, inflowRoute: route })}
                          className={`py-2 px-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer shadow-sm ${basicInfo.inflowRoute === route
                              ? "bg-[#0B3B24] border-[#C5A059] text-white shadow-md active:scale-95"
                              : "bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24]"
                            }`}
                        >
                          {route}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* --- Row 6 --- */}
                  {/* 주된 고민사항 (mainConcern) */}
                  <div className="col-span-1 md:col-span-3 border-t pt-4 border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[#0B3B24] text-xs font-bold uppercase" id="main_concern_lbl">
                        주된 고민사항 <span className="text-slate-400 font-normal">(선택)</span>
                      </label>
                      <div className="text-[10px] text-slate-400 font-mono font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                        {(basicInfo.mainConcern || "").length} / 150자
                      </div>
                    </div>
                    <textarea
                      placeholder="학원 개원 시 가장 고민되거나 핵심적으로 도움받고 싶은 부분에 대해 기입해 주세요. (예: 상권 선택, 마케팅 전략, 교사 구인, 초기 자본금 등)"
                      value={basicInfo.mainConcern || ""}
                      maxLength={150}
                      onChange={(e) => setBasicInfo({ ...basicInfo, mainConcern: e.target.value })}
                      className="w-full bg-white border-2 border-[#E5E7EB] rounded-xl p-3 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] text-slate-800 text-xs h-[85px] resize-none leading-relaxed placeholder-slate-400 shadow-sm"
                    />
                  </div>

                  {/* 창업 예산 시뮬레이터 (Budget Simulator Integration) */}
                  <div className="col-span-1 md:col-span-3 border-t pt-6 border-slate-100">
                    <BudgetSimulator
                      initialDesiredArea={basicInfo.desiredArea}
                      initialRegionalTier={basicInfo.regionalTier}
                      initialMyCapital={basicInfo.myCapital}
                      onChange={(data) => {
                        setBasicInfo(prev => ({
                          ...prev,
                          desiredArea: data.desiredArea,
                          regionalTier: data.regionalTier,
                          calculatedBudget: data.calculatedBudget,
                          myCapital: data.myCapital
                        }));
                      }}
                    />
                  </div>


                </div>



                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    id="submit_basic_info_btn"
                    onClick={handleBasicInfoSubmit}
                    className="flex-1 py-3 px-5 rounded-xl bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-sm transition-all flex items-center justify-center space-x-1 shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>{basicInfo.franchiseType} 문항 진단 받기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-[#C5A059]/10 text-[#0B3B24] text-xs font-extrabold rounded-xl border border-[#C5A059]/20 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059] animate-pulse" />
                    <span>필수 6개 항목만 입력하면 시작 가능</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}


          {/* VIEW: STEP 3 - Diagnostic Questionnaire (Quiz) */}
          {view === "quiz" && (
            <motion.div
              key="view_quiz"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
              id="section_quiz"
            >
              {/* Question card container */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg p-8 relative overflow-hidden border-t-8 border-t-[#C5A059]" id="quiz_panel">

                {/* Progress bar and numeric tracking */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-xs bg-slate-50 border border-[#E5E7EB] text-[#C5A059] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                      {basicInfo.franchiseType} 세션
                    </span>
                    <h3 className="text-[#0B3B24] text-sm font-semibold mt-1">창업 및 개원 역량 문항 진단</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0B3B24]">{currentQuestionIndex + 1}</span>
                    <span className="text-slate-400 text-xs"> / {activeQuestionsList.length}</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#0B3B24] to-[#C5A059]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / activeQuestionsList.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Current Question Block */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`question_${currentQuestionIndex}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.55 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-50 p-6 rounded-lg border border-[#E5E7EB]">
                      <span className="text-xs text-[#C5A059] font-mono font-bold">QUESTION {String(currentQuestionIndex + 1).padStart(2, "0")}</span>
                      <h4 className="text-lg font-bold text-[#0B3B24] mt-1 leading-snug">
                        {activeQuestionsList[currentQuestionIndex].text}
                      </h4>
                    </div>

                    {/* Styled Option Radio buttons */}
                    <div className="space-y-3.5" id="quiz_options_container">
                      {activeQuestionsList[currentQuestionIndex].options.map((opt) => {
                        const isSelected = answers[currentQuestionIndex] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleAnswerSelect(opt.value)}
                            className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between group ${isSelected
                                ? "bg-[#0B3B24]/5 border-2 border-[#C5A059] text-[#0B3B24] shadow-sm font-semibold"
                                : "bg-white hover:bg-slate-50 border-[#E5E7EB] text-slate-700"
                              }`}
                          >
                            <div className="flex items-center space-x-3.5">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${isSelected
                                  ? "bg-[#0B3B24] text-white"
                                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                }`}>
                                {opt.value}
                              </span>
                              <span className="text-sm">{opt.text}</span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-[#C5A059] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Foot Controls */}
                <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex items-center justify-between" id="quiz_footer">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => { setCurrentQuestionIndex(prev => prev - 1); }}
                    className="px-4 py-2.5 rounded border border-[#E5E7EB] text-slate-600 hover:text-[#0B3B24] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center space-x-1 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>이전 문항</span>
                  </button>

                  {currentQuestionIndex === activeQuestionsList.length - 1 ? (
                    <button
                      id="save_diagnosis_result_btn"
                      onClick={handleSubmitDiagnosis}
                      disabled={answers[currentQuestionIndex] === 0}
                      className="px-6 py-3 rounded bg-[#0B3B24] hover:bg-[#062919] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-white font-bold text-sm shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>최종 진단결과 받기</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { setCurrentQuestionIndex(prev => prev + 1); }}
                      disabled={answers[currentQuestionIndex] === 0}
                      className="px-4.5 py-2.5 rounded bg-[#0B3B24] text-white hover:bg-[#062919] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none text-xs flex items-center space-x-1 font-semibold cursor-pointer"
                    >
                      <span>다음 문항</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}


          {/* VIEW: STEP 4 - Results Analytics Page */}
          {view === "result" && (
            <motion.div
              key="view_result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[960px] mx-auto space-y-8 w-full px-4 sm:px-0"
              id="section_result"
            >
              {aiReportLoading ? (
                /* Loading screen and reassurance prompts */
                <div className="py-20 text-center space-y-5 bg-white border border-[#E5E7EB] rounded-2xl p-12" id="ai_diagnosing_spinner">
                  <RefreshCw className="w-12 h-12 text-[#0B3B24] animate-spin mx-auto SiegfriedIndicator" />
                  <h3 className="text-[#0B3B24] text-xl font-bold">오프닝맵 AI 컨설팅 보고서 분석 중...</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                    초중등전문 영어학원 브랜드 데이터 인공지능이 원장님의 성향, 자본 가동력 및 수업 경력을 바탕으로 솔루션을 조합하는 중입니다. 잠시만 기다려주십시오.
                  </p>
                </div>
              ) : (
                diagnosisResult && (
                  <div className="space-y-6" id="report_ready_panel">

                    {/* Admin Back to Admin & Print Bar */}
                    {isAdminAuthenticated && (
                      <div className="p-4 bg-[#C5A059]/15 border-2 border-[#C5A059] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print shadow-md animate-fade-in" id="admin_top_control_bar">
                        <div className="flex items-center space-x-2.5 text-[#0B3B24]">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider font-sans text-slate-800 block">관리자 진단 결과 확인 모드</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">원장님의 모든 평가 결과와 처방전 항목에 완벽한 확인 및 편집 등 출력이 허용됩니다.</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={handleDownloadPdfOrPrint}
                            disabled={isGeneratingPdf}
                            className={`px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer h-10 border-0`}
                          >
                            <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>{isGeneratingPdf ? "PDF 생성 중..." : "결과 출력 / PDF 다운로드"}</span>
                          </button>
                          <button
                            onClick={() => { setView("admin"); }}
                            className="px-4 py-2 bg-[#0B3B24] hover:bg-[#062919] text-white text-xs font-extrabold rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer border-0 h-10"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>관리자 대시보드로 돌아가기</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Page Tab Switcher */}
                    {isAdminAuthenticated && (
                      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 w-full no-print">
                        <button
                          onClick={() => setResultActiveTab("page1")}
                          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer h-12 flex items-center justify-center ${resultActiveTab === "page1"
                              ? "bg-[#0B3B24] text-white shadow-md font-extrabold"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                            }`}
                        >
                          1페이지: 핵심 요약 (PROPORTIONAL METRICS)
                        </button>
                        <button
                          onClick={() => setResultActiveTab("page2")}
                          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer h-12 flex items-center justify-center ${resultActiveTab === "page2"
                              ? "bg-[#0B3B24] text-white shadow-md font-extrabold"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                            }`}
                        >
                          2페이지: 항목별 상세 코멘트 & 로드맵 (DETAILED SOLUTIONS)
                        </button>
                      </div>
                    )}

                    {/* TOP SUMMARY DIALOG BANNER (Shared) */}
                    <div className="p-4 bg-[#0B3B24]/5 border border-[#0B3B24]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#0B3B24] flex items-center justify-center text-white font-bold select-none shrink-0">✓</div>
                        <div>
                          <h4 className="text-[#0B3B24] font-bold text-sm sm:text-base">
                            {diagnosisResult.name} 원장님{diagnosisResult.birth ? ` (만 ${calculateKoreanAge(diagnosisResult.birth)}세)` : ""}의 프리미엄 개원 심사 진단이 완결되었습니다.
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">매칭 담당관: {diagnosisResult.counselorName} • 진단일자: {new Date(diagnosisResult.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#0B3B24] text-white px-3 py-1.5 rounded-lg border border-[#C5A059]/40 font-bold self-start sm:self-center font-mono">
                        CODE: {diagnosisResult.verificationCode}
                      </span>
                    </div>

                    {/* RENDER PAGE 1: 핵심 요약 */}
                    {resultActiveTab === "page1" && (() => {
                      const activeGrade = diagnosisResult.competencyRank || "C";
                      const gradeGradients: Record<string, string> = {
                        S: "bg-gradient-to-br from-[#FDFBF7] via-[#FFF] to-[#FAF5D9] border-amber-200/80 shadow-xs",
                        A: "bg-gradient-to-br from-[#F3FCF7] via-[#FFF] to-[#E5F7ED] border-emerald-200/80 shadow-xs",
                        B: "bg-gradient-to-br from-[#F3F7FC] via-[#FFF] to-[#E5EDF7] border-blue-200/80 shadow-xs",
                        C: "bg-gradient-to-br from-[#FCF7F3] via-[#FFF] to-[#F7EDE5] border-orange-200/70 shadow-xs",
                        D: "bg-gradient-to-br from-[#FCF3F3] via-[#FFF] to-[#F7E5E5] border-red-200/70 shadow-xs"
                      };
                      const gradientClass = gradeGradients[activeGrade] || gradeGradients.C;

                      return (
                        <div className="space-y-10" id="result_page_one_view">

                          {/* [상단 헤더] */}
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            className={`${gradientClass} border rounded-2xl p-6 sm:p-12 shadow-sm relative overflow-hidden`}
                            id="page1_header_card"
                          >
                            <div className="flex flex-col md:flex-row items-center gap-8">

                              {/* Radial circular grade badge */}
                              {(() => {
                                const grade = diagnosisResult.competencyRank || "C";
                                const colors: Record<string, { main: string, text: string, bg: string, ring: string }> = {
                                  S: { main: "#D4AF37", text: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", ring: "border-[#D4AF37]" },
                                  A: { main: "#10B981", text: "text-[#10B981]", bg: "bg-emerald-50/50", ring: "border-[#10B981]" },
                                  B: { main: "#3B82F6", text: "text-[#3B82F6]", bg: "bg-blue-50/50", ring: "border-[#3B82F6]" },
                                  C: { main: "#F97316", text: "text-[#F97316]", bg: "bg-orange-50/50", ring: "border-[#F97316]" },
                                  D: { main: "#EF4444", text: "text-[#EF4444]", bg: "bg-red-50/50", ring: "border-[#EF4444]" }
                                };
                                const cfg = colors[grade] || colors.C;
                                const label = getCompetencyLabelAndDesc(grade, diagnosisResult.franchiseType);

                                return (
                                  <>
                                    <div className="relative flex items-center justify-center shrink-0">
                                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${cfg.ring} ${cfg.bg} flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105`}>
                                        <span className={`text-3xl sm:text-4xl font-extrabold ${cfg.text} font-mono block leading-none`}>{grade}</span>
                                        <span className="text-[10px] text-slate-400 font-bold font-mono mt-1">GRADE</span>
                                      </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-left space-y-2.5">
                                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                                        <span className="text-xl sm:text-2xl font-black text-slate-800">{grade}등급 진단 리포트</span>
                                        <span className="text-sm px-3 py-1 font-mono font-bold bg-[#0B3B24] text-[#C5A059] rounded-lg">
                                          종합점수 {diagnosisResult.totalScore} / {diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환" ? "40" : "30"}점
                                        </span>
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.ring}/30`}>
                                          {label}
                                        </span>
                                      </div>
                                      <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
                                        {diagnosisResult.name} 원장님 (만 {calculateKoreanAge(diagnosisResult.birth)}세) • 가맹유형: <strong className="text-slate-800">{diagnosisResult.franchiseType}</strong> • 직인일자: {new Date(diagnosisResult.appliedAt).toLocaleDateString()} • 컨설턴트: {diagnosisResult.counselorName}
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            {/* [Visual Grade Position Spectrum] */}
                            {(() => {
                              const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                              const totalScore = diagnosisResult.totalScore || 0;
                              const grade = diagnosisResult.competencyRank || "C";

                              const segments = isBrand ? [
                                { grade: "D", min: 0, max: 12, label: "보완 필요", bg: "bg-red-400", hex: "#F87171" },
                                { grade: "C", min: 13, max: 22, label: "개선 권장", bg: "bg-orange-400", hex: "#FB923C" },
                                { grade: "B", min: 23, max: 29, label: "준수함", bg: "bg-blue-400", hex: "#60A5FA" },
                                { grade: "A", min: 30, max: 35, label: "우수함", bg: "bg-emerald-400", hex: "#34D399" },
                                { grade: "S", min: 36, max: 40, label: "탁월함", bg: "bg-[#D4AF37]", hex: "#D4AF37" }
                              ] : [
                                { grade: "D", min: 0, max: 6, label: "보완 필요", bg: "bg-red-400", hex: "#F87171" },
                                { grade: "C", min: 7, max: 12, label: "개선 권장", bg: "bg-orange-400", hex: "#FB923C" },
                                { grade: "B", min: 13, max: 19, label: "준수함", bg: "bg-blue-400", hex: "#60A5FA" },
                                { grade: "A", min: 20, max: 23, label: "우수함", bg: "bg-emerald-400", hex: "#34D399" },
                                { grade: "S", min: 24, max: 30, label: "탁월함", bg: "bg-[#D4AF37]", hex: "#D4AF37" }
                              ];

                              let activeSegmentIndex = segments.findIndex(seg => totalScore >= seg.min && totalScore <= seg.max);
                              if (activeSegmentIndex === -1) {
                                if (totalScore < segments[0].min) activeSegmentIndex = 0;
                                else activeSegmentIndex = segments.length - 1;
                              }

                              const activeSeg = segments[activeSegmentIndex];
                              const rangeSize = activeSeg.max - activeSeg.min;
                              const relativeOffset = rangeSize > 0 ? (totalScore - activeSeg.min) / rangeSize : 0.5;
                              const clampedOffset = Math.min(1, Math.max(0, relativeOffset));

                              // Each block represents 20% width. Pin position is activeSegmentIndex * 20 + offset * 20.
                              const positionPercent = (activeSegmentIndex * 20) + (clampedOffset * 20);

                              return (
                                <div className="border-t border-slate-100 mt-8 pt-8" id="grade_position_spectrum_pane">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] tracking-[0.1em] text-[#C5A059] font-sans font-bold uppercase block">DIAGNOSIS ACCURACY & GRADE LOCATION</span>
                                        <span className="bg-[#0B3B24]/5 text-[#0B3B24] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#0B3B24]/10">실시간 매핑</span>
                                      </div>
                                      <h4 className="text-[15px] font-bold text-slate-800">원장님 종합 역량 등급의 포지션</h4>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-8 md:min-w-[280px]">
                                      <div className="text-left space-y-0.5">
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">진단 총점</span>
                                        <span className="text-sm font-extrabold text-slate-800">{totalScore}점 <span className="text-slate-400 font-medium text-xs">/ {isBrand ? "40" : "30"}점</span></span>
                                      </div>
                                      <div className="w-px h-8 bg-slate-200"></div>
                                      <div className="text-left space-y-0.5">
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">종합 개원 역량 등급</span>
                                        <span className="text-sm font-extrabold text-[#0B3B24]">{grade}등급 <span className="text-slate-400 font-bold text-xs">({activeSeg.label})</span></span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="relative pt-12 pb-6 px-1">
                                    {/* Floating PIN / Indicator pointing to the exact percentage position */}
                                    <motion.div
                                      className="absolute top-0 z-20 flex flex-col items-center -translate-x-1/2"
                                      style={{ left: `${positionPercent}%` }}
                                      initial={{ scale: 0.5, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
                                    >
                                      {/* Visual Marker Label */}
                                      <div className="bg-[#0B3B24] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 shrink-0 select-none border border-[#C5A059]/40 whitespace-nowrap">
                                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
                                        <span>원장님 위치: <strong className="text-[#C5A059] font-mono">{grade}등급</strong> ({totalScore}점)</span>
                                      </div>
                                      {/* Down arrow marker */}
                                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#0B3B24] shadow-sm" />
                                    </motion.div>

                                    {/* The spectrum track */}
                                    <div className="relative w-full h-4 bg-slate-100 rounded-full flex overflow-hidden shadow-inner border border-slate-200/50">
                                      {segments.map((seg, idx) => {
                                        const isActive = idx === activeSegmentIndex;
                                        return (
                                          <div
                                            key={seg.grade}
                                            className={`w-[20%] h-full relative transition-all duration-300 ${seg.bg} ${isActive ? 'brightness-105 saturate-125' : 'opacity-70 saturate-75'} flex items-center justify-center`}
                                          >
                                            {/* Fine border dividing line */}
                                            {idx < 4 && <div className="absolute right-0 top-0 bottom-0 w-px bg-white/40" />}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Segment markers/labels below the track */}
                                    <div className="grid grid-cols-5 mt-4 sm:mt-5 text-center">
                                      {segments.map((seg, idx) => {
                                        const isActive = idx === activeSegmentIndex;
                                        return (
                                          <div key={seg.grade} className="flex flex-col items-center space-y-1 select-none">
                                            {/* Grade Character Bubble */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${isActive ? 'bg-[#0B3B24] text-white ring-2 ring-[#C5A059]/50 shadow-sm scale-110' : 'bg-slate-100 text-slate-500'} transition-all duration-300`}>
                                              {seg.grade}
                                            </div>
                                            {/* Info and range */}
                                            <span className={`text-[11px] font-bold tracking-tight block ${isActive ? 'text-[#0B3B24]' : 'text-slate-500'}`}>
                                              {seg.label}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-400 font-medium block">
                                              {seg.min}~{seg.max}점
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>

                          {/* If not admin, render basic information & secure lock notice, else the standard detailed view */}
                          {!isAdminAuthenticated ? (
                            <div className="space-y-6">
                              {/* [기본 기입 정보 (Profile Checklist)] */}
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-sm text-left"
                              >
                                <div className="border-b border-slate-100 pb-4 mb-5">
                                  <span className="text-[10px] tracking-[0.1em] text-[#C5A059] font-sans font-bold uppercase block">APPLICANT PROFILE CHECKLIST</span>
                                  <h3 className="text-[16px] font-bold text-slate-800 mt-0.5">예비 원장님 기본 기입 정보 목록</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">성명 / 나이</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.name} 원장님 ({diagnosisResult.birth ? `만 ${calculateKoreanAge(diagnosisResult.birth)}세` : ""})</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">연락처</span>
                                    <span className="font-bold text-slate-800 font-mono">{diagnosisResult.phone}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">희망 개원지역</span>
                                    <span className="font-bold text-[#0B3B24]">{diagnosisResult.region || "기재안함"}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">개원 희망 시기</span>
                                    <span className="font-bold text-[#0B3B24]">{diagnosisResult.openingMonth === "없음" ? "개원시기 미정" : `${diagnosisResult.openingMonth} 예정`}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">가맹 유형</span>
                                    <span className="font-bold text-[#C5A059]">{diagnosisResult.franchiseType}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">운영 형태</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.operationType}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">전공 여부</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.englishMajor}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">영어 회화 실력</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.englishSpeaking || "미기입"}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">성향 유형</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.personality}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">유입 경로</span>
                                    <span className="font-bold text-slate-800">{diagnosisResult.inflowRoute || "일반 유입"}</span>
                                  </div>
                                  <div className="md:col-span-2 flex flex-col pt-2 text-left">
                                    <span className="text-slate-400 font-medium mb-1">메인 관심사 및 고민</span>
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed font-sans min-h-[48px]">
                                      {diagnosisResult.mainConcern || "작성된 내용이 없습니다."}
                                    </div>
                                  </div>



                                </div>
                              </motion.div>

                              {/* [보안 안내 및 잠금 배너] */}
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-inner text-left"
                                id="client_only_restricted_info_banner"
                              >
                                <div className="flex items-center space-x-3 text-[#0B3B24]">
                                  <div className="w-10 h-10 rounded-full bg-[#0B3B24]/10 flex items-center justify-center border border-[#0B3B24]/20 shrink-0">
                                    <Lock className="w-5 h-5 text-[#C5A059]" />
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-[#0B3B24] text-sm sm:text-base">상세 개원 처방정보 보안 잠금 안내</h4>
                                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">HEADQUARTERS SECURE DATABASE RECORDED</p>
                                  </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium font-sans">
                                  원장님의 <b>8대 부문별 세부 심사 역량</b>, <b>개원 타당 특수 KPI 지표</b>, <b>주요 입지 및 상권 분석 소견</b>은 모두 본사 전용 관리자 데이터베이스 시스템에 안심 암호화되어 안전하게 기록 보관되었습니다.
                                </p>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium font-sans">
                                  성공적인 영어 전문학원 창업 준비를 위해 본사 개원 매칭 심사처의 전임 담당관(컨설턴트: <b>{diagnosisResult.counselorName}</b>)이 기입해주신 연락처로 신속히 개별 통보 유선 상담을 드릴 예정입니다.
                                </p>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium font-sans">
                                  유선 컨설팅 브리핑 과정을 통하여 원장님만을 위한 맞춤형 8대 세부 분석 및 핵심 추천입지, 단계별 가이드라인 로드맵의 세부 내용을 모두 상세하게 상담 받으실 수 있습니다.
                                </p>

                                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center">
                                  <button
                                    type="button"
                                    onClick={() => setView("home")}
                                    className="w-full sm:w-auto h-12 px-6 rounded-lg bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 border-0 font-sans"
                                  >
                                    <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
                                    <span>진단 홈으로 가기</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleRequestConsultantInquiry}
                                    disabled={submittingInquiry || diagnosisResult.consultantInquiryRequested}
                                    className={`w-full sm:w-auto h-12 px-6 rounded-lg font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 border-0 font-sans ${diagnosisResult.consultantInquiryRequested
                                        ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/35 select-none cursor-default"
                                        : "bg-[#C5A059] hover:bg-[#B38F48] text-white shadow-md hover:shadow-lg active:scale-95"
                                      }`}
                                  >
                                    {submittingInquiry ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                        <span>문의 접수 중...</span>
                                      </>
                                    ) : diagnosisResult.consultantInquiryRequested ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                                        <span>✓ 컨설턴트 문의 접수됨</span>
                                      </>
                                    ) : (
                                      <>
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        <span>컨설턴트 진단결과 문의</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleDownloadPdfOrPrint}
                                    disabled={isGeneratingPdf}
                                    className="w-full sm:w-auto h-12 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 border-0 font-sans"
                                  >
                                    {isGeneratingPdf ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                        <span>PDF 다운로드 중...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>기본정보/등급표 PDF 다운로드</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            </div>
                          ) : (
                            <>
                              {/* [핵심 지표 KPI 카드 또는 개선 및 강화 사항] */}
                              {(() => {
                                const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                                if (isBrand) {
                                  const answersList = diagnosisResult.answers || [3, 3, 3, 3, 3, 3, 3, 3];

                                  const getBrandQTopic = (idx: number): string => {
                                    switch (idx) {
                                      case 0: return "현재 운영 형태";
                                      case 1: return "현재 운영 공간 규모";
                                      case 2: return "현재 재원생 규모";
                                      case 3: return "영어학원 원장 경력";
                                      case 4: return "영어 수업 경력";
                                      case 5: return "브랜드 전환 가용 자본";
                                      case 6: return "소득분류";
                                      case 7: return "초등인원";
                                      default: return "상세 역량 평가";
                                    }
                                  };

                                  // Create an array of question indices [0..7] and sort descending by their score.
                                  const sortedIndices = [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => {
                                    const scoreA = answersList[a] !== undefined ? answersList[a] : 3;
                                    const scoreB = answersList[b] !== undefined ? answersList[b] : 3;
                                    return scoreB - scoreA;
                                  });

                                  const strengthIndices = [sortedIndices[0], sortedIndices[1]];
                                  const improvementIndices = [sortedIndices[7], sortedIndices[6]]; // the two lowest

                                  const itemsToDisplay = [
                                    // Strength 1
                                    (() => {
                                      const qIdx = strengthIndices[0] !== undefined ? strengthIndices[0] : 0;
                                      const score = answersList[qIdx] !== undefined ? answersList[qIdx] : 3;
                                      const topicLabel = getBrandQTopic(qIdx);
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, qIdx, score);
                                      const selectedOptionText = brandQuestions[qIdx]?.options.find(o => o.value === score)?.text || `${score}점 수준`;
                                      return {
                                        isStrength: score >= 4,
                                        topic: topicLabel,
                                        title: `${topicLabel} ${score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요"}`,
                                        desc: feedback.comment || "우수한 현재 운영 요건을 지니고 있어 브랜드 전환 시 강력한 시너지 창출이 예상됩니다.",
                                        detail: `${selectedOptionText} (${score}점)`,
                                        icon: score >= 4 ? "check" : "alert"
                                      };
                                    })(),
                                    // Strength 2
                                    (() => {
                                      const qIdx = strengthIndices[1] !== undefined ? strengthIndices[1] : 1;
                                      const score = answersList[qIdx] !== undefined ? answersList[qIdx] : 3;
                                      const topicLabel = getBrandQTopic(qIdx);
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, qIdx, score);
                                      const selectedOptionText = brandQuestions[qIdx]?.options.find(o => o.value === score)?.text || `${score}점 수준`;
                                      return {
                                        isStrength: score >= 4,
                                        topic: topicLabel,
                                        title: `${topicLabel} ${score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요"}`,
                                        desc: feedback.comment || "풍부한 기초 자원과 높은 등급 요건으로 지역 내 프리미엄 브랜드 전개에 매끄럽게 안착 가능합니다.",
                                        detail: `${selectedOptionText} (${score}점)`,
                                        icon: score >= 4 ? "check" : "alert"
                                      };
                                    })(),
                                    // Weakness 1
                                    (() => {
                                      const qIdx = improvementIndices[0] !== undefined ? improvementIndices[0] : 7;
                                      const score = answersList[qIdx] !== undefined ? answersList[qIdx] : 3;
                                      const topicLabel = getBrandQTopic(qIdx);
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, qIdx, score);
                                      const selectedOptionText = brandQuestions[qIdx]?.options.find(o => o.value === score)?.text || `${score}점 수준`;
                                      return {
                                        isStrength: score >= 4,
                                        topic: topicLabel,
                                        title: `${topicLabel} ${score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요"}`,
                                        desc: feedback.comment || "해당 분야의 리스크 요인을 억제하기 위해 본사 전담 솔루션 컨설팅 배정과 액션 아이템 설계가 시급합니다.",
                                        detail: `${selectedOptionText} (${score}점)`,
                                        icon: score >= 4 ? "check" : "alert"
                                      };
                                    })(),
                                    // Weakness 2
                                    (() => {
                                      const qIdx = improvementIndices[1] !== undefined ? improvementIndices[1] : 6;
                                      const score = answersList[qIdx] !== undefined ? answersList[qIdx] : 3;
                                      const topicLabel = getBrandQTopic(qIdx);
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, qIdx, score);
                                      const selectedOptionText = brandQuestions[qIdx]?.options.find(o => o.value === score)?.text || `${score}점 수준`;
                                      return {
                                        isStrength: score >= 4,
                                        topic: topicLabel,
                                        title: `${topicLabel} ${score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요"}`,
                                        desc: feedback.comment || "본사 가동 시스템 보수 교육 전수 및 가이드라인 정독을 실행하여 운영 안전 마진을 선확보하십시오.",
                                        detail: `${selectedOptionText} (${score}점)`,
                                        icon: score >= 4 ? "check" : "alert"
                                      };
                                    })()
                                  ];

                                  return (
                                    <div className="space-y-10">
                                      <div className="space-y-6">
                                        <div className="mb-4">
                                          <span className="text-[11px] tracking-[0.1em] text-[#C5A059] font-sans uppercase block font-bold">BRAND SYSTEM UPGRADE</span>
                                          <h3 className="text-[16px] font-bold text-slate-800 mt-0.5">브랜드 전환 핵심 개선 및 강화 사항</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="brand_switch_improvements">
                                          {itemsToDisplay.map((item, itemIdx) => {
                                            const isStr = item.isStrength;
                                            return (
                                              <div
                                                key={itemIdx}
                                                className={`bg-white border ${isStr ? 'border-emerald-100 hover:border-emerald-300' : 'border-rose-100 hover:border-rose-300'} rounded-xl p-5 shadow-sm transition-all duration-300 flex items-start gap-4 hover:-translate-y-0.5`}
                                              >
                                                {isStr ? (
                                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                                  </div>
                                                ) : (
                                                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs">
                                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                                  </div>
                                                )}
                                                <div className="space-y-1 flex-1 text-left">
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider block px-1.5 py-0.5 rounded ${isStr ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                                      {isStr ? "핵심 강점" : "우선 보완 과제"}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-slate-400">
                                                      {item.detail}
                                                    </span>
                                                  </div>
                                                  <h4 className="font-extrabold text-slate-800 text-sm leading-normal">{item.title}</h4>
                                                  <p className="text-xs text-slate-600 font-medium leading-relaxed font-sans pt-1">
                                                    {item.desc}
                                                  </p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      <div className="border-t border-slate-100 pt-8">
                                        <div className="mb-4">
                                          <span className="text-[11px] tracking-[0.1em] text-slate-400 font-sans uppercase block">COMPETENCY KEYMETRICS</span>
                                          <h3 className="text-[16px] font-medium text-slate-800 mt-0.5">다차원 개원 타당 지표 (핵심 KPI)</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="kpi_grid_holder_brand">
                                          {[
                                            { label: "추천 개원 형태", value: diagnosisResultAnalysis?.capitalRec || "내실 위주 주거단지 거점형 영어 학원", desc: "분석에 따른 최적 개설 가맹 타입" },
                                            { label: "추천 개원 규모", value: diagnosisResultAnalysis?.capitalRecSize || "중소형 규모 (18~25평형권)", desc: "지역 평형별 가성비 등 공간 규격" },
                                            { label: "추천 상권 구역", value: diagnosisResultAnalysis?.recRegions[0] || "안정형 배후 항아리 상권", desc: "도보 이동 및 배후 세대 밀집도" },
                                            { label: "개원 추천 시기", value: diagnosisResultAnalysis?.recOpeningMonth || (diagnosisResult.openingMonth === "없음" ? "개원시기 미정" : `${diagnosisResult.openingMonth} 예정`), desc: "성향과 준비도 기준 본사 추천 개원 시기" },
                                            { label: "개원 인력 구성", value: diagnosisResultAnalysis?.recStaffSetup[0] || "원장 직강형 구성", desc: "원장 경력을 연동한 구성 배점" },
                                            {
                                              label: "현재 가용 예산 범위", value: (() => {
                                                const val = diagnosisResultAnalysis?.capitalLevel || 3;
                                                const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                                                if (isBrand) {
                                                  if (val === 1) return "1,000만원 미만";
                                                  if (val === 2) return "1,000만원 ~ 3,000만원";
                                                  if (val === 3) return "3,000만원 ~ 5,000만원";
                                                  if (val === 4) return "5,000만원 ~ 7,000만원";
                                                  return "7,000만원 이상";
                                                } else {
                                                  if (val === 1) return "5,000만원 미만";
                                                  if (val === 2) return "5,000만원 ~ 1억원";
                                                  if (val === 3) return "1억원 ~ 1억5천만원";
                                                  if (val === 4) return "1억5천만원 ~ 2억원";
                                                  return "2억원 이상";
                                                }
                                              })(), desc: "자가 진단 기입 기준 가용 예산 범위"
                                            }
                                          ].map((kpi, i) => (
                                            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:border-[#C5A059] transition-colors">
                                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{kpi.label}</span>
                                              <span className="font-extrabold text-slate-800 text-sm sm:text-[15px] block mt-1.5 leading-normal">{kpi.value}</span>
                                              <span className="text-[11px] text-slate-400 block mt-2 font-medium">{kpi.desc}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  const answers = diagnosisResult.answers || [3, 3, 3, 3, 3, 3];
                                  const expVal = answers[0] || 1; // Q1: "원장 경력이 있나요?"
                                  const budgetVal = answers[2] || 1; // Q3: "현재 창업 가능 자본은 어느 정도인가요?"

                                  // Calculate the core KPI parameters based on experience and budget
                                  let spaceSize = "30평 미만";
                                  let recRegion = "신도시 외곽 / 경쟁 약한 학군";
                                  let staffSetup = "교수부장 또는 상담실장";
                                  let prepPeriod = "4~6개월";

                                  if (expVal <= 2) {
                                    // 초등영어학원 1년 미만
                                    if (budgetVal <= 2) {
                                      spaceSize = "30평 미만";
                                      recRegion = "신도시 외곽 / 경쟁 약한 학군";
                                      staffSetup = "교수부장 또는 상담실장";
                                      prepPeriod = "4~6개월";
                                    } else if (budgetVal === 3) {
                                      spaceSize = "30평 미만";
                                      recRegion = "중소도시 중심상권";
                                      staffSetup = "교수부장 또는 상담실장";
                                      prepPeriod = "4~6개월";
                                    } else if (budgetVal === 4) {
                                      spaceSize = "30~40평";
                                      recRegion = "신규 택지지구";
                                      staffSetup = "교수부장 또는 상담실장";
                                      prepPeriod = "4~6개월";
                                    } else { // budgetVal >= 5
                                      spaceSize = "30~40평";
                                      recRegion = "준학군지 (초등 밀집지역)";
                                      staffSetup = "교수부장 또는 상담실장";
                                      prepPeriod = "4~6개월";
                                    }
                                  } else if (expVal === 3) {
                                    // 초등영어학원 1~3년
                                    if (budgetVal <= 2) {
                                      spaceSize = "30평 미만";
                                      recRegion = "구도심 학군지";
                                      staffSetup = "교수부장급 강사";
                                      prepPeriod = "3~4개월";
                                    } else if (budgetVal === 3) {
                                      spaceSize = "40~50평";
                                      recRegion = "초등학교 인접 상권";
                                      staffSetup = "교수부장급 강사";
                                      prepPeriod = "3~4개월";
                                    } else if (budgetVal === 4) {
                                      spaceSize = "40~50평";
                                      recRegion = "브랜드 약한 학원 밀집지역";
                                      staffSetup = "교수부장급 강사";
                                      prepPeriod = "3~4개월";
                                    } else {
                                      spaceSize = "40~50평";
                                      recRegion = "준프리미엄 학군";
                                      staffSetup = "교수부장급 강사";
                                      prepPeriod = "3~4개월";
                                    }
                                  } else if (expVal === 4) {
                                    // 초등영어학원 3년 이상
                                    if (budgetVal <= 2) {
                                      spaceSize = "30평 미만";
                                      recRegion = "틈새 학군지";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else if (budgetVal === 3) {
                                      spaceSize = "40~50평";
                                      recRegion = "중형 학군 중심상권";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else if (budgetVal === 4) {
                                      spaceSize = "60평 이상";
                                      recRegion = "프리미엄 학군지";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else {
                                      spaceSize = "60평 이상";
                                      recRegion = "대형 브랜드 경쟁지역";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    }
                                  } else { // expVal >= 5
                                    // 초등학원 운영
                                    if (budgetVal <= 2) {
                                      spaceSize = "30평 미만";
                                      recRegion = "저경쟁 지역";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else if (budgetVal === 3) {
                                      spaceSize = "40~50평";
                                      recRegion = "초등 밀집 주거지역";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else if (budgetVal === 4) {
                                      spaceSize = "60평 이상";
                                      recRegion = "학원 상권 형성지역";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    } else {
                                      spaceSize = "60평 이상";
                                      recRegion = "핵심 학군지";
                                      staffSetup = "경험있는 강사";
                                      prepPeriod = "2~3개월";
                                    }
                                  }

                                  return (
                                    <div>
                                      <div className="mb-4">
                                        <span className="text-[11px] tracking-[0.1em] text-slate-400 font-sans uppercase block">COMPETENCY KEYMETRICS</span>
                                        <h3 className="text-[16px] font-medium text-slate-800 mt-0.5">다차원 개원 타당 지표 (핵심 KPI)</h3>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="kpi_grid_holder_new">
                                        {[
                                          { label: "추천 공간규모", value: spaceSize, desc: "원장 경력 및 자금 규격 맞춤 면적" },
                                          { label: "추천지역", value: recRegion, desc: "경쟁 정합성에 맞춘 입지 추천" },
                                          { label: "인력구성", value: staffSetup, desc: "경력 단계별 최적 행정/교수 팀빌딩" },
                                          { label: "개원준비 기간", value: prepPeriod, desc: "경향성에 비춘 최적 개설 소요 예상 기간" }
                                        ].map((kpi, i) => (
                                          <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm hover:border-[#C5A059] transition-colors">
                                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{kpi.label}</span>
                                            <span className="font-extrabold text-[#0B3B24] text-sm sm:text-[15px] block mt-1.5 leading-normal">{kpi.value}</span>
                                            <span className="text-[11px] text-slate-400 block mt-2 font-medium">{kpi.desc}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                              })()}

                              {/* [항목별 진단 그래프 (가로 바 차트)] */}
                              <div>
                                <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
                                  <div>
                                    <span className="text-[11px] tracking-[0.1em] text-slate-400 font-sans uppercase block">METRICS HORIZONTAL BARS</span>
                                    <h3 className="text-[16px] font-medium text-slate-800 mt-0.5">부문별 자가 역량 스코어 진단 그래프 (8대 영역)</h3>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                                    <span className="text-slate-400 font-mono">* 5점 만족 척도</span>
                                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                      <span className="flex items-center gap-1.5 text-emerald-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        초록=양호
                                      </span>
                                      <span className="flex items-center gap-1.5 text-amber-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                        주황=보통
                                      </span>
                                      <span className="flex items-center gap-1.5 text-rose-500">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        빨강=위험
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 sm:p-5 shadow-sm space-y-1.5" id="bars_diagnosis_chart">
                                  {(() => {
                                    const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                                    const categoriesList = isBrand
                                      ? [
                                        { qIdx: 0, label: "운영 형태" },
                                        { qIdx: 1, label: "원내 공간" },
                                        { qIdx: 2, label: "기존 원생" },
                                        { qIdx: 3, label: "원장 경력" },
                                        { qIdx: 4, label: "영어 교수" },
                                        { qIdx: 5, label: "투자 가용" },
                                        { qIdx: 6, label: "소득분류" },
                                        { qIdx: 7, label: "초등인원" }
                                      ]
                                      : [
                                        { qIdx: 0, label: "원장 경영" },
                                        { qIdx: 1, label: "영어 교수" },
                                        { qIdx: 2, label: "자본 준비" },
                                        { qIdx: 3, label: "상담 역량" },
                                        { qIdx: 4, label: "학사 행정" },
                                        { qIdx: 5, label: "조직 관리" }
                                      ];

                                    return categoriesList.map((cat, idx) => {
                                      const score = diagnosisResult.answers[cat.qIdx] || 3;
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, cat.qIdx, score);
                                      const bulletColor = score >= 4 ? "bg-emerald-500" : score === 3 ? "bg-orange-500" : "bg-red-500";
                                      const textColor = score >= 4 ? "text-emerald-600" : score === 3 ? "text-orange-600" : "text-red-500";

                                      const isExpanded = !!expandedCategories[cat.label];
                                      const toggleExpand = () => {
                                        setExpandedCategories(prev => ({
                                          ...prev,
                                          [cat.label]: !prev[cat.label]
                                        }));
                                      };

                                      return (
                                        <div key={idx} className="border-b border-slate-100 last:border-0 py-1.5">
                                          <div
                                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-150 select-none"
                                            onClick={toggleExpand}
                                          >

                                            {/* Left visual label - Stacked cleanly for bullet/title vertical consistency */}
                                            <div className="w-full md:w-44 flex flex-col justify-center shrink-0">
                                              <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${bulletColor}`} />
                                                <span className="text-xs sm:text-sm font-extrabold text-slate-700 leading-none">{cat.label}</span>
                                              </div>
                                              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5 ml-4 truncate max-w-[150px]" title={feedback.scoreText}>
                                                {feedback.scoreText}
                                              </span>
                                            </div>

                                            {/* Middle Progress slots */}
                                            <div className="flex-1 flex items-center space-x-2 max-w-sm shrink-0">
                                              <div className="flex-1 flex items-center space-x-1">
                                                {[1, 2, 3, 4, 5].map((step) => (
                                                  <div
                                                    key={step}
                                                    className={`h-3.5 flex-1 rounded transition-colors duration-150 ${step <= score
                                                        ? bulletColor
                                                        : "bg-slate-100/80"
                                                      }`}
                                                  />
                                                ))}
                                              </div>

                                              {/* Dynamic Score Badge with Indicator */}
                                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black border shrink-0 ${score >= 4
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : score === 3
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${score >= 4 ? "bg-emerald-500" : score === 3 ? "bg-amber-500" : "bg-rose-500"}`} />
                                                {score} / 5
                                              </span>
                                            </div>

                                            {/* Right comments with truncated or click-to-expand */}
                                            <div className="flex-1 flex items-center justify-between gap-3 min-w-0 md:pl-4">
                                              <p className="text-slate-500 text-xs leading-relaxed truncate max-w-[320px] md:max-w-md">
                                                {feedback.comment}
                                              </p>

                                              <div className="flex items-center space-x-1 shrink-0 text-[10px] font-black text-[#C5A059] bg-[#C5A059]/10 rounded-md px-2 py-1 hover:bg-[#C5A059]/20 transition-all">
                                                <span>{isExpanded ? "접기" : "자세히 보기"}</span>
                                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`} />
                                              </div>
                                            </div>
                                          </div>

                                          {/* Detailed Accordion/Expendable feedback panel */}
                                          {isExpanded && (
                                            <div
                                              className={`mt-1.5 ml-4 md:ml-6 p-4 rounded-xl border text-xs leading-relaxed transition-all duration-300 ${score >= 4
                                                  ? "bg-emerald-50/50 border-emerald-100 text-slate-700"
                                                  : score === 3
                                                    ? "bg-amber-50/50 border-amber-100 text-slate-700"
                                                    : "bg-rose-50/50 border-rose-100 text-slate-700"
                                                }`}
                                            >
                                              <div className="font-extrabold text-[#0B3B24] mb-1.5 flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                                <span>오프닝맵 전문가 밀착 정밀 처방 의견</span>
                                                <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-black border ${score >= 4
                                                    ? "bg-emerald-100/50 border-emerald-300 text-emerald-800"
                                                    : score === 3
                                                      ? "bg-amber-100/50 border-amber-300 text-amber-800"
                                                      : "bg-rose-100/50 border-rose-300 text-rose-800"
                                                  }`}>
                                                  {score >= 4 ? "양호" : score === 3 ? "보통" : "위험/보완 필요"}
                                                </span>
                                              </div>
                                              <p className="font-medium text-slate-600 block pl-4.5">{feedback.comment}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              {/* [오프닝맵 전문가 진단평가 요약 영역] */}
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6" id="expert_diagnosis_summary_report">
                                <div className="border-b border-slate-200 pb-4 text-left">
                                  <span className="text-[11px] tracking-[0.1em] text-[#C5A059] font-sans font-bold uppercase block">EXPERT DIAGNOSIS & EVALUATION SUMMARY</span>
                                  <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1">✦ 전문가 진단평가 요약 (Executive Prescription Summary)</h3>
                                  <p className="text-xs text-slate-500 mt-1 font-medium">부문별 자가 역량 스코어 진단 결과에 따른 1:1 오프닝맵 전문가 밀착 정밀 처방 핵심 요약 보고서</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {(() => {
                                    const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                                    const categoriesList = isBrand
                                      ? [
                                        { qIdx: 0, label: "운영 형태" },
                                        { qIdx: 1, label: "원내 공간" },
                                        { qIdx: 2, label: "기존 원생" },
                                        { qIdx: 3, label: "원장 경력" },
                                        { qIdx: 4, label: "영어 교수" },
                                        { qIdx: 5, label: "투자 가용" },
                                        { qIdx: 6, label: "소득분류" },
                                        { qIdx: 7, label: "초등인원" }
                                      ]
                                      : [
                                        { qIdx: 0, label: "원장 경영" },
                                        { qIdx: 1, label: "영어 교수" },
                                        { qIdx: 2, label: "자본 준비" },
                                        { qIdx: 3, label: "상담 역량" },
                                        { qIdx: 4, label: "학사 행정" },
                                        { qIdx: 5, label: "조직 관리" }
                                      ];

                                    return categoriesList.map((cat, idx) => {
                                      const score = diagnosisResult.answers[cat.qIdx] || 3;
                                      const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, cat.qIdx, score);
                                      const customLabelText = getCustomItemTitle(cat.label, score, score >= 4);

                                      const scoreColor = score >= 4 ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
                                        score === 3 ? "text-amber-700 bg-amber-50 border-amber-100" :
                                          "text-rose-700 bg-rose-50 border-rose-100";

                                      return (
                                        <div key={idx} className="bg-white border border-slate-100 rounded-lg p-5 shadow-xs space-y-2.5 flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors text-left">
                                          <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                                            <div className="flex items-center space-x-2">
                                              <span className={`w-2 h-2 rounded-full ${score >= 4 ? "bg-emerald-500" : score === 3 ? "bg-amber-500" : "bg-rose-500"}`} />
                                              <span className="text-xs font-extrabold text-slate-800">{cat.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${scoreColor}`}>
                                              {feedback.scoreText} ({score}점)
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                            {feedback.comment}
                                          </p>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              {/* [오프닝맵 정밀 상권 분석 지도] */}
                              <div className="border-t border-slate-200/60 pt-8 mt-8 text-left space-y-4">
                                <div>
                                  <span className="text-[11px] tracking-[0.1em] text-[#C5A059] font-sans font-bold uppercase block">Opening Map Interactive Analyzer</span>
                                  <h3 className="text-[16px] font-bold text-slate-800 mt-0.5">3. 고려대학교 협약 정량 상권 매칭 지도 분석 (Opening Map)</h3>
                                </div>
                                <OpeningMapResult
                                  regionName={diagnosisResult.region || "서울 서초구"}
                                  applicantName={diagnosisResult.name}
                                  recommendedTypes={diagnosisResultAnalysis?.recFranchiseStyles}
                                />
                              </div>

                              {/* [창업 예산 정밀 분석 시뮬레이터] */}
                              <div className="border-t border-slate-200/60 pt-8 mt-8 text-left space-y-4">
                                <div>
                                  <span className="text-[11px] tracking-[0.1em] text-[#C5A059] font-sans font-bold uppercase block">Detailed Capital Allocation Analysis</span>
                                  <h3 className="text-[16px] font-bold text-slate-800 mt-0.5">4. 창업 예산 시뮬레이션 및 자본 효율 진단 (Budget Simulator)</h3>
                                </div>
                                <BudgetSimulator
                                  initialDesiredArea={diagnosisResult.desiredArea}
                                  initialRegionalTier={diagnosisResult.regionalTier}
                                  initialMyCapital={diagnosisResult.myCapital}
                                  readOnly={true}
                                />
                              </div>

                              {/* [하단 안내] */}

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100 no-print" id="page1_footer_notice">
                                <div className="flex flex-col text-left gap-1">
                                  <p className="text-xs text-slate-400 font-bold font-sans">
                                    * 본 결과지는 오프닝맵 가맹영업팀 본사에 즉시 안전하게 공유되었습니다.
                                  </p>
                                  {isAdminAuthenticated && (
                                    <p className="text-[11px] text-[#C5A059] font-bold">
                                      🛡️ 관리자 계정으로 접속 중입니다. 대시보드로 복귀하거나 2페이지로 이동하실 수 있습니다.
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {isAdminAuthenticated && (
                                    <button
                                      onClick={() => { setView("admin"); }}
                                      className="px-4 py-2 bg-[#0B3B24] hover:bg-[#062919] text-white text-xs font-bold rounded-lg flex items-center space-x-1 shadow-sm transition-all cursor-pointer border-0"
                                    >
                                      <ArrowLeft className="w-3 h-3 text-[#C5A059]" />
                                      <span>관리자 대시보드</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setResultActiveTab("page2")}
                                    className="text-xs text-[#0B3B24] font-extrabold hover:underline flex items-center space-x-1 shrink-0 cursor-pointer"
                                  >
                                    <span>2페이지: 항목별 상세 전문가 피드백 검토하기</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                            </>
                          )}

                        </div>
                      );
                    })()}

                    {/* RENDER PAGE 2: 항목별 상세 코멘트 & 로드맵 */}
                    {resultActiveTab === "page2" && isAdminAuthenticated && (
                      <div className="space-y-10" id="result_page_two_view">

                        {/* [상단 요약바] */}
                        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs sm:text-[13px] text-slate-600 font-medium font-sans">
                          <div>
                            <strong className="text-slate-800 font-bold">{diagnosisResult.name}</strong> 원장님 • 가맹: <strong className="text-slate-800">{diagnosisResult.franchiseType}</strong>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-bold text-[#0B3B24] bg-[#0B3B24]/5 px-2 py-0.5 rounded border border-[#0B3B24]/10">
                              종합등급: {diagnosisResult.competencyRank}등급 ({diagnosisResult.totalScore}점)
                            </span>
                            <span>진단일: {new Date(diagnosisResult.appliedAt).toLocaleDateString()}</span>
                            <span>담당관: {diagnosisResult.counselorName}</span>
                          </div>
                        </div>

                        {/* [항목별 상세 카드 - 6개 전체 표시] */}
                        <div>
                          <div className="mb-4">
                            <span className="text-[11px] tracking-[0.1em] text-slate-400 font-sans uppercase block">DETAILED ANALYSIS CARDS</span>
                            <h3 className="text-[16px] font-medium text-slate-800 mt-0.5">자가 진단 수치 연동 부문별 상세 처방전</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="detailed_cards_holder">
                            {(() => {
                              const isBrand = diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환";
                              const categoriesList = isBrand
                                ? [
                                  { qIdx: 0, label: "운영 형태", icon: Award },
                                  { qIdx: 1, label: "원내 공간", icon: BookOpen },
                                  { qIdx: 2, label: "기존 원생", icon: TrendingUp },
                                  { qIdx: 3, label: "원장 경력", icon: MapPin },
                                  { qIdx: 4, label: "영어 교수", icon: Users },
                                  { qIdx: 5, label: "투자 가용", icon: Grid },
                                  { qIdx: 6, label: "소득분류", icon: Users },
                                  { qIdx: 7, label: "초등인원", icon: FileText }
                                ]
                                : [
                                  { qIdx: 0, label: "원장 경영", icon: Award },
                                  { qIdx: 1, label: "영어 교수", icon: BookOpen },
                                  { qIdx: 2, label: "자본 준비", icon: TrendingUp },
                                  { qIdx: 3, label: "상담 역량", icon: MapPin },
                                  { qIdx: 4, label: "학사 행정", icon: Users },
                                  { qIdx: 5, label: "조직 관리", icon: Grid }
                                ];

                              return categoriesList.map((cat, idx) => {
                                const score = diagnosisResult.answers[cat.qIdx] || 3;
                                const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, cat.qIdx, score);
                                const IconComponent = cat.icon;

                                const badgeColor = score >= 4 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                  score === 3 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                                    "bg-rose-50 text-rose-600 border border-rose-250";
                                const badgeText = score >= 4 ? "우수" : score === 3 ? "준수" : "검토필요";

                                const actionTags = getCategoryActionTags(cat.label, score);

                                return (
                                  <div key={idx} className="bg-white border border-[#E5E7EB] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-sm space-y-4 hover:border-[#C5A059] transition-all" id={`detailed_item_card_${idx}`}>

                                    {/* Header info */}
                                    <div>
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center space-x-2.5">
                                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0B3B24]">
                                            <IconComponent className="w-4 h-4 shrink-0" />
                                          </div>
                                          <h4 className="text-slate-800 font-extrabold text-sm sm:text-base">{cat.label} 상세 분석</h4>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${badgeColor}`}>
                                          {badgeText} ({score}점)
                                        </span>
                                      </div>

                                      {/* Commentary text: line-height: 1.7, 3~5 lines */}
                                      <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-medium mt-4 font-sans" style={{ lineHeight: '1.7', minHeight: '80px' }}>
                                        {feedback.comment || "세부 답변에 입각한 본사 경영기획 처방 솔루션입니다. 전임 컨설턴트와의 심층 면접 소싱 과정에서 상세 대안을 열람하실 수 있습니다."}
                                      </p>
                                    </div>

                                    {/* Dynamic Recommended Action pills */}
                                    <div className="pt-3 border-t border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold block mb-2 uppercase tracking-wide">💡 본사 추천 액션 플랜</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {actionTags.map((tag, i) => (
                                          <span key={i} className="bg-[#0B3B24]/5 text-[#0B3B24] border border-[#0B3B24]/10 px-2 py-0.5 rounded text-[10px] font-bold font-sans">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* 개원 준비 로드맵 (4단계) 삭제함 */}

                        {/* [하단 CTA 버튼 2개 + 13px gray 텍스트] */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-[#E5E7EB] no-print" id="page2_cta_row">
                          <div className="flex flex-col gap-1.5 text-left w-full md:max-w-xl">
                            <p className="text-xs text-slate-400 font-bold font-sans">
                              분석된 등급 보고서는 오프닝맵 가맹영업팀 본사 우선순위로 즉각 전송 완료되었습니다.
                            </p>
                            <p className="text-[10px] text-[#C5A059] font-semibold bg-[#C5A059]/5 px-2.5 py-1 rounded border border-[#C5A059]/20 inline-flex items-center gap-1">
                              💡 <b>알림:</b> 브라우저 인쇄가 제한된 프레임 개발 환경에서는 자동으로 <b>고해상도 PDF 리포트 파일</b>이 즉시 다운로드됩니다.
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0 justify-end">
                            <button
                              id="print_report_btn"
                              onClick={handleDownloadPdfOrPrint}
                              disabled={isGeneratingPdf}
                              className={`w-full sm:w-auto h-12 text-white px-6 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 font-bold shadow cursor-pointer border-0 ${isGeneratingPdf
                                  ? "bg-slate-400 cursor-not-allowed text-slate-200"
                                  : "bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-95"
                                }`}
                            >
                              {isGeneratingPdf ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                                  <span>고해상도 PDF 다운로드 중...</span>
                                </>
                              ) : (
                                <>
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>인쇄 및 PDF 다운로드</span>
                                </>
                              )}
                            </button>

                            {isAdminAuthenticated ? (
                              <button
                                onClick={() => { setView("admin"); }}
                                className="w-full sm:w-auto h-12 bg-[#0B3B24] hover:bg-[#062919] text-white px-6 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 font-bold cursor-pointer border-0 shadow-sm"
                              >
                                <ArrowLeft className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>관리자 대시보드 복귀</span>
                              </button>
                            ) : (
                              <button
                                id="reset_diagnosis_btn"
                                onClick={() => { setView("home"); }}
                                className="w-full sm:w-auto h-12 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 font-bold cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-[#C5A059]" />
                                <span>새 진단 테스트</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                )
              )}
            </motion.div>
          )}


          {/* VIEW: ADMIN GATEWAY & DASHBOARD */}
          {view === "admin" && (
            <motion.div
              key="view_admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
              id="section_admin"
            >
              {!isAdminAuthenticated ? (
                /* 1. Admin Password protection card */
                <div className="max-w-md mx-auto p-8 rounded-xl bg-white border border-[#E5E7EB] shadow-lg relative border-t-8 border-t-[#C5A059]">

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-lg bg-[#C5A059]/10 flex items-center justify-center mx-auto mb-3 border border-[#C5A059]/20">
                      <Lock className="w-6 h-6 text-[#C5A059]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#0B3B24]">관리자 보안 인증</h2>
                    <p className="text-slate-500 text-xs mt-1">오프닝맵 창업진단 데이터 시스템 접속을 위한 암호를 입력해주세요.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#0B3B24] text-xs font-bold mb-2 uppercase" htmlFor="admin_id_input">
                        관리자 아이디
                      </label>
                      <input
                        id="admin_id_input"
                        type="text"
                        value={adminId}
                        onChange={(e) => setAdminId(e.target.value)}
                        placeholder="아이디 입력"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#0B3B24] text-xs font-bold mb-2 uppercase" htmlFor="admin_password_input">
                        관리자 암호
                      </label>
                      <input
                        id="admin_password_input"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAdminVerify();
                        }}
                        placeholder="보안 비밀번호 여섯자리"
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                      />
                    </div>

                    {adminAuthError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-[11px] leading-normal flex items-center space-x-1.5 font-sans">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>{adminAuthError}</span>
                      </div>
                    )}

                    <button
                      id="admin_verify_submit_btn"
                      onClick={handleAdminVerify}
                      className="w-full py-3 rounded bg-[#0B3B24] hover:bg-[#062919] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    >
                      시스템인증 & 보안 연결
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. Authenticated Admin view layout */
                <div className="space-y-8" id="admin_dashboard_panels">

                  {/* Top summary row stats layout */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" id="admin_stats_cards_row">
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0B3B24]/5 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[#0B3B24]" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">총 신청자 건수</span>
                        <span className="font-mono text-2xl font-black text-[#0B3B24]">{applicants.length} <span className="text-xs font-bold">건</span></span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">S/A등급 비율</span>
                        <span className="font-mono text-2xl font-black text-emerald-600">
                          {applicants.length > 0
                            ? Math.round((applicants.filter(a => a.competencyRank === "S" || a.competencyRank === "A").length / applicants.length) * 100)
                            : 0} <span className="text-xs font-bold">%</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">S급 영업리드</span>
                        <span className="font-mono text-2xl font-black text-emerald-600">
                          {applicants.filter(a => a.leadRank === "S").length} <span className="text-xs font-bold">명</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm flex items-center space-x-4 border-l-4 border-l-amber-500">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className={`w-5 h-5 ${applicants.filter(a => isStagnated(a).stagnated).length > 0 ? "text-amber-600 animate-pulse" : "text-amber-500"}`} />
                      </div>
                      <div>
                        <span className="text-amber-700 block text-[10px] font-bold uppercase tracking-wider font-sans">파이프라인 정체</span>
                        <span className="font-mono text-2xl font-black text-amber-600">
                          {applicants.filter(a => isStagnated(a).stagnated).length} <span className="text-xs font-bold">건</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-lg bg-[#C5A059]/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#C5A059]" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">등록 컨설턴트</span>
                        <span className="font-mono text-2xl font-black text-[#C5A059]">{Object.keys(consultantCodes).length} <span className="text-xs font-bold">인</span></span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm flex items-center space-x-4 border-l-4 border-l-[#C5A059]">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px] font-bold uppercase tracking-wider font-sans">개원진단 문의접수</span>
                        <span className="font-mono text-2xl font-black text-rose-600">
                          {applicants.filter(a => a.consultantInquiryRequested).length} <span className="text-xs font-bold">건</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category-based Administrative Workspace Selector */}
                  <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-md border-t-4 border-t-[#0B3B24]" id="admin_workspace_tabs_container">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#C5A059] font-black uppercase tracking-widest block font-mono">WORK STATION CATEGORY</span>
                      <h3 className="text-[#0B3B24] font-black text-sm">본사 공식 관리업무를 카테고리별로 선택하여 간편하게 확인하세요</h3>
                      <p className="text-[11px] text-slate-500">필요한 정보군을 카테고리 탭으로 전환하여 실시간 조회 및 원클릭 제어가 가능합니다.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setAdminCategoryTab("dashboard")}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm border cursor-pointer ${adminCategoryTab === "dashboard"
                            ? "bg-[#0B3B24] text-white border-transparent scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>📊 통계 대시보드</span>
                      </button>

                      <button
                        onClick={() => setAdminCategoryTab("applicants")}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm border cursor-pointer ${adminCategoryTab === "applicants"
                            ? "bg-[#0B3B24] text-white border-transparent scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <Users className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>👥 신청자 명단 ({filteredApplicants.length}건)</span>
                      </button>

                      <button
                        onClick={() => setAdminCategoryTab("promotion")}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm border cursor-pointer ${adminCategoryTab === "promotion"
                            ? "bg-[#0B3B24] text-white border-transparent scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>📁 홍보용 콘텐츠</span>
                      </button>

                      <button
                        onClick={() => setAdminCategoryTab("consultants")}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm border cursor-pointer ${adminCategoryTab === "consultants"
                            ? "bg-[#0B3B24] text-white border-transparent scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>💬 컨설턴트 고유코드</span>
                      </button>

                      <button
                        onClick={() => setAdminCategoryTab("systems")}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all shadow-sm border cursor-pointer ${adminCategoryTab === "systems"
                            ? "bg-[#0B3B24] text-white border-transparent scale-105"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>⚙️ 엑셀 및 시스템</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Dashboard Panel */}
                  {adminCategoryTab === "dashboard" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Lead Pipeline Status Donut Chart Panel */}
                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md p-6 space-y-6" id="admin_pipeline_donut_chart_panel">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-[#E5E7EB]">
                          <div>
                            <h3 className="text-[#0B3B24] font-extrabold text-base flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5 text-[#C5A059]" />
                              <span>가맹 영업 리드 파이프라인 진행 현황</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">예비 원장님들이 각 가맹 상담 단계에 배분되어 있는 비율을 도넛 차트로 실시간 시각화합니다.</p>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 select-none">
                            전체 파이프라인 관리 대상: <strong className="text-[#0B3B24] font-mono">{applicants.length}건</strong>
                          </div>
                        </div>

                        {/* Donut Chart Visualization container */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                          {/* Left: Interactive Donut Chart using Recharts */}
                          <div className="lg:col-span-5 flex flex-col items-center justify-center relative p-2" id="donut_chart_container">
                            {applicants.length > 0 ? (
                              <div className="w-full h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={(() => {
                                        const counts: Record<string, number> = {
                                          "신규접수": 0,
                                          "1차상담": 0,
                                          "상권분석": 0,
                                          "설명회참석": 0,
                                          "계약진행": 0,
                                          "계약완료": 0,
                                          "보류": 0
                                        };
                                        applicants.forEach(app => {
                                          const status = app.counselorStatus || "신규접수";
                                          if (counts[status] !== undefined) {
                                            counts[status]++;
                                          } else {
                                            counts[status] = (counts[status] || 0) + 1;
                                          }
                                        });
                                        return Object.entries(counts)
                                          .map(([name, value]) => ({ name, value }))
                                          .filter(item => item.value > 0);
                                      })()}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={65}
                                      outerRadius={90}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      {(() => {
                                        const colors: Record<string, string> = {
                                          "신규접수": "#3B82F6",    // Blue
                                          "1차상담": "#F59E0B",     // Amber
                                          "상권분석": "#F97316",    // Orange
                                          "설명회참석": "#6366F1",  // Indigo
                                          "계약진행": "#14B8A6",    // Teal
                                          "계약완료": "#10B981",    // Emerald
                                          "보류": "#F43F5E"        // Rose
                                        };
                                        const counts: Record<string, number> = {
                                          "신규접수": 0,
                                          "1차상담": 0,
                                          "상권분석": 0,
                                          "설명회참석": 0,
                                          "계약진행": 0,
                                          "계약완료": 0,
                                          "보류": 0
                                        };
                                        applicants.forEach(app => {
                                          const status = app.counselorStatus || "신규접수";
                                          if (counts[status] !== undefined) {
                                            counts[status]++;
                                          } else {
                                            counts[status] = (counts[status] || 0) + 1;
                                          }
                                        });
                                        return Object.entries(counts)
                                          .filter(([_, value]) => value > 0)
                                          .map(([name]) => (
                                            <Cell key={`cell-${name}`} fill={colors[name] || "#94A3B8"} />
                                          ));
                                      })()}
                                    </Pie>
                                    <Tooltip
                                      formatter={(value: any, name: any) => [
                                        `${value}명 (${Math.round((Number(value) / applicants.length) * 100)}%)`,
                                        name
                                      ]}
                                      contentStyle={{
                                        backgroundColor: "rgba(27, 54, 93, 0.95)",
                                        border: "1px solid #C5A059",
                                        borderRadius: "8px",
                                        color: "#fff",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        fontFamily: "sans-serif"
                                      }}
                                      itemStyle={{ color: "#fff" }}
                                      labelStyle={{ display: "none" }}
                                    />
                                  </RechartsPieChart>
                                </ResponsiveContainer>

                                {/* Centered Total Counter label */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
                                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block font-sans">총 가맹 리드</span>
                                  <span className="text-3xl font-black text-[#0B3B24] font-mono leading-none">{applicants.length}</span>
                                  <span className="text-xs text-slate-500 font-bold ml-0.5">건</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-16 text-slate-400 text-xs w-full">
                                가맹 신청인 정보가 없어 파이프라인 현황을 표시할 수 없습니다.
                              </div>
                            )}
                          </div>

                          {/* Right: Enriched Table & Legend statistics with custom color indicators */}
                          <div className="lg:col-span-7 space-y-4" id="donut_legend_statistics">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(() => {
                                const colors: Record<string, string> = {
                                  "신규접수": "#3B82F6",    // Blue
                                  "1차상담": "#F59E0B",     // Amber
                                  "상권분석": "#F97316",    // Orange
                                  "설명회참석": "#6366F1",  // Indigo
                                  "계약진행": "#14B8A6",    // Teal
                                  "계약완료": "#10B981",    // Emerald
                                  "보류": "#F43F5E"        // Rose
                                };
                                const statusNames = ["신규접수", "1차상담", "상권분석", "설명회참석", "계약진행", "계약완료", "보류"];

                                return statusNames.map((status) => {
                                  const count = applicants.filter(app => app.counselorStatus === status).length;
                                  const pct = applicants.length > 0 ? Math.round((count / applicants.length) * 100) : 0;
                                  const barColor = colors[status] || "#94A3B8";

                                  return (
                                    <div
                                      key={status}
                                      className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-all shadow-sm"
                                    >
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        {/* Color Indicator Bullet */}
                                        <span
                                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                          style={{ backgroundColor: barColor }}
                                        />
                                        <div className="truncate">
                                          <span className="text-xs text-slate-700 font-extrabold block leading-snug">{status}</span>
                                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block font-semibold">
                                            Pipeline Level
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span className="text-sm font-black text-[#0B3B24] font-mono">{count}명</span>
                                        <span className="text-[10px] text-slate-400 font-bold ml-1.5 font-mono bg-white border border-slate-200/60 px-1 rounded">
                                          {pct}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>

                            {/* Pipeline Insight Summary Text banner */}
                            <div className="bg-[#0B3B24]/5 border border-[#0B3B24]/10 rounded-lg p-3 text-[11px] leading-relaxed text-slate-600 font-medium">
                              💡 <strong className="text-[#0B3B24]">마일스톤 분석:</strong> 전체 가맹 리드 중 본사 계약 체결 완료율은{" "}
                              <strong className="text-[#C5A059]">
                                {applicants.length > 0
                                  ? Math.round((applicants.filter(a => a.counselorStatus === "계약완료").length / applicants.length) * 100)
                                  : 0}%
                              </strong>{" "}
                              이며, 최종 단계로 전환을 유도하기 위한 집중 관리가 필요합니다. 해당 시각화 지표는 가맹 상담사의 정보 갱신에 따라 실시간 반영됩니다.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lead Score and Quality Trend Analysis Panel (Line Chart) */}
                      <LeadQualityTrendChart applicants={applicants} />
                    </motion.div>
                  )}

                  {/* Tab 4: Consultant Codes Panel */}
                  {adminCategoryTab === "consultants" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Consultant Codes Management Panel Card */}
                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md p-6 space-y-6 animate-fade-in" id="admin_consultants_panel_card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-[#E5E7EB]">
                          <div>
                            <h3 className="text-[#0B3B24] font-extrabold text-base flex items-center space-x-2">
                              <Users className="w-5 h-5 text-[#C5A059]" />
                              <span>담당 컨설턴트 고유 코드 설정</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">예비 원장님이 자가진단 시작 페이지 및 상담사 배정에 실시간 연동되는 4자리 고유 코드 조합 리스트입니다.</p>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 select-none">
                            총 {Object.keys(consultantCodes).length}명 구성됨
                          </span>
                        </div>

                        {consultantUpdateMessage && (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2" id="consultant_success_banner">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold">{consultantUpdateMessage}</span>
                          </div>
                        )}

                        {consultantUpdateError && (
                          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center space-x-2" id="consultant_error_banner">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span className="font-semibold">{consultantUpdateError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                          {/* Left Column: Register New Consultant */}
                          <form onSubmit={handleAddConsultant} className="lg:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200/80 space-y-4" id="consultant_add_form_element">
                            <h4 className="text-slate-800 font-extrabold text-xs uppercase tracking-wider border-b pb-2 border-slate-250 flex items-center space-x-1.5">
                              <Plus className="w-4 h-4 text-[#C5A059]" />
                              <span>컨설턴트 신규 가입 등록</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="consultant_add_fields">
                              <div>
                                <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase font-sans" htmlFor="new_code_input_val">
                                  고유코드 (숫자 4자리)
                                </label>
                                <input
                                  id="new_code_input_val"
                                  type="text"
                                  maxLength={4}
                                  placeholder="예: 7777"
                                  value={newConsultantCode}
                                  onChange={(e) => setNewConsultantCode(e.target.value.replace(/\D/g, ""))}
                                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase font-sans" htmlFor="new_name_input_val">
                                  컨설턴트 성명
                                </label>
                                <input
                                  id="new_name_input_val"
                                  type="text"
                                  placeholder="컨설턴트명과 직급 입력"
                                  value={newConsultantName}
                                  onChange={(e) => setNewConsultantName(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 rounded bg-[#0B3B24] hover:bg-[#062919] text-white font-bold text-xs transition-all flex items-center justify-center space-x-1 border-0 cursor-pointer shadow-sm mt-2 font-sans"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
                              <span>컨설턴트 신규 추가 & 실시간 동기화</span>
                            </button>
                          </form>

                          {/* Right Column: Registered Codes List Grid */}
                          <div className="lg:col-span-7 flex flex-col" id="consultants_list_area_intern">
                            <h4 className="text-[#0B3B24] font-bold text-xs uppercase tracking-wider border-b pb-2 border-slate-200 mb-3 flex items-center space-x-1.5">
                              <Users className="w-4 h-4 text-[#C5A059]" />
                              <span>현재 등록 및 승인된 컨설턴트 고유 코드 리스트</span>
                            </h4>

                            <div className="overflow-y-auto max-h-[220px] rounded-lg border border-slate-100 divide-y divide-slate-100 bg-white shadow-inner" id="consultants_roster_scroll_intern">
                              {Object.entries(consultantCodes).length > 0 ? (
                                Object.entries(consultantCodes).map(([code, nameVal]) => {
                                  const name = nameVal as string;
                                  const isEditing = editingCode === code;
                                  return (
                                    <div key={code} className="flex px-4 py-2.5 items-center justify-between hover:bg-slate-50 transition-colors min-h-[52px]">
                                      {isEditing ? (
                                        <div className="flex items-center space-x-2 w-full animate-fade-in">
                                          <input
                                            type="text"
                                            maxLength={4}
                                            value={editCodeValue}
                                            onChange={(e) => setEditCodeValue(e.target.value.replace(/\D/g, ""))}
                                            className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#C5A059]"
                                            placeholder="코드"
                                          />
                                          <input
                                            type="text"
                                            value={editNameValue}
                                            onChange={(e) => setEditNameValue(e.target.value)}
                                            className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-sans font-bold text-slate-800 focus:outline-none focus:border-[#C5A059]"
                                            placeholder="이름"
                                          />
                                          <div className="flex items-center space-x-1 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleSaveEditConsultant(code)}
                                              className="bg-[#0B3B24] hover:bg-[#062919] text-white px-2.5 py-1.5 rounded text-[11px] font-bold transition-all border-0 shadow-sm cursor-pointer"
                                            >
                                              저장
                                            </button>
                                            <button
                                              type="button"
                                              onClick={handleCancelEditConsultant}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded border border-slate-200 text-[11px] font-bold transition-all cursor-pointer"
                                            >
                                              취소
                                            </button>
                                          </div>
                                        </div>
                                      ) : deletingConsultantCode === code ? (
                                        <div className="flex items-center space-x-2 bg-rose-50 border border-rose-250 rounded-lg px-3 py-1.5 w-full animate-fade-in text-xs font-sans font-extrabold text-rose-800">
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 animate-pulse" />
                                          <span className="flex-1 truncate select-none">'{name.replace(/\s*\(비활성\)$/, "")}' ({code}) 삭제할까요?</span>
                                          <div className="flex items-center space-x-1 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleConfirmDeleteConsultant(code)}
                                              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[10px] font-bold border-0 cursor-pointer transition-all shadow-sm"
                                            >
                                              삭제
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDeletingConsultantCode(null)}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-650 px-2.5 py-1 rounded border border-slate-200 text-[10px] font-bold transition-all cursor-pointer"
                                            >
                                              취소
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
                                            <span className="text-[#C5A059] font-mono font-extrabold bg-[#C5A059]/10 px-2.5 py-0.5 rounded border border-[#C5A059]/30 text-xs shadow-sm select-all flex-shrink-0">
                                              {code}
                                            </span>
                                            <span className={`font-extrabold text-xs truncate ${name.endsWith(" (비활성)") ? "text-slate-400 line-through" : "text-[#0B3B24]"}`}>
                                              {name.replace(/\s*\(비활성\)$/, "")}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold flex-shrink-0 ${name.endsWith(" (비활성)") ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-emerald-50 text-emerald-700 border border-emerald-250"}`}>
                                              {name.endsWith(" (비활성)") ? "비활성" : "활성"}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleConsultantActive(code)}
                                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${name.endsWith(" (비활성)")
                                                  ? "bg-[#0B3B24] hover:bg-[#062919] text-white border-transparent"
                                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                                }`}
                                              title={name.endsWith(" (비활성)") ? "활성화로 변경" : "비활성화로 변경"}
                                            >
                                              {name.endsWith(" (비활성)") ? "활성화" : "비활성화"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleStartEditConsultant(code, name)}
                                              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                                              title="코드/이름 수정"
                                            >
                                              <Edit2 className="w-3 h-3 text-slate-400" />
                                              <span>수정</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteConsultant(code)}
                                              className="bg-rose-650 hover:bg-rose-700 text-white border-transparent px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer shadow-sm flex items-center space-x-1"
                                              title="코드 삭제"
                                            >
                                              <Trash2 className="w-3 h-3 text-rose-100" />
                                              <span>삭제</span>
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                  등록된 컨설턴트가 한 명도 없습니다. 새로운 컨설턴트를 등록해 주세요.
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-semibold font-sans font-sans">
                              * 본 고유 매칭 설정은 데이터베이스에 전임 기록되며, 예비 원장님이 진단 세션 기입 시 자동 실시간 인출 분류 매칭에 반영됩니다.
                            </p>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 5: Systems & Excel Panel */}
                  {adminCategoryTab === "systems" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Excel Data Integration Panel */}
                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md p-6 space-y-6" id="admin_excel_integration_panel">
                        <div>
                          <h3 className="text-lg font-bold text-[#0B3B24] flex items-center space-x-2">
                            <FileSpreadsheet className="w-5 h-5 text-[#C5A059]" />
                            <span>데이터 입출력 관리 (Excel 연동)</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">창업 진단평가 결과와 진단 문항 정보를 엑셀로 백업하거나 실시간으로 일괄 업로드 등록할 수 있습니다.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* 진단 평가 관리 */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">신청자 데이터베이스</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                                공지된 모든 신청자(진단평가) 정보를 다운로드하거나 새 데이터를 일괄 업로드하여 등록합니다. 일괄 등록 양식은 다운로드한 엑셀 파일과 같은 규격을 사용합니다.
                              </p>
                            </div>

                            <div>
                              <div className="grid grid-cols-3 gap-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={handleDownloadXlsx}
                                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-1 rounded text-xs border border-slate-300 transition-all flex items-center justify-center space-x-1"
                                  title="엑셀 양식 다운로드"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>다운로드</span>
                                </button>

                                <label className="bg-[#0B3B24] hover:bg-[#062919] text-white font-bold py-2 px-1 rounded text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer text-center">
                                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>일괄등록</span>
                                  <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleUploadApplicantsXlsx}
                                    className="hidden"
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={handleClearApplicants}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-1 rounded text-xs border border-rose-200 transition-all flex items-center justify-center space-x-1"
                                  title="기존 신청자 전체 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>전체삭제</span>
                                </button>
                              </div>

                              {excelStatus.applicants && (
                                <div className={`mt-3 p-2.5 rounded-lg text-xs flex flex-col space-y-0.5 border font-sans ${excelStatus.applicants.success
                                    ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                  }`}>
                                  <div className="flex items-center space-x-1.5 font-extrabold text-[11px]">
                                    {excelStatus.applicants.success ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span>{excelStatus.applicants.success ? "엑셀 일괄등록 완료" : "업로드 실패"}</span>
                                  </div>
                                  <p className="text-[10.5px] font-medium leading-relaxed mt-0.5" style={{ paddingLeft: "20px" }}>
                                    {excelStatus.applicants.success
                                      ? `정상적으로 총 ${excelStatus.applicants.count}건의 신청자 데이터가 반영 및 등록완료 되었습니다. (${excelStatus.applicants.time})`
                                      : `오류 원인: ${excelStatus.applicants.error} (${excelStatus.applicants.time})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 진단 문항 관리 */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                                <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">진단 질문 문항 관리</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                                진단 시 화면에 노출되는 신규 창업 및 브랜드 전환용 질문지를 백업하고 수정하여 반영합니다. 수정 또는 신규 추가한 엑셀 파일을 업로드하여 일괄 문항을 실시간 등록할 수 있습니다.
                              </p>
                            </div>

                            <div>
                              <div className="grid grid-cols-3 gap-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={handleDownloadQuestionsXlsx}
                                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-1 rounded text-xs border border-slate-300 transition-all flex items-center justify-center space-x-1"
                                  title="엑셀 양식 다운로드"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>다운로드</span>
                                </button>

                                <label className="bg-[#0B3B24]/90 hover:bg-[#0B3B24] text-white font-bold py-2 px-1 rounded text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer text-center">
                                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>일괄등록</span>
                                  <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleUploadQuestionsXlsx}
                                    className="hidden"
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={handleClearQuestions}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold py-2 px-1 rounded text-xs border border-amber-200 transition-all flex items-center justify-center space-x-1"
                                  title="질문지 기본 세트 복원"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>기본복원</span>
                                </button>
                              </div>

                              {excelStatus.questions && (
                                <div className={`mt-3 p-2.5 rounded-lg text-xs flex flex-col space-y-0.5 border font-sans ${excelStatus.questions.success
                                    ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                  }`}>
                                  <div className="flex items-center space-x-1.5 font-extrabold text-[11px]">
                                    {excelStatus.questions.success ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span>{excelStatus.questions.success ? "엑셀 질문문항 교체완료" : "업로드 실패"}</span>
                                  </div>
                                  <p className="text-[10.5px] font-medium leading-relaxed mt-0.5" style={{ paddingLeft: "20px" }}>
                                    {excelStatus.questions.success
                                      ? `신규 창업 ${excelStatus.questions.newFranchiseCount}개, 브랜드 전환 ${excelStatus.questions.brandSwitchCount}개 질문 전체 셋이 즉시 반영되었습니다. (${excelStatus.questions.time})`
                                      : `오류 원인: ${excelStatus.questions.error} (${excelStatus.questions.time})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 선택지 점수별 처방 코멘트 일괄 관리 */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between" id="admin_comments_excel_card">
                            <div>
                              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059]"></div>
                                <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider">처방 코멘트 일괄 관리</h4>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                                진단 결과지의 질문 및 답변별 전문가 보완 처방 코멘트 일괄 세트를 엑셀 다운로드하거나, 엑셀 파일로 수정하여 업로드 시 시스템 메시지를 실시간으로 일괄 등록 업데이트합니다.
                              </p>
                            </div>

                            <div>
                              <div className="grid grid-cols-3 gap-1.5 pt-2">
                                <button
                                  type="button"
                                  onClick={handleDownloadCommentsXlsx}
                                  className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 px-1 rounded text-xs border border-slate-300 transition-all flex items-center justify-center space-x-1"
                                  title="엑셀 양식 다운로드"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>다운로드</span>
                                </button>

                                <label className="bg-[#0B3B24] hover:bg-[#062919] text-white font-bold py-2 px-1 rounded text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer text-center">
                                  <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
                                  <span>일괄등록</span>
                                  <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleUploadCommentsXlsx}
                                    className="hidden"
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={handleClearComments}
                                  className="bg-[#C5A059]/10 hover:bg-[#C5A059]/20 text-[#C5A059] font-bold py-2 px-1 rounded text-xs border border-[#C5A059]/30 transition-all flex items-center justify-center space-x-1"
                                  title="해설 코멘트 기본값 복원"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>기본복원</span>
                                </button>
                              </div>

                              {excelStatus.comments && (
                                <div className={`mt-3 p-2.5 rounded-lg text-xs flex flex-col space-y-0.5 border font-sans ${excelStatus.comments.success
                                    ? "bg-emerald-50 border-emerald-250 text-emerald-800"
                                    : "bg-red-50 border-red-200 text-red-800"
                                  }`}>
                                  <div className="flex items-center space-x-1.5 font-extrabold text-[11px]">
                                    {excelStatus.comments.success ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    ) : (
                                      <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                                    )}
                                    <span>{excelStatus.comments.success ? "처방 코멘트 등록 완료" : "업로드 실패"}</span>
                                  </div>
                                  <p className="text-[10.5px] font-medium leading-relaxed mt-0.5" style={{ paddingLeft: "20px" }}>
                                    {excelStatus.comments.success
                                      ? `총 ${excelStatus.comments.count}개의 점수별 전문가 추가 코멘트가 영구교체완료 및 실시간 바인딩 되었습니다. (${excelStatus.comments.time})`
                                      : `오류 원인: ${excelStatus.comments.error} (${excelStatus.comments.time})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 3: Brand Content (Promotion) Panel */}
                  {adminCategoryTab === "promotion" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Brand Content Manager Panel */}
                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md p-6 space-y-6" id="admin_brand_content_panel">
                        {/* Title and Mode Selection Tab Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-[#0B3B24] flex items-center space-x-2">
                              <BookOpen className="w-5 h-5 text-[#C5A059]" />
                              <span>본사 공식 홍보 콘텐츠 관리 (브로슈어 및 홍보 영상)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              '브랜드 알아보기' 탭에 노출되는 PDF 가맹 브로슈어 책자와 유튜브 홍보 동영상을 관리자 권한으로 직접 업로드하고 실시간으로 관리할 수 있습니다.
                            </p>
                          </div>

                          {/* Toggle Button for Bulk Mode */}
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsBulkMode(false)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center space-x-1 ${!isBulkMode
                                  ? "bg-white text-[#0B3B24] shadow-sm font-black"
                                  : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                              <span>개별 등록</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsBulkMode(true);
                                setBulkBrochures([]);
                                setBulkVideos([]);
                                setBulkInputText("");
                              }}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 flex items-center space-x-1 ${isBulkMode
                                  ? "bg-[#0B3B24] text-white shadow-sm font-black"
                                  : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                              <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                              </span>
                              <span>대량 일괄 등록</span>
                            </button>
                          </div>
                        </div>

                        {!isBulkMode ? (
                          /* -------------------------------------------
                             INDIVIDUAL MODE (EXISTING UI)
                             ------------------------------------------- */
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                            {/* Left: Brochure management */}
                            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                              <div className="border-b pb-2 flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider flex items-center space-x-1">
                                  <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                                  <span>가맹 브로슈어 파일 등록</span>
                                </h4>
                                <span className="text-[10px] bg-[#0B3B24]/10 text-[#0B3B24] px-1.5 py-0.5 rounded font-black font-mono">
                                  COUNT: {adminBrochures.length}
                                </span>
                              </div>

                              {/* Brochure Add Form */}
                              <form onSubmit={handleAddBrochure} className="space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">브로슈어 제목</label>
                                  <input
                                    type="text"
                                    value={brochureTitle}
                                    onChange={(e) => setBrochureTitle(e.target.value)}
                                    placeholder="예: KY Academy 공식 가맹브로슈어 (2026 개정판)"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">상세 설명</label>
                                  <textarea
                                    value={brochureDesc}
                                    onChange={(e) => setBrochureDesc(e.target.value)}
                                    placeholder="원장님들 화면에 표기될 브로슈어 요약 설명 문구"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] h-12 font-medium"
                                  />
                                </div>

                                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                  <input
                                    type="checkbox"
                                    id="allow-download"
                                    checked={brochureAllowDownload}
                                    onChange={(e) => setBrochureAllowDownload(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-[#C5A059] cursor-pointer"
                                  />
                                  <label htmlFor="allow-download" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                                    사용자 화면(브랜드 알아보기)에서 이 브로슈어의 다운로드 버튼 노출 허용
                                  </label>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">가맹 브로슈어 첨부 (로컬 PDF/이미지 파일 다중 선택 가능)</label>
                                    <div
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDraggingBrochure(true);
                                      }}
                                      onDragLeave={() => setIsDraggingBrochure(false)}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDraggingBrochure(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                          const files = Array.from(e.dataTransfer.files) as File[];
                                          files.sort((a, b) => a.name.localeCompare(b.name));
                                          handleBrochureFileSelection(files);
                                        }
                                      }}
                                      onClick={() => {
                                        if (brochureFiles.length === 0) {
                                          brochureInputRef.current?.click();
                                        }
                                      }}
                                      className={`border-2 border-dashed rounded-xl p-3 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[110px] ${brochureFiles.length > 0 ? "" : "cursor-pointer"
                                        } ${isDraggingBrochure
                                          ? "border-[#C5A059] bg-[#0B3B24]/5 scale-[1.02]"
                                          : brochureFiles.length > 0
                                            ? "border-emerald-500 bg-emerald-50/30"
                                            : "border-slate-300 hover:border-[#0B3B24] bg-slate-50/50 hover:bg-slate-50"
                                        }`}
                                    >
                                      <input
                                        ref={brochureInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        multiple
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files.length > 0) {
                                            const files = Array.from(e.target.files) as File[];
                                            files.sort((a, b) => a.name.localeCompare(b.name));
                                            handleBrochureFileSelection(files);
                                            if (brochureInputRef.current) brochureInputRef.current.value = "";
                                          }
                                        }}
                                        className="hidden"
                                      />

                                      {brochureFiles.length > 0 ? (
                                        <div className="flex flex-col items-center space-y-2 w-full max-h-[200px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                          <p className="text-[10px] text-slate-500 font-bold self-start mt-1">파일 순서를 마우스로 드래그하여 변경할 수 있습니다.</p>
                                          <div className="w-full space-y-1">
                                            {brochureFiles.map((file, idx) => (
                                              <div
                                                key={`${file.name}-${idx}`}
                                                draggable
                                                onDragStart={(e) => {
                                                  setDraggedFileIndex(idx);
                                                  e.dataTransfer.effectAllowed = 'move';
                                                }}
                                                onDragOver={(e) => {
                                                  e.preventDefault();
                                                  e.dataTransfer.dropEffect = 'move';
                                                  setDragOverFileIndex(idx);
                                                }}
                                                onDragLeave={() => setDragOverFileIndex(null)}
                                                onDrop={(e) => {
                                                  e.preventDefault();
                                                  if (draggedFileIndex === null) return;
                                                  const newFiles = [...brochureFiles];
                                                  const draggedFile = newFiles[draggedFileIndex];
                                                  newFiles.splice(draggedFileIndex, 1);
                                                  newFiles.splice(idx, 0, draggedFile);
                                                  setBrochureFiles(newFiles);
                                                  setDraggedFileIndex(null);
                                                  setDragOverFileIndex(null);
                                                }}
                                                className={`flex items-center justify-between bg-white px-2 py-1.5 border rounded cursor-grab active:cursor-grabbing text-[10px] transition-colors ${dragOverFileIndex === idx ? 'border-[#C5A059] bg-[#C5A059]/10' : 'border-slate-200 hover:border-slate-300'}`}
                                              >
                                                <span className="font-semibold text-slate-700 truncate mr-2 flex-1 text-left">{idx + 1}. {file.name}</span>
                                                <span className="text-slate-400 font-mono text-[9px] shrink-0">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                                              </div>
                                            ))}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setBrochureFiles([]);
                                              if (brochureInputRef.current) brochureInputRef.current.value = "";
                                              addToast("첨부 파일이 모두 취소되었습니다.", "info");
                                            }}
                                            className="px-2 py-0.5 text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-all cursor-pointer"
                                          >
                                            파일 전체 취소
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center space-y-1.5 pointer-events-none">
                                          <div className={`p-1.5 rounded-full transition-colors ${isDraggingBrochure ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-slate-200/60 text-slate-500"}`}>
                                            <Upload className="w-3.5 h-3.5" />
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-black text-slate-800 leading-tight">
                                              {isDraggingBrochure ? "마우스에서 손을 놓으세요!" : "클릭하거나 파일 드래그"}
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                              PDF, 이미지 지원 (최대 200MB)
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Real-time File Upload & Status Feedback */}
                                {brochureUploadFeedback.status !== "idle" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    className={`p-2.5 rounded-lg flex items-center space-x-2 text-[11px] font-extrabold border ${brochureUploadFeedback.status === "uploading"
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : brochureUploadFeedback.status === "success"
                                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                          : "bg-rose-50 border-rose-200 text-rose-800"
                                      }`}
                                  >
                                    {brochureUploadFeedback.status === "uploading" && (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                                    )}
                                    {brochureUploadFeedback.status === "success" && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-bounce shrink-0" />
                                    )}
                                    {brochureUploadFeedback.status === "error" && (
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    )}
                                    <span>{brochureUploadFeedback.message}</span>
                                  </motion.div>
                                )}

                                <button
                                  type="submit"
                                  disabled={brochureUploading}
                                  className="w-full py-2.5 bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-xs rounded transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                  {brochureUploading ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300 shrink-0" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                  )}
                                  <span>{brochureUploading ? "서버 파일 업로드 및 가맹 브로슈어 등록 중..." : "브로슈어 신규 등록 및 업로드"}</span>
                                </button>
                              </form>

                              {/* Current Brochures List */}
                              <div className="space-y-2 pt-2 border-t border-slate-200 max-h-48 overflow-y-auto">
                                <h5 className="text-[11px] font-bold text-slate-500 mb-1">현재 노출 중인 브로슈어</h5>
                                {adminBrochures.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">등록된 맞춤 브로슈어가 없습니다. (기본 책자가 표시됩니다)</p>
                                ) : (
                                  adminBrochures.map((b) => (
                                    <div key={b.id} className="p-2.5 bg-white border rounded-lg flex flex-col justify-center text-xs hover:border-[#C5A059]/40 transition-colors">
                                      {editingBrochureId === b.id ? (
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            value={editBrochureData.title}
                                            onChange={(e) => setEditBrochureData({ ...editBrochureData, title: e.target.value })}
                                            className="w-full border rounded px-2 py-1 text-xs"
                                            placeholder="제목"
                                          />
                                          <input
                                            type="text"
                                            value={editBrochureData.description}
                                            onChange={(e) => setEditBrochureData({ ...editBrochureData, description: e.target.value })}
                                            className="w-full border rounded px-2 py-1 text-xs"
                                            placeholder="설명"
                                          />
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              checked={editBrochureData.allowDownload}
                                              onChange={(e) => setEditBrochureData({ ...editBrochureData, allowDownload: e.target.checked })}
                                              className="w-3 h-3 cursor-pointer"
                                            />
                                            <span className="text-[10px]">다운로드 허용</span>
                                          </div>
                                          <div className="flex justify-end space-x-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => setEditingBrochureId(null)}
                                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                                            >
                                              취소
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveBrochureEdit(b.id)}
                                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center space-x-1"
                                            >
                                              <Save className="w-3 h-3" />
                                              <span>저장</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center space-x-2 overflow-hidden pr-2">
                                            {b.thumbnailUrl && (
                                              <img src={b.thumbnailUrl} alt="thumb" className="w-8 h-10 object-cover rounded shadow-sm shrink-0 border border-slate-200" />
                                            )}
                                            <div className="truncate">
                                              <span className="font-extrabold text-slate-700 block truncate">{b.title}</span>
                                              <span className="text-[9px] text-slate-400 font-mono truncate block">{b.filename || b.url}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-1.5 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const targetUrl = b.url || (b.urls && b.urls.length > 0 ? b.urls[0] : null);
                                                if (!targetUrl) return;

                                                if (targetUrl.startsWith("data:")) {
                                                  const win = window.open();
                                                  if (win) {
                                                    win.document.write(`
                                                      <html>
                                                        <head><title>미리보기 - ${b.title}</title></head>
                                                        <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#000;">
                                                          <img src="${targetUrl}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                                        </body>
                                                      </html>
                                                    `);
                                                    win.document.close();
                                                  }
                                                } else {
                                                  window.open(targetUrl, "_blank");
                                                }
                                              }}
                                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center space-x-1"
                                            >
                                              <Eye className="w-3 h-3 text-emerald-600" />
                                              <span className="hidden sm:inline">미리보기</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingBrochureId(b.id);
                                                setEditBrochureData({ title: b.title, description: b.description || "", allowDownload: b.allowDownload !== false });
                                              }}
                                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center space-x-1"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                              <span className="hidden sm:inline">수정</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteBrochure(b.id)}
                                              className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold rounded cursor-pointer transition-colors"
                                            >
                                              삭제
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Right: Video management */}
                            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                              <div className="border-b pb-2 flex items-center justify-between">
                                <h4 className="text-xs font-bold text-[#0B3B24] uppercase tracking-wider flex items-center space-x-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                  <span>유튜브 홍보 동영상 등록</span>
                                </h4>
                                <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-black font-mono">
                                  COUNT: {adminVideos.length}
                                </span>
                              </div>

                              {/* Video Add Form */}
                              <form onSubmit={handleAddVideo} className="space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">동영상 제목</label>
                                  <input
                                    type="text"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.target.value)}
                                    placeholder="예: KY Academy 대치캠퍼스 실제 원장 인터뷰"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">상세 설명</label>
                                  <textarea
                                    value={videoDesc}
                                    onChange={(e) => setVideoDesc(e.target.value)}
                                    placeholder="영상 플레이어 하단에 간략하게 노출될 부연 코멘트"
                                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C5A059] h-12 font-medium"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">유튜브 링크 또는 ID</label>
                                    <input
                                      type="text"
                                      value={videoUrl}
                                      onChange={(e) => setVideoUrl(e.target.value)}
                                      placeholder="https://www.youtube.com/watch?v=..."
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C5A059] font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">상영 시간 (Duration)</label>
                                    <input
                                      type="text"
                                      value={videoDuration}
                                      onChange={(e) => setVideoDuration(e.target.value)}
                                      placeholder="예: 3분 45초"
                                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C5A059] font-semibold"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2 bg-[#0B3B24] hover:bg-[#062919] text-white font-bold text-xs rounded transition-all flex items-center justify-center space-x-1 cursor-pointer"
                                >
                                  <span>홍보 동영상 등록</span>
                                </button>
                              </form>

                              {/* Current Videos List */}
                              <div className="space-y-2 pt-2 border-t border-slate-200 max-h-48 overflow-y-auto">
                                <h5 className="text-[11px] font-bold text-slate-500 mb-1">현재 노출 중인 동영상</h5>
                                {adminVideos.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic">등록된 맞춤 동영상이 없습니다. (기본 시뮬레이터 영상이 표시됩니다)</p>
                                ) : (
                                  adminVideos.map((v) => (
                                    <div key={v.id} className="p-2.5 bg-white border rounded-lg flex items-center justify-between text-xs hover:border-rose-300 transition-colors">
                                      <div className="truncate pr-2">
                                        <span className="font-extrabold text-slate-700 block truncate">{v.title}</span>
                                        <span className="text-[9px] text-slate-400 font-mono block truncate">{v.youtubeUrl} • {v.duration}</span>
                                      </div>
                                      <div className="flex items-center space-x-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setAdminPreviewVideo(v)}
                                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded cursor-pointer transition-colors flex items-center space-x-1"
                                        >
                                          <Eye className="w-3 h-3 text-emerald-600" />
                                          <span>미리보기</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteVideo(v.id)}
                                          className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold rounded cursor-pointer transition-colors"
                                        >
                                          삭제
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* -------------------------------------------
                             BULK MODE (NEW IMPLEMENTATION)
                             ------------------------------------------- */
                          <div className="space-y-6 pt-2">
                            {/* Sub Tab Bar: Brochure vs Video */}
                            <div className="flex border-b border-slate-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkType("brochure");
                                  setBulkInputText("");
                                }}
                                className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center space-x-1.5 ${bulkType === "brochure"
                                    ? "border-[#0B3B24] text-[#0B3B24]"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                  }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                                <span>브로슈어 일괄 등록</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBulkType("video");
                                  setBulkInputText("");
                                }}
                                className={`px-4 py-2 text-xs font-black border-b-2 transition-all flex items-center space-x-1.5 ${bulkType === "video"
                                    ? "border-[#0B3B24] text-[#0B3B24]"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                  }`}
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                <span>홍보 동영상 일괄 등록</span>
                              </button>
                            </div>

                            {/* Content for Bulk Brochure */}
                            {bulkType === "brochure" && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Multi-file drag upload zone */}
                                  <div className="border-2 border-dashed border-slate-300 hover:border-[#0B3B24]/60 bg-slate-50 hover:bg-slate-50/80 rounded-xl p-6 transition-all relative flex flex-col items-center justify-center min-h-[140px] text-center">
                                    <input
                                      type="file"
                                      multiple
                                      accept=".pdf,image/*"
                                      onChange={(e) => handleBulkBrochuresFilesSelect(e.target.files)}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <BookOpen className="w-8 h-8 text-[#C5A059] mb-2" />
                                    <span className="text-xs font-extrabold text-slate-700">여기를 클릭하거나 파일을 드래그하여 다중 PDF 첨부</span>
                                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">여러 개의 로컬 브로슈어 파일들을 한 번에 선택 가능</span>
                                  </div>

                                  {/* Text format direct paste URL zone */}
                                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-slate-700">브로슈어 목록 텍스트 직접 입력 (옵션)</label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setBulkInputText(
                                              "공식 가맹 브로슈어 (2026)|https://example.com/2026_brochure.pdf|2026년 개정 가맹 공식 가맹안내\n" +
                                              "초등과정 핵심 교재 브로슈어|https://example.com/elementary_book.pdf|초등 영어 과정 시그니처 팜플렛"
                                            );
                                          }}
                                          className="text-[10px] font-bold text-[#0B3B24] hover:underline"
                                        >
                                          💡 예시 입력
                                        </button>
                                      </div>
                                      <textarea
                                        value={bulkInputText}
                                        onChange={(e) => setBulkInputText(e.target.value)}
                                        placeholder="입력 형식: 브로슈어제목 | 파일 다운로드 URL 주소 | 간략한 요약 설명 문구"
                                        className="w-full h-16 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-[#C5A059] shadow-inner"
                                      />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                      <button
                                        type="button"
                                        onClick={handleParseBulkText}
                                        className="px-3 py-1.5 bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer"
                                      >
                                        텍스트 파싱 분석하여 아래 추가
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Spreadsheet Table Grid */}
                                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                  <div className="bg-slate-100/80 border-b px-4 py-2.5 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700 flex items-center space-x-1">
                                      <span>대량 등록 대기 중인 가맹 브로슈어 목록</span>
                                      <span className="bg-[#0B3B24] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {bulkBrochures.length}건
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleBulkBrochuresAddRow}
                                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border text-[10px] font-bold rounded flex items-center space-x-1"
                                    >
                                      <span>+ 수동 행 추가</span>
                                    </button>
                                  </div>

                                  <div className="max-h-72 overflow-y-auto">
                                    {bulkBrochures.length === 0 ? (
                                      <div className="p-8 text-center text-slate-400 text-xs">
                                        <p>대기 목록이 비어 있습니다. 위 박스를 통해 파일을 첨부하거나 직접 텍스트를 작성하여 분석하세요.</p>
                                      </div>
                                    ) : (
                                      <div className="divide-y text-xs">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 bg-slate-50 p-2 font-bold text-slate-500 border-b">
                                          <div className="col-span-4">제목 (Title) *</div>
                                          <div className="col-span-5">다운로드 URL 또는 첨부파일명</div>
                                          <div className="col-span-2">요약 설명</div>
                                          <div className="col-span-1 text-center">삭제</div>
                                        </div>

                                        {bulkBrochures.map((b) => (
                                          <div key={b.id} className="grid grid-cols-12 p-2 gap-2 items-center hover:bg-slate-50/50">
                                            <div className="col-span-4">
                                              <input
                                                type="text"
                                                value={b.title}
                                                onChange={(e) => handleUpdateBulkBrochureField(b.id, "title", e.target.value)}
                                                placeholder="브로슈어 제목"
                                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#C5A059] font-semibold"
                                              />
                                            </div>
                                            <div className="col-span-5">
                                              {b.file ? (
                                                <div className="bg-[#0B3B24]/5 border border-[#0B3B24]/10 rounded px-2 py-1 text-[11px] text-[#0B3B24] font-semibold truncate flex items-center space-x-1">
                                                  <span className="font-mono">📎 파일 전송 대기: {b.file.name}</span>
                                                </div>
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={b.url}
                                                  onChange={(e) => handleUpdateBulkBrochureField(b.id, "url", e.target.value)}
                                                  placeholder="https://... 또는 파일 주소"
                                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-[#C5A059]"
                                                />
                                              )}
                                            </div>
                                            <div className="col-span-2">
                                              <input
                                                type="text"
                                                value={b.description}
                                                onChange={(e) => handleUpdateBulkBrochureField(b.id, "description", e.target.value)}
                                                placeholder="설명 문구 (선택)"
                                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                                              />
                                            </div>
                                            <div className="col-span-1 text-center">
                                              <button
                                                type="button"
                                                onClick={() => handleBulkBrochuresDeleteRow(b.id)}
                                                className="text-rose-600 hover:text-rose-700 font-extrabold hover:underline"
                                              >
                                                삭제
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Process / Submit actions */}
                                <div className="flex items-center justify-between bg-slate-50 border p-4 rounded-xl">
                                  <div className="text-xs text-slate-500 font-medium">
                                    {isBulkProcessing ? (
                                      <span className="font-bold text-[#0B3B24] animate-pulse">
                                        ⏳ 대량 업로드 진행 중... ({bulkProgressCurrent} / {bulkProgressTotal})
                                      </span>
                                    ) : (
                                      <span>※ 로컬 파일을 첨부한 경우 순차적으로 자동 암호화 업로드 후 일괄 데이터베이스에 적재됩니다.</span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setBulkBrochures([])}
                                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all active:scale-95"
                                    >
                                      초기화
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleBulkBrochuresSubmit}
                                      disabled={isBulkProcessing || bulkBrochures.length === 0}
                                      className="px-5 py-2 bg-gradient-to-r from-[#0B3B24] to-[#124a2e] text-white font-extrabold text-xs rounded-lg transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md"
                                    >
                                      {isBulkProcessing ? "등록 처리 중..." : `총 ${bulkBrochures.length}개 가맹 브로슈어 일괄 등록 실행`}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Content for Bulk Videos */}
                            {bulkType === "video" && (
                              <div className="space-y-4">
                                {/* Format Paste zone */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700 flex items-center space-x-1">
                                      <span>동영상 정보 텍스트 일괄 붙여넣기</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBulkInputText(
                                          "KY Academy 대치동 입시 전략 설명회 | https://youtu.be/dQw4w9WgXcQ | 4분 30초 | 대치 캠퍼스 원장님 설명회 리얼 가이드\n" +
                                          "KY Academy 실제 초등 수업 참관 스케치 | dQw4w9WgXcQ | 2분 15초 | 초등부 실제 수업 라이브\n" +
                                          "학원 운영 세미나 현장 스케치 | dQw4w9WgXcQ | 5분 10초 | 전국 가맹 원장님 세미나 영상"
                                        );
                                      }}
                                      className="text-[10px] font-bold text-[#0B3B24] hover:underline"
                                    >
                                      💡 작성 예시 텍스트 불러오기
                                    </button>
                                  </div>
                                  <textarea
                                    value={bulkInputText}
                                    onChange={(e) => setBulkInputText(e.target.value)}
                                    placeholder="작성 형식: 동영상 제목 | 유튜브 주소 또는 ID | 상영시간 | 요약 설명"
                                    className="w-full h-24 bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-[#C5A059] leading-relaxed shadow-inner"
                                  />
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={handleParseBulkText}
                                      className="px-4 py-2 bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-xs rounded-lg transition-colors shadow-sm"
                                    >
                                      동영상 목록으로 파싱 분석하기
                                    </button>
                                  </div>
                                </div>

                                {/* Spreadsheet Table Grid */}
                                <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                  <div className="bg-slate-100/80 border-b px-4 py-2.5 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-700 flex items-center space-x-1">
                                      <span>대량 등록 대기 중인 홍보 동영상 목록</span>
                                      <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {bulkVideos.length}건
                                      </span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleBulkVideoAddRow}
                                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border text-[10px] font-bold rounded flex items-center space-x-1"
                                    >
                                      <span>+ 수동 행 추가</span>
                                    </button>
                                  </div>

                                  <div className="max-h-72 overflow-y-auto">
                                    {bulkVideos.length === 0 ? (
                                      <div className="p-8 text-center text-slate-400 text-xs">
                                        <p>대기 목록이 비어 있습니다. 위 입력창에 양식대로 입력한 후 파싱 단추를 클릭하거나 수동으로 행을 추가하세요.</p>
                                      </div>
                                    ) : (
                                      <div className="divide-y text-xs">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 bg-slate-50 p-2 font-bold text-slate-500 border-b">
                                          <div className="col-span-3">동영상 제목 (Title) *</div>
                                          <div className="col-span-4">유튜브 링크 또는 11자리 비디오 ID *</div>
                                          <div className="col-span-2">상영 시간 (Duration)</div>
                                          <div className="col-span-2">상세 설명 문구</div>
                                          <div className="col-span-1 text-center">삭제</div>
                                        </div>

                                        {bulkVideos.map((v) => (
                                          <div key={v.id} className="grid grid-cols-12 p-2 gap-2 items-center hover:bg-slate-50/50">
                                            <div className="col-span-3">
                                              <input
                                                type="text"
                                                value={v.title}
                                                onChange={(e) => handleUpdateBulkVideoField(v.id, "title", e.target.value)}
                                                placeholder="동영상 제목"
                                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[#C5A059] font-semibold"
                                              />
                                            </div>
                                            <div className="col-span-4">
                                              <input
                                                type="text"
                                                value={v.youtubeUrl}
                                                onChange={(e) => handleUpdateBulkVideoField(v.id, "youtubeUrl", e.target.value)}
                                                placeholder="https://www.youtube.com/watch?v=... 또는 ID"
                                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-[11px] font-mono focus:outline-none focus:border-[#C5A059]"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <input
                                                type="text"
                                                value={v.duration}
                                                onChange={(e) => handleUpdateBulkVideoField(v.id, "duration", e.target.value)}
                                                placeholder="예: 3분 45초"
                                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <input
                                                type="text"
                                                value={v.desc}
                                                onChange={(e) => handleUpdateBulkVideoField(v.id, "desc", e.target.value)}
                                                placeholder="간략 요약설명"
                                                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none"
                                              />
                                            </div>
                                            <div className="col-span-1 text-center">
                                              <button
                                                type="button"
                                                onClick={() => handleBulkVideoDeleteRow(v.id)}
                                                className="text-rose-600 hover:text-rose-700 font-extrabold hover:underline"
                                              >
                                                삭제
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action button footer */}
                                <div className="flex items-center justify-between bg-slate-50 border p-4 rounded-xl">
                                  <div className="text-xs text-slate-500 font-medium">
                                    <span>※ 입력된 유튜브 주소로부터 고유 동영상 비디오 코드를 자동 분리 및 가맹점 전용 채널에 통합 적용합니다.</span>
                                  </div>
                                  <div className="flex items-center space-x-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setBulkVideos([])}
                                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-all active:scale-95"
                                    >
                                      초기화
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleBulkVideoSubmit}
                                      disabled={isBulkProcessing || bulkVideos.length === 0}
                                      className="px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-extrabold text-xs rounded-lg transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-md"
                                    >
                                      {isBulkProcessing ? "등록 처리 중..." : `총 ${bulkVideos.length}개 홍보 영상 일괄 등록 실행`}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 2: Applicants Detail List Panel */}
                  {adminCategoryTab === "applicants" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Roster & Filters panel */}
                      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md" id="admin_roster_panel">

                        {/* Header search / filters block */}
                        <div className="p-6 border-b border-[#E5E7EB] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h3 className="text-[#0B3B24] font-bold text-base flex items-center gap-1.5">
                                <Users className="w-5 h-5 text-[#C5A059]" />
                                <span>신청자 데이터베이스 상세조회 및 분류</span>
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">자가진단을 마친 창업 희망자 명단을 조회하고 상담 등급과 상담상태를 일괄 제어합니다.</p>
                            </div>
                          </div>

                          {/* Quick Category-based Multi-Tabs Dashboard */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-4" id="quick_category_dashboard">
                            {/* Classification Group Selector */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                              <div className="flex items-center space-x-2 font-black text-xs sm:text-sm text-[#0B3B24]">
                                <Grid className="w-4 h-4 text-[#C5A059]" />
                                <span>카테고리별 분류 그룹 선택:</span>
                              </div>
                              <div className="flex flex-wrap gap-1 bg-slate-200/60 p-1 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setAdminClassificationGroup("status")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${adminClassificationGroup === "status"
                                      ? "bg-[#0B3B24] text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  상담 상태별
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdminClassificationGroup("franchise")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${adminClassificationGroup === "franchise"
                                      ? "bg-[#0B3B24] text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  가맹 유형별
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdminClassificationGroup("competency")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${adminClassificationGroup === "competency"
                                      ? "bg-[#0B3B24] text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  역량 등급별
                                </button>
                              </div>
                            </div>

                            {/* Category Items List with Live Counts */}
                            <div className="flex flex-wrap gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminFilterFranchise("All");
                                  setAdminFilterCompetency("All");
                                  setAdminFilterLead("All");
                                  setAdminFilterStatus("All");
                                }}
                                className={`px-3 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer border flex items-center space-x-1.5 ${adminFilterFranchise === "All" && adminFilterCompetency === "All" && adminFilterLead === "All" && adminFilterStatus === "All"
                                    ? "bg-[#0B3B24] text-white border-transparent shadow-sm"
                                    : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100"
                                  }`}
                              >
                                <span>전체 보기</span>
                                <span className="bg-black/10 px-1.5 py-0.5 rounded text-[10px] font-black">
                                  {applicants.length}
                                </span>
                              </button>

                              {/* CONDITIONAL SUB-CATEGORIES BASED ON SELECTED CLASSIFICATION GROUP */}
                              {adminClassificationGroup === "status" && (
                                <>
                                  {[
                                    { status: "신규접수", label: "🆕 신규접수", key: "신규접수" },
                                    { status: "1차상담", label: "📞 1차상담", key: "1차상담" },
                                    { status: "상권분석", label: "🗺️ 상권분석", key: "상권분석" },
                                    { status: "설명회참석", label: "🏫 설명회참석", key: "설명회참석" },
                                    { status: "계약진행", label: "✍️ 계약진행", key: "계약진행" },
                                    { status: "계약완료", label: "🎉 계약완료", key: "계약완료" },
                                    { status: "보류", label: "⚠️ 보류", key: "보류" },
                                  ].map((cat) => {
                                    const count = applicants.filter(a => a.counselorStatus === cat.status).length;
                                    const isActive = adminFilterStatus === cat.status && adminFilterFranchise === "All" && adminFilterCompetency === "All";
                                    return (
                                      <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                          setAdminFilterFranchise("All");
                                          setAdminFilterCompetency("All");
                                          setAdminFilterLead("All");
                                          setAdminFilterStatus(cat.status);
                                        }}
                                        className={`px-3 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer border flex items-center space-x-1.5 ${isActive
                                            ? "bg-[#C5A059] text-white border-transparent shadow-sm"
                                            : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100"
                                          }`}
                                      >
                                        <span>{cat.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </>
                              )}

                              {adminClassificationGroup === "franchise" && (
                                <>
                                  {[
                                    { type: "신규 창업", label: "🚀 신규 창업", key: "new" },
                                    { type: "브랜드 전환", label: "🔄 브랜드 전환", key: "switch" },
                                  ].map((cat) => {
                                    const count = applicants.filter(a => a.franchiseType === cat.type).length;
                                    const isActive = adminFilterFranchise === cat.type && adminFilterStatus === "All" && adminFilterCompetency === "All";
                                    return (
                                      <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                          setAdminFilterFranchise(cat.type);
                                          setAdminFilterCompetency("All");
                                          setAdminFilterLead("All");
                                          setAdminFilterStatus("All");
                                        }}
                                        className={`px-3 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer border flex items-center space-x-1.5 ${isActive
                                            ? "bg-[#C5A059] text-white border-transparent shadow-sm"
                                            : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100"
                                          }`}
                                      >
                                        <span>{cat.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </>
                              )}

                              {adminClassificationGroup === "competency" && (
                                <>
                                  {[
                                    { rank: "S", label: "⭐ S등급 (최우수)", key: "S" },
                                    { rank: "A", label: "🥇 A등급 (우수)", key: "A" },
                                    { rank: "B", label: "🥈 B등급 (양호)", key: "B" },
                                    { rank: "C", label: "🥉 C등급 (보통)", key: "C" },
                                    { rank: "D", label: "📋 D등급 (미흡)", key: "D" },
                                  ].map((cat) => {
                                    const count = applicants.filter(a => a.competencyRank === cat.rank).length;
                                    const isActive = adminFilterCompetency === cat.rank && adminFilterFranchise === "All" && adminFilterStatus === "All";
                                    return (
                                      <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => {
                                          setAdminFilterFranchise("All");
                                          setAdminFilterCompetency(cat.rank);
                                          setAdminFilterLead("All");
                                          setAdminFilterStatus("All");
                                        }}
                                        className={`px-3 py-2 rounded-lg font-bold transition-all text-xs cursor-pointer border flex items-center space-x-1.5 ${isActive
                                            ? "bg-[#C5A059] text-white border-transparent shadow-sm"
                                            : "bg-white text-slate-700 border-slate-250 hover:bg-slate-100"
                                          }`}
                                      >
                                        <span>{cat.label}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                          {count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3" id="admin_filters_group">

                            {/* Search Input */}
                            <div className="sm:col-span-4 relative">
                              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="원장명, 지역, 연락처, 담당관 검색..."
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#C5A059]"
                              />
                            </div>

                            {/* Franchise filter */}
                            <div className="sm:col-span-2">
                              <select
                                value={adminFilterFranchise}
                                onChange={(e) => setAdminFilterFranchise(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#C5A059]"
                                aria-label="가맹유형 필터"
                              >
                                <option value="All">가맹형태: 전체</option>
                                <option value="신규 창업">신규 창업</option>
                                <option value="브랜드 전환">브랜드 전환</option>
                              </select>
                            </div>

                            {/* Competency filter */}
                            <div className="sm:col-span-2">
                              <select
                                value={adminFilterCompetency}
                                onChange={(e) => setAdminFilterCompetency(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#C5A059]"
                                aria-label="역량등급 필터"
                              >
                                <option value="All">역량등급: 전체</option>
                                <option value="S">S등급</option>
                                <option value="A">A등급</option>
                                <option value="B">B등급</option>
                                <option value="C">C등급</option>
                                <option value="D">D등급</option>
                              </select>
                            </div>

                            {/* Lead filter */}
                            <div className="sm:col-span-2">
                              <select
                                value={adminFilterLead}
                                onChange={(e) => setAdminFilterLead(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#C5A059]"
                                aria-label="리드등급 필터"
                              >
                                <option value="All">리드등급: 전체</option>
                                <option value="S">S급 리드</option>
                                <option value="A">A급 리드</option>
                                <option value="B">B급 리드</option>
                                <option value="C">C급 리드</option>
                              </select>
                            </div>

                            {/* Counseling Status filter */}
                            <div className="sm:col-span-2">
                              <select
                                value={adminFilterStatus}
                                onChange={(e) => setAdminFilterStatus(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#C5A059]"
                                aria-label="상담방식 필터"
                              >
                                <option value="All">상담상태: 전체</option>
                                <option value="신규접수">신규접수</option>
                                <option value="1차상담">1차상담</option>
                                <option value="상권분석">상권분석</option>
                                <option value="설명회참석">설명회참석</option>
                                <option value="계약진행">계약진행</option>
                                <option value="계약완료">계약완료</option>
                                <option value="보류">보류</option>
                              </select>
                            </div>

                          </div>
                        </div>

                        {/* Batch Actions Toolbar */}
                        {selectedApplicantIds.length > 0 && (
                          <div className="bg-rose-50/80 border-b border-rose-100 px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-rose-800 text-xs font-extrabold">
                              <CheckCircle2 className="w-4 h-4 text-rose-500 flex-shrink-0 animate-bounce" />
                              <span>선택된 원장님: <strong className="text-sm font-black text-rose-600 underline decoration-2">{selectedApplicantIds.length}</strong>명</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleBatchDeleteApplicants}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 animate-fade-in"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>선택한 건 일괄삭제</span>
                            </button>
                          </div>
                        )}

                        {/* Table of Applicants */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200" id="applicants_table_scroll">
                          <table className="w-full text-xs text-left border-collapse" id="admin_roster_table">
                            <thead className="bg-[#0B3B24] text-slate-100 uppercase text-[10px] tracking-wider font-bold">
                              <tr>
                                <th className="pl-4 pr-1 py-4 text-center w-12 bg-[#0B3B24]/95 select-none font-sans font-extrabold text-slate-200 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedApplicantIds(filteredApplicants.map(app => app.id));
                                      } else {
                                        setSelectedApplicantIds([]);
                                      }
                                    }}
                                    checked={filteredApplicants.length > 0 && selectedApplicantIds.length === filteredApplicants.length}
                                    className="h-4 w-4 rounded border-slate-350 text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                                    aria-label="전체 선택"
                                  />
                                </th>
                                <th className="px-4 py-4 text-left font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 whitespace-nowrap">이름</th>
                                <th className="px-4 py-4 text-left font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 whitespace-nowrap">가맹유형</th>
                                <th className="px-4 py-4 text-left font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 whitespace-nowrap">역량등급</th>
                                <th className="px-4 py-4 text-center font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 whitespace-nowrap min-w-[120px]">결과요청여부</th>
                                <th className="px-4 py-4 text-center font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 w-36 whitespace-nowrap">진단결과보기</th>
                                <th className="px-4 py-4 text-center font-sans font-extrabold text-slate-200 bg-[#0B3B24]/95 w-24 whitespace-nowrap">삭제여부</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB] bg-white text-slate-700">
                              {filteredApplicants.length > 0 ? (
                                filteredApplicants.map((app) => (
                                  <tr key={app.id} className={`hover:bg-[#0B3B24]/5 border-b border-[#E5E7EB] transition-all duration-150 ${selectedApplicantIds.includes(app.id) ? "bg-[#0B3B24]/5/20" : ""}`}>

                                    {/* Row Checkbox */}
                                    <td className="pl-4 pr-1 py-4.5 text-center align-middle w-12">
                                      <input
                                        type="checkbox"
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedApplicantIds(prev => [...prev, app.id]);
                                          } else {
                                            setSelectedApplicantIds(prev => prev.filter(id => id !== app.id));
                                          }
                                        }}
                                        checked={selectedApplicantIds.includes(app.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-[#C5A059] focus:ring-[#C5A059] cursor-pointer"
                                        aria-label={`${app.name} 원장님 선택`}
                                      />
                                    </td>

                                    {/* 이름 (원장명 & 신청일시) */}
                                    <td className="px-4 py-4.5 align-middle">
                                      <div className="flex flex-col space-y-1">
                                        <div className="font-extrabold text-[#0B3B24] text-sm sm:text-[15px] flex flex-row items-center gap-1.5 flex-nowrap whitespace-nowrap">
                                          <span className="tracking-tight hover:text-[#C5A059] transition-colors whitespace-nowrap shrink-0">{app.name}</span>
                                          {app.birth && (() => {
                                            const age = calculateKoreanAge(app.birth);
                                            return age !== null ? (
                                              <span className="text-[10px] font-black text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap inline-flex items-center">
                                                만 {age}세
                                              </span>
                                            ) : null;
                                          })()}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono font-semibold tracking-tight block whitespace-nowrap">
                                          신청: {formatAppliedAt(app.appliedAt)}
                                        </span>
                                        {app.mainConcern && (
                                          <div className="text-[10px] text-[#C5A059] font-semibold bg-[#C5A059]/5 border border-[#C5A059]/10 rounded px-1.5 py-0.5 mt-1 max-w-[180px] truncate" title={app.mainConcern}>
                                            고민: {app.mainConcern}
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    {/* 가맹유형 */}
                                    <td className="px-4 py-4.5 align-middle">
                                      <div className="flex flex-col space-y-1">
                                        <span className={`inline-flex items-center self-start px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider whitespace-nowrap ${app.franchiseType === "신규 창업"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-amber-50 text-amber-700 border-amber-250"
                                          }`}>
                                          {app.franchiseType}
                                        </span>
                                        {app.openingMonth && app.openingMonth !== "없음" && (
                                          <div className="text-[10px] text-[#C5A059] font-bold flex items-center gap-1.5 pl-0.5 mt-0.5 whitespace-nowrap">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                                            <span>{app.openingMonth} 예정</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    {/* 역량등급 */}
                                    <td className="px-4 py-4.5 align-middle font-sans">
                                      <div className="flex flex-col space-y-1.5">
                                        <div className="flex items-center space-x-1.5 flex-nowrap whitespace-nowrap">
                                          {(() => {
                                            const grade = app.competencyRank || "C";
                                            const colors: Record<string, string> = {
                                              S: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
                                              S등급: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
                                              A: "bg-emerald-50 text-emerald-700 border-emerald-250",
                                              B: "bg-blue-50 text-[#C5A059] border-[#C5A059]/30",
                                              C: "bg-orange-50 text-orange-700 border-orange-200",
                                              D: "bg-red-50 text-red-700 border-red-200"
                                            };
                                            const badgeStyle = colors[grade] || colors.C;
                                            return (
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border whitespace-nowrap ${badgeStyle}`}>
                                                {grade}등급
                                              </span>
                                            );
                                          })()}
                                          <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                            {app.totalScore}점
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium tracking-tight block truncate max-w-[200px]" title={getCompetencyLabelAndDesc(app.competencyRank, app.franchiseType)}>
                                          {getCompetencyLabelAndDesc(app.competencyRank, app.franchiseType).split(":")[0]}
                                        </span>
                                      </div>
                                    </td>

                                    {/* 결과요청여부 */}
                                    <td className="px-4 py-4.5 align-middle text-center">
                                      {app.consultantInquiryRequested ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-250 rounded-full text-[10px] font-black shadow-sm tracking-wider whitespace-nowrap animate-pulse">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                                          <span>분석 요청됨 🔔</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[10px] font-bold tracking-wider whitespace-nowrap">
                                          <span>일반 조회 📄</span>
                                        </span>
                                      )}
                                    </td>

                                    {/* 진단결과보기 */}
                                    <td className="px-4 py-4.5 align-middle text-center">
                                      <button
                                        onClick={() => {
                                          setDiagnosisResult(app);
                                          setView("result");
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 w-full max-w-[120px] py-1.5 rounded-full bg-[#0B3B24] hover:bg-[#062919] text-white border-transparent text-[11px] font-black transition-all cursor-pointer shadow-md active:scale-95 whitespace-nowrap hover:shadow-lg"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                                        <span>진단결과보기</span>
                                      </button>
                                    </td>

                                    {/* 삭제여부 */}
                                    <td className="px-4 py-4.5 align-middle text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteApplicant(app.id, app.name)}
                                        className="inline-flex items-center justify-center gap-1 w-16 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-full transition-all duration-150 border border-rose-150 cursor-pointer hover:shadow-inner active:scale-95 text-[10px] font-bold"
                                        title={`${app.name} 원장님 데이터 삭제`}
                                      >
                                        <Trash2 className="w-3 h-3 shrink-0" />
                                        <span>삭제</span>
                                      </button>
                                    </td>

                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="text-center py-16 text-slate-500">
                                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm font-semibold">조건에 일치하는 창업 신청자 데이터가 없습니다.</p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Table statistics metadata summary footer */}
                        <div className="p-4 bg-slate-50 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-slate-500 font-medium font-sans">
                          <span>검색결과: 총 <strong className="text-[#0B3B24]">{filteredApplicants.length}</strong>건이 표시 중입니다.</span>
                          <span>고려대학교 협력 파트너스 오프닝맵 데이터 시스템 v1.0</span>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Styled Footer */}
      <footer className="mt-16 py-12 px-6 border-t border-slate-200 text-slate-500 bg-slate-50 text-xs text-center space-y-3.5" id="app_footer_nav">
        <div className="flex items-center justify-center space-x-4 text-[#0B3B24] mb-2 font-medium">
          <span className="cursor-pointer hover:text-[#C5A059] transition-colors" onClick={() => setView("home")}>진단시작</span>
          <span className="text-slate-300">•</span>
          <span className="cursor-pointer hover:text-[#C5A059] transition-colors" onClick={() => { setView("admin"); }}>본사 시스템</span>
          <span className="text-slate-300">•</span>
          <span className="cursor-pointer hover:text-[#C5A059] transition-colors" onClick={() => { if (confirm("데이터베이스를 재생성하시겠습니까?")) fetchApplicants(); }}>시스템 검진</span>
        </div>
        <p className="max-w-md mx-auto text-slate-500">
          오프닝맵(Opening Map)은 10년이상 개원컨설팅 경험있는 전문가의 개원준비 진단하는 사이트입니다.
        </p>
        <p className="font-mono text-[10px] text-slate-500">
          © 2026 Opening Map Corporation. All rights reserved. Registered for AI Studio Platform.
        </p>
      </footer>

      {/* Styled Interactive Print Preview Modal Dialog */}
      {showPrintPreview && diagnosisResult && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="print_preview_modal_overlay">
          <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-[950px] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-scale-up" id="print_preview_modal_container">
            {/* Modal Header */}
            <div className="bg-[#0B3B24] text-white px-6 py-4 flex items-center justify-between" id="print_preview_modal_header">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Printer className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight dialog-title text-white">진단 보고서 인쇄 및 PDF 다운로드 미리보기</h2>
                  <p className="text-[10px] text-[#C5A059] font-bold mt-0.5">※ 원장님께 제공될 고해상도 고려대학교 협약 정형 디테일 분석 리포트 프리뷰입니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="text-white/70 hover:text-white bg-white/5 hover:bg-white/15 p-2 rounded-full border-0 cursor-pointer transition-all active:scale-90 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Guided Instructions Banner */}
            <div className="bg-[#C5A059]/10 px-6 py-3 border-b border-[#C5A059]/20 flex items-start space-x-2.5 text-xs text-slate-800" id="print_preview_modal_banner">
              <AlertCircle className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">
                <p>프린트 서식 및 여백 정렬이 한 장에 꼭 들어차게 정교화 가이드 라인이 사전 매핑되어 있습니다.</p>
                <p className="text-[10px] text-slate-500 mt-1">"고해상도 PDF 다운로드" 클릭 시 프록시 렌더 엔진이 작동하여 폰트 에러나 차트 이탈 없는 모바일/PC 통합 보존용 최고 사양 벡터 PDF 파일이 생성됩니다.</p>
              </div>
            </div>

            {/* Scrollable Layout Context Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/60 divide-y divide-slate-300/30" id="print_preview_modal_scrollzone">
              <div className="max-w-[850px] mx-auto bg-white p-1 shadow-lg rounded-xl border border-slate-300">
                {renderPrintableReportContent()}
              </div>
            </div>

            {/* Modal Bottom Buttons Panel */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between" id="print_preview_modal_footer">
              <div className="text-[11px] text-slate-500 font-bold font-sans">
                대상 신청자: <span className="text-[#0B3B24] font-black">{diagnosisResult.name} 예비 원장님</span> ({diagnosisResult.verificationCode})
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    setShowPrintPreview(false);
                    await handleTriggerPdfDownloadDirectly();
                  }}
                  className="bg-[#C5A059] hover:bg-[#B38F4D] text-white px-4 py-2 rounded-xl text-xs font-black border-0 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>고해상도 PDF 다운로드</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.focus();
                    window.print();
                  }}
                  className="bg-[#0B3B24] hover:bg-[#062919] text-white px-4 py-2 rounded-xl text-xs font-black border-0 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>프린트 출력</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-slate-100 hover:bg-slate-205 text-slate-600 px-4 py-2 rounded-xl text-xs font-black border border-slate-250 transition-all cursor-pointer active:scale-95"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Report - Only rendered when diagnosisResult exists and only visible via print query */}
      {diagnosisResult && (
        <div
          className={`${isGeneratingPdf ? "block fixed top-0 left-[-9999px] w-[850px] bg-white z-[-50] overflow-visible" : "hidden print:block"} print-optimized-report bg-white text-slate-800 border-0 p-0 m-0`}
          id="printable_report_wrapper"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* PAGE 1: BASIC DETAILS & STRUCTURAL RECOMMENDATIONS */}
          <div className="print-page-break p-8 border-4 border-[#0B3B24] rounded-xl relative" style={{ minHeight: "1050px" }}>
            {/* Header Emblem */}
            <div className="flex justify-between items-start border-b pb-4 mb-6 border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-[#C5A059] flex items-center justify-center font-black text-white text-sm">O</div>
                  <span className="font-extrabold text-slate-800 text-lg uppercase tracking-wider">Opening Map</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-1">고려대 협약 파트너 영어학원 창업 정밀 개설 진단 보고서</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] bg-[#0B3B24] text-white px-2 py-0.5 rounded font-extrabold font-mono border border-[#C5A059]/40">
                  SESSION CODE: {diagnosisResult.verificationCode}
                </span>
                <p className="text-[9px] text-slate-400 mt-1 font-mono">발행일: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Main Title Banner */}
            <div className="text-center bg-[#0B3B24] text-white py-6 px-4 rounded-lg mb-6 relative">
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">
                영어전문학원 PREMIUM 개원진단 보고서 (1P: 진단/추천부)
              </h1>
              <p className="text-[11px] text-[#C5A059] font-mono tracking-widest uppercase font-bold">
                PROPORTIONAL METRICS & CONSULTING ROADMAP FOR PARTNER
              </p>
            </div>

            {/* [상단] 1. 예비 원장님 기본 정보 및 기입 정보 */}
            <div className="mb-6">
              <h3 className="text-sm font-extrabold text-[#0B3B24] border-b pb-1 mb-2">1. 예비 원장님 기본 정보 및 기입 내용 (Profile Checklist)</h3>
              <table className="w-full text-xs border border-collapse border-slate-300">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold w-1/4">성 명</td>
                    <td className="border border-slate-300 px-3 py-2 w-1/4 font-semibold">
                      {diagnosisResult.name} 예비원장님 {diagnosisResult.birth ? `(만 ${calculateKoreanAge(diagnosisResult.birth)}세)` : ""}
                    </td>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold w-1/4">연락처 및 회신처</td>
                    <td className="border border-slate-300 px-3 py-2 w-1/4 font-mono">{diagnosisResult.phone}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold">희망 개원지역</td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-[#0B3B24]">{diagnosisResult.region || "기재안함 (상권 유선 협상)"}</td>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold">권장 개원 시기</td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-[#0B3B24]">{diagnosisResultAnalysis?.recOpeningMonth || (diagnosisResult.openingMonth === "없음" ? "개원시기 미정" : `${diagnosisResult.openingMonth} 예정`)}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold">가맹 신청 유형 (유입경로)</td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold">{diagnosisResult.franchiseType} {diagnosisResult.inflowRoute ? `(${diagnosisResult.inflowRoute})` : ""}</td>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold">배정 담당 상담사</td>
                    <td className="border border-slate-300 px-3 py-2 font-semibold text-slate-800">{diagnosisResult.counselorName || "본사 영업 담당관"}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 bg-slate-50 px-3 py-2 font-bold">주된 고민사항</td>
                    <td colSpan={3} className="border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                      {diagnosisResult.mainConcern || "기재하지 않음 (상담 시 유선 확인 예정)"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Core Scorecard Grid Summary */}
            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
                <span className="text-[10px] text-slate-500 font-bold block">통합 준비 역량 레벨</span>
                <span className="text-base font-black text-[#0B3B24] block mt-1">{diagnosisResult.competencyRank}등급</span>
                <span className="text-[10px] text-[#C5A059] font-bold block">
                  ({getCompetencyLabelAndDesc(diagnosisResult.competencyRank, diagnosisResult.franchiseType)})
                </span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
                <span className="text-[10px] text-slate-500 font-bold block">자가진단 합산 총점</span>
                <span className="text-xl font-black text-[#0B3B24] block mt-0.5">{diagnosisResult.totalScore}점</span>
                <span className="text-[9px] text-slate-500 block font-bold">
                  {diagnosisResult.franchiseType === "브랜드 전환" || diagnosisResult.franchiseType === "브랜드전환" ? "40" : "30"}점 만점 기준
                </span>
              </div>
              <div className="border border-slate-200 p-3 rounded-lg text-center bg-slate-50/50 print-avoid-break">
                <span className="text-[10px] text-slate-500 font-bold block">원장 정서 및 성향 기질</span>
                <span className="text-base font-black text-[#C5A059] block mt-1">{diagnosisResult.personality}</span>
                <span className="text-[9px] text-slate-500 block">
                  {diagnosisResult.personality === "외향형" ? "설명회 / 대외영업 최적" : "직강 원장 / 관리경영 최적"}
                </span>
              </div>
            </div>

            {/* Conditional detailed views for admin, locked security notice for clients */}
            {isAdminAuthenticated ? (
              <>
                {/* [중간 1부] 다차원 역량 분석 육각형 결과 */}
                <div className="mb-6">
                  <h3 className="text-sm font-extrabold text-[#0B3B24] border-b pb-1 mb-3">2. 다차원 역량 분석 육각형 진단 지표 (Competency Hexagon Charts)</h3>

                  <div className="grid grid-cols-12 gap-4 border border-slate-200 p-4 bg-slate-50/40 rounded-lg print-avoid-break">
                    {/* Printable Radar Chart */}
                    <div className="col-span-5 h-[180px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="62%" data={
                          (diagnosisResult.franchiseType === "신규 창업"
                            ? ["원장 경영", "영어 교수", "자본 준비", "상담 역량", "학사 행정", "조직 관리"]
                            : ["운영 형태", "원내 공간", "기존 원생", "원장 경력", "영어 교수", "투자 가용", "소득분류", "초등인원"]
                          ).map((subject, idx) => ({
                            subject,
                            score: diagnosisResult.answers[idx] || 3
                          }))
                        }>
                          <PolarGrid stroke="#CBD5E1" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#334155', fontSize: 7, fontWeight: 820 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 5]}
                            tick={{ fill: '#94A3B8', fontSize: 7 }}
                            tickCount={6}
                          />
                          <Radar
                            name="평가 점수"
                            dataKey="score"
                            stroke="#0B3B24"
                            fill="#C5A059"
                            fillOpacity={0.35}
                            strokeWidth={1.5}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="col-span-12 md:col-span-7 flex flex-col justify-center">
                      <h4 className="text-[11px] font-extrabold text-[#0B3B24] uppercase tracking-wider mb-2">✦ 자가 역량 부문별 점수 현황</h4>
                      <p className="text-[10px] text-slate-600 leading-normal mb-2">
                        원장님의 자가 진단 각 항목 수치 밸런스입니다. 수치가 4점 이상인 범위는 본사 제안 프리미엄 지표에서 즉각 추진이 우수한 강점이며, 3점 이하의 범위는 보완 처방 영역입니다.
                      </p>
                      <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                        {(diagnosisResult.franchiseType === "신규 창업"
                          ? ["원장 경영", "영어 교수", "자본 준비", "상담 역량", "학사 행정", "조직 관리"]
                          : ["운영 형태", "원내 공간", "기존 원생", "원장 경력", "영어 교수", "투자 가용", "소득분류", "초등인원"]
                        ).map((subject, idx) => ({
                          label: subject,
                          val: diagnosisResult.answers[idx] || 3
                        })).map((x, idx) => (
                          <div key={idx} className="bg-white/80 border p-1 rounded flex justify-between font-bold">
                            <span className="text-slate-500 scale-[0.88] origin-left truncate">{x.label}</span>
                            <span className="text-[#0B3B24] font-mono">{x.val}점</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* [중간 2부] 추천 학원 상권, 추천 규모, 인력 구성 */}
                {diagnosisResultAnalysis && (
                  <div className="mb-6 space-y-4">
                    <h3 className="text-sm font-extrabold text-[#0B3B24] border-b pb-1 mb-2">3. 고려대 파트너 연계 추천 상권 및 가이드라인 (Opening Map Solutions)</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 print-avoid-break">
                        <h5 className="text-[11px] font-extrabold text-[#0B3B24] border-b pb-1 mb-2">✓ 추천 학원 상권 입지 구역</h5>
                        <p className="text-xs text-slate-700 font-semibold mb-2">
                          희망지({diagnosisResult.region || "기재지"}) 분석에 인근 세대수와 보행 밀도를 기획 결합한 매칭 지역:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {diagnosisResultAnalysis.recRegions.map((region, i) => (
                            <span key={i} className="bg-[#0B3B24] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                              {region}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/50 print-avoid-break">
                        <h5 className="text-[11px] font-extrabold text-[#0B3B24] border-b pb-1 mb-2">✓ 추천 개원 형태 및 공간 규모</h5>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          • <strong>권장 형태</strong>: {diagnosisResultAnalysis.capitalRec}<br />
                          • <strong>공간 권장 규격</strong>: {diagnosisResultAnalysis.capitalRecSize}
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/35 print-avoid-break">
                      <h5 className="text-[11px] font-extrabold text-[#0B3B24] flex items-center space-x-1 mb-1.5">
                        <span>✓ 추천 연계 인력 조직 구성</span>
                      </h5>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {diagnosisResultAnalysis.recStaffSetup.map((staff, i) => (
                          <span key={i} className="border border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded text-[10px] font-extrabold">
                            {staff}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        원장님의 성향 점수 자가 분석과 준비 총점을 교차 평가하여 초기 투입 대비 효율성이 우수한 연계 조직 모델입니다.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-8 border border-slate-300 rounded-lg p-6 bg-slate-50/50 print-avoid-break text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#0B3B24]/10 border border-[#0B3B24]/20 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-[#C5A059]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-[#0B3B24]">상세 데이터 및 전문 소견 보안 안전 잠금 소정</h4>
                  <p className="text-[10px] text-slate-400 font-mono tracking-wider">APPLICANT PROFILE DATA SYSTEM SECURITY</p>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed max-w-lg mx-auto font-medium">
                  원장님의 자가진단 문항세부 배점, 8대 부문별 세부 심사 역량 그래프, 개원 타당 특수 KPI 지표, 본사 추천 상권 입지 의견은 오프닝맵 본사 전용 관리자 시스템에 안전하게 기록되었습니다.
                </p>
                <p className="text-xs text-slate-650 leading-relaxed max-w-lg mx-auto font-medium">
                  본 서류 심사가 완결됨에 따라 본사 매칭 전임 담당관(<b>{diagnosisResult.counselorName}</b>)이 원장님 연락처로 직접 신속히 전화를 드리고 상세 개설 심사 통보 유선 상담 및 입지 로드맵 브리핑을 지원해 드립니다.
                </p>

                {/* Official Stamp Box for high fidelity */}
                <div className="pt-6 flex justify-center items-center gap-12 select-none">
                  <div className="text-left font-sans">
                    <p className="text-[9px] text-[#0B3B24] font-black tracking-wider uppercase">고려대학교 협력 파트너십</p>
                    <p className="text-[12px] font-extrabold text-slate-805 tracking-tight">오프닝맵(Opening Map) 개원심사처</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-[#0B3B24]/30 flex items-center justify-center relative rotate-12 shrink-0">
                    <div className="w-12 h-12 rounded-full border border-dashed border-[#0B3B24]/50 flex flex-col items-center justify-center text-center">
                      <span className="text-[7px] text-[#0B3B24]/80 font-black leading-none">오프닝맵</span>
                      <span className="text-[9px] text-red-500 font-black mt-0.5 leading-none">심사인인</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seal and page footer */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[9px] text-slate-400 border-t pt-2">
              <span>오프닝맵 창업진단 PREMIUM 레포트 • Page 1 of {isAdminAuthenticated ? "2" : "1"}</span>
              <span>본 진단결과지는 인공지능에 기반한 경영 자치 분석지로 법적 효력을 대체할 수 없습니다.</span>
            </div>
          </div>

          {/* PAGE 2: Q&A FEEDBACK & AI ROADMAP COMMENTARY */}
          {isAdminAuthenticated && (
            <div className="p-8 border-4 border-[#0B3B24] rounded-xl relative mt-8" style={{ minHeight: "1050px" }}>
              <div className="flex justify-between items-start border-b pb-3 mb-4 border-slate-200">
                <div>
                  <span className="text-xs font-bold text-[#0B3B24]">Opening Map Premium Report</span>
                  <p className="text-[10px] text-slate-400">자가진단 문항세부 배점 및 전문가 입시/경영 처방전 (2P: 보완/총평부)</p>
                </div>
                <span className="text-[10px] text-[#C5A059] font-bold">APPLICANT: {diagnosisResult.name} 원장님</span>
              </div>

              {/* [중간 3부] 보완사항 (Detail questions loop) */}
              <div className="mb-6 space-y-3.5">
                <h3 className="text-sm font-extrabold text-[#0B3B24] border-b pb-1 mb-2">4. 자가진단 문항별 세부 보완 및 처방 솔루션 (Prescription Details)</h3>

                <div className="space-y-3">
                  {(diagnosisResult.franchiseType === "신규 창업" ? newQuestions : brandQuestions).map((q, idx) => {
                    const score = diagnosisResult.answers[idx] || 3;
                    const feedback = resolveQuestionFeedback(diagnosisResult.franchiseType, idx, score);
                    const selectedOptionText = q.options.find(o => o.value === score)?.text || "미답변";

                    return (
                      <div key={q.id} className="border border-slate-250 rounded p-2.5 bg-slate-50/20 shrink-0 print-avoid-break">
                        <div className="flex items-start space-x-2">
                          <span className="bg-[#0B3B24] text-white font-mono text-[9px] font-bold px-1 py-0.5 rounded shrink-0">
                            Q0{idx + 1}
                          </span>
                          <div className="w-full text-[10.5px]">
                            <h4 className="font-extrabold text-slate-800 leading-tight">{q.text}</h4>

                            <div className="grid grid-cols-12 gap-2 mt-1.5 pt-1.5 border-t border-slate-200/50 text-[10px]">
                              <div className="col-span-4 bg-slate-50 px-2 py-1 rounded">
                                <span className="text-[8px] text-slate-400 block font-bold">나의 답변</span>
                                <span className="text-slate-700 font-bold block truncate">{selectedOptionText}</span>
                              </div>

                              <div className="col-span-2 bg-slate-50 px-2 py-1 rounded text-center">
                                <span className="text-[8px] text-slate-400 block font-bold">평가수준</span>
                                <span className="text-[#C5A059] font-black block">{feedback.scoreText} ({score}점)</span>
                              </div>

                              <div className="col-span-6 bg-slate-50 px-2 py-1 rounded">
                                <span className="text-[8px] text-[#C5A059] font-extrabold block">본사 개원 보완 권고사항</span>
                                <p className="text-slate-600 font-semibold leading-normal mt-0.5 text-[9.5px]">
                                  {feedback.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* [마지막] 各領域別結果に対する総評 */}
              <div className="mb-4 print-avoid-break">
                <h3 className="text-sm font-extrabold text-[#0B3B24] border-b pb-1 mb-2">5. 인공지능 정량 분석 종합 총평</h3>
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-semibold font-sans" style={{ whiteSpace: "pre-line" }}>
                    {diagnosisResult.aiReport || (diagnosisResultAnalysis ? diagnosisResultAnalysis.aiReport : "원장님의 영역별 분석 결과에 대한 본사 컨설팅 종합 로드맵 레포트가 성공적으로 귀결되었습니다. 고려대학교 영어전문학원 상표 사용 허가 및 타겟 마케팅을 위해 본사 담당 컨설턴트와의 1:1 세미나 미팅을 접수할 것을 권유드립니다.")}
                  </p>
                </div>
              </div>

              {/* Official seal or sign section */}
              <div className="mt-6 pt-5 border-t border-slate-200 flex justify-between items-end print-avoid-break">
                <div className="space-y-0.5 text-[11px]">
                  <p className="text-[#0B3B24] font-extrabold">고려대 프랜차이즈 개원 매칭 전문 분석처</p>
                  <p className="text-slate-600 font-medium">원장님의 성공적인 프리미엄 어학 클래스 개설과 안정적 초기 자립 영업을 축원합니다.</p>
                </div>
                <div className="text-right flex items-center space-x-4">
                  <div className="font-serif italic text-slate-500 text-[10px] text-left">
                    Opening Map <br />
                    Consulting Group
                  </div>
                  {/* Simulated Official Seal Stamp in Gold CSS */}
                  <div className="w-14 h-14 rounded-full border-4 border-double border-[#C5A059] text-[#C5A059] font-black text-[9px] flex flex-col items-center justify-center font-sans uppercase tracking-tighter transform rotate-12 select-none shrink-0 bg-white">
                    <span>OFFICIAL</span>
                    <span className="border-t border-b py-0.5 text-[#0B3B24] border-[#C5A059]">SEAL</span>
                    <span>OPENING</span>
                  </div>
                </div>
              </div>

              {/* Sheet Page Margin seal */}
              <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[9px] text-slate-400 border-t pt-2">
                <span>오프닝맵 창업진단 PREMIUM 레포트 • Page 2 of 2</span>
                <span>© 2016 - 2026 Opening Map Corp. Registered partner with Korea University.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Excel Upload Result Popup Modal */}
      {uploadModalResult && uploadModalResult.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header portion with deep colors */}
            <div className={`px-5 py-4 flex items-center space-x-3 text-white ${uploadModalResult.success
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                : 'bg-gradient-to-r from-rose-600 to-red-700'
              }`}>
              {uploadModalResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-100 flex-shrink-0 animate-bounce" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-100 flex-shrink-0 animate-pulse" />
              )}
              <h3 className="font-extrabold text-base tracking-tight">
                {uploadModalResult.title}
              </h3>
            </div>

            {/* Content portion */}
            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <p className="text-slate-800 font-extrabold text-xs sm:text-sm leading-snug">
                  {uploadModalResult.message}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  처리 일시: {new Date().toLocaleString()}
                </div>
              </div>

              {uploadModalResult.details && (
                <div className="bg-slate-50 border border-slate-250 rounded-lg p-3 text-xs text-slate-600 font-medium whitespace-pre-line leading-relaxed font-mono select-all max-h-48 overflow-y-auto">
                  {uploadModalResult.details}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  id="excel_modal_close_btn"
                  onClick={() => setUploadModalResult(null)}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all text-white shadow-sm hover:shadow active:scale-95 focus:outline-none focus:ring-2 ${uploadModalResult.success
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                    }`}
                >
                  확인 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert/Confirm Promise-based Modal Dialog */}
      {modalDialog && modalDialog.isOpen && (
        <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#C5A059]/20 max-w-sm w-full overflow-hidden animate-in zoom-in duration-200">
            {/* Header: Forest green with gold accents */}
            <div className="bg-gradient-to-r from-[#0B3B24] to-[#124e31] px-5 py-4 flex items-center space-x-3 text-white">
              <span className="p-1.5 bg-white/10 rounded-full shrink-0">
                {modalDialog.type === "confirm" ? (
                  <AlertTriangle className="w-5 h-5 text-[#C5A059]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#C5A059]" />
                )}
              </span>
              <h3 className="font-extrabold text-sm tracking-tight text-white uppercase font-sans">
                {modalDialog.title}
              </h3>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5">
              <p className="text-slate-700 text-xs sm:text-sm font-extrabold leading-relaxed text-center whitespace-pre-line">
                {modalDialog.message}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {modalDialog.type === "confirm" && (
                  <button
                    type="button"
                    onClick={() => modalDialog.onCancel?.()}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all hover:shadow-sm active:scale-95 cursor-pointer"
                  >
                    {modalDialog.cancelText || "취소"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => modalDialog.onConfirm()}
                  className="flex-1 py-2.5 px-4 bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer border border-[#C5A059]/30"
                >
                  {modalDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmState && deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Warning gradient header */}
            <div className="bg-gradient-to-r from-rose-600 to-red-700 px-6 py-5 flex items-center space-x-3 text-white">
              <span className="p-2 bg-white/10 rounded-full shrink-0">
                <Trash2 className="w-5 h-5 text-rose-100" />
              </span>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">신청자 데이터 신속 파기</h3>
                <p className="text-[10px] text-rose-100/85">영구 파기 처리 (복구 불가)</p>
              </div>
            </div>

            {/* Modal Body Info */}
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-200/60 p-4 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 space-y-1">
                  <span className="font-black block text-rose-900">경고: 데이터 영구 삭제</span>
                  <p className="leading-relaxed font-semibold">
                    이 조치는 백업되지 않으며, 선택한 신상 정보 및 정밀 통계 지표가 영구적으로 자동 파괴됩니다.
                  </p>
                </div>
              </div>

              <div className="text-slate-700 text-sm py-1 font-semibold leading-relaxed">
                {deleteConfirmState.isBatch ? (
                  <div>
                    선택한 신청자 총 <strong className="text-rose-600 font-extrabold text-base underline decoration-2">{deleteConfirmState.targetIds?.length || 0}</strong>명의 데이터를 일괄 삭제하시겠습니까?
                  </div>
                ) : (
                  <div>
                    정말로 <strong className="text-rose-600 font-extrabold text-base">'{deleteConfirmState.targetName}'</strong> 원장님의 진단 평가 및 세션 기록을 즉시 삭제하시겠습니까?
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmState(null)}
                  className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-lg transition-all active:scale-95 border border-slate-300"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmState.isBatch) {
                      executeBatchDelete(deleteConfirmState.targetIds || []);
                    } else {
                      executeSingleDelete(deleteConfirmState.targetId || "", deleteConfirmState.targetName || "");
                    }
                  }}
                  className="w-1/2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-lg transition-all active:scale-95 shadow-sm hover:shadow"
                >
                  확실히 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Video Preview Modal */}
      {adminPreviewVideo && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm font-sans animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0B3B24] to-[#124e31] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-white/10 rounded-lg">
                  <Play className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                </span>
                <span className="font-extrabold text-sm tracking-tight">홍보 동영상 미리보기</span>
              </div>
              <button
                type="button"
                onClick={() => setAdminPreviewVideo(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="p-6 space-y-4">
              <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-inner">
                {extractYoutubeId(adminPreviewVideo.youtubeUrl || "") ? (
                  <iframe
                    className="w-full h-full border-0"
                    src={`https://www.youtube.com/embed/${extractYoutubeId(adminPreviewVideo.youtubeUrl)}?autoplay=1&rel=0&modestbranding=1`}
                    title={adminPreviewVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <span className="font-extrabold text-xs text-rose-500 mb-2">유튜브 비디오 ID 추출 실패</span>
                    <p className="text-[11px] leading-relaxed max-w-sm">
                      올바른 유튜브 주소(URL) 또는 11자리 비디오 코드가 아닙니다. 등록된 주소를 확인해 주세요: <br />
                      <span className="font-mono text-[10px] text-slate-500 mt-1 block break-all">{adminPreviewVideo.youtubeUrl}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start justify-between">
                  <h4 className="font-black text-slate-800 text-sm tracking-tight">{adminPreviewVideo.title}</h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded shrink-0">
                    상영시간: {adminPreviewVideo.duration || "N/A"}
                  </span>
                </div>
                {adminPreviewVideo.desc && (
                  <p className="text-xs text-slate-500 leading-relaxed">{adminPreviewVideo.desc}</p>
                )}
              </div>

              {/* Confirm/Close Button */}
              <button
                type="button"
                onClick={() => setAdminPreviewVideo(null)}
                className="w-full py-2.5 bg-[#0B3B24] hover:bg-[#062919] text-white font-extrabold text-xs rounded-lg transition-all active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[10010] flex flex-col space-y-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-xl border flex items-start space-x-3 pointer-events-auto text-xs font-extrabold leading-relaxed transition-all ${toast.type === "success"
                  ? "bg-[#0B3B24] border-[#C5A059]/40 text-white"
                  : toast.type === "error"
                    ? "bg-rose-950 border-rose-500/40 text-white"
                    : "bg-slate-900 border-slate-700/40 text-white"
                }`}
            >
              <span className="shrink-0 pt-0.5">
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#C5A059] animate-pulse" />
                ) : toast.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-rose-300" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
              </span>
              <div className="flex-1">
                <p className="text-[11px] sm:text-xs font-extrabold tracking-tight">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-white/60 hover:text-white shrink-0 font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
