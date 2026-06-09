/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SolverConfig } from '../types';
import { Settings, Plus, Minus, Info, ArrowUpDown, Layers, HelpCircle } from 'lucide-react';

interface SolverControlsProps {
  config: SolverConfig;
  onChangeConfig: (newConfig: SolverConfig) => void;
}

export default function SolverControls({
  config,
  onChangeConfig
}: SolverControlsProps) {

  const [minInput, setMinInput] = useState(config.globalMinClassSize.toString());
  const [maxInput, setMaxInput] = useState(config.globalMaxClassSize.toString());
  const [multiMinInput, setMultiMinInput] = useState((config.multiLevelMinStudentsPerLevel ?? 4).toString());
  const [multiMaxInput, setMultiMaxInput] = useState((config.multiLevelMaxStudentsPerLevel ?? 18).toString());

  // Keep local input states in sync with config when config changes (e.g., via preset loading)
  useEffect(() => {
    setMinInput(config.globalMinClassSize.toString());
  }, [config.globalMinClassSize]);

  useEffect(() => {
    setMaxInput(config.globalMaxClassSize.toString());
  }, [config.globalMaxClassSize]);

  useEffect(() => {
    setMultiMinInput((config.multiLevelMinStudentsPerLevel ?? 4).toString());
  }, [config.multiLevelMinStudentsPerLevel]);

  useEffect(() => {
    setMultiMaxInput((config.multiLevelMaxStudentsPerLevel ?? 18).toString());
  }, [config.multiLevelMaxStudentsPerLevel]);

  const handleClassChange = (delta: number) => {
    onChangeConfig({
      ...config,
      maxClasses: Math.max(1, Math.min(15, config.maxClasses + delta))
    });
  };

  const setMinimizeDouble = (val: boolean) => {
    onChangeConfig({
      ...config,
      minimizeDoubleLevels: val
    });
  };

  const setConsecutiveOnly = (val: boolean) => {
    onChangeConfig({
      ...config,
      consecutiveDoubleLevelsOnly: val
    });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMinInput(raw);
    const parsed = parseInt(raw, 10);
    // Allow typing numbers comfortably without changing user text immediately
    if (!isNaN(parsed) && parsed > 0) {
      onChangeConfig({
        ...config,
        globalMinClassSize: parsed
      });
    }
  };

  const handleMinBlur = () => {
    let parsed = parseInt(minInput, 10);
    // Enforce limits strictly only when user leaves the field
    if (isNaN(parsed) || parsed < 5) {
      parsed = 5;
    } else if (parsed > 45) {
      parsed = 45;
    }
    setMinInput(parsed.toString());
    onChangeConfig({
      ...config,
      globalMinClassSize: parsed
    });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMaxInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChangeConfig({
        ...config,
        globalMaxClassSize: parsed
      });
    }
  };

  const handleMaxBlur = () => {
    let parsed = parseInt(maxInput, 10);
    if (isNaN(parsed) || parsed < 5) {
      parsed = 5;
    } else if (parsed > 45) {
      parsed = 45;
    }
    setMaxInput(parsed.toString());
    onChangeConfig({
      ...config,
      globalMaxClassSize: parsed
    });
  };

  const handleMultiMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMultiMinInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChangeConfig({
        ...config,
        multiLevelMinStudentsPerLevel: parsed
      });
    }
  };

  const handleMultiMinBlur = () => {
    let parsed = parseInt(multiMinInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      parsed = 1;
    } else if (parsed > 25) {
      parsed = 25;
    }
    setMultiMinInput(parsed.toString());
    onChangeConfig({
      ...config,
      multiLevelMinStudentsPerLevel: parsed
    });
  };

  const handleMultiMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMultiMaxInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onChangeConfig({
        ...config,
        multiLevelMaxStudentsPerLevel: parsed
      });
    }
  };

  const handleMultiMaxBlur = () => {
    let parsed = parseInt(multiMaxInput, 10);
    if (isNaN(parsed) || parsed < 5) {
      parsed = 5;
    } else if (parsed > 40) {
      parsed = 40;
    }
    setMultiMaxInput(parsed.toString());
    onChangeConfig({
      ...config,
      multiLevelMaxStudentsPerLevel: parsed
    });
  };

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border-light p-6 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 border-b border-brand-border-light pb-4 mb-5">
          <div className="p-1.5 bg-brand-bg text-slate-700 rounded-lg border border-brand-border-medium">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">1. Paramètres de Répartition</h2>
            <p className="text-xs text-slate-400">Ajustez les contraintes de dimensionnement de l'école.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Max classes limit input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 block">
              Nombre maximal de classes
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleClassChange(-1)}
                className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-border-medium text-slate-600 hover:bg-brand-accent transition flex items-center justify-center cursor-pointer font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center bg-brand-bg border border-brand-border-medium rounded-xl py-2">
                <span className="text-xl font-extrabold text-indigo-700">{config.maxClasses}</span>
                <span className="text-xs text-slate-500 font-medium block">classes</span>
              </div>
              <button
                type="button"
                onClick={() => handleClassChange(1)}
                className="w-10 h-10 rounded-xl bg-brand-bg border border-brand-border-medium text-slate-600 hover:bg-brand-accent transition flex items-center justify-center cursor-pointer font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Global standard capacities */}
          <div className="border-t border-brand-border-light pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gabarit d'effectif standard</h4>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-medium block">Effectif min ciblé</label>
                <input
                  type="number"
                  value={minInput}
                  onChange={handleMinChange}
                  onBlur={handleMinBlur}
                  className="w-full text-sm font-semibold text-slate-700 bg-brand-bg hover:bg-brand-accent/40 border border-brand-border-medium rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 font-medium block">Effectif max absolu</label>
                <input
                  type="number"
                  value={maxInput}
                  onChange={handleMaxChange}
                  onBlur={handleMaxBlur}
                  className="w-full text-sm font-semibold text-slate-700 bg-brand-bg hover:bg-brand-accent/40 border border-brand-border-medium rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Priorité d'homogénéité */}
          <div className="border-t border-brand-border-light pt-4 space-y-2">
            <label className="text-sm font-bold text-slate-700 block">
              Priorité d'homogénéité des effectifs
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, homogeneityPriority: 'global' })}
                className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all text-center leading-tight ${
                  config.homogeneityPriority === 'global' || !config.homogeneityPriority
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                }`}
              >
                Globale (toutes classes)
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, homogeneityPriority: 'cycle' })}
                className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all text-center leading-tight ${
                  config.homogeneityPriority === 'cycle'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                }`}
              >
                Par cycle (C1, C2, C3)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {config.homogeneityPriority === 'cycle'
                ? "L'algorithme équilibre en priorité les effectifs au sein de chaque cycle d'apprentissage."
                : "L'algorithme équilibre au mieux les effectifs de l'ensemble des classes de l'école."}
            </p>
          </div>

          {/* Paramètres de niveaux multiples */}
          <div className="space-y-3 bg-brand-bg/50 border border-brand-border-medium rounded-xl p-3.5">
            <label className="text-sm font-bold text-slate-700 block">
              Paramètres de niveaux multiples
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, multipleLevelsPolicy: 'pure_only' })}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer text-left transition-all flex items-center justify-between ${
                  config.multipleLevelsPolicy === 'pure_only'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                }`}
              >
                <span>Classes pures uniquement</span>
                <span className="text-[10px] opacity-80 font-normal">(1 niveau max)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, multipleLevelsPolicy: 'double_only' })}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer text-left transition-all flex items-center justify-between ${
                  config.multipleLevelsPolicy === 'double_only'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                }`}
              >
                <span>Double niveaux possibles</span>
                <span className="text-[10px] opacity-80 font-normal">(2 niveaux max)</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, multipleLevelsPolicy: 'multi_levels' })}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer text-left transition-all flex items-center justify-between ${
                  config.multipleLevelsPolicy === 'multi_levels' || !config.multipleLevelsPolicy
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                }`}
              >
                <span>Niveaux multiples possibles</span>
                <span className="text-[10px] opacity-80 font-normal">(jusqu'à 4 niveaux)</span>
              </button>
            </div>

            {config.multipleLevelsPolicy !== 'pure_only' && (
              <div className="pt-2.5 border-t border-brand-border-medium mt-2 space-y-3.5">
                {/* Optimisation sub-setting */}
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Optimisation des niveaux multiples</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMinimizeDouble(false)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center ${
                        !config.minimizeDoubleLevels
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                      }`}
                    >
                      Tolérer & Équilibrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setMinimizeDouble(true)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all text-center ${
                        config.minimizeDoubleLevels
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                      }`}
                      title="Tente de créer un maximum de classes de niveau unique"
                    >
                      Minimiser absolument
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {config.minimizeDoubleLevels
                      ? "Privilégie les classes d'un seul niveau au détriment de la régularité des effectifs globaux."
                      : "Autorise librement les couplages pour garantir l'homogénéité parfaite des effectifs par classe."}
                  </p>
                </div>

                {/* Succession des âges sub-setting */}
                <div className="space-y-2 pt-2.5 border-t border-brand-border-medium">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Composition des niveaux multiples</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConsecutiveOnly(true)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        config.consecutiveDoubleLevelsOnly
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      Niveaux consécutifs
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsecutiveOnly(false)}
                      className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !config.consecutiveDoubleLevelsOnly
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-brand-card text-slate-600 border-brand-border-medium hover:bg-brand-accent/50'
                      }`}
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      Écarts autorisés
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {config.consecutiveDoubleLevelsOnly
                      ? "Autorise seulement des classes adjacentes (ex: GS/CP, CM1/CM2). Recommandé."
                      : "Autorise des couplages disjoints (ex: CP/CE2, PS/GS) si nécessaire."}
                  </p>
                </div>

                {/* Effectifs min/max par groupe de niveau */}
                <div className="space-y-2 pt-2.5 border-t border-brand-border-medium">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Effectifs des groupes de niveau</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium block leading-tight">Minimum par niveau</label>
                      <input
                        type="number"
                        value={multiMinInput}
                        onChange={handleMultiMinChange}
                        onBlur={handleMultiMinBlur}
                        className="w-full text-xs font-semibold text-slate-700 bg-brand-bg hover:bg-brand-accent/40 border border-brand-border-medium rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        title="Nombre minimal d'élèves d'un même niveau dans une classe à niveaux multiples"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-medium block leading-tight">Maximum par niveau</label>
                      <input
                        type="number"
                        value={multiMaxInput}
                        onChange={handleMultiMaxChange}
                        onBlur={handleMultiMaxBlur}
                        className="w-full text-xs font-semibold text-slate-700 bg-brand-bg hover:bg-brand-accent/40 border border-brand-border-medium rounded-lg p-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        title="Nombre maximal d'élèves d'un même niveau dans une classe à niveaux multiples ou double niveau"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Ajuste la taille critique de chaque cohorte dans une classe double ou multi-niveaux pour éviter les élèves isolés ou les groupes trop denses.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
