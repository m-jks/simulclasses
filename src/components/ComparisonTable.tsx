/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AllocationProposal, LevelId } from '../types';
import { 
  FolderHeart, 
  Trash2, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  Info,
  Layers3,
  Pencil,
  Check,
  X,
  Table,
  Calculator,
  TriangleAlert,
  Printer
} from 'lucide-react';

interface ComparisonTableProps {
  savedProposals: AllocationProposal[];
  onDeleteProposal: (id: string) => void;
  onClearAll: () => void;
  onRenameClass?: (proposalId: string, classId: string, newCustomName: string) => void;
}

const ALL_LEVELS_ORDER: LevelId[] = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];

export default function ComparisonTable({
  savedProposals,
  onDeleteProposal,
  onClearAll,
  onRenameClass
}: ComparisonTableProps) {
  const [selectedPropId, setSelectedPropId] = useState<string>('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Auto-reset confirmation if list becomes empty or changes
  useEffect(() => {
    if (savedProposals.length === 0) {
      setConfirmClearAll(false);
    }
  }, [savedProposals.length]);

  // Auto-select first proposal when none is chosen or the list updates
  useEffect(() => {
    if (savedProposals.length > 0) {
      if (!selectedPropId || !savedProposals.some(p => p.id === selectedPropId)) {
        setSelectedPropId(savedProposals[0].id);
      }
    } else {
      setSelectedPropId('');
    }
  }, [savedProposals, selectedPropId]);

  if (savedProposals.length === 0) {
    return (
      <div className="bg-brand-card border-2 border-dashed border-brand-border-medium rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-bg border border-brand-border-medium flex items-center justify-center text-slate-500">
          <FolderHeart className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-800 text-base">Aucune proposition enregistrée</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Générez des conceptions d'organisation, puis appuyez sur le bouton <strong>"Sauvegarder"</strong> des cartes pour pouvoir les administrer et les imprimer individuellement ici.
          </p>
        </div>
      </div>
    );
  }

  const activeProposal = savedProposals.find(p => p.id === selectedPropId) || savedProposals[0];

  // Helper to start inline class renaming
  const handleStartEditing = (classId: string, currentName: string) => {
    setEditingClassId(classId);
    setEditingNameValue(currentName);
  };

  const handleSaveClassName = (classId: string) => {
    if (onRenameClass) {
      onRenameClass(activeProposal.id, classId, editingNameValue.trim());
    }
    setEditingClassId(null);
  };

  const handlePrint = () => {
    // Sort classes by academic index for clean sequential display
    const sortedClasses = [...activeProposal.classes].sort((a, b) => {
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

      if (valA !== valB) return valA - valB;

      const minIndexA = Math.min(...Object.keys(a.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      const minIndexB = Math.min(...Object.keys(b.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      return minIndexA - minIndexB;
    });

    // Construct fully self-contained HTML layout crafted beautifully for standard A4 pages
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Répartition Scolaire - ${activeProposal.name}</title>
<style>
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #0f172a;
    line-height: 1.4;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
  }
  .header {
    border-bottom: 3px solid #1e40af;
    padding-bottom: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .header-left h1 {
    font-size: 22px;
    font-weight: 800;
    color: #1e3a8a;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: -0.5px;
  }
  .header-left .tagline {
    font-size: 11px;
    color: #475569;
    font-weight: bold;
    margin-top: 4px;
  }
  .header-right {
    text-align: right;
    font-size: 10px;
    color: #64748b;
    line-height: 1.3;
  }
  h2 {
    font-size: 14px;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .stats-grid {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: nowrap;
  }
  .stats-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px;
    text-align: center;
    flex: 1;
  }
  .stats-label {
    font-size: 8px;
    text-transform: uppercase;
    font-weight: 700;
    color: #475569;
    margin-bottom: 2px;
    display: block;
  }
  .stats-value {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a;
  }
  .cycle-bar {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
    border-radius: 4px;
    padding: 8px 10px;
    margin-bottom: 6px;
  }
  .cycle-bar-title {
    font-weight: bold;
    font-size: 11px;
    color: #0f172a;
    margin-bottom: 2px;
  }
  .cycle-bar-desc {
    font-size: 10px;
    color: #475569;
  }
  .class-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .class-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 12px;
    background-color: #ffffff;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .class-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .class-name {
    font-size: 13px;
    font-weight: bold;
    color: #1e40af;
  }
  .class-total {
    font-size: 11px;
    color: #475569;
    font-weight: bold;
  }
  .levels-chip-list {
    display: flex;
    gap: 16px;
    margin: 4px 0;
  }
  .level-item {
    font-size: 11px;
    color: #334155;
  }
  .level-bullet {
    color: #3b82f6;
    font-weight: bold;
    margin-right: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }
  th {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 4px 8px;
    font-weight: 700;
    text-align: left;
    font-size: 10px;
    color: #475569;
    text-transform: uppercase;
  }
  td {
    border: 1px solid #cbd5e1;
    padding: 4px 8px;
    font-size: 10px;
    color: #334155;
  }
  .footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 8px;
    border-top: 1px solid #cbd5e1;
    font-size: 9px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${activeProposal.name}</h1>
      <div class="tagline">Fiche Officielle de Répartition Scolaire</div>
    </div>
    <div class="header-right">
      Document généré le ${new Date().toLocaleDateString('fr-FR')}<br>
      Éditeur : SimulClasses
    </div>
  </div>

  <h2>Statistiques Globales d'Établissement</h2>
  <div class="stats-grid">
    <div class="stats-card">
      <span class="stats-label">Effectif Total</span>
      <span class="stats-value">${activeProposal.stats.totalStudents} élèves</span>
    </div>
    <div class="stats-card">
      <span class="stats-label">Salles de classe</span>
      <span class="stats-value">${activeProposal.stats.totalClasses}</span>
    </div>
    <div class="stats-card">
      <span class="stats-label">Effectif moyen</span>
      <span class="stats-value">${activeProposal.stats.averageClassSize} él./classe</span>
    </div>
    <div class="stats-card">
      <span class="stats-label">Écart extrême</span>
      <span class="stats-value">${activeProposal.stats.minClassSize} à ${activeProposal.stats.maxClassSize} él.</span>
    </div>
    <div class="stats-card">
      <span class="stats-label">Cours doubles / multiples</span>
      <span class="stats-value">${activeProposal.stats.doubleLevelCount} classes</span>
    </div>
  </div>

  <h2>Équilibre Harmonique par Cycle</h2>
  <div style="margin-bottom: 12px;">
`;

    [1, 2, 3].forEach(cycleNum => {
      const gClasses = getCycleClasses(cycleNum as 1 | 2 | 3);
      const cycleTitle = cycleNum === 1 ? 'Cycle 1 (PS / MS / GS)' : cycleNum === 2 ? 'Cycle 2 (CP / CE1 / CE2)' : 'Cycle 3 (CM1 / CM2)';
      let desc = '';
      if (gClasses.length === 0) {
        desc = 'Aucune classe présente dans ce cycle.';
      } else if (gClasses.length === 1) {
        desc = `1 classe • Effectif de ${gClasses[0].totalStudents} élèves (Équilibre automatique original).`;
      } else {
        const avg = getCycleAvg(gClasses);
        const sd = getCycleStdDev(gClasses);
        desc = `${gClasses.length} classes • Effectif moyen : ${avg} élèves • Écart-type d'homogénéité : ${sd} (${getCycleStdDevStatus(sd || 0)})`;
      }
      
      html += `    <div class="cycle-bar" style="border-left-color: ${cycleNum === 1 ? '#3b82f6' : cycleNum === 2 ? '#f59e0b' : '#ec4899'}">
      <div class="cycle-bar-title">${cycleTitle}</div>
      <div class="cycle-bar-desc">${desc}</div>
    </div>\n`;
    });

    html += `  </div>

  <h2>Détail Analytique des Classes par Salles</h2>
  <div class="class-container">
`;

    sortedClasses.forEach((cls, index) => {
      const displayName = cls.customName || `Classe ${index + 1}`;
      const levelsStr = Object.keys(cls.levels)
        .filter(l => (cls.levels[l as LevelId] || 0) > 0)
        .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a as LevelId) - ALL_LEVELS_ORDER.indexOf(b as LevelId))
        .join(' / ');

      html += `    <div class="class-card">
      <div class="class-title-row">
        <div class="class-name">${displayName}</div>
        <div class="class-total">${cls.totalStudents} élèves (${levelsStr})</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Niveau d'Enseignement</th>
            <th>Nombre d'Élèves</th>
            <th>Proportion du Niveau</th>
          </tr>
        </thead>
        <tbody>
`;

      Object.entries(cls.levels)
        .filter(([_, qty]) => (qty || 0) > 0)
        .sort((a,b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId))
        .forEach(([lvl, qty]) => {
          const percent = Math.round(((qty || 0) / cls.totalStudents) * 100);
          html += `          <tr>
            <td><strong>${lvl}</strong></td>
            <td>${qty} élèves</td>
            <td>${percent}%</td>
          </tr>\n`;
        });

      html += `        </tbody>
      </table>
    </div>\n`;
    });

    html += `  </div>

  <div class="footer">
    Document de travail - SimulClasses - Généré numériquement le ${new Date().toLocaleDateString('fr-FR')}
  </div>
</body>
</html>`;

    // Create standard hidden iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        // Let the document render fully, then open browser's print dialog
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          // Remove iframe safely after user print/cancel action
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        }, 500);
      } else {
        // Fallback if writing to iframe fails
        window.print();
      }
    } catch (e) {
      console.error('Print iframe error, attempting window.print()', e);
      window.print();
    }
  };

  // Trigger Client-side File Download Helper
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(['\uFEFF', content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Spreadsheet Format Export (.ods format - optimized HTML Spreadsheet with colored grids)
  const handleExportSpreadsheet = () => {
    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; }
  table { border-collapse: collapse; margin-bottom: 24px; }
  th { border: 1px solid #cbd5e1; padding: 10px; font-weight: bold; background-color: #1e3a8a; color: #ffffff; font-size: 12px; }
  td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; color: #334155; }
  .title-head { font-size: 16px; font-weight: bold; color: #1e3a8a; background-color: #eff6ff; border: none; padding: 12px; }
  .section-label { font-size: 12px; font-weight: bold; background-color: #f1f5f9; color: #1e293b; text-align: left; }
  .class-header-row { font-weight: bold; background-color: #f8fafc; color: #1e40af; }
  .stat-label-cell { font-weight: bold; background-color: #f8fafc; }
  .stat-val-cell { text-align: right; font-weight: bold; }
  .number-cell { text-align: right; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="4" class="title-head">SCÉNARIO DE RÉPARTITION : ${activeProposal.name}</td>
    </tr>
    <tr>
      <td colspan="4" style="color: #64748b; font-size: 11px; font-style: italic;">Date de génération : ${new Date(activeProposal.createdAt).toLocaleDateString('fr-FR')}</td>
    </tr>
  </table>

  <table>
    <thead>
      <tr>
        <th colspan="2" class="section-label">Indicateurs Majeurs du Scénario</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="stat-label-cell">Total Élèves d'École</td>
        <td class="stat-val-cell">${activeProposal.stats.totalStudents}</td>
      </tr>
      <tr>
        <td class="stat-label-cell">Total Classes planifiées</td>
        <td class="stat-val-cell">${activeProposal.stats.totalClasses}</td>
      </tr>
      <tr>
        <td class="stat-label-cell">Moyenne d'élèves par Classe</td>
        <td class="stat-val-cell">${activeProposal.stats.averageClassSize}</td>
      </tr>
      <tr>
        <td class="stat-label-cell">Écart-Type d'Homogénéité</td>
        <td class="stat-val-cell">${activeProposal.stats.standardDeviation}</td>
      </tr>
      <tr>
        <td class="stat-label-cell">Classes à cours doubles / multiples</td>
        <td class="stat-val-cell">${activeProposal.stats.doubleLevelCount}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th colspan="4" class="section-label">Répartition Détaillée des Classes</th>
      </tr>
      <tr>
        <th>Nom de la classe</th>
        <th>Niveau d'Enseignement</th>
        <th>Effectif du Niveau</th>
        <th>Total Équipe Classe</th>
      </tr>
    </thead>
    <tbody>
`;

    const sortedClasses = [...activeProposal.classes].sort((a, b) => {
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

      if (valA !== valB) return valA - valB;

      const minIndexA = Math.min(...Object.keys(a.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      const minIndexB = Math.min(...Object.keys(b.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
      return minIndexA - minIndexB;
    });

    sortedClasses.forEach((cls, index) => {
      const displayName = cls.customName || `Classe ${index + 1}`;
      const activeLevels = Object.entries(cls.levels)
        .filter(([_, qty]) => (qty || 0) > 0)
        .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId));

      activeLevels.forEach(([lvl, qty], lvlIdx) => {
        if (lvlIdx === 0) {
          html += `      <tr>
        <td class="class-header-row">${displayName}</td>
        <td><strong>${lvl}</strong></td>
        <td class="number-cell">${qty}</td>
        <td rowspan="${activeLevels.length}" class="number-cell" style="vertical-align: middle; font-weight: bold; background-color: #f8fafc;">${cls.totalStudents}</td>
      </tr>\n`;
        } else {
          html += `      <tr>
        <td class="class-header-row"></td>
        <td><strong>${lvl}</strong></td>
        <td class="number-cell">${qty}</td>
      </tr>\n`;
        }
      });
    });

    html += `    </tbody>
  </table>
</body>
</html>`;

    downloadFile(html, `${activeProposal.name.replace(/\s+/g, '_')}_Format_Tableur.ods`, 'application/vnd.oasis.opendocument.spreadsheet;charset=utf-8');
  };

  // Local helper functions for rendering stats & standard deviations
  const classCycles = activeProposal.classes.map(cls => {
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

  const getCycleStdDev = (classes: typeof activeProposal.classes) => {
    if (classes.length <= 1) return null;
    const sizes = classes.map(c => c.totalStudents);
    const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const sqDiffSum = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0);
    return Math.round(Math.sqrt(sqDiffSum / sizes.length) * 100) / 100;
  };

  const getCycleAvg = (classes: typeof activeProposal.classes) => {
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

  const getHomogeneityLabel = (stdDev: number) => {
    if (stdDev < 1.0) return "Très équilibrée, répartition optimale";
    if (stdDev <= 1.5) return "Très Homogène (1-2 él. d'écart)";
    if (stdDev <= 2.5) return "Équilibré (3-4 él. d'écart)";
    return "Hétérogène (écarts marqués)";
  };

  const getClassSpecificCeilings = (cls: typeof activeProposal.classes[0], proposalConfig: typeof activeProposal.config) => {
    const limits: Array<{ level: LevelId; limit: number }> = [];
    Object.entries(cls.levels).forEach(([lId, qty]) => {
      if ((qty || 0) > 0) {
        const configItem = proposalConfig.levels.find(lvlConf => lvlConf.id === lId);
        if (configItem && configItem.maxClassSize) {
          limits.push({ level: lId as LevelId, limit: configItem.maxClassSize });
        }
      }
    });
    return limits;
  };

  return (
    <div className="space-y-6">
      {/* Title block with general actions (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border-light pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-bg text-slate-700 rounded-lg border border-brand-border-medium">
            <FolderHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Répartitions Sauvegardées</h2>
            <p className="text-xs text-slate-400">Explorez vos configurations d'école et extrayez vos rapports ou tableaux.</p>
          </div>
        </div>

        {confirmClearAll ? (
          <div className="flex items-center gap-2 self-end sm:self-auto bg-rose-50/50 border border-rose-100 p-1.5 rounded-xl">
            <span className="text-xs text-rose-700 font-bold px-1.5">Tout supprimer ?</span>
            <button
              onClick={() => {
                onClearAll();
                setConfirmClearAll(false);
              }}
              className="h-8 px-2.5 bg-rose-600 hover:bg-rose-700 text-white transition rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 shadow-3xs"
            >
              <Check className="w-3.5 h-3.5" />
              Oui, tout effacer
            </button>
            <button
              onClick={() => setConfirmClearAll(false)}
              className="h-8 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 transition rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClearAll(true)}
            disabled={savedProposals.length === 0}
            className={`h-10 px-4 transition rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 self-end sm:self-auto ${
              savedProposals.length === 0
                ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-200 text-slate-400'
                : 'bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Tout effacer ({savedProposals.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Sidebar proposal picker list (Hidden during print) */}
        <div className="lg:col-span-4 bg-brand-card border border-brand-border-light rounded-2xl p-4 space-y-3.5 print:hidden">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Liste des scénarios ({savedProposals.length})
          </h3>
          
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {savedProposals.map((prop) => {
              const isSelected = prop.id === selectedPropId;
              return (
                <div
                  key={prop.id}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200 shadow-3xs'
                      : 'bg-brand-bg/30 border-brand-border-medium hover:bg-brand-accent/40'
                  }`}
                  onClick={() => {
                    setSelectedPropId(prop.id);
                    setEditingClassId(null);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`block font-bold text-xs truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {prop.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {prop.stats.totalClasses} classes • Ø {prop.stats.averageClassSize} él. • sd {prop.stats.standardDeviation}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProposal(prop.id);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-3xs"
                      title="Supprimer cette répartition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-300'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Detailed selected sheet & PDF printable block */}
        <div className="lg:col-span-8 bg-brand-card border border-brand-border-light rounded-3xl p-6 md:p-8 shadow-xs print:border-none print:shadow-none print:p-0">
          {activeProposal ? (
            <div className="space-y-8">
              {/* Detailed panel actions row with GDoc, GSheet and print formats (Hidden during print) */}
              <div className="flex flex-wrap items-center justify-end gap-4 border-b border-brand-border-light pb-5 print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Format tableur (ODS sheet representation) */}
                  <button
                    type="button"
                    onClick={handleExportSpreadsheet}
                    className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white transition rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Table className="w-4 h-4" />
                    Format tableur
                  </button>

                  {/* Format PDF / Imprimer */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="h-10 px-3 bg-rose-50 hover:bg-rose-100 hover:text-rose-900 border border-rose-200 text-rose-700 transition rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Format PDF
                  </button>
                </div>
              </div>

              {/* PRINTABLE AREA STARTS HERE */}
              <div id="printable-proposal-sheet" className="space-y-8 print:space-y-8">
                {/* School Report Certificat Header */}
                <div className="border-b-2 border-slate-800 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                        {activeProposal.name}
                      </h1>
                    </div>
                  </div>

                  {/* High level metrics badge deck - 5 Columns structure matching the visual distribution page! */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-brand-bg border border-brand-border-medium rounded-xl p-3 print:border-slate-205">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Nombre de classes</span>
                      <span className="text-base font-extrabold text-slate-800">{activeProposal.stats.totalClasses} classes</span>
                    </div>

                    <div className="bg-brand-bg border border-brand-border-medium rounded-xl p-3 print:border-slate-205">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Effectif moyen</span>
                      <span className="text-base font-extrabold text-slate-800">{activeProposal.stats.averageClassSize} élèves</span>
                    </div>

                    {/* NEW DATA POINT: Écart de tailles */}
                    <div className="bg-brand-bg border border-brand-border-medium rounded-xl p-3 print:border-slate-205">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Écart de tailles</span>
                      <span className="text-base font-extrabold text-slate-800">
                        {activeProposal.stats.minClassSize} à {activeProposal.stats.maxClassSize} él.
                      </span>
                    </div>

                    <div className="bg-brand-bg border border-brand-border-medium rounded-xl p-3 print:border-slate-205 relative group">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1 cursor-help">
                        Écart-type homogénéité
                        <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition" />
                      </span>
                      <span className="text-base font-extrabold text-indigo-700 block mt-1">{activeProposal.stats.standardDeviation}</span>

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

                    <div className="bg-brand-bg border border-brand-border-medium rounded-xl p-3 print:border-slate-205">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Cours doubles / multiples</span>
                      <span className="text-base font-extrabold text-purple-700">
                        {activeProposal.stats.doubleLevelCount} ({Math.round((activeProposal.stats.doubleLevelCount / activeProposal.stats.totalClasses) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact List details classes with in-line renaming */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide border-b border-brand-border-light pb-2">
                    Détail par classe <span className="text-xs font-normal text-slate-400 lowercase italic print:hidden">(survolez le titre pour renommer)</span>
                  </h3>

                  <div className="divide-y divide-brand-border-light border border-brand-border-medium rounded-2xl overflow-hidden bg-brand-bg/10">
                    {[...activeProposal.classes].sort((a, b) => {
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

                      if (valA !== valB) return valA - valB;

                      const minIndexA = Math.min(...Object.keys(a.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
                      const minIndexB = Math.min(...Object.keys(b.levels).map(l => ALL_LEVELS_ORDER.indexOf(l as LevelId)));
                      return minIndexA - minIndexB;
                    }).map((cls, index) => {
                      const activeLevels = Object.entries(cls.levels)
                        .filter(([_, qty]) => (qty || 0) > 0)
                        .sort((a, b) => ALL_LEVELS_ORDER.indexOf(a[0] as LevelId) - ALL_LEVELS_ORDER.indexOf(b[0] as LevelId));

                      const lvlCount = activeLevels.length;
                      let classBadge = "Niveaux Multiples";
                      let badgeStyle = "bg-purple-50 text-purple-800 border-purple-100";

                      if (lvlCount === 1) {
                        classBadge = "Niveau Unique";
                        badgeStyle = "bg-indigo-50 text-indigo-850 border-indigo-150";
                      } else if (lvlCount === 2) {
                        classBadge = "Double Niveau";
                        badgeStyle = "bg-amber-50 text-amber-800 border-amber-150";
                      } else if (lvlCount === 3) {
                        classBadge = "Triple Niveau";
                        badgeStyle = "bg-rose-50 text-rose-800 border-rose-150";
                      } else if (lvlCount === 4) {
                        classBadge = "Quadruple Niveau";
                        badgeStyle = "bg-red-50 text-red-850 border-red-150";
                      }

                      const defaultClassName = `Classe ${index + 1}`;
                      const classTitle = cls.customName || defaultClassName;
                      const classId = cls.id || `class-${activeProposal.id}-${index}`;

                      return (
                        <div 
                          key={classId} 
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors break-inside-avoid"
                        >
                          {/* Class name (renameable) & total count */}
                          <div className="min-w-[170px] shrink-0 space-y-1">
                            {editingClassId === classId ? (
                              <div className="flex items-center gap-1.5 mt-1 print:hidden">
                                <input
                                  type="text"
                                  value={editingNameValue}
                                  onChange={(e) => setEditingNameValue(e.target.value)}
                                  className="h-8 w-40 px-2 bg-white border border-slate-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                                  placeholder={defaultClassName}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveClassName(classId);
                                    if (e.key === 'Escape') setEditingClassId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveClassName(classId)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded border border-emerald-200"
                                  title="Enregistrer le nom"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingClassId(null)}
                                  className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded border border-slate-200"
                                  title="Annuler"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => handleStartEditing(classId, classTitle)}
                                className="inline-flex items-center gap-2 group/classname cursor-pointer hover:text-indigo-600 transition-colors py-0.5 select-none print:hidden"
                                title="Cliquer pour renommer cette classe"
                              >
                                <h4 className="font-extrabold text-slate-950 group-hover/classname:text-indigo-600 text-sm transition-colors decoration-dashed decoration-1 underline-offset-4 hover:underline">
                                  {classTitle}
                                </h4>
                                <span className="p-1 text-slate-500 group-hover/classname:text-indigo-600 group-hover/classname:bg-indigo-50 group-hover/classname:border-indigo-200 bg-slate-50 border border-slate-200 rounded transition-all" aria-hidden="true">
                                  <Pencil className="w-3 h-3" />
                                </span>
                              </div>
                            )}

                            {/* Printable static custom title display */}
                            <h4 className="hidden print:block font-extrabold text-slate-950 text-sm">
                              {classTitle}
                            </h4>

                            <div className="text-xs text-slate-500 font-bold">
                              {cls.totalStudents} élèves
                            </div>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeStyle}`}>
                              {classBadge}
                            </span>
                          </div>

                          {/* Level distribution list with visual bars */}
                          <div className="flex-1 space-y-2 max-w-xl">
                            {activeLevels.map(([lvl, count]) => {
                              const levelPercent = Math.round(((count || 0) / cls.totalStudents) * 100);
                              return (
                                <div key={lvl} className="flex items-center gap-3 text-xs">
                                  <span className="w-10 font-extrabold text-slate-800">{lvl}</span>
                                  <div className="flex-1 bg-slate-150 rounded-full h-2 relative min-w-[70px]">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        lvlCount === 1 ? 'bg-indigo-600' :
                                        lvlCount === 2 ? 'bg-amber-500' :
                                        lvlCount === 3 ? 'bg-rose-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${levelPercent}%` }}
                                    ></div>
                                  </div>
                                  <span className="w-24 text-right text-slate-600 font-semibold shrink-0">
                                    {count} élèves <span className="text-[10px] text-slate-400 font-normal">({levelPercent}%)</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NEW REPLICATED COMPONENT: Educational optimization and cycle-wise standard deviations block! */}
                <div className="p-4.5 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-4 shadow-sm break-inside-avoid">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-blue-100 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Analyse & Indicateurs d'Équilibre Consolidés
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Indicators Globaux */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Indicateurs Globaux</span>
                      <ul className="text-xs text-blue-900/80 space-y-2 list-disc pl-4 leading-relaxed">
                        <li>
                          La répartition présente un écart-type d'homogénéité de{' '}
                          <strong className="text-blue-900 font-bold">{activeProposal.stats.standardDeviation}</strong>, qualifié de{' '}
                          <strong className="text-blue-900 font-bold">« {getHomogeneityLabel(activeProposal.stats.standardDeviation)} »</strong>.
                        </li>
                        {activeProposal.stats.doubleLevelCount > 0 ? (
                          <li>
                            Elle emploie {activeProposal.stats.doubleLevelCount} classe(s) à cours doubles ou multiples pour loger l'intégralité de vos effectifs décrits.
                          </li>
                        ) : (
                          <li>
                            Aucune classe à cours doubles ou multiples n'est nécessaire. Toutes les classes demeurent à niveau pur unique.
                          </li>
                        )}
                        {activeProposal.classes.map((c, sIdx) => {
                          const tinyLevels = Object.entries(c.levels).filter(([_, qty]) => (qty || 0) > 0 && (qty || 0) <= 3);
                          if (tinyLevels.length > 0 && Object.keys(c.levels).length === 2) {
                            return (
                              <li key={sIdx} className="text-amber-800 list-none mt-1 p-2 rounded-lg bg-amber-50 border border-amber-100/70 text-[11px] font-semibold flex items-start gap-1.5">
                                <TriangleAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>La classe « {c.customName || `Classe ${sIdx + 1}`} » abrite un effectif de regroupement réduit pour le niveau {tinyLevels[0][0]} ({tinyLevels[0][1]} élèves).</span>
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    </div>

                    {/* Cycle balances with Standard Deviations */}
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
                            <div key={cycleDef.num} className="bg-white/60 p-2.5 border border-slate-205 rounded-lg space-y-1">
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
                                  <span className="text-slate-400 italic">Aucune classe pour ce cycle.</span>
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

              </div>
              {/* PRINTABLE AREA ENDS HERE */}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              Veuillez sélectionner un scénario de répartition dans le menu latéral.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
