const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let fileContent = fs.readFileSync(filePath, 'utf8');

const anchorStart = '                            {/* 추천 학원 상권 매칭 지도 카드 */}';
const anchorEnd = '                      {/* AI Customized Consulting Section (Last Overall Summary) */}';

const startIndex = fileContent.indexOf(anchorStart);
const endIndex = fileContent.indexOf(anchorEnd);

if (startIndex === -1) {
  console.error("Could not find start anchor");
  process.exit(1);
}
if (endIndex === -1) {
  console.error("Could not find end anchor");
  process.exit(1);
}

const replacement = `                            {/* 추천 학원 상권 매칭 지도 카드 */}
                            <div className="bg-slate-50/50 p-5 rounded-xl border border-[#E5E7EB] flex flex-col justify-between" id="recommended_regions_interactive_card">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] text-slate-400 font-extrabold tracking-wide uppercase block">추천 학원 상권 (Recommended Hotspot Map)</span>
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#C5A059]/10 text-[9px] text-[#C5A059] font-bold border border-[#C5A059]/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                                    <span>실시간 추천 매칭 지도</span>
                                  </span>
                                </div>

                                {/* 1. Stylized Interactive Map Canvas */}
                                <div className="h-44 w-full bg-[#1B365D]/5 rounded-lg relative border border-[#1B365D]/10 mb-4 select-none">
                                  {/* Wrapping grid background & range rings in a separate clipping container */}
                                  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                                    {/* Blueprint background grid pattern */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b365d0a_1px,transparent_1px),linear-gradient(to_bottom,#1b365d0a_1px,transparent_1px)] bg-[size:14px_24px]" />
                                    
                                    {/* Radial concentric range rings representing service boundaries */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-dashed border-[#1B365D]/15 flex items-center justify-center">
                                      <div className="w-16 h-16 rounded-full border border-dashed border-[#1B365D]/10" />
                                    </div>
                                    
                                    {/* Geographic backdrop labels resembling target town zones */}
                                    <span className="absolute left-4 top-4 text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">주거 단지 zone</span>
                                    <span className="absolute right-4 bottom-4 text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">상업 시설 zone</span>
                                    
                                    {/* Map connection lines */}
                                    <svg className="absolute inset-0 w-full h-full opacity-45">
                                      <line x1="25%" y1="40%" x2="48%" y2="70%" stroke="#1B365D" strokeWidth="1" strokeDasharray="3 3" />
                                      <line x1="70%" y1="25%" x2="48%" y2="70%" stroke="#1B365D" strokeWidth="1" strokeDasharray="3 3" />
                                    </svg>
                                  </div>

                                  {/* Interactive Glowing Pins */}
                                  {[
                                    { left: "25%", top: "40%", label: "Spot 1" },
                                    { left: "70%", top: "25%", label: "Spot 2" },
                                    { left: "48%", top: "70%", label: "Spot 3" }
                                  ].map((pin, i) => {
                                    const isSelected = selectedMapHotspotIndex === i;
                                    const typeCode = diagnosisResultAnalysis.typeCode;
                                    const isTypeD = typeCode === "D";
                                    
                                    let pinCategory = "항아리 배후 독점 구역";
                                    let pinSchool = "중림초등학교";
                                    let pinDesc = "세대 분배가 균일하고 보행 동선이 한곳으로 모이는 최고 밀착지";
                                    
                                    if (i === 0) {
                                      pinCategory = isTypeD ? "신도시 프리미엄 중심가" : "항아리 배후 독점 구역";
                                      pinSchool = isTypeD ? "해누리초등학교" : "중림초등학교";
                                      pinDesc = "세대 분배가 균일하고 보행 동선이 한곳으로 모이는 최고 밀착지";
                                    } else if (i === 1) {
                                      pinCategory = isTypeD ? "신축 아파트 핵심 유입로" : "주거 밀집 로컬 안심가";
                                      pinSchool = isTypeD ? "단지솔잎초등학교" : "다빛초등학교";
                                      pinDesc = "도보 이동선에 초교 정문이 직통 배치되어 접근성이 최고인 구간";
                                    } else {
                                      pinCategory = isTypeD ? "광역 랜드마크 학군지" : "복합 중산층 주거상가";
                                      pinSchool = isTypeD ? "다인초등학교" : "은빛초등학교";
                                      pinDesc = "복합 다세대 학부모 트래픽이 교차하는 상징적인 교육 허브 구역";
                                    }
                                    
                                    const regionName = diagnosisResultAnalysis.recRegions[i] || \`추천구역 \${i + 1}\`;

                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedMapHotspotIndex(i)}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none z-20"
                                        style={{ left: pin.left, top: pin.top }}
                                      >
                                        {/* Ripple effect */}
                                        {isSelected && (
                                          <span className="absolute -inset-2.5 rounded-full bg-[#C5A059]/30 animate-ping" />
                                        )}
                                        
                                        {/* Pin icon backer */}
                                        <div className={\`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border transition-all transform hover:scale-110 \${
                                          isSelected 
                                            ? "bg-[#C5A059] border-white text-white rotate-12 scale-110 z-20" 
                                            : "bg-[#1B365D] border-slate-200 text-slate-100 opacity-80 hover:opacity-100"
                                        }\`}>
                                          <MapPin className="w-4 h-4" />
                                        </div>

                                        {/* Simple display label (visible only when NOT hovered & isSelected) */}
                                        <span className={\`absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-tight whitespace-nowrap shadow border transition-all pointer-events-none \${
                                          isSelected
                                            ? "bg-[#1B365D] border-[#C5A059] text-white font-extrabold group-hover:opacity-0"
                                            : "bg-white border-slate-200 text-slate-600 opacity-0 group-hover:opacity-0 font-semibold"
                                        }\`}>
                                          {regionName.substring(0, 10)}
                                        </span>

                                        {/* Enriched hover tooltip popup */}
                                        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-52 bg-[#1B365D]/95 backdrop-blur-sm text-white px-3 py-2.5 rounded-lg shadow-xl border border-[#C5A059]/50 text-left pointer-events-none transition-all duration-200 opacity-0 scale-95 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 invisible group-hover:visible z-30">
                                          {/* Hotspot category badge */}
                                          <span className="inline-block text-[8px] bg-[#C5A059] text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase mb-1">
                                            {pinCategory}
                                          </span>
                                          
                                          {/* Region Name */}
                                          <h5 className="text-[11px] font-bold text-white border-b border-white/10 pb-1 leading-normal truncate">
                                            {regionName}
                                          </h5>
                                          
                                          {/* School Name */}
                                          <div className="text-[10px] text-slate-300 mt-1 flex items-center">
                                            <span className="text-[#C5A059] mr-1 text-[9px]">🏫</span>
                                            <strong className="text-white font-semibold">{pinSchool}</strong>
                                          </div>
                                          
                                          {/* Description */}
                                          <p className="text-[9px] text-slate-300/80 mt-1 leading-normal font-medium">
                                            {pinDesc}
                                          </p>

                                          {/* Subtle tooltip tip/arrow pointing to the pin */}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-[#1B365D]/95 border-r border-b border-[#C5A059]/50"></div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 2. Responsive buttons selector for region names */}
                                <div className="flex flex-col gap-1.5 mb-3" id="map_hotspot_selector_buttons">
                                  {diagnosisResultAnalysis.recRegions.map((regionStr, i) => {
                                    const isSelected = selectedMapHotspotIndex === i;
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedMapHotspotIndex(i)}
                                        className={\`text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-all font-sans font-bold \${
                                          isSelected 
                                            ? "bg-[#1B365D] text-white border-[#1B365D] shadow-sm transform translate-x-1" 
                                            : "bg-white hover:bg-slate-50 border-[#E5E7EB] text-slate-700 hover:text-slate-900"
                                        }\`}
                                      >
                                        <div className="flex items-center space-x-2 truncate">
                                          <span className={\`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 \${
                                            isSelected ? "bg-[#C5A059] text-white font-extrabold" : "bg-slate-100 text-[#1B365D]"
                                          }\`}>
                                            {i + 1}
                                          </span>
                                          <span className="truncate">{regionStr}</span>
                                        </div>
                                        <ChevronRight className={\`w-3.5 h-3.5 transition-transform shrink-0 \${isSelected ? "text-[#C5A059] translate-x-0.5" : "text-slate-400"}\`} />
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* 3. Deep Intelligence Telemetry based on user's preference and type */}
                                {(() => {
                                  const typeCode = diagnosisResultAnalysis.typeCode;
                                  const normalizedRegion = diagnosisResult.region || "개원 희망지";
                                  
                                  const list = [
                                    {
                                      schools: "원내 기준 초교 2개교 인접",
                                      households: typeCode === "D" ? "12,500세대 매머드급 배후" : "4,200세대 단지내 인입 독점",
                                      competition: typeCode === "D" ? "높음 (경쟁 치열/고수익)" : "매우 낮음 (안정 경쟁회피)",
                                      competitionColor: typeCode === "D" ? "text-amber-500 bg-amber-50" : "text-emerald-600 bg-emerald-50",
                                      rentLevel: typeCode === "D" ? "상급 (신도시 로드샵)" : "효율적 저자본 보증",
                                      advisory: typeCode === "D" 
                                        ? \`\${normalizedRegion} 신도시 중심 학원가로, 높은 교육비 단가 승인이 수월한 최고 선호지입니다.\` 
                                        : \`경쟁 유출 경로가 한정되어 있어, 원격 홍보만으로도 아파트 단지 입원생을 손쉽게 대거 결합하는 최고 안전지입니다.\`
                                    },
                                    {
                                      schools: "초교 도보 3분권 밀집지",
                                      households: typeCode === "D" ? "15,800세대 신규 배후단지" : "3,800세대 실속형 독점",
                                      competition: typeCode === "D" ? "치열 (신생 영어학원 진출선)" : "최저 (영어 공공 공백 구역)",
                                      competitionColor: typeCode === "D" ? "text-orange-500 bg-orange-50" : "text-emerald-550 bg-emerald-50",
                                      rentLevel: typeCode === "D" ? "최상급 (항아리 신축 상가)" : "실속형 소액 아파트상가형",
                                      advisory: typeCode === "D" 
                                        ? \`신축 대표 브랜드 아파트 직통 길목으로, 마케팅 초도 노출 시 학부모 간담회 유입 트래픽이 극도로 폭발적입니다.\` 
                                        : \`원내 밀착 케어가 극대화되는 구역으로, 대형 셔틀 통학 리스크를 질색하는 학부모들이 최우선 귀속되어 안전도가 절대적입니다.\`
                                    },
                                    {
                                      schools: "광역 반경 유통 초교 3개교",
                                      households: typeCode === "D" ? "9,200세대 성장형 상업권" : "5,100세대 안정 항아리상권",
                                      competition: typeCode === "D" ? "보통 (신축 브랜드 대결지)" : "안정 (인근 공부방 노후화)",
                                      competitionColor: typeCode === "D" ? "text-[#1B365D] bg-[#1B365D]/5" : "text-teal-600 bg-teal-50",
                                      rentLevel: "합리적 시세 보정형(안심 보장)",
                                      advisory: typeCode === "D" 
                                        ? \`계획 신도시 핵심 학원 시설 유입 반경으로, 본고려대 고급 교육협력 스피킹 클래스를 통해 1등 학원으로 치고 나가기 알맞습니다.\`
                                        : \`마을 상권 내 프리미엄 단독 대안책이 무주공산이어서, 신규 개원 간판 교체 및 설명회 입회 유도가 최고로 순이익을 창출하는 주효지입니다.\`
                                    }
                                  ];
                                  
                                  const activeMeta = list[selectedMapHotspotIndex] || list[0];
                                  
                                  return (
                                    <div className="bg-white p-3.5 rounded-lg border border-[#E5E7EB] space-y-2 text-[11px] shadow-sm animate-fadeIn" id="hotspot_meta_telemetry_box">
                                      <div className="flex items-center justify-between border-b pb-1.5 border-slate-100">
                                        <span className="font-extrabold text-[#1B365D] flex items-center space-x-1">
                                          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                                          <span>[상세정보] {diagnosisResultAnalysis.recRegions[selectedMapHotspotIndex] || "핫스팟 구역"}</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">Hotspot 0{selectedMapHotspotIndex + 1}</span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                                        <div>
                                          <span className="text-slate-400 block font-semibold font-sans">배후 입점 규모</span>
                                          <span className="font-extrabold text-slate-800 font-sans">{activeMeta.households}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-semibold font-sans">지역 경쟁 강도</span>
                                          <span className={\`font-extrabold px-1.5 py-0.5 rounded text-[10px] inline-block mt-0.5 font-sans \${activeMeta.competitionColor}\`}>
                                            {activeMeta.competition}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-semibold font-sans">인접 초등 및 통학환경</span>
                                          <span className="font-extrabold text-slate-800 font-sans">{activeMeta.schools}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block font-semibold font-sans">예상 임대료 수준</span>
                                          <span className="font-extrabold text-slate-800 font-sans">{activeMeta.rentLevel}</span>
                                        </div>
                                      </div>
                                      <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-sans font-semibold leading-relaxed">
                                        💡 {activeMeta.advisory}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#C5A059] font-extrabold">
                                * 원장님의 성향 점수({diagnosisResult.personality})와의 시너지 분석
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* 3. 결과지 마지막: 각 영역별 결과에 대한 총평 */}
                      <div className="border-b border-slate-200 pb-2 mt-4 pt-4">
                        <h3 className="text-lg font-black text-[#1B365D] flex items-center space-x-2">
                          <span className="w-2.5 h-6 bg-[#C5A059] rounded-sm inline-block" />
                          <span>마지막: 영역별 결과 종합 분석 총평 및 로드맵</span>
                        </h3>
                      </div>
                      
`;

const updatedContent = fileContent.substring(0, startIndex) + replacement + fileContent.substring(endIndex);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('App.tsx map / result segments healed successfully!');
