/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AllocationProposal, Class分配, LevelId } from '../types';
import {
  TrendingUp,
  TriangleAlert,
  Save,
  CheckCircle,
  Hash,
  Sparkles,
  Info,
  Layers3,
  SquareCheck,
  ChevronRight,
  Calculator,
  Smile
} from 'lucide-react';

interface ProposalViewerProps {
  proposals: AllocationProposal[];
  onSaveProposal: (proposal: AllocationProposal, customName: string) => void;
  savedProposalsIds: string[];
}

export default function ProposalViewer({
  proposals,
  onSaveProposal,
  savedProposalsIds
}: ProposalViewerProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [customNameInput, setCustomNameInput] = useState<string>('');

  if (proposals.length === 0) return null;

  const selectedProposal = proposals[activeTab] || proposals[0];

  // Helper to determine occupancy bar color
  const getOccupancyColor = (size: number, maxClassSize: number) => {
    if (size >= maxClassSize + 1) return 'bg-rose-500'; // Overcrowded
    if (size >= 29) return 'bg-amber-500'; // Very dense
    if (size >= 25) return 'bg-sky-500'; // Dense but normal
    if (size >= 18) return 'bg-emerald-500'; // High comfort
    return 'bg-teal-400'; // Low population
  };

  const getOccupancyBackground = (size: number, maxClassSize: number) => {
    if (size >= maxClassSize + 1) return 'bg-rose-50 border-rose-200';
    if (size >= 29) return 'bg-amber-50 border-amber-200';
    if (size >= 25) return 'bg-sky-50 border-sky-200';
    if (size >= 18) return 'bg-emerald-50/50 border-emerald-200';
    return 'bg-teal-50 border-teal-200';
  };

  const handleSaveClick = () => {
    const defaultName = `Proposition ${activeTab + 1} (${selectedProposal.stats.totalClasses} classes)`;
    onSaveProposal(selectedProposal, customNameInput.trim() || defaultName);
    setCustomNameInput('');
  };

  const isAlreadySaved = savedProposalsIds.includes(selectedProposal.id);

  // Check if any level in class has customized ceiling limit
  const getClassSpecificCeilings = (cls: Class分配, selectedProposalConfig: AllocationProposal['config']) => {
    const limits: Array<{ level: LevelId; limit: number }> = [];
    Object.entries(cls.levels).forEach(([lId, qty]) => {
      if ((qty || 0) > 0) {
        const configItem = selectedProposalConfig.levels.find(lvlConf => lvlConf.id === lId);
        if (configItem && configItem.maxClassSize) {
          limits.push({ level: lId as LevelId, limit: configItem.maxClassSize });
        }
      }
    });
    return limits;
  };

  const getHomogeneityLabel = (stdDev: number) => {
    if (stdDev < 1.0) return "Très équilibrée, répartition optimale";
    if (stdDev <= 1.5) return "Très Homogène (1-2 él. d'écart)";
    if (stdDev <= 2.5) return "Équilibré (3-4 él. d'écart)";
    return "Hétérogène (écarts marqués)";
  };

  // Group classes by primary cycle for local cycle standard deviation computation
  const classCycles = selectedProposal.classes.map(cls => {
    const c1 = (cls.levels['PS'] || 0) + (cls.levels['MS'] || 0) + (cls.levels['GS'] || 0);
    const c2 = (cls.levels['CP'] || 0) + (cls.levels['CE1'] || 0) + (cls.levels['CE2'] || 0);
    const c3 = (cls.levels['CM1'] || 0) + (cls.levels['CM2'] || 0);
    
    const maxVal = Math.max(c1, c2, c3);
    let cycle: 1 | 2 | 3 = 1;
    if (maxVal === 0) {
      const levelsInClass = Object.keys(cls.levels);
      if (levelsInClass.some(l => ['CM1', 'CM2'].includes(l))) cycle = 3;
      else if (levelsInClass.some(l => ['CP', 'CE1', 'CE2'].includes(l))) cycle = 2;
    } else if (c2 === maxVal) {
      cycle = 2;
    } else if (c3 === maxVal) {
      cycle = 3;
    }
    return { class: cls, cycle };
  });

  const getCycleClasses = (num: 1 | 2 | 3) => classCycles.filter(item => item.cycle === num).map(item => item.class);

  const getCycleStdDev = (classes: Class分配[]) => {
    if (classes.length <= 1) return null;
    const sizes = classes.map(c => c.totalStudents);
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const sqDiffSum = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0);
    return Math.round(Math.sqrt(sqDiffSum / sizes.length) * 100) / 100;
  };

  const getCycleAvg = (classes: Class分配[]) => {
    if (classes.length === 0) return null;
    const sizes = classes.map(c => c.totalStudents);
    return Math.round((sizes.reduce((a, b) => a + b, 0) / sizes.length) * 10) / 10;
  };

  const getCycleStdDevStatus = (stdDev: number) => {
    if (stdDev < 1.0) return "Très équilibrée";
    if (stdDev <= 1.5) return "Très Homogène";
    if (stdDev <= 2.5) return "Équilibré";
    return "Hétérogène";
  };

  return (
    <div className="space-y-6">
      {/* Tab select buttons */}
      <div className="bg-brand-bg border border-brand-border-medium p-1 rounded-xl flex flex-wrap gap-1">
        {proposals.map((prop, idx) => (
          <button
            key={prop.id}
            onClick={() => {
              setActiveTab(idx);
              setCustomNameInput('');
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs transition duration-150 cursor-pointer text-center whitespace-nowrap min-w-[120px] ${
              activeTab === idx
                ? 'bg-brand-card border border-brand-border-medium text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-800 hover:bg-brand-accent/40'
            }`}
          >
            Option n°{idx + 1}
            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
              {prop.stats.totalClasses} cls • {prop.stats.averageClassSize} él.
            </span>
          </button>
        ))}
      </div>

      <div className="bg-brand-card rounded-2xl border border-brand-border-light p-6 shadow-sm space-y-6">
        {/* Selected option stats panel */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 border-b border-brand-border-light pb-5">
          <div className="bg-brand-bg/50 p-3.5 rounded-xl border border-brand-border-light text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Classes utilisées</span>
            <span className="text-xl font-black text-slate-800">{selectedProposal.stats.totalClasses}</span>
          </div>

          <div className="bg-brand-bg/50 p-3.5 rounded-xl border border-brand-border-light text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Moyenne d'effectif</span>
            <span className="text-xl font-black text-slate-800">{selectedProposal.stats.averageClassSize}</span>
            <span className="text-[9px] text-slate-400 block -mt-0.5">élèves / classe</span>
          </div>

          <div className="bg-brand-bg/50 p-3.5 rounded-xl border border-brand-border-light text-center col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Écart de tailles</span>
            <span className="text-xl font-black text-slate-800">
              {selectedProposal.stats.minClassSize} à {selectedProposal.stats.maxClassSize}
            </span>
            <span className="text-[9px] text-slate-400 block -mt-0.5">élèves max/min</span>
          </div>

          <div className="bg-brand-bg/50 p-3.5 rounded-xl border border-brand-border-light text-center relative group">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1 cursor-help md:relative">
              Écart-type homogénéité
              <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
            </span>
            <span className="text-xl font-black text-indigo-700 block mt-1">{selectedProposal.stats.standardDeviation}</span>
            <span className="text-[9px] text-slate-400 block -mt-0.5">
              {selectedProposal.stats.standardDeviation < 1.0 ? '⭐️ Très équilibré' :
               selectedProposal.stats.standardDeviation <= 1.5 ? '⭐️ Très Homogène' :
               selectedProposal.stats.standardDeviation <= 2.5 ? '⚖️ Équilibré' : '⚠️ Hétérogène'}
            </span>
            
            {/* Elegant Tooltip overlay */}
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-slate-900 text-white rounded-xl p-3.5 shadow-xl text-left text-xs invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 origin-bottom group-hover:scale-100 pointer-events-none">
              <h5 className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5 text-xs">
                <Calculator className="w-3.5 h-3.5" />
                Qu'est-ce que l'écart-type homogénéité ?
              </h5>
              <p className="text-[11px] text-slate-300 leading-normal mb-2.5">
                Il mesure la dispersion des effectifs par rapport à la moyenne. Plus il est proche de 0, plus les tailles de classes sont équilibrées et homogènes.
              </p>
              <h6 className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">Échelle d'évaluation :</h6>
              <ul className="space-y-1 text-[11px] font-medium">
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-emerald-300 font-bold">&lt; 1,0 :</span>
                  <span>Très équilibrée, répartition optimale</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
                  <span className="text-sky-300 font-bold">1,0 à 1,5 :</span>
                  <span>Très Homogène (1-2 él. d'écart)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="text-amber-300 font-bold">1,5 à 2,5 :</span>
                  <span>Équilibré (3-4 él. d'écart)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="text-rose-400 font-bold">&gt; 2,5 :</span>
                  <span>Hétérogène (écarts marqués)</span>
                </li>
              </ul>
              {/* Tooltip caret arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>

          <div className="bg-brand-bg/50 p-3.5 rounded-xl border border-brand-border-light text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Cours doubles / multiples</span>
            <span className="text-xl font-black text-slate-800">
              {selectedProposal.stats.doubleLevelCount}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({Math.round((selectedProposal.stats.doubleLevelCount / selectedProposal.stats.totalClasses) * 100)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Classes grid */}
        <div>
          <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-1.5">
            <Layers3 className="w-4.5 h-4.5 text-slate-400" />
            Structure des salles de classe générées ({selectedProposal.classes.length})
          </h3>

          <div className="space-y-4">
            {selectedProposal.classes.map((cls, idx) => {
              const activeLevelsInClass = Object.entries(cls.levels)
                .filter(([_, qty]) => (qty || 0) > 0)
                .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId));
              
              // Find ceilings violated in this class
              const ceilings = getClassSpecificCeilings(cls, selectedProposal.config);
              const maxAllowedGlobal = selectedProposal.config.solver.globalMaxClassSize;
              const effectiveMax = ceilings.length > 0 ? Math.min(...ceilings.map(c => c.limit)) : maxAllowedGlobal;
              
              const isLimitViolated = cls.totalStudents > effectiveMax;

              // CALIBRATE Progress bar on user-indicated effectiveMax!
              const occupancyPercent = Math.min(100, Math.round((cls.totalStudents / effectiveMax) * 100));

              return (
                <div
                  key={cls.id}
                  className={`border rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 transition-all hover:shadow-xs ${
                    isLimitViolated
                      ? 'bg-rose-50/70 border-rose-300'
                      : getOccupancyBackground(cls.totalStudents, effectiveMax)
                  }`}
                >
                  {/* Left Column: Title and Level badges */}
                  <div className="min-w-[130px] shrink-0 space-y-1">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black uppercase tracking-wider">
                      Classe n°{idx + 1}
                    </span>
                    <div className="font-extrabold text-slate-800 text-base leading-tight mt-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 leading-none">
                        {activeLevelsInClass.map(([lvl], i) => (
                          <span 
                            key={lvl} 
                            className={`px-1.5 py-0.5 rounded border text-[11px] font-extrabold tracking-tight text-nowrap ${
                              i === 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                              i === 1 ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              i === 2 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {lvl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Levels breakdown with percentages & mini-progress bars */}
                  <div className="flex-1 space-y-2.5 max-w-xl md:border-l md:border-slate-200/50 md:pl-5">
                    {activeLevelsInClass.map(([lvl, qty]) => {
                      const count = qty || 0;
                      const levelPercent = Math.round((count / cls.totalStudents) * 100);
                      return (
                        <div key={lvl} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold leading-none">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                              Niveau <strong className="text-slate-800 font-bold">{lvl}</strong> :
                            </span>
                            <span className="font-bold text-slate-700">
                              {count} {count > 1 ? 'élèves' : 'élève'} <span className="text-indigo-600 font-extrabold">({levelPercent}%)</span>
                            </span>
                          </div>
                          
                          {/* Mini level bar */}
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                activeLevelsInClass.indexOf(activeLevelsInClass.find(x => x[0] === lvl)!) === 0 ? 'bg-indigo-500' :
                                activeLevelsInClass.indexOf(activeLevelsInClass.find(x => x[0] === lvl)!) === 1 ? 'bg-purple-500' :
                                activeLevelsInClass.indexOf(activeLevelsInClass.find(x => x[0] === lvl)!) === 2 ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${levelPercent}%` }}
                            ></div>
                          </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Global class occupancy filling bar */}
                  <div className="w-full md:w-56 shrink-0 space-y-1.5 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-200/50 md:pl-5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Remplissage</span>
                      <span className="font-extrabold text-slate-900 leading-none">{cls.totalStudents} / {effectiveMax}</span>
                    </div>
                    
                    <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getOccupancyColor(
                          cls.totalStudents,
                          effectiveMax
                        )}`}
                        style={{ width: `${occupancyPercent}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold leading-none">
                      <span>Seuil : {effectiveMax} Max</span>
                      <span>{occupancyPercent}% rempli</span>
                    </div>

                    {/* Violation warnings tags */}
                    {ceilings.map(ceil => {
                      const violated = cls.totalStudents > ceil.limit;
                      return (
                        <div
                          key={ceil.level}
                          className={`mt-1.5 flex items-center gap-1.5 text-[9px] font-bold tracking-tight rounded px-1.5 py-0.5 leading-none w-max ${
                            violated
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                              : 'bg-indigo-50 text-indigo-800'
                          }`}
                        >
                          <TriangleAlert className="w-2.5 h-2.5 shrink-0" />
                          Plafonné ({ceil.level}): {ceil.limit} max
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Solver feedback and minor rules compromises warnings */}
        {selectedProposal.classes.some(c => {
          const ceilings = getClassSpecificCeilings(c, selectedProposal.config);
          const maxAllowedGlobal = selectedProposal.config.solver.globalMaxClassSize;
          const effectiveMax = ceilings.length > 0 ? Math.min(...ceilings.map(cc => cc.limit)) : maxAllowedGlobal;
          return c.totalStudents > effectiveMax;
        }) && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 my-2">
            <div className="font-bold flex items-center gap-1 text-sm">
              <TriangleAlert className="w-4 h-4" />
              Alerte de dépassement de capacité d'élèves !
            </div>
            <p>
              En raison de la distribution mathématique de vos effectifs, certaines classes de cette proposition dépassent vos plafonds d'élèves configurés. Vous devriez envisager d'augmenter le seuil d'élèves par classe.
            </p>
          </div>
        )}

        {/* Educational optimization feedback suggestions */}
        <div className="p-4.5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-100 pb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Analyse
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Indicateurs Globaux</span>
              <ul className="text-xs text-blue-900/80 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  La répartition présente un écart-type d'homogénéité de{' '}
                  <strong className="text-blue-900 font-bold">{selectedProposal.stats.standardDeviation}</strong>, ce qui est qualifié de{' '}
                  <strong className="text-blue-900 font-bold">« {getHomogeneityLabel(selectedProposal.stats.standardDeviation)} »</strong>.
                </li>
                {selectedProposal.stats.doubleLevelCount > 0 ? (
                  <li>
                    Il y a {selectedProposal.stats.doubleLevelCount} classe(s) à cours doubles ou multiples nécessaire(s) pour répartir vos effectifs. Les autres classes conservent un niveau unique.
                  </li>
                ) : (
                  <li>
                    Aucune classe à cours doubles ou multiples n'est nécessaire. Toutes vos classes conservent un niveau unique (100% à niveau simple).
                  </li>
                )}
                {selectedProposal.classes.map((c, sIdx) => {
                  const tinyLevels = Object.entries(c.levels).filter(([_, qty]) => (qty || 0) > 0 && (qty || 0) <= 3);
                  if (tinyLevels.length > 0 && Object.keys(c.levels).length === 2) {
                    return (
                      <li key={sIdx} className="text-amber-800 list-none mt-1 p-2 rounded-lg bg-amber-50 border border-amber-100/70 text-[11px] font-semibold flex items-start gap-1.5">
                        <TriangleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>La classe n°{sIdx + 1} contient un effectif très faible pour le niveau {tinyLevels[0][0]} ({tinyLevels[0][1]} {tinyLevels[0][1] > 1 ? 'élèves' : 'élève'}). Cela peut être difficile à intégrer.</span>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>

            <div className="space-y-2.5 border-t md:border-t-0 md:border-l border-blue-100 pt-3.5 md:pt-0 md:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Équilibre par Cycles d'Enseignement</span>
              <div className="space-y-2.5">
                {[
                  { num: 1, name: 'Cycle 1', target: 'PS/MS/GS' },
                  { num: 2, name: 'Cycle 2', target: 'CP/CE1/CE2' },
                  { num: 3, name: 'Cycle 3', target: 'CM1/CM2' }
                ].map(cycleDef => {
                  const classes = getCycleClasses(cycleDef.num as 1 | 2 | 3);
                  const stdDev = getCycleStdDev(classes);
                  const avg = getCycleAvg(classes);
                  
                  return (
                    <div key={cycleDef.num} className="bg-white/60 p-2.5 border border-slate-200/40 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-blue-900 leading-none">
                          {cycleDef.name} <span className="text-[10px] text-slate-400 font-bold">({cycleDef.target})</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {classes.length} {classes.length > 1 ? 'classes' : 'classe'}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-600 font-semibold flex flex-wrap items-center gap-1.5">
                        {classes.length === 0 ? (
                          <span className="text-slate-400 italic">Aucune classe principale pour ce cycle.</span>
                        ) : classes.length === 1 ? (
                          <>
                            <span>Classe de {classes[0].totalStudents} élèves.</span>
                            <span className="font-bold text-slate-600">Enseignant unique</span>
                          </>
                        ) : (
                          <>
                            <span>Moyenne : <strong className="text-slate-800 font-extrabold">{avg} él.</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Écart-type : <strong className="text-indigo-900 font-black">{stdDev}</strong></span>
                            {stdDev !== null && (
                              <span className={`px-1 rounded text-[9px] font-black uppercase ${
                                stdDev < 1.0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                stdDev <= 1.5 ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                stdDev <= 2.5 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {getCycleStdDevStatus(stdDev)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Save proposal workflow */}
        <div className="bg-slate-50 rounded-xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200/65">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-center sm:justify-start gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Cette configuration de classe vous intéresse ?
            </h4>
            <p className="text-xs text-slate-400">
              Enregistrez-la pour pouvoir la comparer à d'autres alternatives ou l'imprimer.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              placeholder={`Option n°${activeTab + 1} (${selectedProposal.stats.totalClasses} classes)`}
              className="flex-1 sm:w-64 h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
              disabled={isAlreadySaved}
            />
            <button
              onClick={handleSaveClick}
              disabled={isAlreadySaved}
              className={`h-9 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-nowrap select-none ${
                isAlreadySaved
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isAlreadySaved ? 'Proposition close' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ALL_LEVELS_ORDER: LevelId[] = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];
