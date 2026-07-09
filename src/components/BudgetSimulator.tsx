import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Settings, 
  MapPin, 
  Compass, 
  Activity, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Layout,
  BookOpen,
  PieChart as PieIcon,
  CircleAlert,
  BadgeAlert,
  Wallet,
  Coins
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface BudgetSimulatorProps {
  initialDesiredArea?: number;
  initialRegionalTier?: string;
  initialMyCapital?: number;
  onChange?: (data: { desiredArea: number; regionalTier: string; calculatedBudget: number; myCapital: number }) => void;
  readOnly?: boolean;
}

export const BudgetSimulator: React.FC<BudgetSimulatorProps> = ({
  initialDesiredArea = 30,
  initialRegionalTier = "Tier 2",
  initialMyCapital = 8000,
  onChange,
  readOnly = false
}) => {
  const [desiredArea, setDesiredArea] = useState<number>(initialDesiredArea);
  const [regionalTier, setRegionalTier] = useState<string>(initialRegionalTier);
  const [myCapital, setMyCapital] = useState<number>(initialMyCapital);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<"chart" | "list">("chart");

  // Cost calculation engine (Values in 'ten-thousand KRW' 만원)
  const costBreakdown = useMemo(() => {
    // 1. Interior: 190 ten-thousand KRW per 'pyeong' (premium eco-friendly design)
    const interior = desiredArea * 190;

    // 2. HVAC & Fire Safety: 16 ten-thousand KRW per 'pyeong'
    const hvac = desiredArea * 16;

    // 3. Franchise Joining Fee: Fixed 1,000 ten-thousand KRW (Opening Map partner discount)
    const franchiseFee = 1000;

    // 4. Learning Materials & Media Books setup
    const materials = 300 + (desiredArea > 35 ? 200 : 0);

    // 5. Signage & Brand Graphics
    const signage = 400 + (desiredArea > 40 ? 150 : 0);

    // 6. Media hardware, sound system & furniture setup
    const furniture = Math.round(desiredArea * 8.5) + 300;

    // 7. Lease deposit estimate based on tier & size
    let deposit = 0;
    let premium = 0;
    if (regionalTier === "Tier 1") {
      deposit = 3000 + desiredArea * 50;
      premium = 1500 + desiredArea * 20;
    } else if (regionalTier === "Tier 2") {
      deposit = 2000 + desiredArea * 35;
      premium = 800 + desiredArea * 10;
    } else {
      deposit = 1000 + desiredArea * 20;
      premium = 200 + desiredArea * 5;
    }

    // 8. Launching marketing & opening reserves
    const marketing = 250 + Math.round(desiredArea * 5);

    const total = interior + hvac + franchiseFee + materials + signage + furniture + deposit + premium + marketing;

    return {
      interior,
      hvac,
      franchiseFee,
      materials,
      signage,
      furniture,
      deposit,
      premium,
      marketing,
      total
    };
  }, [desiredArea, regionalTier]);

  // Store onChange in ref to break infinite re-render loop
  const onChangeRef = React.useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (onChangeRef.current && !readOnly) {
      onChangeRef.current({
        desiredArea,
        regionalTier,
        calculatedBudget: costBreakdown.total,
        myCapital
      });
    }
  }, [desiredArea, regionalTier, costBreakdown.total, myCapital, readOnly]);

  const chartData = useMemo(() => {
    return [
      { name: "인테리어 공사", value: costBreakdown.interior, color: "#0B3B24" },
      { name: "임차 보증금", value: costBreakdown.deposit, color: "#C5A059" },
      { name: "프랜차이즈 가맹", value: costBreakdown.franchiseFee, color: "#0D5C34" },
      { name: "간판/기획 실외", value: costBreakdown.signage, color: "#8E6E34" },
      { name: "소방/냉난방", value: costBreakdown.hvac, color: "#475569" },
      { name: "초도 도서/교재", value: costBreakdown.materials, color: "#AAC495" },
      { name: "학원 가구/스마트미디어", value: costBreakdown.furniture, color: "#8B5CF6" },
      { name: "권리비(예상)", value: costBreakdown.premium, color: "#F43F5E" },
      { name: "홍보 및 예비비", value: costBreakdown.marketing, color: "#E2E8F0" }
    ].filter(item => item.value > 0);
  }, [costBreakdown]);

  // Financial safety index configuration
  const budgetShortage = costBreakdown.total - myCapital;
  const sufficiencyRate = Math.round((myCapital / costBreakdown.total) * 100);
  
  let safetyLevel: "stable" | "warning" | "danger" = "stable";
  let safetyMsg = "";
  let financialAdvice = "";

  if (sufficiencyRate >= 100) {
    safetyLevel = "stable";
    safetyMsg = "매우 안정적인 예산 구조";
    financialAdvice = "요구되는 초기 가구 도입비 및 인테리어를 최고 수준 프리미엄 스펙으로 구축 가능하며, 개원 초기 약 3~4개월간의 적자 운영 예비비까지 충당 가능합니다.";
  } else if (sufficiencyRate >= 70) {
    safetyLevel = "warning";
    safetyMsg = "금융 연계 적정 조달 필요 수준";
    financialAdvice = `약 ${Math.round(budgetShortage).toLocaleString()}만원 수준의 추가 조달이 예상됩니다. 고려대 MOU 파트너 연계 본사 무이자 금융 대출 또는 보증 협약 융자 상품(최대 5,000만원 대출 연계)을 통하여 안전하게 예산을 충당할 수 있습니다.`;
  } else {
    safetyLevel = "danger";
    safetyMsg = "초기 규모 조정 또는 가용 예산 확보 권장";
    financialAdvice = "총 예산 대비 자자 자금 비중이 낮아 지점 개정 초기 다소 재무적 제약이 있을 수 있습니다. 가용 자본을 확장하시거나, 혹은 희망 평수를 약 5~10평 하향하고 Tier 급지를 조정하여 합리적인 20평대 교습소 형태로의 개설 조율을 권장합니다.";
  }

  // Format currency helper
  const formatKRW = (val: number) => {
    return `${Math.round(val).toLocaleString()} 만원`;
  };

  const getTierDescription = (tier: string) => {
    if (tier === "Tier 1") return "서울 주요 핵심 학군 및 1급지 (수도권 요충지)";
    if (tier === "Tier 2") return "신도시 일반 구역 및 타겟 요충 아파트 대규모 밀집 구역 (2급지)";
    return "중소도시 일반 및 신흥 택지지구 (3급지)";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm text-left" id="budget_simulator_panel">
      {/* Container Header */}
      <div className="bg-gradient-to-r from-[#0B3B24] to-[#0D5C34] text-white p-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <Coins className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">오프닝맵 창업 예산 실시간 시뮬레이터</h3>
            <p className="text-[10px] text-white/70 font-sans tracking-wide uppercase mt-0.5">OPENING BUDGET REALTIME ESTIMATOR & PLANNER</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Input & Controls (col-span-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section: Size Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center space-x-1">
                <Layout className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>희망 개원 면적 (Desired Size)</span>
              </label>
              <span className="text-sm font-black text-[#0B3B24] font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {desiredArea} 평 <span className="text-[10px] text-slate-400 font-normal ml-1">({Math.round(desiredArea * 3.3)} m²)</span>
              </span>
            </div>
            {!readOnly ? (
              <div className="space-y-1">
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={desiredArea}
                  onChange={(e) => setDesiredArea(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#0B3B24]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-sans px-0.5">
                  <span>15평 (교습소)</span>
                  <span>30평 (중형)</span>
                  <span>60평 (대형)</span>
                  <span>90평 (초대형)</span>
                  <span>120평 (초대형 학원)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">지정 크기: {desiredArea}평</p>
            )}
          </div>

          {/* Section: Regional Tier Option */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>희망 상권 입학 급지 (Commercial Regional Tier)</span>
            </label>
            {!readOnly ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Tier 1", label: "Tier 1", desc: "핵심/수도권요충" },
                  { id: "Tier 2", label: "Tier 2", desc: "중형/아파트 밀집" },
                  { id: "Tier 3", label: "Tier 3", desc: "일반/소도시/지방" }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setRegionalTier(tier.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                      regionalTier === tier.id
                        ? "border-[#0B3B24] bg-[#0B3B24]/5 shadow-sm text-[#0B3B24]"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-bold font-sans">{tier.label}</span>
                    <span className="text-[9px] mt-0.5 truncate max-w-full font-medium">{tier.desc}</span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-slate-800 font-bold block bg-slate-50 border p-2 rounded-lg text-xs">
                {regionalTier} ({getTierDescription(regionalTier)})
              </span>
            )}
            <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 p-2 rounded">
              💡 {getTierDescription(regionalTier)}
            </p>
          </div>

          {/* Section: Self Capital available */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 flex items-center space-x-1">
                <Wallet className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>자가 예산 및 동원 가능 자본금 (Self Assets)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1000"
                  max="50000"
                  step="500"
                  disabled={readOnly}
                  value={myCapital}
                  onChange={(e) => setMyCapital(Number(e.target.value))}
                  className="w-32 bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 text-right focus:outline-none focus:border-[#C5A059] text-xs font-bold font-mono text-slate-850"
                />
                <span className="text-[10px] text-[#0B3B24] ml-1 font-semibold">만원</span>
              </div>
            </div>
            {!readOnly && (
              <div>
                <input
                  type="range"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={myCapital}
                  onChange={(e) => setMyCapital(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-sans px-0.5">
                  <span>1,000만</span>
                  <span>1억</span>
                  <span>2억</span>
                  <span>3억 (최대 한도 설계)</span>
                </div>
              </div>
            )}
          </div>

          {/* Financial Advice Card (Adaptive Feedback) */}
          <div className={`p-4 rounded-xl border flex gap-3 ${
            safetyLevel === "stable" 
              ? "bg-emerald-50/50 border-emerald-100" 
              : safetyLevel === "warning"
                ? "bg-amber-50/50 border-amber-100"
                : "bg-rose-50/40 border-rose-100"
          }`}>
            <div className="shrink-0 pt-0.5">
              {safetyLevel === "stable" ? (
                <Coins className="w-5 h-5 text-emerald-600" />
              ) : safetyLevel === "warning" ? (
                <BadgeAlert className="w-5 h-5 text-amber-500" />
              ) : (
                <CircleAlert className="w-5 h-5 text-rose-500" />
              )}
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className={`font-black uppercase tracking-wider text-[10px] ${
                  safetyLevel === "stable" ? "text-emerald-700" : safetyLevel === "warning" ? "text-amber-700" : "text-rose-700"
                }`}>
                  자금 타당성 수지 판정 ({sufficiencyRate}%)
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-extrabold text-slate-800">{safetyMsg}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px] font-medium font-sans">
                {financialAdvice}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Chart & Cost Breakdown List (col-span-5) */}
        <div className="lg:col-span-5 border border-slate-150 p-4 rounded-xl bg-slate-50/30 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h4 className="text-xs font-black text-slate-700 uppercase">예산 항목별 분석서</h4>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActiveBreakdownTab("chart")}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${activeBreakdownTab === "chart" ? "bg-[#0B3B24] text-white shadow-xs" : "text-slate-500"}`}
              >
                비율 차트
              </button>
              <button
                type="button"
                onClick={() => setActiveBreakdownTab("list")}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${activeBreakdownTab === "list" ? "bg-[#0B3B24] text-white shadow-xs" : "text-slate-500"}`}
              >
                상세 목록
              </button>
            </div>
          </div>

          <div className="h-[220px] flex items-center justify-center relative">
            {activeBreakdownTab === "chart" ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius="43%"
                    outerRadius="72%"
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontSize: '10px', borderRadius: '8px', padding: '6px' }}
                    formatter={(value: any) => [`${value.toLocaleString()} 만원`, '예상비용']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full overflow-y-auto space-y-2 pr-1 text-[10.5px]">
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">1. 실내 인테리어 (평당 190만)</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.interior)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">2. 임차 보증금 (급지별 추정)</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.deposit)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">3. 본사 프랜차이즈 가맹금</span>
                  <span className="font-bold text-[#0D5C34] font-mono">{formatKRW(costBreakdown.franchiseFee)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">4. 실외 기획간판 및 파사드</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.signage)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">5. 냉난방 및 설비 (평당 16만)</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.hvac)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">6. 초도 도서교개 및 정품교구</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.materials)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">7. 스마트 장비 및 학원 가구</span>
                  <span className="font-bold text-slate-850 font-mono">{formatKRW(costBreakdown.furniture)}</span>
                </div>
                {costBreakdown.premium > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-400 font-medium font-sans">8. 바닥 권리비 (추정 범주)</span>
                    <span className="font-bold text-rose-600 font-mono">{formatKRW(costBreakdown.premium)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500 font-medium font-sans">9. 홍보 세팅 및 예비 여유자금</span>
                  <span className="font-bold text-slate-800 font-mono">{formatKRW(costBreakdown.marketing)}</span>
                </div>
              </div>
            )}

            {/* Sum indicator overlap */}
            {activeBreakdownTab === "chart" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[45px] sm:mt-[35px] scale-90">
                <span className="text-[9px] text-slate-400 font-sans tracking-tight uppercase">EST. STARTUP TOTAL</span>
                <span className="text-sm font-black text-[#0B3B24] font-mono leading-tight tracking-tight">
                  ~ {formatKRW(costBreakdown.total)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-left mt-2">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold">총 예상 개원 비용</p>
              <p className="text-sm font-black text-[#0B3B24] font-mono">{formatKRW(costBreakdown.total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-semibold">동원 자본 대비 과부족</p>
              <p className={`text-xs font-black font-mono ${budgetShortage > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                {budgetShortage > 0 ? `+ ${formatKRW(budgetShortage)} 조달필요` : `${formatKRW(Math.abs(budgetShortage))} 여유`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
