/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AllocationProposal, LevelId, ALL_LEVELS_ORDER } from '../types';
import {
  GitCompare,
  ArrowRightLeft,
  Scale,
  Layers
} from 'lucide-react';

interface DualProposalComparerProps {
  activeProposals: AllocationProposal[];
  savedProposals: AllocationProposal[];
}

export default function DualProposalComparer({
  activeProposals,
  savedProposals
}: DualProposalComparerProps) {
  // Combine active (generated) and saved proposals for full flexibility
  const [proposalAId, setProposalAId] = useState<string>('');
  const [proposalBId, setProposalBId] = useState<string>('');

  // Built proposal pool for choice options
  const allProposals: AllocationProposal[] = [];
  
  activeProposals.forEach((p) => {
    allProposals.push({
      ...p,
      name: `${p.name} (Génération active)`
    });
  });

  savedProposals.forEach(p => {
    // Avoid double adding if already in there by ID
    if (!allProposals.some(ap => ap.id === p.id)) {
      allProposals.push({
        ...p,
        name: `${p.name} (Sauvegardé)`
      });
    }
  });

  // Automatically initialize selected proposals
  useEffect(() => {
    if (allProposals.length >= 2) {
      // Find default IDs that are different
      if (!proposalAId || !allProposals.some(p => p.id === proposalAId)) {
        setProposalAId(allProposals[0].id);
      }
      if (!proposalBId || !allProposals.some(p => p.id === proposalBId) || proposalBId === allProposals[0].id) {
        setProposalBId(allProposals[1]?.id || allProposals[0].id);
      }
    }
  }, [activeProposals, savedProposals, proposalAId, proposalBId]);

  if (allProposals.length < 2) {
    return (
      <div className="bg-brand-bg/50 border border-brand-border-medium rounded-2xl p-6 text-center text-slate-500">
        <GitCompare className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
        <h3 className="font-bold text-slate-700 text-sm">Comparateur de Scénarios</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Générez des scénarios de classes ou chargez des exemples pour débloquer le comparateur côte-à-côte de deux propositions.
        </p>
      </div>
    );
  }

  const propA = allProposals.find(p => p.id === proposalAId) || allProposals[0];
  const propB = allProposals.find(p => p.id === proposalBId) || allProposals[1] || allProposals[0];

  // Helper to get multi-level descriptions for comparison
  const getDoubleLevelsList = (prop: AllocationProposal) => {
    const list: string[] = [];
    prop.classes.forEach(cls => {
      const lvls = Object.keys(cls.levels).filter(l => (cls.levels[l as LevelId] || 0) > 0);
      if (lvls.length >= 2) {
        list.push(lvls.join('/'));
      }
    });
    return list;
  };

  const dblA = getDoubleLevelsList(propA);
  const dblB = getDoubleLevelsList(propB);

  // Compare stats to give recommendation highlights
  const sdA = propA.stats.standardDeviation;
  const sdB = propB.stats.standardDeviation;

  const classesCountA = propA.stats.totalClasses;
  const classesCountB = propB.stats.totalClasses;

  const doubleLevelsCountA = propA.stats.doubleLevelCount;
  const doubleLevelsCountB = propB.stats.doubleLevelCount;

  const getHomogeneityLabel = (stdDev: number) => {
    if (stdDev < 1.0) return "Très équilibrée";
    if (stdDev <= 1.5) return "Très Homogène";
    if (stdDev <= 2.5) return "Équilibré";
    return "Hétérogène";
  };

  const getHomogeneityFullText = (stdDev: number) => {
    if (stdDev < 1.0) return "Très équilibrée, répartition optimale";
    if (stdDev <= 1.5) return "Très Homogène (1-2 él. d'écart)";
    if (stdDev <= 2.5) return "Équilibré (3-4 él. d'écart)";
    return "Hétérogène (écarts marqués)";
  };

  // Helper for computing cycle-wise stats for any proposal
  const getProposalCycleDetails = (proposal: AllocationProposal) => {
    const classCycles = proposal.classes.map(cls => {
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

    const getCycleStdDev = (classes: typeof proposal.classes) => {
      if (classes.length <= 1) return null;
      const sizes = classes.map(c => c.totalStudents);
      const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const sqDiffSum = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0);
      return Math.round(Math.sqrt(sqDiffSum / sizes.length) * 100) / 100;
    };

    const getCycleAvg = (classes: typeof proposal.classes) => {
      if (classes.length === 0) return null;
      const sizes = classes.map(c => c.totalStudents);
      return Math.round((sizes.reduce((a, b) => a + b, 0) / sizes.length) * 10) / 10;
    };

    return {
      c1: { classes: getCycleClasses(1), stdDev: getCycleStdDev(getCycleClasses(1)), avg: getCycleAvg(getCycleClasses(1)), label: getCycleClasses(1).length > 1 ? getHomogeneityLabel(getCycleStdDev(getCycleClasses(1))!) : "N/A" },
      c2: { classes: getCycleClasses(2), stdDev: getCycleStdDev(getCycleClasses(2)), avg: getCycleAvg(getCycleClasses(2)), label: getCycleClasses(2).length > 1 ? getHomogeneityLabel(getCycleStdDev(getCycleClasses(2))!) : "N/A" },
      c3: { classes: getCycleClasses(3), stdDev: getCycleStdDev(getCycleClasses(3)), avg: getCycleAvg(getCycleClasses(3)), label: getCycleClasses(3).length > 1 ? getHomogeneityLabel(getCycleStdDev(getCycleClasses(3))!) : "N/A" }
    };
  };

  const cycleDetailsA = getProposalCycleDetails(propA);
  const cycleDetailsB = getProposalCycleDetails(propB);

  const sortClassesByAge = (classesList: typeof propA.classes) => {
    return [...classesList].sort((a, b) => {
      const getWeightedIndex = (cls: typeof a) => {
        let weightedSum = 0;
        let total = 0;
        Object.entries(cls.levels).forEach(([lvl, qty]) => {
          if (qty && qty > 0) {
            const idx = ALL_LEVELS_ORDER.indexOf(lvl as LevelId);
            weightedSum += idx * qty;
            total += qty;
          }
        });
        return total > 0 ? weightedSum / total : 0;
      };

      const valA = getWeightedIndex(a);
      const valB = getWeightedIndex(b);

      if (valA !== valB) {
        return valA - valB;
      }

      const minIndexA = Math.min(...Object.keys(a.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      const minIndexB = Math.min(...Object.keys(b.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      return minIndexA - minIndexB;
    });
  };

  const sortedClassesA = sortClassesByAge(propA.classes);
  const sortedClassesB = sortClassesByAge(propB.classes);

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border-light p-6 shadow-sm space-y-6">
      {/* Header section of comparer */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-border-light pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-bg text-slate-700 rounded-lg border border-brand-border-medium">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Comparateur Libre de Solutions</h2>
            <p className="text-xs text-slate-400">Sélectionnez 2 scénarios pour les analyser côte-à-côte.</p>
          </div>
        </div>

        {/* Action picker dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="w-full sm:w-64">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Option de Référence (A)</label>
            <select
              value={proposalAId}
              onChange={(e) => setProposalAId(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg border border-brand-border-medium rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {allProposals.map(p => (
                <option key={`A-${p.id}`} value={p.id} disabled={p.id === proposalBId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-1 text-slate-350 shrink-0 hidden sm:block">
            <ArrowRightLeft className="w-4 h-4" />
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Option de Comparaison (B)</label>
            <select
              value={proposalBId}
              onChange={(e) => setProposalBId(e.target.value)}
              className="w-full h-9 px-3 bg-brand-bg border border-brand-border-medium rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {allProposals.map(p => (
                <option key={`B-${p.id}`} value={p.id} disabled={p.id === proposalAId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {propA.id === propB.id ? (
        <div className="p-4 bg-amber-50 rounded-xl text-center text-amber-700 text-xs font-medium border border-amber-200">
          Sélectionnez deux propositions différentes pour afficher le rapport de comparaison.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key difference matrices grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A Card */}
            <div className="bg-indigo-50/20 rounded-xl p-5 border border-indigo-100/60 space-y-5">
              <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2.5">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md">
                  Scénario [A]
                </span>
                <span className="text-xs font-bold text-slate-800">{propA.name.split(' (')[0]}</span>
              </div>

              {/* Stats column A list */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Effectif moyen</span>
                  <span className="text-lg font-black text-slate-800">{propA.stats.averageClassSize} él.</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Amplitude</span>
                  <span className="text-lg font-black text-slate-800">{propA.stats.minClassSize} - {propA.stats.maxClassSize} él.</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Homogénéité</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-lg font-black text-indigo-700">{sdA}</span>
                    {sdA < sdB && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black whitespace-nowrap animate-pulse">
                        Mieux 🏆
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block leading-none mt-1">
                    {getHomogeneityFullText(sdA)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Niveaux multiples</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-lg font-black text-slate-800">{doubleLevelsCountA} class.</span>
                    {doubleLevelsCountA < doubleLevelsCountB && (
                      <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 font-extrabold rounded">
                        Mieux 🏆
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-450 font-medium block mt-1">
                    {doubleLevelsCountA === 0 ? "Pur niveau unique !" : `${doubleLevelsCountA} cours multiples`}
                  </span>
                </div>
              </div>

              {/* Cycle stdDev for A */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-150/80 space-y-2">
                <span className="text-[10.5px] text-indigo-900 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  Homogénéité par Cycles
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'c1' as const, name: 'Cycle 1' },
                    { key: 'c2' as const, name: 'Cycle 2' },
                    { key: 'c3' as const, name: 'Cycle 3' }
                  ].map(cyl => {
                    const info = cycleDetailsA[cyl.key];
                    return (
                      <div key={cyl.key} className="bg-slate-50/50 p-2 rounded border border-slate-100 text-center flex flex-col justify-between min-h-[64px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">{cyl.name}</span>
                        <div className="my-1">
                          {info.classes.length > 1 ? (
                            <span className="text-xs font-black text-indigo-850">σ = {info.stdDev}</span>
                          ) : info.classes.length === 1 ? (
                            <span className="text-[9px] font-bold text-emerald-650 block leading-tight bg-emerald-50 py-0.5 rounded">1 classe</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic block">Vide</span>
                          )}
                        </div>
                        {info.classes.length > 1 && (
                          <span className={`text-[9px] font-black uppercase tracking-tight py-0.5 px-0.5 rounded leading-none ${
                            info.stdDev! < 1.0 ? 'bg-emerald-50 text-emerald-700' :
                            info.stdDev! <= 1.5 ? 'bg-sky-50 text-sky-700' :
                            info.stdDev! <= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {info.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Double level mixtures listed */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-450" />
                  Niveaux multiples créés ({dblA.length})
                </span>
                {dblA.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {dblA.map((d, i) => (
                      <span key={i} className="text-xs bg-indigo-50/60 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded font-extrabold shadow-3xs">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic font-medium block">Aucun niveau multiple</span>
                )}
              </div>

              {/* Layout detail of classrooms */}
              <div className="space-y-2">
                <span className="text-[10.5px] text-indigo-900 font-extrabold uppercase tracking-wider block">Composition détaillée des classes</span>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {sortedClassesA.map((cls, idx) => {
                    const sorted = Object.entries(cls.levels)
                      .filter(([_, q]) => (q || 0) > 0)
                      .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId))
                      .map(([lvl, q]) => `${lvl}: ${q}`)
                      .join(' + ');

                    return (
                      <div key={cls.id} className="text-xs flex flex-col justify-center bg-white border border-slate-150 p-2.5 rounded-lg hover:border-indigo-200 transition">
                        <div className="flex items-center justify-between font-extrabold">
                          <span className="text-indigo-800 text-xs font-black">{cls.customName || `Classe ${idx + 1}`}</span>
                          <span className="text-slate-800 text-xs">{cls.totalStudents} élèves</span>
                        </div>
                        <span className="text-slate-500 font-bold text-[11px] mt-1 leading-normal">{sorted}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column B Card */}
            <div className="bg-purple-50/25 rounded-xl p-5 border border-purple-100/60 space-y-5">
              <div className="flex items-center justify-between border-b border-purple-100/50 pb-2.5">
                <span className="text-xs font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">
                  Scénario [B]
                </span>
                <span className="text-xs font-bold text-slate-800">{propB.name.split(' (')[0]}</span>
              </div>

              {/* Stats column B list */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Effectif moyen</span>
                  <span className="text-lg font-black text-slate-800">{propB.stats.averageClassSize} él.</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Amplitude</span>
                  <span className="text-lg font-black text-slate-800">{propB.stats.minClassSize} - {propB.stats.maxClassSize} él.</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Homogénéité</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-lg font-black text-purple-750">{sdB}</span>
                    {sdB < sdA && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black whitespace-nowrap animate-pulse">
                        Mieux 🏆
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block leading-none mt-1">
                    {getHomogeneityFullText(sdB)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-100/80 shadow-3xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Niveaux multiples</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-lg font-black text-slate-800">{doubleLevelsCountB} class.</span>
                    {doubleLevelsCountB < doubleLevelsCountA && (
                      <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.5 font-extrabold rounded">
                        Mieux 🏆
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-450 font-medium block mt-1">
                    {doubleLevelsCountB === 0 ? "Pur niveau unique !" : `${doubleLevelsCountB} cours multiples`}
                  </span>
                </div>
              </div>

              {/* Cycle stdDev for B */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-150/80 space-y-2">
                <span className="text-[10.5px] text-purple-900 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-purple-500" />
                  Homogénéité par Cycles
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'c1' as const, name: 'Cycle 1' },
                    { key: 'c2' as const, name: 'Cycle 2' },
                    { key: 'c3' as const, name: 'Cycle 3' }
                  ].map(cyl => {
                    const info = cycleDetailsB[cyl.key];
                    return (
                      <div key={cyl.key} className="bg-slate-50/50 p-2 rounded border border-slate-100 text-center flex flex-col justify-between min-h-[64px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">{cyl.name}</span>
                        <div className="my-1">
                          {info.classes.length > 1 ? (
                            <span className="text-xs font-black text-purple-850">σ = {info.stdDev}</span>
                          ) : info.classes.length === 1 ? (
                            <span className="text-[9px] font-bold text-emerald-650 block leading-tight bg-emerald-50 py-0.5 rounded">1 classe</span>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic block">Vide</span>
                          )}
                        </div>
                        {info.classes.length > 1 && (
                          <span className={`text-[9px] font-black uppercase tracking-tight py-0.5 px-0.5 rounded leading-none ${
                            info.stdDev! < 1.0 ? 'bg-emerald-50 text-emerald-700' :
                            info.stdDev! <= 1.5 ? 'bg-sky-50 text-sky-700' :
                            info.stdDev! <= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {info.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Double level mixtures listed */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-100 space-y-2">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                  <Layers className="w-3 h-3 text-slate-450" />
                  Niveaux multiples créés ({dblB.length})
                </span>
                {dblB.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {dblB.map((d, i) => (
                      <span key={i} className="text-xs bg-purple-50/65 border border-purple-100 text-purple-700 px-2.5 py-0.5 rounded font-extrabold shadow-3xs">
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic font-medium block">Aucun niveau multiple</span>
                )}
              </div>

              {/* Layout detail of classrooms */}
              <div className="space-y-2">
                <span className="text-[10.5px] text-purple-900 font-extrabold uppercase tracking-wider block">Composition détaillée des classes</span>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {sortedClassesB.map((cls, idx) => {
                    const sorted = Object.entries(cls.levels)
                      .filter(([_, q]) => (q || 0) > 0)
                      .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId))
                      .map(([lvl, q]) => `${lvl}: ${q}`)
                      .join(' + ');

                    return (
                      <div key={cls.id} className="text-xs flex flex-col justify-center bg-white border border-slate-150 p-2.5 rounded-lg hover:border-purple-200 transition">
                        <div className="flex items-center justify-between font-extrabold">
                          <span className="text-purple-800 text-xs font-black">{cls.customName || `Classe ${idx + 1}`}</span>
                          <span className="text-slate-800 text-xs">{cls.totalStudents} élèves</span>
                        </div>
                        <span className="text-slate-500 font-bold text-[11px] mt-1 leading-normal">{sorted}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Matrix comparing both of them in a visual grid table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-150">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-slate-500" />
                Matrice d'Évaluation Comparative des Critères
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 bg-slate-50/50 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-extrabold">Indicateur Pédagogique / Technique</th>
                    <th className="py-2.5 px-4 font-extrabold">Option [A]</th>
                    <th className="py-2.5 px-4 font-extrabold">Option [B]</th>
                    <th className="py-2.5 px-4 font-extrabold text-center">Meilleure Solution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 font-medium text-slate-700">
                  {/* Global deviation */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Écart-type Global <span className="text-[10px] text-slate-400 font-normal">(Homogénéité)</span>
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">Mesure l'homogénéité globale des classes</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{sdA}</span>
                      <span className={`block text-[9.5px] font-bold ${
                        sdA < 1.0 ? 'text-emerald-700' : sdA <= 1.5 ? 'text-sky-750' : sdA <= 2.5 ? 'text-amber-700' : 'text-rose-700'
                      }`}>{getHomogeneityFullText(sdA)}</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{sdB}</span>
                      <span className={`block text-[9.5px] font-bold ${
                        sdB < 1.0 ? 'text-emerald-700' : sdB <= 1.5 ? 'text-sky-750' : sdB <= 2.5 ? 'text-amber-700' : 'text-rose-700'
                      }`}>{getHomogeneityFullText(sdB)}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {sdA === sdB ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : sdA < sdB ? (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>

                  {/* Amplitude */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Amplitude des tailles de classe
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">Différence entre la plus petite et la plus grande classe</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{propA.stats.minClassSize} - {propA.stats.maxClassSize} él.</span>
                      <span className="block text-[10px] text-slate-400">Écart de {propA.stats.maxClassSize - propA.stats.minClassSize} élèves</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{propB.stats.minClassSize} - {propB.stats.maxClassSize} él.</span>
                      <span className="block text-[10px] text-slate-400">Écart de {propB.stats.maxClassSize - propB.stats.minClassSize} élèves</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {Math.abs(propA.stats.maxClassSize - propA.stats.minClassSize) === Math.abs(propB.stats.maxClassSize - propB.stats.minClassSize) ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : Math.abs(propA.stats.maxClassSize - propA.stats.minClassSize) < Math.abs(propB.stats.maxClassSize - propB.stats.minClassSize) ? (
                        <span className="bg-emerald-50 text-emerald-750 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-750 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>

                  {/* Multi-level counts */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Classes à cours doubles ou multiples
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">À minimiser pour faciliter la gestion de la classe</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{doubleLevelsCountA} classes</span>
                      <span className="block text-[10px] text-slate-400">{dblA.length > 0 ? dblA.join(', ') : 'Aucun'}</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      <span className="font-extrabold text-slate-800 text-xs">{doubleLevelsCountB} classes</span>
                      <span className="block text-[10px] text-slate-400">{dblB.length > 0 ? dblB.join(', ') : 'Aucun'}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {doubleLevelsCountA === doubleLevelsCountB ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : doubleLevelsCountA < doubleLevelsCountB ? (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>

                  {/* Cycle 1 Std Dev */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Écart-type Cycle 1 <span className="text-[10px] text-slate-400 font-normal">(PS/MS/GS)</span>
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">Homogénéité entre collègues de maternelle</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsA.c1.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsA.c1.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsA.c1.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsB.c1.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsB.c1.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsB.c1.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {cycleDetailsA.c1.stdDev === null || cycleDetailsB.c1.stdDev === null ? (
                        <span className="text-slate-400 italic block text-[10px]">N/A</span>
                      ) : cycleDetailsA.c1.stdDev === cycleDetailsB.c1.stdDev ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : cycleDetailsA.c1.stdDev! < cycleDetailsB.c1.stdDev! ? (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>

                  {/* Cycle 2 Std Dev */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Écart-type Cycle 2 <span className="text-[10px] text-slate-400 font-normal">(CP/CE1/CE2)</span>
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">Homogénéité entre collègues du Cycle 2</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsA.c2.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsA.c2.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsA.c2.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsB.c2.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsB.c2.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsB.c2.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {cycleDetailsA.c2.stdDev === null || cycleDetailsB.c2.stdDev === null ? (
                        <span className="text-slate-400 italic block text-[10px]">N/A</span>
                      ) : cycleDetailsA.c2.stdDev === cycleDetailsB.c2.stdDev ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : cycleDetailsA.c2.stdDev! < cycleDetailsB.c2.stdDev! ? (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>

                  {/* Cycle 3 Std Dev */}
                  <tr className="hover:bg-slate-50/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100">
                      Écart-type Cycle 3 <span className="text-[10px] text-slate-400 font-normal">(CM1/CM2)</span>
                      <span className="block text-[10px] text-slate-400 font-semibold leading-normal">Homogénéité entre collègues du Cycle 3</span>
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsA.c3.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsA.c3.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsA.c3.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-100">
                      {cycleDetailsB.c3.classes.length > 1 ? (
                        <>
                          <span className="font-extrabold text-slate-800 text-xs">σ = {cycleDetailsB.c3.stdDev}</span>
                          <span className="block text-[10px] text-slate-500 font-semibold">{cycleDetailsB.c3.label}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 italic block text-[10px]">Non comparable (≤ 1 cl.)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {cycleDetailsA.c3.stdDev === null || cycleDetailsB.c3.stdDev === null ? (
                        <span className="text-slate-400 italic block text-[10px]">N/A</span>
                      ) : cycleDetailsA.c3.stdDev === cycleDetailsB.c3.stdDev ? (
                        <span className="bg-slate-100 text-slate-600 font-extrabold px-2 py-0.5 rounded text-[10px]">Équivalent</span>
                      ) : cycleDetailsA.c3.stdDev! < cycleDetailsB.c3.stdDev! ? (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [A] 🏆</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded border border-emerald-100 inline-block text-[10.5px]">Solution [B] 🏆</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analysis Comparison Report card */}
          <div className="p-4.5 bg-slate-50 border border-slate-205 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-slate-500" />
              Synthèse d'Équilibre Comparée
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 font-medium">
                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0 mt-1.5"></div>
                  <span>
                    <strong>Nombre de Classes :</strong> {classesCountA === classesCountB ? (
                      `Les deux options partagent exactement le même nombre de classes (${classesCountA}).`
                    ) : (
                      `L'option [A] comporte ${classesCountA} classes contre ${classesCountB} pour l'option [B].`
                    )}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0 mt-1.5"></div>
                  <span>
                    <strong>Équilibre des tailles :</strong> {sdA === sdB ? (
                      "Les deux options affichent la même répartition homogène des tailles de classe."
                    ) : sdA < sdB ? (
                      `L'option [A] est mathématiquement plus équilibrée avec un écart-type global plus faible (${sdA} contre ${sdB}).`
                    ) : (
                      `L'option [B] est mathématiquement plus équilibrée avec un écart-type global plus faible (${sdB} contre ${sdA}).`
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2 font-medium">
                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0 mt-1.5"></div>
                  <span>
                    <strong>Cours doubles ou multiples :</strong> {doubleLevelsCountA === doubleLevelsCountB ? (
                      `Les deux options nécessitent le même nombre de classes à cours doubles ou multiples (${doubleLevelsCountA}).`
                    ) : doubleLevelsCountA < doubleLevelsCountB ? (
                      `L'option [A] comporte moins de classes à cours doubles ou multiples (${doubleLevelsCountA} contre {doubleLevelsCountB} pour B).`
                    ) : (
                      `L'option [B] comporte moins de classes à cours doubles ou multiples (${doubleLevelsCountB} contre {doubleLevelsCountA} pour A).`
                    )}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0 mt-1.5"></div>
                  <span>
                    <strong>Associations de niveaux :</strong> {JSON.stringify(dblA.sort()) === JSON.stringify(dblB.sort()) ? (
                      "Les deux options forment exactement les mêmes regroupements pédagogiques de cours doubles ou multiples."
                    ) : (
                      "Les choix d'associations diffèrent. Repérez l'option avec les regroupements de niveaux les plus cohérents pour vos élèves."
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
