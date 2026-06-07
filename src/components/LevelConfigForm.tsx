/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, LevelId } from '../types';
import { Users, ShieldAlert, Plus, Minus, Check, X } from 'lucide-react';

interface LevelConfigFormProps {
  levels: LevelConfig[];
  onChangeLevels: (newLevels: LevelConfig[]) => void;
}

export default function LevelConfigForm({ levels, onChangeLevels }: LevelConfigFormProps) {
  
  const handleToggleEnable = (id: LevelId) => {
    const updated = levels.map(lvl => {
      if (lvl.id === id) {
        return { ...lvl, enabled: !lvl.enabled };
      }
      return lvl;
    });
    onChangeLevels(updated);
  };

  const handleCountChange = (id: LevelId, val: number) => {
    const updated = levels.map(lvl => {
      if (lvl.id === id) {
        return { ...lvl, count: Math.max(0, val) };
      }
      return lvl;
    });
    onChangeLevels(updated);
  };

  const handleToggleLimitSize = (id: LevelId) => {
    const updated = levels.map(lvl => {
      if (lvl.id === id) {
        const hasLimit = lvl.maxClassSize !== undefined;
        return {
          ...lvl,
          maxClassSize: hasLimit ? undefined : 24 // default limit to 24 when checked
        };
      }
      return lvl;
    });
    onChangeLevels(updated);
  };

  const handleLimitChange = (id: LevelId, limit: number) => {
    const updated = levels.map(lvl => {
      if (lvl.id === id) {
        return { ...lvl, maxClassSize: Math.max(1, limit) };
      }
      return lvl;
    });
    onChangeLevels(updated);
  };

  // Helper to quickly add or subtract students
  const adjustCount = (id: LevelId, delta: number) => {
    const current = levels.find(l => l.id === id)?.count || 0;
    handleCountChange(id, current + delta);
  };

  const activeCount = levels.filter(l => l.enabled).length;
  const totalStudents = levels.reduce((sum, l) => sum + (l.enabled ? l.count : 0), 0);

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border-light p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-brand-border-light pb-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-bg text-slate-700 rounded-lg border border-brand-border-medium">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">2. Effectifs par Niveaux</h2>
            <p className="text-xs text-slate-400">Définissez les effectifs d'élèves pour chaque section existante.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Élèves</span>
          <span className="text-lg font-extrabold text-indigo-750">{totalStudents}</span>
        </div>
      </div>

      <div className="space-y-3">
        {levels.map((lvl) => {
          const hasLimit = lvl.maxClassSize !== undefined;

          return (
            <div
              key={lvl.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                lvl.enabled
                  ? 'bg-brand-bg/45 border-brand-border-medium shadow-2xs'
                  : 'bg-brand-card border-dashed border-brand-border-medium opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Level Toggle & Name */}
                <div className="flex items-center gap-3 min-w-[130px]">
                  <button
                    onClick={() => handleToggleEnable(lvl.id)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      lvl.enabled
                        ? 'bg-indigo-600 text-white'
                        : 'border-2 border-slate-300 hover:border-slate-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span
                    onClick={() => handleToggleEnable(lvl.id)}
                    className="font-bold text-slate-700 text-sm cursor-pointer select-none"
                  >
                    {lvl.id} <span className="font-normal text-slate-400 text-xs">- {lvl.name}</span>
                  </span>
                </div>

                {/* Students Count Modifier */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1 sm:hidden">Élèves :</span>
                  <button
                    disabled={!lvl.enabled}
                    onClick={() => adjustCount(lvl.id, -1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    disabled={!lvl.enabled}
                    value={lvl.count === 0 ? '' : lvl.count}
                    onChange={(e) => handleCountChange(lvl.id, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-40"
                  />
                  <button
                    disabled={!lvl.enabled}
                    onClick={() => adjustCount(lvl.id, 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Specific Class Limit constraint */}
                <div className="flex items-center gap-2 min-w-[210px] justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <label className={`flex items-center gap-2 text-xs select-none cursor-pointer ${
                    lvl.enabled ? 'text-slate-500' : 'text-slate-300 pointer-events-none'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!lvl.enabled}
                      checked={hasLimit}
                      onChange={() => handleToggleLimitSize(lvl.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                    />
                    <span>Plafonner à :</span>
                  </label>

                  {hasLimit ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                      <input
                        type="number"
                        disabled={!lvl.enabled}
                        value={lvl.maxClassSize}
                        onChange={(e) => handleLimitChange(lvl.id, parseInt(e.target.value) || 24)}
                        className="w-12 h-7 px-1 text-center bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        title="Nombre maximum d'élèves autorisés dans toute classe contenant ce niveau"
                      />
                      <span className="text-[10px] text-indigo-600 font-medium">élèves</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-300 italic min-w-[100px] text-left">
                      Sans plafond
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeCount === 0 && (
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aucune section active :</span> Veuillez activer au moins un niveau ci-dessus pour pouvoir générer des répartitions.
          </div>
        </div>
      )}
    </div>
  );
}
