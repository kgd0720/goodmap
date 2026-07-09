import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  FileText,
  Eye,
  Download,
  ChevronRight,
  Video,
  Youtube,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Sparkles,
  Award,
  ShieldCheck,
  Check,
  BookOpen,
  Users,
  TrendingUp,
  HelpCircle,
  FileSpreadsheet,
  BookMarked,
  X
} from "lucide-react";

interface BrandViewProps {
  setView: (view: "hub" | "brand" | "home" | "step1" | "step2" | "quiz" | "result" | "admin" | "schedule" | "timetable") => void;
}

export default function BrandView({ setView }: BrandViewProps) {
  const [brandTab, setBrandTab] = useState<"brochure" | "video">("brochure");
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);

  // Dynamic brand configurations fetched from the backend
  const [brochures, setBrochures] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Digital Brochure Viewer States
  const [selectedBrochure, setSelectedBrochure] = useState<any | null>(null);
  const [viewerPage, setViewerPage] = useState<number>(0); // 0 to 5 (6 pages total)
  const [viewerZoom, setViewerZoom] = useState<number>(1.0); // 1.0x to 2.5x max zoom
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchEndX, setTouchEndX] = useState<number>(0);
  const [fitMode, setFitMode] = useState<"width" | "height">("width");

  // PDF Book Flip States (for uploaded PDF brochures)
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [pdfTouchStartX, setPdfTouchStartX] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Determine screen size for 2-page PC spread vs 1-page mobile/tablet view
  const [isPc, setIsPc] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPc(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("/api/brand-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setBrochures(data.config.brochures || []);
          setVideos(data.config.videos || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch brand config, using static fallback:", err);
        setLoading(false);
      });
  }, []);

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

  // Simulated video playback timer (only used for non-youtube fallback)
  useEffect(() => {
    let timer: any;
    if (videoPlaying && videos[activeVideoIndex] && !extractYoutubeId(videos[activeVideoIndex].youtubeUrl)) {
      timer = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            setVideoPlaying(false);
            return 100;
          }
          return prev + 2.5;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [videoPlaying, activeVideoIndex, videos]);

  const currentVideo = videos[activeVideoIndex] || null;

  // Render dummy subtitle captions for the default/fallback videos
  const getSimulatedCaption = () => {
    if (!currentVideo) return "";
    if (currentVideo.id === "v-default-1") {
      if (videoProgress < 20) return "안녕하세요, KY Academy 대표 컨설턴트입니다. 저희 브랜드를 방문해 주셔서 환영합니다.";
      if (videoProgress < 45) return "학부모와 예비 원장님들이 모두 찬사하는 KY Academy만의 특별한 커리큘럼을 소개합니다.";
      if (videoProgress < 70) return "저희는 10년간 축적된 현장 진단 분석 데이터를 통해 맞춤형 명품 클래스를 실현해 드립니다.";
      if (videoProgress < 95) return "본사와 지점이 함께 성장하는 정직한 파트너십을 바탕으로, 원장님의 평생 교육 동반자가 되겠습니다.";
      return "지금 KY Academy와 함께 독보적인 영어 교육의 프리미엄을 경험해 보세요.";
    }
    if (currentVideo.id === "v-default-2") {
      if (videoProgress < 20) return "반갑습니다! 저는 작년까지 개인 보습 학원을 운영하다가 KY Academy로 전환한 대치 캠퍼스 원장입니다.";
      if (videoProgress < 40) return "전환 당시 가장 고민했던 부분이 교재 수급과 본사의 강압적인 인테리어 비용 요구였는데요.";
      if (videoProgress < 65) return "KY Academy는 본사 마진 거품을 완전히 빼고 자율 인테리어를 보장해주어 창업 비용을 크게 절감했습니다.";
      if (videoProgress < 85) return "특히 첫 학부모 설명회 때 본사 수석 소장님이 직접 오셔서 마감 인원을 달성해 주셨던 게 가장 큰 힘이었습니다.";
      return "지금은 대치지역에서 최고 평판을 받으며 매달 학부모 소개가 이어지고 있습니다. 강력 추천해 드려요!";
    }
    if (currentVideo.id === "v-default-3") {
      if (videoProgress < 25) return "KY Academy의 자랑인 최첨단 스마트 AI 교실에 오신 것을 환영합니다.";
      if (videoProgress < 50) return "원생들은 등원과 동시에 스마트 패드를 통해 개별화된 자기주도 맞춤 피드백 과정을 수행합니다.";
      if (videoProgress < 75) return "원장님이나 교사가 일일이 채점할 필요 없이, AI 음성 분석기가 악센트와 인토네이션을 완벽 보정합니다.";
      if (videoProgress < 95) return "오늘 배운 핵심 어휘와 대화문은 수업이 끝나기 5분 전 리포트로 자동 생성되어 학부모님 스마트폰으로 전송됩니다.";
      return "교육 효과는 극대화되고 원장님의 업무 효율은 3배 향상되는 미래형 스마트 교실을 경험하십시오.";
    }
    return "영상을 재생하면 가상 자막이 여기에 실시간으로 표시됩니다.";
  };

  // Digital Brochure Navigation Logics
  const handleNextPage = () => {
    if (isPc) {
      if (viewerPage === 0) setViewerPage(1);
      else if (viewerPage === 1 || viewerPage === 2) setViewerPage(3);
      else if (viewerPage === 3 || viewerPage === 4) setViewerPage(5);
    } else {
      setViewerPage((prev) => Math.min(5, prev + 1));
    }
    // Reset zoom & pan when turning pages
    setViewerZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePrevPage = () => {
    if (isPc) {
      if (viewerPage === 5) setViewerPage(3);
      else if (viewerPage === 3 || viewerPage === 4) setViewerPage(1);
      else if (viewerPage === 1 || viewerPage === 2) setViewerPage(0);
    } else {
      setViewerPage((prev) => Math.max(0, prev - 1));
    }
    // Reset zoom & pan when turning pages
    setViewerZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mobile Touch Swiping & Drag Panning Event Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const clientX = e.targetTouches[0].clientX;
    const clientY = e.targetTouches[0].clientY;

    setTouchStartX(clientX);
    setTouchEndX(clientX);

    if (viewerZoom > 1.0) {
      setIsDragging(true);
      setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const clientX = e.targetTouches[0].clientX;
    const clientY = e.targetTouches[0].clientY;

    setTouchEndX(clientX);

    if (viewerZoom > 1.0 && isDragging) {
      const newX = clientX - dragStart.x;
      const newY = clientY - dragStart.y;

      const maxPanX = (viewerZoom - 1) * 350;
      const maxPanY = (viewerZoom - 1) * 450;
      setPanOffset({
        x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
        y: Math.min(maxPanY, Math.max(-maxPanY, newY))
      });
    }
  };

  const handleTouchEnd = () => {
    if (viewerZoom > 1.0) {
      setIsDragging(false);
      return;
    }

    const diff = touchStartX - touchEndX;
    if (diff > 60) {
      handleNextPage();
    } else if (diff < -60) {
      handlePrevPage();
    }
  };

  // Zoom control handlers (Max 2.5x limit, Min 1.0x)
  const handleZoomIn = () => {
    setViewerZoom((prev) => Math.min(2.5, prev + 0.25));
  };

  const handleZoomOut = () => {
    setViewerZoom((prev) => {
      const nextZoom = Math.max(1.0, prev - 0.25);
      if (nextZoom === 1.0) {
        setPanOffset({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const handleResetZoom = () => {
    setViewerZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse drag panning when zoomed
  const handleDragStart = (clientX: number, clientY: number) => {
    if (viewerZoom <= 1.0) return;
    setIsDragging(true);
    setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || viewerZoom <= 1.0) return;
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    const maxPanX = (viewerZoom - 1) * 350;
    const maxPanY = (viewerZoom - 1) * 450;
    setPanOffset({
      x: Math.min(maxPanX, Math.max(-maxPanX, newX)),
      y: Math.min(maxPanY, Math.max(-maxPanY, newY))
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Render highly-polished, legible, premium digital catalog page layout
  const renderDigitalPage = (pageIndex: number) => {
    switch (pageIndex) {
      case 0: // PAGE 1: COVER
        return (
          <div className="w-full h-full bg-gradient-to-b from-[#0A331F] to-[#041D12] text-white flex flex-col justify-between p-6 sm:p-10 border-4 border-[#C5A059] relative overflow-hidden select-none shadow-inner rounded-xl">
            {/* Background watermarks */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Page Header */}
            <div className="flex justify-between items-center border-b border-[#C5A059]/30 pb-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#C5A059] flex items-center justify-center text-[10px] font-black text-[#0B3B24]">K</span>
                <span className="font-mono text-xs font-black tracking-widest text-[#C5A059]">KY ACADEMY</span>
              </div>
              <span className="text-[9px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/40 px-2 py-0.5 rounded-full font-black tracking-widest">
                OFFICIAL GUIDE
              </span>
            </div>

            {/* Page Body */}
            <div className="my-auto text-center space-y-6 py-4">
              <div className="inline-block px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-full text-[10px] font-bold text-[#C5A059] tracking-wider">
                고려대학교 협약 파트너 브랜드
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight leading-tight text-white">
                  KY ACADEMY
                </h1>
                <p className="text-[#C5A059] font-black text-sm tracking-widest uppercase font-mono">
                  Franchise & Opening Guide
                </p>
              </div>

              <div className="w-12 h-0.5 bg-[#C5A059] mx-auto my-3" />

              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-extrabold text-slate-100 tracking-tight leading-relaxed">
                  2026 프리미엄 가맹 개설 안내서
                </p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold max-w-xs mx-auto leading-relaxed">
                  수익성과 교육의 품격을 동시에 극대화하는 검증된 원스톱 영어 전문 학원 성공 모델
                </p>
              </div>

              <div className="pt-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#C5A059] mx-auto flex items-center justify-center bg-white/5 shadow-md">
                  <Sparkles className="w-6 h-6 text-[#C5A059] animate-pulse" />
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-[#C5A059]/20 pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono">
              <span>© KY ACADEMY CORP.</span>
              <span>PAGE 01</span>
            </div>
          </div>
        );

      case 1: // PAGE 2: CURRICULUM
        return (
          <div className="w-full h-full bg-white text-slate-800 flex flex-col justify-between p-6 sm:p-8 border border-slate-200 select-none rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <span className="text-[10px] text-emerald-700 font-black tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#C5A059]" /> BRAND CURRICULUM
              </span>
              <span className="text-[9px] text-slate-400 font-mono">PAGE 02</span>
            </div>

            {/* Body */}
            <div className="my-auto space-y-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-[#0B3B24]">8단계 프리미엄 독보적 커리큘럼</h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                  초등 기초 파닉스 과정부터 외고/자사고 수능 대비 및 에세이 토론까지 빈틈없이 연결됩니다.
                </p>
              </div>

              {/* Grid of 4 selected key curriculum milestones for mobile readability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0B3B24] text-[#C5A059] text-[9px] font-black flex items-center justify-center">1</span>
                    <span className="font-bold text-xs text-[#0B3B24]">Starter Phonics</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    음성학 원리를 바탕으로 한 영단어 읽기 완성 및 완벽한 소리 조합 마스터. (초등 1~2)
                  </p>
                </div>

                <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0B3B24] text-[#C5A059] text-[9px] font-black flex items-center justify-center">2</span>
                    <span className="font-bold text-xs text-blue-900">Bridge Speaking</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    감각적인 멀티미디어 훈련과 문장 중심의 말하기를 통한 영어 발화 극대화. (초등 3~4)
                  </p>
                </div>

                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0B3B24] text-[#C5A059] text-[9px] font-black flex items-center justify-center">3</span>
                    <span className="font-bold text-xs text-indigo-950">Elite Debate & Essay</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    시사 토론 주제를 통한 논리적 영어 문장 완성 및 에세이 정밀 1:1 피드백. (초등 5~중등 1)
                  </p>
                </div>

                <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-lg space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#0B3B24] text-[#C5A059] text-[9px] font-black flex items-center justify-center">4</span>
                    <span className="font-bold text-xs text-purple-950">Honors Scholars</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    수능 만점 정복, 텝스, 영문학 디베이트 및 원어민급 스피치 기획력 장착. (중등 2~3)
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-[9px] text-slate-500 leading-relaxed">
                📢 <strong className="text-slate-700">원장님 혜택:</strong> 모든 커리큘럼 교재 파일 및 티칭 가이드북, 멀티미디어 교안이 스마트패드로 전량 지원되어 교사 수급 및 교재 준비 시간이 90% 단축됩니다.
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-3 flex justify-between items-center text-[9px] text-slate-400">
              <span>KY ACADEMY LEADING ENGLISH</span>
              <span>고려대 산학협력관 502호</span>
            </div>
          </div>
        );

      case 2: // PAGE 3: SMART AI CLASSROOM
        return (
          <div className="w-full h-full bg-[#0B1E14] text-slate-200 flex flex-col justify-between p-6 sm:p-8 border border-[#164E33] select-none rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 border-emerald-900/40">
              <span className="text-[10px] text-[#C5A059] font-black tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" /> FUTURE SYSTEM
              </span>
              <span className="text-[9px] text-emerald-500 font-mono">PAGE 03</span>
            </div>

            {/* Body */}
            <div className="my-auto space-y-4">
              <div className="space-y-1">
                <span className="text-[#C5A059] text-[9px] font-bold block uppercase tracking-widest font-mono">스마트 하이 테크놀로지</span>
                <h2 className="text-base sm:text-lg font-black text-white leading-tight">스마트 AI 미래형 클래스룸</h2>
                <p className="text-[10px] sm:text-xs text-emerald-400/80 font-medium">
                  원격 발음 솔루션과 자동 LMS 리포트를 이용한 1인 스마트 학습 솔루션입니다.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 bg-black/30 p-3 rounded-lg border border-emerald-950">
                  <span className="text-xl shrink-0">🎙️</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-[#C5A059]">실시간 AI 발음 인토네이션 분석</h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      인공지능 분석 모듈이 학생의 억양과 액센트를 1:1로 판독하여 정밀한 즉시 피드백을 제공합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-black/30 p-3 rounded-lg border border-emerald-950">
                  <span className="text-xl shrink-0">📊</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-white">원클릭 스마트 LMS 리포트</h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      등/하원 출결 처리와 동시에 오늘 학습한 단어, 디베이트 성취도 분석표가 학부모 앱으로 즉시 자동 발송됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-black/30 p-3 rounded-lg border border-emerald-950">
                  <span className="text-xl shrink-0">🖨️</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-white">개인 맞춤 오답 프린트 지원</h4>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      틀린 유형의 문제를 실시간으로 파악하여 무제한 개인화 워크시트를 즉시 프린터에서 자동 추출 인쇄합니다.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[9px] text-[#C5A059] bg-[#C5A059]/5 border border-[#C5A059]/20 p-2 rounded text-center font-semibold">
                원장이 1명씩 채점할 필요가 전혀 없어 노동 효율이 3배 극대화됩니다!
              </p>
            </div>

            {/* Footer */}
            <div className="border-t pt-3 flex justify-between items-center text-[9px] text-emerald-600 font-mono">
              <span>KY AI CLASSROOM ENGINE</span>
              <span>SECURE ACCESS</span>
            </div>
          </div>
        );

      case 3: // PAGE 4: HQ SUPPORT PACKAGES
        return (
          <div className="w-full h-full bg-white text-slate-800 flex flex-col justify-between p-6 sm:p-8 border border-slate-200 select-none rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <span className="text-[10px] text-amber-700 font-black tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" /> ONE-STOP SERVICE
              </span>
              <span className="text-[9px] text-slate-400 font-mono">PAGE 04</span>
            </div>

            {/* Body */}
            <div className="my-auto space-y-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-[#0B3B24]">개원 전후 단계별 본사 원스톱 밀착 케어</h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold leading-relaxed">
                  본사의 전담 개원 서포터즈가 학원 등록 심사부터 학부모 1차 모집 완료까지 모든 관정을 무료로 동반합니다.
                </p>
              </div>

              {/* Steps timeline cards */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 p-2 border-l-4 border-l-[#0B3B24] bg-slate-50 rounded-r-lg">
                  <span className="text-[10px] font-black bg-[#0B3B24] text-[#C5A059] px-2 py-0.5 rounded font-mono">1단계</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">정밀 상권 실사 및 입지 확정 (개원 2달 전)</h4>
                    <p className="text-[9px] text-slate-500">본사 마케팅팀 소장이 인근 초교 통학 경로 및 정밀 가구 소득 실사</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-2 border-l-4 border-l-[#C5A059] bg-slate-50 rounded-r-lg">
                  <span className="text-[10px] font-black bg-[#C5A059] text-white px-2 py-0.5 rounded font-mono">2단계</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">본사 집중 입문 원장 연수 (개원 1달 전)</h4>
                    <p className="text-[9px] text-slate-500">학사 경영, 교수법 실무 시뮬레이션, 학원법 세무 완벽 이수 지원</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-2 border-l-4 border-l-[#0B3B24] bg-slate-50 rounded-r-lg">
                  <span className="text-[10px] font-black bg-[#0B3B24] text-[#C5A059] px-2 py-0.5 rounded font-mono">3단계</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">본사 연사 무상 파견 학부모 설명회 (개원 2주 전)</h4>
                    <p className="text-[9px] text-slate-500">수억 매출 신화 수석 소장이 직접 방문하여 1차 대인 모집 전량 마감 지원</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-2 border-l-4 border-l-[#C5A059] bg-slate-50 rounded-r-lg">
                  <span className="text-[10px] font-black bg-[#C5A059] text-white px-2 py-0.5 rounded font-mono">4단계</span>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">신학기 오프닝 인근 마케팅 지원 (개원 후 1달)</h4>
                    <p className="text-[9px] text-slate-500">포털 노출, 아파트 게시판 광고 대행 및 고려대 파트너 현수막 공급</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-3 flex justify-between items-center text-[9px] text-slate-400">
              <span>KY HEADQUARTERS SUPPORT</span>
              <span>CONSULTING TEAM</span>
            </div>
          </div>
        );

      case 4: // PAGE 5: TERRITORY & PROFIT SIMULATION
        return (
          <div className="w-full h-full bg-slate-50 text-slate-800 flex flex-col justify-between p-6 sm:p-8 border border-slate-200 select-none rounded-xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 border-slate-200">
              <span className="text-[10px] text-[#0B3B24] font-black tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#C5A059]" /> EXCLUSIVE TERRITORY & PROFIT
              </span>
              <span className="text-[9px] text-slate-400 font-mono">PAGE 05</span>
            </div>

            {/* Body */}
            <div className="my-auto space-y-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-[#0B3B24] tracking-tight">상권 독점 안심 보장과 정밀 수익 시뮬레이션</h2>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  반경 내 3개 초교 상권을 무조건 완벽하게 독점 보장하며, 마진 거품을 완전히 뺀 투명한 수익 시뮬레이션입니다.
                </p>
              </div>

              {/* Simulated Profit Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px] bg-white shadow-sm">
                <div className="bg-slate-100 p-2 font-bold text-slate-700 grid grid-cols-3 border-b text-center">
                  <span>항목 구분</span>
                  <span>원생 50명 (교습소)</span>
                  <span>원생 100명 (대형)</span>
                </div>
                <div className="p-2 border-b grid grid-cols-3 text-center text-slate-600">
                  <span className="font-bold">월 수강 총 매출</span>
                  <span className="text-emerald-700 font-bold">13,000,000 원</span>
                  <span className="text-[#0B3B24] font-black">26,000,000 원</span>
                </div>
                <div className="p-2 border-b grid grid-cols-3 text-center text-slate-600">
                  <span>총 임대료/관리비</span>
                  <span>1,500,000 원</span>
                  <span>3,000,000 원</span>
                </div>
                <div className="p-2 border-b grid grid-cols-3 text-center text-slate-600">
                  <span>인건비 및 소모품</span>
                  <span>2,300,000 원</span>
                  <span>3,500,000 원</span>
                </div>
                <div className="p-2 border-b grid grid-cols-3 text-center text-slate-600">
                  <span>본사 로열티 (5%)</span>
                  <span>650,000 원</span>
                  <span>1,300,000 원</span>
                </div>
                <div className="bg-[#0B3B24]/5 p-2 font-black grid grid-cols-3 text-center text-[#0B3B24] border-t-2 border-t-[#0B3B24]/15">
                  <span>원장 최종 순수익</span>
                  <span className="text-emerald-700">8,550,000 원</span>
                  <span className="text-amber-800">18,200,000 원</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-lg">
                <span className="text-xs text-[#C5A059]">👑</span>
                <p className="text-[9px] text-[#0B3B24] leading-relaxed font-semibold">
                  <strong>상권 독점 특약:</strong> 계약서 내에 가맹점 반경 초등학교 3곳을 지정하여, 해당 학군 내 신규 가맹 출점을 100% 영구적으로 거부 및 차단합니다. (상권 양도양수 보장 가능)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-3 flex justify-between items-center text-[9px] text-slate-400 font-mono">
              <span>KY ACADEMY EXCLUSIVE METRICS</span>
              <span>RELIABILITY FIRST</span>
            </div>
          </div>
        );

      case 5: // PAGE 6: BACK COVER
        return (
          <div className="w-full h-full bg-[#041D12] text-white flex flex-col justify-between p-6 sm:p-10 border-4 border-[#C5A059] relative overflow-hidden select-none shadow-inner rounded-xl">
            {/* Background vector decoration */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#C5A059]/5 rounded-full pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-64 h-32 bg-emerald-500/5 rounded-t-full blur-2xl pointer-events-none" />

            {/* Page Header */}
            <div className="text-center">
              <span className="text-[9px] border border-[#C5A059]/40 text-[#C5A059] px-2.5 py-0.5 rounded-full font-black tracking-widest font-mono">
                PARTNER BRAND WITH KOREA UNIVERSITY
              </span>
            </div>

            {/* Main content */}
            <div className="my-auto text-center space-y-5">
              <div className="w-12 h-12 bg-white/5 border border-[#C5A059]/30 rounded-full flex items-center justify-center mx-auto shadow-md">
                <span className="text-[#C5A059] text-lg font-black font-serif">KY</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-[#C5A059]">KY ACADEMY</h2>
                <p className="text-[10px] text-slate-300 font-medium tracking-tight">성공적인 학원 경영의 확실한 로드맵</p>
              </div>

              <div className="w-8 h-px bg-slate-600 mx-auto" />

              <div className="space-y-1.5 text-[10px] text-slate-400 leading-relaxed font-semibold">
                <p>본사 주소: 서울특별시 성북구 안암로 145 고려대학교 산학관 502호</p>
                <p>전화 번호: 1544-2026 (가맹 담당자 직통 연결)</p>
                <p>공식 메일: partner@kyacademy.co.kr</p>
              </div>

              <div className="pt-3">
                <p className="text-[11px] text-[#C5A059] font-black italic">
                  "원장님의 교육 열정에 고려대학교 파트너십의 신뢰를 더합니다."
                </p>
              </div>
            </div>

            {/* Page Footer */}
            <div className="border-t border-[#C5A059]/20 pt-4 text-center text-[9px] text-slate-500 font-mono">
              <span>© 2026 KY ACADEMY CORP. ALL RIGHTS RESERVED.</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Spread layouts calculation for PC
  const getPcSpreadIndices = (pageIdx: number): [number, number | null] => {
    if (pageIdx === 0) return [0, null]; // Cover
    if (pageIdx === 1 || pageIdx === 2) return [1, 2]; // Spread 1
    if (pageIdx === 3 || pageIdx === 4) return [3, 4]; // Spread 2
    return [5, null]; // Back Cover
  };

  const spreadIndices = getPcSpreadIndices(viewerPage);

  // PDF Book-flip navigation helpers
  // On PC: advance 2 pages at a time (book spread), on mobile: 1 page at a time
  const goNextPdfPage = () => {
    if (isFlipping || pdfCurrentPage >= pdfTotalPages) return;
    setFlipDirection("right");
    setIsFlipping(true);
    setTimeout(() => {
      setPdfCurrentPage(p => {
        const step = isPc ? 2 : 1;
        return Math.min(pdfTotalPages, p + step);
      });
      setIsFlipping(false);
    }, 400);
  };
  const goPrevPdfPage = () => {
    if (isFlipping || pdfCurrentPage <= 1) return;
    setFlipDirection("left");
    setIsFlipping(true);
    setTimeout(() => {
      setPdfCurrentPage(p => {
        const step = isPc ? 2 : 1;
        return Math.max(1, p - step);
      });
      setIsFlipping(false);
    }, 400);
  };

  // Calculate the two-page spread for the current page on PC
  // Ensures left page is always odd-numbered for consistent book layout
  const getBookSpreadPages = (): [number, number | null] => {
    if (!isPc) return [pdfCurrentPage, null];
    // Make left page always odd (1, 3, 5, ...)
    const leftPage = pdfCurrentPage % 2 === 1 ? pdfCurrentPage : pdfCurrentPage - 1;
    const rightPage = leftPage + 1;
    if (leftPage < 1) return [1, pdfTotalPages >= 2 ? 2 : null];
    if (rightPage > pdfTotalPages) return [leftPage, null];
    return [leftPage, rightPage];
  };

  const renderCustomBrochureViewer = () => {
    if (!selectedBrochure) return null;

    // Backwards compatibility for old data that might not have a type field
    const isPdf = selectedBrochure.type === 'pdf' || (!selectedBrochure.type && selectedBrochure.url && (selectedBrochure.url.toLowerCase().endsWith(".pdf") || selectedBrochure.filename?.toLowerCase().endsWith(".pdf")));
    const isImages = selectedBrochure.type === 'images' || (!isPdf && selectedBrochure.urls && selectedBrochure.urls.length > 0);

    if (isPdf || isImages) {
      const [leftPage, rightPage] = getBookSpreadPages();

      return (
        <div
          className="flex-1 w-full h-full flex flex-col items-center justify-center select-none min-h-0 bg-slate-950"
          style={{ perspective: "1800px" }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goNextPdfPage();
            if (e.key === "ArrowLeft") goPrevPdfPage();
          }}
          tabIndex={0}
          onTouchStart={(e) => setPdfTouchStartX(e.targetTouches[0].clientX)}
          onTouchEnd={(e) => {
            const diff = pdfTouchStartX - e.changedTouches[0].clientX;
            if (diff > 60) goNextPdfPage();
            else if (diff < -60) goPrevPdfPage();
          }}
        >
          {/* Book stage container */}
          <div
            className="relative flex items-center justify-center w-full h-full mx-auto"
            style={{ containerType: "size" }}
          >
            {/* Left page turn arrow */}
            <button
              onClick={goPrevPdfPage}
              disabled={pdfCurrentPage <= 1 || isFlipping}
              className="absolute left-1 sm:left-3 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-[#C5A059] text-white flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-0 disabled:cursor-not-allowed shadow-lg hover:shadow-[#C5A059]/50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Book wrapper */}
            <AnimatePresence mode="wait">
              <motion.div
                key={leftPage}
                initial={{ rotateY: flipDirection === "right" ? 8 : -8, opacity: 0, scale: 0.97 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: flipDirection === "right" ? -8 : 8, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-stretch justify-center"
                style={{
                  width: "100%",
                  maxHeight: "100%",
                  maxWidth: isPc && rightPage ? "calc(100cqh * 1.414)" : "calc(100cqh * 0.707)",
                  aspectRatio: isPc && rightPage ? "1.414 / 1" : "1 / 1.414",
                  transformStyle: "preserve-3d" as const,
                  transformOrigin: "center center",
                }}
              >
                {/* Book Left Edge (spine shadow) */}
                {isPc && rightPage && (
                  <div
                    className="absolute left-1/2 top-0 bottom-0 z-20 w-8 -translate-x-1/2 pointer-events-none"
                    style={{
                      background: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0) 100%)",
                    }}
                  />
                )}

                {/* Left Page */}
                <div
                  className={`relative overflow-hidden ${isPc && rightPage ? "rounded-l-xl border-r-0" : "rounded-xl"} ${isImages ? "bg-transparent" : "bg-white"}`}
                  style={{
                    width: isPc ? "50%" : "100%",
                    height: "100%",
                    boxShadow: isPc && rightPage ? "inset -20px 0 40px -10px rgba(0,0,0,0.15), -10px 10px 40px rgba(0,0,0,0.3)" : "0 10px 40px rgba(0,0,0,0.3)"
                  }}
                >
                  {/* Book spine decoration (left edge) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 z-10 w-4 bg-gradient-to-r from-[#041D12] to-[#0B3B24] border-r border-[#C5A059]/30 flex flex-col items-center justify-center gap-1 select-none pointer-events-none"
                    style={{ boxShadow: "inset -3px 0 8px rgba(0,0,0,0.4)" }}
                  >
                    <div className="w-0.5 h-8 bg-[#C5A059]/30 rounded" />
                    <span className="text-[6px] text-[#C5A059]/50 font-black tracking-widest rotate-90 whitespace-nowrap">KY</span>
                    <div className="w-0.5 h-8 bg-[#C5A059]/30 rounded" />
                  </div>
                  {isImages ? (
                    <img
                      src={selectedBrochure.urls[leftPage - 1]}
                      alt={`Page ${leftPage}`}
                      className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none drop-shadow-md"
                      draggable="false"
                    />
                  ) : (
                    <iframe
                      ref={iframeRef}
                      src={`${selectedBrochure.url || (selectedBrochure.urls && selectedBrochure.urls[0])}#page=${leftPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      title={`${selectedBrochure.title} - Page ${leftPage}`}
                      className="w-full h-full border-0 bg-white"
                      style={{ display: "block" }}
                    />
                  )}
                  {/* Page number tag */}
                  <div className="absolute bottom-2 left-6 bg-black/50 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full pointer-events-none z-20">
                    {leftPage}
                  </div>
                  {/* Page shadow overlay during flip */}
                  {isFlipping && (
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        background: flipDirection === "right"
                          ? "linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 50%)"
                          : "linear-gradient(to left, rgba(0,0,0,0.2) 0%, transparent 50%)"
                      }}
                    />
                  )}
                </div>

                {/* Right Page (PC only, when available) */}
                {isPc && rightPage && (
                  <div
                    className={`relative overflow-hidden rounded-r-xl border-l-0 ${isImages ? "bg-transparent" : "bg-white"}`}
                    style={{
                      width: "50%",
                      height: "100%",
                      boxShadow: "inset 20px 0 40px -10px rgba(0,0,0,0.15), 10px 10px 40px rgba(0,0,0,0.3)"
                    }}
                  >
                    {isImages ? (
                      <img
                        src={selectedBrochure.urls[rightPage - 1]}
                        alt={`Page ${rightPage}`}
                        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none drop-shadow-md"
                        draggable="false"
                      />
                    ) : (
                      <iframe
                        src={`${selectedBrochure.url || (selectedBrochure.urls && selectedBrochure.urls[0])}#page=${rightPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        title={`${selectedBrochure.title} - Page ${rightPage}`}
                        className="w-full h-full border-0 bg-white"
                        style={{ display: "block" }}
                      />
                    )}
                    {/* Page number tag */}
                    <div className="absolute bottom-2 right-6 bg-black/50 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full pointer-events-none z-20">
                      {rightPage}
                    </div>
                    {/* Page curl shadow */}
                    <div
                      className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none z-20"
                      style={{ background: "radial-gradient(ellipse at bottom right, rgba(0,0,0,0.15) 0%, transparent 70%)" }}
                    />
                    {/* Page shadow overlay during flip */}
                    {isFlipping && (
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: flipDirection === "right"
                            ? "linear-gradient(to left, rgba(0,0,0,0.15) 0%, transparent 50%)"
                            : "linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 50%)"
                        }}
                      />
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Right page turn arrow */}
            <button
              onClick={goNextPdfPage}
              disabled={pdfCurrentPage >= pdfTotalPages || isFlipping}
              className="absolute right-1 sm:right-3 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-[#C5A059] text-white flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer disabled:opacity-0 disabled:cursor-not-allowed shadow-lg hover:shadow-[#C5A059]/50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Page controls */}
          <div className="absolute bottom-6 flex items-center justify-center pointer-events-none z-30">
            <div className="flex items-center bg-black/60 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 shadow-2xl">
              <span className="text-white font-bold text-[13px] font-mono tracking-[0.2em]">
                {isPc && rightPage ? `${leftPage}-${rightPage}` : pdfCurrentPage} / {pdfTotalPages}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 mt-3 font-medium">
            {isPc ? "← → 키보드로 2페이지씩 넘김 · 책처럼 펼쳐서 보기" : "← → 키보드 또는 좌우 스와이프로 페이지 이동"}
          </p>
        </div>
      );
    }

    // IMAGE brochure
    return (
      <div className="w-full h-full max-w-2xl max-h-[75vh] flex items-center justify-center bg-slate-950 rounded-xl overflow-auto p-4 shadow-2xl border border-slate-800">
        <img
          src={selectedBrochure.url}
          alt={selectedBrochure.title}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-full object-contain rounded shadow-lg"
        />
      </div>
    );
  };


  return (
    <motion.div
      key="view_brand"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      {/* Back and Title header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setView("hub")}
            className="p-2 bg-white hover:bg-slate-50 border rounded-lg text-[#0B3B24] transition-all shadow-sm flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">브랜드 알아보기</h1>
            <p className="text-slate-500 text-xs">KY Academy 본사에서 등록한 프리미엄 브로슈어 책자와 유튜브 홍보 영상을 확인합니다.</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="bg-slate-100 p-1.5 rounded-xl border flex items-center self-start sm:self-auto">
          <button
            onClick={() => {
              setBrandTab("brochure");
              setVideoPlaying(false);
            }}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${brandTab === "brochure"
              ? "bg-white text-[#0B3B24] shadow-sm"
              : "text-slate-600 hover:text-[#0B3B24]"
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>가맹브로슈어 보기</span>
          </button>
          <button
            onClick={() => {
              setBrandTab("video");
              setVideoProgress(0);
            }}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${brandTab === "video"
              ? "bg-white text-[#0B3B24] shadow-sm"
              : "text-slate-600 hover:text-[#0B3B24]"
              }`}
          >
            <Eye className="w-4 h-4" />
            <span>브랜드영상 보기</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 가맹 브로슈어 */}
      {brandTab === "brochure" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Brochures Panel */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="bg-white border rounded-2xl shadow-sm p-12 text-center">
                <div className="w-10 h-10 border-4 border-[#0B3B24] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-bold text-xs">본사 가맹 브로슈어를 불러오는 중입니다...</p>
              </div>
            ) : brochures.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base mb-2 px-1 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                  <span>등록된 본사 공식 브로슈어</span>
                </h3>
                {brochures.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className="bg-white border border-slate-200 hover:border-[#0B3B24]/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-[#0B3B24]/5 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-[#0B3B24]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{b.title}</h4>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{b.description || "등록된 설명이 없습니다."}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {b.filename || "Brochure.pdf"}
                          </span>
                          {b.uploadedAt && (
                            <span className="text-[10px] font-mono text-slate-400">
                              등록일: {new Date(b.uploadedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
                      <button
                        onClick={() => {
                          setSelectedBrochure(b);
                          setViewerPage(0);
                          setViewerZoom(1.0);
                          setPanOffset({ x: 0, y: 0 });
                          setPdfCurrentPage(1);
                          setPdfTotalPages(b.type === 'images' && b.urls ? b.urls.length : 20);
                          setIsFlipping(false);
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>바로보기</span>
                      </button>
                      {b.allowDownload === true && (
                        <a
                          href={b.url || (b.urls && b.urls[0])}
                          download={b.filename || "KY_Brochure.pdf"}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[#0B3B24] hover:bg-[#062919] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>다운로드</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border rounded-2xl shadow-sm p-12 text-center text-slate-500 font-semibold text-xs space-y-2">
                <p>본사에서 등록한 가맹 브로슈어 파일이 없습니다.</p>
                <p className="text-slate-400 font-normal">본사 관리자 계정에서 브로슈어를 신규 등록해 주십시오.</p>
              </div>
            )}
          </div>

          {/* Right Panel: Promo info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B3B24] text-white p-6 rounded-2xl shadow-sm border border-[#C5A059]/30 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
              <h3 className="font-extrabold text-base text-[#C5A059] mb-2">실물 브로슈어 소장 안내</h3>
              <p className="text-white/80 text-xs leading-relaxed mb-4 font-semibold">
                본사에서 공식 등록한 PDF 브로슈어를 내려받아 모바일 또는 지면에 인쇄하여 활용하실 수 있습니다. 가맹 개설 예산표 및 지역 상권 보장권 등을 정밀히 파악하세요.
              </p>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-slate-300 leading-relaxed font-medium">
                원격 상담 또는 내방 방문 시 등록된 공식 PDF 브로슈어를 원생 유치 상담 가이드북으로 대체 지출하실 수 있습니다.
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="font-black text-slate-800 text-sm border-b pb-2">가맹점 특별 프로모션</h4>
              <ul className="space-y-3 text-xs font-semibold text-slate-600">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>초교 3개 밀착 반경 내 1개 캠퍼스 독점 상권 완벽 보장</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>설명회 현수막 및 전단 인쇄 시안 100% 무상 커스텀</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>출결 및 태블릿 전용 학습 LMS 3개월 면제 혜택</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // TAB CONTENT: 브랜드 영상 보기
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Side: Video Player */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="bg-slate-900 rounded-2xl p-24 text-center border border-slate-800 text-slate-400 font-semibold text-xs animate-pulse">
                영상을 로드하는 중입니다...
              </div>
            ) : currentVideo ? (
              <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800 flex flex-col justify-between min-h-[440px]">
                {/* Embed Real YouTube Iframe Player or simulated fallback */}
                <div className="relative flex-1 bg-black min-h-[360px] flex items-center justify-center">
                  {extractYoutubeId(currentVideo.youtubeUrl || "") ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(currentVideo.youtubeUrl)}?autoplay=1&rel=0&modestbranding=1`}
                      title={currentVideo.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : videoPlaying ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 space-y-3 p-6 text-center">
                      <div className="flex space-x-1.5 items-center justify-center h-10">
                        <span className="w-1.5 h-6 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-1.5 h-10 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="w-1.5 h-8 bg-[#C5A059] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-xs font-bold tracking-wider text-slate-300">홍보 영상이 가상 스트리밍 재생 중입니다...</span>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-white space-y-4 z-10 max-w-md">
                      <button
                        onClick={() => {
                          setVideoPlaying(true);
                          if (videoProgress >= 100) setVideoProgress(0);
                        }}
                        className="w-16 h-16 rounded-full bg-[#C5A059] text-[#0B3B24] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shadow-lg mx-auto cursor-pointer"
                      >
                        <span className="text-xl ml-1">▶</span>
                      </button>
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg">{currentVideo.title}</h3>
                        <p className="text-[#C5A059] text-xs font-semibold mt-1">상영시간: {currentVideo.duration || "2분 30초"}</p>
                        <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">{currentVideo.desc}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtitle Caption Panel (Only rendered for non-youtube simulated video player) */}
                {!extractYoutubeId(currentVideo.youtubeUrl || "") && (
                  <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-3">
                    {/* Scrubber */}
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-mono text-slate-400">
                        00:{Math.floor(videoProgress * 1.5).toString().padStart(2, "0")}
                      </span>
                      <div
                        className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = Math.min(100, Math.max(0, Math.round((clickX / rect.width) * 100)));
                          setVideoProgress(pct);
                        }}
                      >
                        <div className="absolute top-0 left-0 h-full bg-[#C5A059]" style={{ width: `${videoProgress}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">03:00</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setVideoPlaying(!videoPlaying)}
                          className="text-[#C5A059] hover:text-white transition-colors text-xs font-bold bg-slate-900 px-3 py-1.5 rounded border border-slate-800 cursor-pointer"
                        >
                          {videoPlaying ? "❙❙ 일시정지" : "▶ 재생하기"}
                        </button>
                        <button
                          onClick={() => {
                            setVideoProgress(0);
                            setVideoPlaying(false);
                          }}
                          className="text-slate-400 hover:text-white transition-colors text-xs cursor-pointer"
                        >
                          처음부터
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">KY Player HD Mode</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-2xl p-24 text-center border border-slate-800 text-slate-400 font-semibold text-xs">
                현재 등록된 브랜드 동영상이 없습니다.
              </div>
            )}

            {/* Dynamic subtitles for simulated playback */}
            {currentVideo && !extractYoutubeId(currentVideo.youtubeUrl || "") && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-[#C5A059] tracking-widest font-extrabold uppercase block mb-1">
                  Live Caption Subtitle
                </span>
                <p className="text-white text-xs sm:text-sm font-medium leading-relaxed italic">
                  "{getSimulatedCaption()}"
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Playlist Selection */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <h4 className="font-black text-slate-800 text-sm border-b pb-2 mb-3 flex items-center space-x-2">
                <Video className="w-4 h-4 text-[#0B3B24]" />
                <span>영상 홍보 리스트 ({videos.length})</span>
              </h4>
              <div className="space-y-2 max-h-[380px] overflow-y-auto">
                {videos.map((vid, idx) => {
                  const isSelected = activeVideoIndex === idx;
                  const isYoutube = !!extractYoutubeId(vid.youtubeUrl || "");
                  return (
                    <button
                      key={vid.id || idx}
                      onClick={() => {
                        setActiveVideoIndex(idx);
                        setVideoProgress(0);
                        setVideoPlaying(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                        ? "border-[#0B3B24] bg-[#0B3B24]/5 shadow-sm"
                        : "border-slate-100 hover:bg-slate-50"
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-1 ${isSelected ? "bg-[#0B3B24] text-white" : "bg-slate-100 text-slate-600"
                            }`}
                        >
                          {isYoutube && <Youtube className="w-2.5 h-2.5 shrink-0 text-rose-500" />}
                          <span>VIDEO 0{idx + 1}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{vid.duration || "3분 00초"}</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-800 mt-2 line-clamp-1">{vid.title}</h5>
                      <p className="text-slate-500 text-[10px] line-clamp-2 mt-1 leading-normal font-semibold">
                        {vid.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 font-semibold space-y-2">
              <p className="font-bold">💡 실전 컨설턴트 한마디</p>
              <p className="leading-relaxed">
                "유튜브 실시간 라이브 영상 또는 본사 개원식 특강을 등록해 두시면 가맹을 고민하시는 신규 입점 원장님들에게 브랜드 가치 입증에 강력한 효과가 있습니다."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN PREMIUM DIGITAL CATALOG MODAL VIEW */}
      <AnimatePresence>
        {selectedBrochure && (() => {
          const isDefaultBrochure = selectedBrochure.id === "b-default-1";
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col justify-between overflow-hidden focus:outline-none"
              onKeyDown={(e) => {
                if (!isDefaultBrochure) return;
                if (e.key === "Escape") setSelectedBrochure(null);
                if (e.key === "ArrowRight") handleNextPage();
                if (e.key === "ArrowLeft") handlePrevPage();
              }}
              tabIndex={0}
            >
              {/* Top Toolbar */}
              <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-3 z-10 shrink-0">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => setSelectedBrochure(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>목록으로</span>
                  </button>
                  <div className="truncate">
                    <h3 className="text-white font-black text-xs sm:text-sm truncate">{selectedBrochure.title}</h3>
                    <p className="text-slate-400 text-[10px] font-medium truncate">
                      {isDefaultBrochure
                        ? "모바일 스와이프 지원 · 초고화질 디지털 카탈로그"
                        : "본사 등록 맞춤형 공식 안내 책자"
                      }
                    </p>
                  </div>
                </div>

                {/* View Original / Options */}
                <div className="flex items-center space-x-2 shrink-0">
                  {isDefaultBrochure && (
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">마우스 드래그 및 모바일 터치 드래그로 탐색 가능합니다.</span>
                  )}
                  <button
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(err => console.log(err));
                      } else {
                        document.exitFullscreen();
                      }
                    }}
                    className="px-3 py-1.5 bg-[#C5A059] hover:bg-[#b08d4b] text-white rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">확대하기</span>
                  </button>
                  {selectedBrochure.allowDownload === true && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedBrochure.urls && selectedBrochure.urls.length > 0) {
                            const win = window.open();
                            if (win) {
                              const imagesHtml = selectedBrochure.urls.map(url => `<img src="${url}" style="max-width:100%;height:auto;object-fit:contain;margin-bottom:20px;box-shadow:0 0 10px rgba(255,255,255,0.1);" />`).join("");
                              win.document.write(`
                                <html>
                                  <head><title>원본 파일 - ${selectedBrochure.title}</title></head>
                                  <body style="margin:0;display:flex;flex-direction:column;align-items:center;background:#111;padding:20px;">
                                    ${imagesHtml}
                                  </body>
                                </html>
                              `);
                              win.document.close();
                            }
                          } else if (selectedBrochure.url) {
                            window.open(selectedBrochure.url, "_blank");
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">원본 보기</span>
                      </button>
                      <a
                        href={selectedBrochure.url || (selectedBrochure.urls && selectedBrochure.urls[0])}
                        download={selectedBrochure.filename || "Brochure.pdf"}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-black flex items-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>다운로드</span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Main Interactive Stage */}
              <div
                className="flex-1 w-full flex items-center justify-center p-4 relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {/* Reset view overlay notification when zoomed */}
                {isDefaultBrochure && viewerZoom > 1.0 && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-xs text-[10px] text-slate-300 font-bold px-3 py-1 rounded-full z-10 pointer-events-none">
                    🔍 {Math.round(viewerZoom * 100)}% 확대 모드 (드래그로 탐색 가능)
                  </div>
                )}

                {/* Booklet Container with responsive dimensions strictly constrained */}
                {isDefaultBrochure ? (
                  <div
                    className="transition-transform duration-100 ease-out flex items-center justify-center"
                    style={{
                      transform: `scale(${viewerZoom}) translate(${panOffset.x / viewerZoom}px, ${panOffset.y / viewerZoom}px)`,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {/* Booklet Stage with maximum size restriction and auto height/width fit */}
                    <div
                      className={`relative select-none transition-all duration-300 flex items-center justify-center ${fitMode === "width"
                        ? "w-full max-w-[95vw] lg:max-w-[1050px]"
                        : "h-full max-h-[60vh] sm:max-h-[65vh] max-w-[90vw]"
                        }`}
                      style={{
                        maxWidth: isPc ? "1100px" : "400px",
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={viewerPage}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.25 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          {/* 2-PAGE PC SPREAD MODE */}
                          {isPc ? (
                            <div className="flex items-stretch justify-center gap-2.5 w-full h-[460px] sm:h-[520px] md:h-[560px] lg:h-[600px] max-h-[65vh]">
                              {spreadIndices[1] === null ? (
                                // Single Page (Cover or Back Cover) Centered
                                <div className="w-full max-w-[380px] h-full shadow-2xl border border-slate-800/40 rounded-xl relative overflow-hidden shrink-0">
                                  {renderDigitalPage(spreadIndices[0])}
                                </div>
                              ) : (
                                // Two Pages side by side
                                <>
                                  <div className="w-1/2 max-w-[390px] h-full shadow-2xl border-r border-slate-200/10 rounded-l-xl relative overflow-hidden">
                                    {renderDigitalPage(spreadIndices[0])}
                                  </div>
                                  <div className="w-1/2 max-w-[390px] h-full shadow-2xl border-l border-slate-200/10 rounded-r-xl relative overflow-hidden">
                                    {renderDigitalPage(spreadIndices[1])}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            // 1-PAGE TABLET & MOBILE MODE
                            <div className="w-full max-w-[380px] h-[460px] sm:h-[500px] max-h-[62vh] aspect-[3/4.2] shadow-2xl border border-slate-800/20 rounded-xl relative overflow-hidden shrink-0">
                              {renderDigitalPage(viewerPage)}
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  // CUSTOM UPLOADED BROCHURE - BOOK FLIP VIEWER
                  renderCustomBrochureViewer()
                )}



                {/* Overlay Navigation Buttons on PC view (visible only on hover or when mouse is active) */}
                {isDefaultBrochure && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevPage();
                      }}
                      disabled={viewerPage === 0}
                      className="absolute left-6 w-11 h-11 rounded-full bg-slate-900/75 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextPage();
                      }}
                      disabled={viewerPage === 5}
                      className="absolute right-6 w-11 h-11 rounded-full bg-slate-900/75 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Controls and Indicators */}
              {isDefaultBrochure ? (
                <div className="bg-slate-900/90 border-t border-slate-800 p-4 shrink-0 z-10 flex flex-col md:flex-row justify-between items-center gap-3">
                  {/* Screen Scale indicators */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="font-bold">🖥️ 화면 최적화:</span>
                    <button
                      onClick={() => setFitMode(fitMode === "width" ? "height" : "width")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${fitMode === "width"
                        ? "bg-emerald-800 text-white border-transparent"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                    >
                      화면 가로 맞춤 (Fit Width)
                    </button>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                      {isPc ? "💻 PC 2페이지 펼침뷰" : "📱 모바일 1페이지 단독뷰"}
                    </span>
                  </div>

                  {/* Page Number indicator */}
                  <div className="flex items-center space-x-4">
                    <div className="text-white text-xs font-black">
                      {isPc ? (
                        spreadIndices[1] === null ? (
                          <span>페이지: {spreadIndices[0] === 0 ? "표지 (Page 1)" : "뒷표지 (Page 6)"} / 6</span>
                        ) : (
                          <span>페이지: {spreadIndices[0] + 1} - {spreadIndices[1] + 1} / 6</span>
                        )
                      ) : (
                        <span>페이지: {viewerPage + 1} / 6</span>
                      )}
                    </div>

                    {/* Progress bar indicator */}
                    <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${((viewerPage + 1) / 6) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Zoom Board */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={viewerZoom <= 1.0}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="축소"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-slate-200 text-xs font-mono font-bold w-12 text-center">
                      {Math.round(viewerZoom * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      disabled={viewerZoom >= 2.5}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="확대 (최대 250%)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                      title="원래 크기"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/90 border-t border-slate-800 p-4 shrink-0 z-10 flex justify-between items-center text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">HQ Registered Custom Brochure Viewer</span>
                  <span className="font-mono text-[10px] text-slate-500">FORMAT: PDF/IMAGE</span>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
