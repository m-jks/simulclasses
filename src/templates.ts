/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, SolverConfig } from './types';

export interface SchoolTemplate {
  name: string;
  description: string;
  maxClasses: number;
  levels: { [key in string]?: { count: number; enabled: boolean; maxClassSize?: number } };
  solver: Partial<SolverConfig>;
}

export const SCHOOL_TEMPLATES: SchoolTemplate[] = [
  {
    name: "Petite école rurale (4 classes)",
    description: "Effectifs restreints répartis de la PS au CM2. Contraintes de double niveau importantes.",
    maxClasses: 4,
    levels: {
      PS: { count: 8, enabled: true },
      MS: { count: 12, enabled: true },
      GS: { count: 10, enabled: true, maxClassSize: 24 },
      CP: { count: 9, enabled: true, maxClassSize: 24 },
      CE1: { count: 11, enabled: true },
      CE2: { count: 14, enabled: true },
      CM1: { count: 13, enabled: true },
      CM2: { count: 11, enabled: true },
    },
    solver: {
      minimizeDoubleLevels: false,
      consecutiveDoubleLevelsOnly: true,
      globalMaxClassSize: 28,
      globalMinClassSize: 15,
    }
  },
  {
    name: "École standard (5 classes)",
    description: "Structure équilibrée avec effectifs moyens. Adaptée pour comparer les options de double niveau.",
    maxClasses: 5,
    levels: {
      PS: { count: 15, enabled: true },
      MS: { count: 18, enabled: true },
      GS: { count: 17, enabled: true, maxClassSize: 24 },
      CP: { count: 20, enabled: true, maxClassSize: 24 },
      CE1: { count: 19, enabled: true },
      CE2: { count: 22, enabled: true },
      CM1: { count: 21, enabled: true },
      CM2: { count: 23, enabled: true },
    },
    solver: {
      minimizeDoubleLevels: true,
      consecutiveDoubleLevelsOnly: true,
      globalMaxClassSize: 28,
      globalMinClassSize: 18,
    }
  },
  {
    name: "École CP/CE1 dédoublés (REP+) (6 classes)",
    description: "Grande école avec limites strictes à 24 élèves pour les classes de GS, CP et CE1.",
    maxClasses: 6,
    levels: {
      PS: { count: 22, enabled: true },
      MS: { count: 24, enabled: true },
      GS: { count: 25, enabled: true, maxClassSize: 24 },
      CP: { count: 23, enabled: true, maxClassSize: 24 },
      CE1: { count: 22, enabled: true, maxClassSize: 24 },
      CE2: { count: 26, enabled: true },
      CM1: { count: 28, enabled: true },
      CM2: { count: 27, enabled: true },
    },
    solver: {
      minimizeDoubleLevels: true,
      consecutiveDoubleLevelsOnly: true,
      globalMaxClassSize: 26,
      globalMinClassSize: 15,
    }
  }
];
