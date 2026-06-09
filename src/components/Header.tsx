/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchoolTemplate, SCHOOL_TEMPLATES } from '../templates';
import { School, TriangleAlert } from 'lucide-react';

interface HeaderProps {
  onLoadTemplate: (template: SchoolTemplate) => void;
}

export default function Header({ onLoadTemplate }: HeaderProps) {
  return (
    <header className="bg-brand-card border-b border-brand-border-light py-6 px-4 mb-8 sticky top-0 z-10 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-bg text-slate-700 rounded-xl border border-brand-border-medium">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              SimulClasses
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium tracking-normal">
                v0.5
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Optimisation de répartition des effectifs.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 md:max-w-md">
          <TriangleAlert className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-[11px] md:text-xs text-amber-900 leading-normal font-medium">
            <span className="font-bold text-amber-950">Avertissement :</span> L&apos;application ne sauvegarde aucune donnée entre vos sessions. Les répartitions enregistrées doivent être exportées pour être conservées.
          </div>
        </div>
      </div>
    </header>
  );
}
