import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { TrendingUp, Calendar, RefreshCw, BarChart2, Award, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Applicant } from "../types";

interface LeadQualityTrendChartProps {
  applicants: Applicant[];
}

export default function LeadQualityTrendChart({ applicants }: LeadQualityTrendChartProps) {
  const [viewMode, setViewMode] = useState<"daily-avg" | "individual">("daily-avg");

  // Determine the reference date (latest applicant date, or current date)
  const referenceDate = useMemo(() => {
    if (!applicants || applicants.length === 0) return new Date();
    const times = applicants.map(a => new Date(a.appliedAt).getTime()).filter(t => !isNaN(t));
    if (times.length === 0) return new Date();
    const maxTime = Math.max(...times);
    // If the latest applicant is from the future relative to now, use it, otherwise use current date
    const now = new Date();
    return maxTime > now.getTime() ? new Date(maxTime) : now;
  }, [applicants]);

  // Aggregate daily averages for the last 30 days
  const dailyData = useMemo(() => {
    const dates: Record<string, { totalScoreSum: number; count: number; highQualityCount: number; maxScore: number; dateStr: string }> = {};
    
    // Initialize 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(referenceDate.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = `${d.getMonth() + 1}/${d.getDate()}`; // MM/DD
      dates[key] = {
        totalScoreSum: 0,
        count: 0,
        highQualityCount: 0,
        maxScore: 0,
        dateStr: label
      };
    }

    // Populate data
    applicants.forEach(app => {
      if (!app.appliedAt) return;
      const key = app.appliedAt.split("T")[0];
      if (dates[key]) {
        dates[key].totalScoreSum += app.totalScore;
        dates[key].count += 1;
        dates[key].maxScore = Math.max(dates[key].maxScore, app.totalScore);
        if (app.leadRank === "S" || app.leadRank === "A" || app.competencyRank === "S" || app.competencyRank === "A") {
          dates[key].highQualityCount += 1;
        }
      }
    });

    // Match output format for Recharts
    return Object.entries(dates).map(([key, data]) => {
      const avgScore = data.count > 0 ? parseFloat((data.totalScoreSum / data.count).toFixed(1)) : null;
      return {
        // Safe key names for Recharts
        key,
        date: data.dateStr,
        "평균 진단점수": avgScore,
        "최고 진단점수": data.count > 0 ? data.maxScore : null,
        "누적 신청자수": data.count,
        "우수 리드수": data.highQualityCount
      };
    });
  }, [applicants, referenceDate]);

  // Chronological individual point scores for the last 30 days
  const individualData = useMemo(() => {
    // Filter applicants in the last 30 days, sort chronologically
    const limitDate = new Date(referenceDate);
    limitDate.setDate(referenceDate.getDate() - 30);

    const filtered = applicants
      .filter(app => {
        if (!app.appliedAt) return false;
        const appDate = new Date(app.appliedAt);
        return appDate >= limitDate;
      })
      .sort((a, b) => new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime());

    return filtered.map(app => {
      const d = new Date(app.appliedAt);
      const formattedDate = `${d.getMonth() + 1}/${d.getDate()}`;
      return {
        name: `${app.name} (${formattedDate})`,
        "진단점수": app.totalScore,
        "등급": app.competencyRank,
        "리드등급": app.leadRank,
        "성명": app.name,
        "지점": app.region || "미지정",
        "일자": d.toLocaleDateString("ko-KR"),
        "유형": app.franchiseType
      };
    });
  }, [applicants, referenceDate]);

  // General summary analytics
  const trendStats = useMemo(() => {
    const validScores = applicants.map(a => a.totalScore).filter(s => typeof s === "number" && !isNaN(s));
    const totalCount = validScores.length;
    const avgScore = totalCount > 0 ? (validScores.reduce((acc, curr) => acc + curr, 0) / totalCount).toFixed(1) : "0.0";
    
    // Calc standard deviations or percentage of top leads (S & A)
    const upperLeadsCount = applicants.filter(a => a.leadRank === "S" || a.leadRank === "A").length;
    const peakLeadRatio = totalCount > 0 ? Math.round((upperLeadsCount / totalCount) * 100) : 0;

    return {
      avgScore,
      totalCount,
      upperLeadsCount,
      peakLeadRatio
    };
  }, [applicants]);

  const hasTimelineData = dailyData.some(d => d["누적 신청자수"] > 0);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-md p-6 space-y-6" id="lead_quality_trend_dashboard_section">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-[#E5E7EB]">
        <div>
          <h3 className="text-[#0B3B24] font-extrabold text-base flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#C5A059] animate-pulse" />
            <span>최근 30일 예비원장 진단 품질 및 스코어 추이</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            자가진단 총점 지표의 변동 흐름을 일자별 또는 개인별 시계열로 분석하여 전반적인 마케팅/영업 리드 유입 퀄리티를 평가합니다.
          </p>
        </div>

        {/* Dynamic Mode Switch Toggle BUTTONS */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-center" id="trend_chart_view_toggles">
          <button
            type="button"
            onClick={() => setViewMode("daily-avg")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 border-0 cursor-pointer ${
              viewMode === "daily-avg"
                ? "bg-white text-[#0B3B24] shadow-sm font-black"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>일자별 평균 추이</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("individual")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 border-0 cursor-pointer ${
              viewMode === "individual"
                ? "bg-white text-[#0B3B24] shadow-sm font-black"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>개별 신청자 순서</span>
          </button>
        </div>
      </div>

      {/* Top Level Score Stats Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="lead_quality_metrics_summary">
        {/* Metric 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-slate-50 border border-slate-100/80 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">누적 전체 평균 점수</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-[#0B3B24] block">
              {trendStats.avgScore} <span className="text-xs font-bold">점</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-slate-50 border border-slate-100/80 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">우수 등급 리드 (S/A)</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-[#C5A059] block">
              {trendStats.upperLeadsCount} <span className="text-xs font-bold">건</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#C5A059]" />
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-slate-50 border border-slate-100/80 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block font-sans">고품질 리드 비율</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-600 block">
              {trendStats.peakLeadRatio}% <span className="text-xs font-bold">명형</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </motion.div>
      </div>

      {/* Main LineChart Container */}
      <div className="w-full relative bg-slate-50/50 rounded-xl border border-slate-150 p-4" id="quality_lead_line_chart_container">
        <AnimatePresence mode="wait">
          {!hasTimelineData ? (
            <motion.div
              key="no-data"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45 }}
              className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <Calendar className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-700">지난 30일간 새로 등록된 신청자가 존재하지 않습니다.</h4>
                <p className="text-slate-400 max-w-md mx-auto">
                  데이터베이스에 엑셀 데이터를 가져오시거나 신규 자가진단 참여를 유치하면 타임라인상에 통계 스코어 추이가 실시간 계산되어 렌더링됩니다.
                </p>
              </div>
            </motion.div>
          ) : viewMode === "daily-avg" ? (
            <motion.div
              key="daily-avg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full h-80"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyData}
                  margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: "bold" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 40]} 
                    tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.98)",
                      border: "1px solid #C5A059",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "12px",
                      fontFamily: "sans-serif"
                    }}
                    formatter={(value: any, name: string) => {
                      if (value === null || value === undefined) return ["점수 없음", name];
                      if (name === "우수 리드수" || name === "누적 신청자수") return [`${value}명`, name];
                      return [`${value}점`, name];
                    }}
                  />
                  <Legend 
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: "bold", color: "#475569" }}
                  />
                  <Line
                    name="평균 진단점수"
                    type="monotone"
                    dataKey="평균 진단점수"
                    stroke="#0B3B24"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    connectNulls={true}
                    dot={{ r: 4, stroke: "#0B3B24", strokeWidth: 2, fill: "#fff" }}
                  />
                  <Line
                    name="최고 진단점수"
                    type="monotone"
                    dataKey="최고 진단점수"
                    stroke="#C5A059"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    connectNulls={true}
                    dot={{ r: 3, stroke: "#C5A059", fill: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-full h-80"
            >
              {individualData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  표시할 수 있는 최근 신청자 레코드가 대시보드상에 존재하지 않습니다.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={individualData}
                    margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: "#64748B", fontSize: 9 }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={[0, 42]}
                      tick={{ fill: "#64748B", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const info = payload[0].payload;
                          return (
                            <div className="bg-white border-2 border-[#0B3B24] rounded-xl p-4 shadow-xl text-xs space-y-1.5 max-w-[240px]">
                              <div className="flex items-center justify-between border-b pb-1 mb-1">
                                <strong className="text-sm font-black text-[#0B3B24]">{info.성명}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">{info.일자}</span>
                              </div>
                              <div className="space-y-1">
                                <p className="flex justify-between">
                                  <span className="text-slate-500">종합 진단점수:</span>
                                  <strong className="text-indigo-600 font-black">{info.진단점수}점 ({info.등급}등급)</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500">영업 등급 (Lead):</span>
                                  <strong className="text-amber-600 font-black">{info.리드등급}급</strong>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500">희망 개원지:</span>
                                  <span className="text-slate-800 font-bold">{info.지점}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-slate-500">개원 형태:</span>
                                  <span className="text-slate-800 font-bold">{info.유형}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      name="진단 총점"
                      type="linear"
                      dataKey="진단점수"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                      dot={{ r: 4, stroke: "#10B981", strokeWidth: 2, fill: "#fff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analysis advice */}
      <div className="bg-[#0B3B24]/5 border border-[#0B3B24]/10 rounded-lg p-3 text-[11px] leading-relaxed text-slate-600 font-medium">
        📊 <strong className="text-[#0B3B24]">마케팅 리드 품질 팁:</strong> 진단 점수가 지속적으로 최고 및 평균적으로 28점(S/A급) 이상 우수 범주에 포진하여 있는 경우 본사의 <b>고려대학교 연계 특화 영어 교육 콘텐츠 선호도</b>가 매우 우수한 상태임을 암시하며, 계약 체결 진행 절차를 공격적으로 상권 협상 단계로 개시하시길 추천드립니다.
      </div>
    </div>
  );
}
