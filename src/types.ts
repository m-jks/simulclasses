/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LevelId = 'PS' | 'MS' | 'GS' | 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';

export interface LevelConfig {
  id: LevelId;
  name: string;
  count: number; // Number of registered students
  enabled: boolean; // Whether this level exists in the school
  maxClassSize?: number; // Maximum students in a class containing this level
}

export interface SolverConfig {
  maxClasses: number;
  minimizeDoubleLevels: boolean;
  consecutiveDoubleLevelsOnly: boolean;
  globalMaxClassSize: number;
  globalMinClassSize: number;
  multipleLevelsPolicy?: 'pure_only' | 'double_only' | 'multi_levels';
  homogeneityPriority?: 'global' | 'cycle';
}

export interface Class分配 {
  id: string;
  name: string;
  customName?: string;
  levels: { [key in LevelId]?: number }; // How many students of each level
  totalStudents: number;
}

export interface AllocationProposal {
  id: string;
  name: string;
  createdAt: string;
  config: {
    levels: LevelConfig[];
    solver: SolverConfig;
  };
  classes: Class分配[];
  stats: {
    totalStudents: number;
    totalClasses: number;
    averageClassSize: number;
    minClassSize: number;
    maxClassSize: number;
    doubleLevelCount: number;
    singleLevelCount: number;
    standardDeviation: number;
  };
  isSaved?: boolean;
}
