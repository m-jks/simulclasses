/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { LevelConfig, SolverConfig, AllocationProposal } from './types';
import { solveAllocations } from './solver';
import { SchoolTemplate } from './templates';
import Header from './components/Header';
import LevelConfigForm from './components/LevelConfigForm';
import SolverControls from './components/SolverControls';
import ProposalViewer from './components/ProposalViewer';
import ComparisonTable from './components/ComparisonTable';
import DualProposalComparer from './components/DualProposalComparer';
import { Sparkles, Calendar, Layers, Sliders, FolderHeart, GitCompare } from 'lucide-react';

const DEFAULT_LEVELS: LevelConfig[] = [
  { id: 'PS', name: 'Petite Section', count: 18, enabled: true },
  { id: 'MS', name: 'Moyenne Section', count: 20, enabled: true },
  { id: 'GS', name: 'Grande Section', count: 22, enabled: true, maxClassSize: 24 },
  { id: 'CP', name: 'Cours Préparatoire', count: 18, enabled: true, maxClassSize: 24 },
  { id: 'CE1', name: 'Cours Élémentaire', count: 19, enabled: true },
  { id: 'CE2', name: 'Cours Élémentaire 2', count: 21, enabled: true },
  { id: 'CM1', name: 'Cours Moyen 1', count: 24, enabled: true },
  { id: 'CM2', name: 'Cours Moyen 2', count: 22, enabled: true },
];

const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxClasses: 5,
  minimizeDoubleLevels: true,
  consecutiveDoubleLevelsOnly: true,
  globalMaxClassSize: 28,
  globalMinClassSize: 18,
  multipleLevelsPolicy: 'multi_levels',
  homogeneityPriority: 'global',
};

export default function App() {
  // Load levels dynamically to have seamless session persistence
  const [levels, setLevels] = useState<LevelConfig[]>(() => {
    try {
      const stored = sessionStorage.getItem('class_planner_levels');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Could not load levels from sessionStorage", e);
    }
    return DEFAULT_LEVELS;
  });

  const [solverConfig, setSolverConfig] = useState<SolverConfig>(() => {
    try {
      const stored = sessionStorage.getItem('class_planner_solver_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Could not load solver config from sessionStorage", e);
    }
    return DEFAULT_SOLVER_CONFIG;
  });

  const [proposals, setProposals] = useState<AllocationProposal[]>([]);
  
  const [savedProposals, setSavedProposals] = useState<AllocationProposal[]>(() => {
    try {
      const stored = sessionStorage.getItem('class_planner_saved_proposals');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(p => p && typeof p === 'object' && p.id && Array.isArray(p.classes) && p.stats);
        }
      }
    } catch (e) {
      console.error("Could not load saved proposals from sessionStorage", e);
    }
    return [];
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasGeneratedFirstTime, setHasGeneratedFirstTime] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'parameters' | 'proposals' | 'saved' | 'comparison'>('parameters');

  // Sync levels to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('class_planner_levels', JSON.stringify(levels));
    } catch (e) {
      console.error("Could not save levels to sessionStorage", e);
    }
  }, [levels]);

  // Sync solverConfig to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('class_planner_solver_config', JSON.stringify(solverConfig));
    } catch (e) {
      console.error("Could not save solver config to sessionStorage", e);
    }
  }, [solverConfig]);

  // Sync saved proposals count to sessionStorage
  const saveToSessionStorage = (list: AllocationProposal[]) => {
    try {
      if (Array.isArray(list)) {
        sessionStorage.setItem('class_planner_saved_proposals', JSON.stringify(list));
      }
    } catch (error) {
      console.error("Could not save to sessionStorage", error);
    }
  };

  // Callback to load user example template
  const handleLoadTemplate = (template: SchoolTemplate) => {
    // Map template levels configuration
    const newLevels = DEFAULT_LEVELS.map(baseLvl => {
      const templateLvl = template.levels[baseLvl.id];
      if (templateLvl) {
        return {
          ...baseLvl,
          count: templateLvl.count,
          enabled: templateLvl.enabled,
          maxClassSize: templateLvl.maxClassSize
        };
      }
      return { ...baseLvl, enabled: false, count: 0, maxClassSize: undefined };
    });

    setLevels(newLevels);
    setSolverConfig({
      ...DEFAULT_SOLVER_CONFIG,
      maxClasses: template.maxClasses,
      ...template.solver
    });

    // Reset current active proposals list (forces them to calculate new scenarios)
    setProposals([]);
    setHasGeneratedFirstTime(false);
    setActiveTab('parameters');
  };

  // Run simulated annealing solver to get top proposals
  const handleGenerateScenarios = () => {
    setIsGenerating(true);
    
    // Tiny timeout to let the React DOM render the spinner/skeleton states beautifully
    setTimeout(() => {
      try {
        const results = solveAllocations(levels, solverConfig, 5);
        setProposals(results);
        setHasGeneratedFirstTime(true);
        setActiveTab('proposals');
      } catch (err) {
        console.error("Calculation failed", err);
      } finally {
        setIsGenerating(false);
      }
    }, 450);
  };

  const handleSaveProposal = (prop: AllocationProposal, customName: string) => {
    const updatedProp = {
      ...prop,
      name: customName,
      isSaved: true
    };
    const newList = [...savedProposals, updatedProp];
    setSavedProposals(newList);
    saveToSessionStorage(newList);
  };

  const handleDeleteSavedProposal = (id: string) => {
    const newList = savedProposals.filter(p => p.id !== id);
    setSavedProposals(newList);
    saveToSessionStorage(newList);
  };

  const handleClearAllSaved = () => {
    if (window.confirm("Êtes-vous certain de vouloir supprimer toutes vos sauvegardes de scénarios ?")) {
      setSavedProposals([]);
      sessionStorage.removeItem('class_planner_saved_proposals');
    }
  };

  const handleRenameClassInSavedProposal = (proposalId: string, classId: string, newCustomName: string) => {
    const newList = savedProposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          classes: p.classes.map(c => {
            if (c.id === classId) {
              return { ...c, customName: newCustomName };
            }
            return c;
          })
        };
      }
      return p;
    });
    setSavedProposals(newList);
    saveToSessionStorage(newList);
  };

  const isLevelActiveAndHasStudents = levels.some(lvl => lvl.enabled && lvl.count > 0);
  const totalSchoolStudents = levels.reduce((sum, lvl) => sum + (lvl.enabled ? lvl.count : 0), 0);

  return (
    <div className="min-h-screen bg-brand-bg pb-16">
      {/* 1. Page Sticky Header with Templates Selector */}
      <Header onLoadTemplate={handleLoadTemplate} />

      {/* Tab Navigation Menu */}
      <div className="max-w-7xl mx-auto px-4 mt-6 print:hidden">
        <div className="border-b border-brand-border-medium">
          <nav className="flex flex-wrap -mb-px gap-1 sm:gap-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('parameters')}
              className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'parameters'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-brand-border-medium'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Paramètres de génération</span>
            </button>

            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-all relative ${
                activeTab === 'proposals'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-brand-border-medium'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Propositions</span>
              {proposals.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {proposals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'comparison'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-brand-border-medium'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>Comparateur de répartitions</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'saved'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-brand-border-medium'
              }`}
            >
              <FolderHeart className="w-4 h-4" />
              <span>Répartitions sauvegardées</span>
              {savedProposals.length > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100">
                  {savedProposals.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Primary layout constraint container */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8 print:bg-white print:p-0">
        
        {/* Loading placeholder skeleton */}
        {isGenerating && (
          <div className="p-16 bg-brand-card border border-brand-border-light rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-white rounded-full animate-spin"></div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-700 text-sm">Calcul des scénarios par l'intelligence d'optimisation...</h3>
              <p className="text-xs text-slate-400">Nous explorons les millions de permutations possibles pour équilibrer les effectifs utilisant le nombre maximal de classes.</p>
            </div>
          </div>
        )}

        {/* 1. Generate parameters tab content */}
        {!isGenerating && activeTab === 'parameters' && (
          <div className="space-y-8 print:hidden animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Solver global constraints parameters (Column span 5) */}
              <div className="lg:col-span-5">
                <SolverControls
                  config={solverConfig}
                  onChangeConfig={setSolverConfig}
                />
              </div>

              {/* Level settings panel (Column span 7) */}
              <div className="lg:col-span-7">
                <LevelConfigForm levels={levels} onChangeLevels={setLevels} />
              </div>
            </div>

            {/* Centered Generate Button at the bottom of the configuration page */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={!(isLevelActiveAndHasStudents && totalSchoolStudents > 0) || isGenerating}
                onClick={handleGenerateScenarios}
                className="w-full max-w-md h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 text-white font-bold text-sm rounded-xl border border-indigo-600 transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                Générer les scénarios de classes
              </button>
            </div>
          </div>
        )}

        {/* 2. Proposals tab content */}
        {!isGenerating && activeTab === 'proposals' && (
          hasGeneratedFirstTime && proposals.length > 0 ? (
            <section className="space-y-4 animate-in fade-in duration-300 print:hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">Propositions de Répartition optimales</h2>
                  <p className="text-xs text-slate-400 flex flex-wrap gap-x-1.5">
                    <span>Le robot a identifié {proposals.length} solutions optimales respectant vos règles de répartition.</span>
                    <strong className="text-indigo-600 font-bold">Chacune utilise exactement {solverConfig.maxClasses} classes.</strong>
                  </p>
                </div>
              </div>

              <ProposalViewer
                proposals={proposals}
                onSaveProposal={handleSaveProposal}
                savedProposalsIds={savedProposals.map(p => p.id)}
              />
            </section>
          ) : (
            <div className="bg-brand-card rounded-2xl border border-brand-border-light p-12 text-center max-w-xl mx-auto shadow-xs space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-brand-bg text-slate-700 rounded-full flex items-center justify-center mx-auto my-2 border border-brand-border-medium">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-800 font-bold text-base">Aucune proposition générée</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Configurez d'abord les effectifs de votre école dans l'onglet <strong>Paramètres de génération</strong>, puis cliquez sur <strong>"Lancer la génération"</strong> pour concevoir vos scénarios de répartition.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('parameters')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 font-semibold hover:bg-indigo-700 text-white rounded-xl text-xs active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Aller aux Paramètres
              </button>
            </div>
          )
        )}

        {/* 3. Side-by-side Free Comparer tab content */}
        {!isGenerating && activeTab === 'comparison' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <DualProposalComparer
              activeProposals={proposals}
              savedProposals={savedProposals}
            />
          </section>
        )}

        {/* 4. Saved Proposals tab content */}
        {!isGenerating && activeTab === 'saved' && (
          <section className="space-y-4 animate-in fade-in duration-300">
            <ComparisonTable
              savedProposals={savedProposals}
              onDeleteProposal={handleDeleteSavedProposal}
              onClearAll={handleClearAllSaved}
              onRenameClass={handleRenameClassInSavedProposal}
            />
          </section>
        )}

      </main>
    </div>
  );
}
