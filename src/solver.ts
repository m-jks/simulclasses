/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelConfig, SolverConfig, Class分配, AllocationProposal, LevelId } from './types';

interface InternalState {
  classes: Array<{ [key in LevelId]?: number }>;
}

const ALL_LEVELS: LevelId[] = ['PS', 'MS', 'GS', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];

function getEmptyClassState(maxClasses: number): InternalState {
  const state: InternalState = { classes: [] };
  for (let i = 0; i < maxClasses; i++) {
    const classObj: { [key in LevelId]?: number } = {};
    state.classes.push(classObj);
  }
  return state;
}

/**
 * Calculates the score and lists all active violations.
 * Lower score is better. A score of 0 (or close to 0) means a perfect allocation.
 */
export function scoreState(
  state: Array<{ [key in LevelId]?: number }>,
  activeLevels: LevelConfig[],
  solverConfig: SolverConfig
): { score: number; penalties: string[] } {
  let score = 0;
  const penalties: string[] = [];

  const sizeByClass = state.map(c =>
    Object.values(c).reduce((sum, v) => sum + (v || 0), 0)
  );

  const totalStudents = activeLevels.reduce((sum, lvl) => sum + lvl.count, 0);
  const totalClasses = state.length;
  const avgClassSize = totalClasses > 0 ? totalStudents / totalClasses : 0;

  state.forEach((c, idx) => {
    const size = sizeByClass[idx];
    const levelsInClass = (Object.keys(c) as LevelId[]).filter(lvl => (c[lvl] || 0) > 0);
    const countLevels = levelsInClass.length;

    if (size === 0) {
      // Empty classes are prohibited because we strictly require using the exact maximum number of classes
      score += 300000;
      penalties.push(`La Classe ${idx + 1} est vide.`);
      return;
    }

    // A. Multi levels policy constraints (no more than 4 levels or policy limits)
    const policy = solverConfig.multipleLevelsPolicy || 'multi_levels';
    const maxLevelsAllowed = policy === 'pure_only' ? 1 : policy === 'double_only' ? 2 : 4;

    if (countLevels > maxLevelsAllowed) {
      score += 300000 * (countLevels - maxLevelsAllowed);
      penalties.push(`La Classe ${idx + 1} dépasse le nombre maximal de niveaux autorisés par votre réglage (${countLevels} niveau(x) > ${maxLevelsAllowed} max): ${levelsInClass.join('/')}`);
    }

    // B. Global class size constraints
    if (size > solverConfig.globalMaxClassSize) {
      score += (size - solverConfig.globalMaxClassSize) * 8000;
      penalties.push(`La Classe ${idx + 1} dépasse l'effectif maximum global de ${solverConfig.globalMaxClassSize} élèves (${size} élèves)`);
    } else if (size > 28) {
      // Gentle penalty for very dense classes even if global max is larger
      score += (size - 28) * 400;
    }

    if (size < solverConfig.globalMinClassSize) {
      score += (solverConfig.globalMinClassSize - size) * 1500;
      if (size < solverConfig.globalMinClassSize - 2) {
        penalties.push(`La Classe ${idx + 1} est sous-peuplée (${size} élèves), en dessous du minimum conseillé de ${solverConfig.globalMinClassSize}`);
      }
    }

    // C. Level-specific limits (e.g. GS limited to 24)
    levelsInClass.forEach(lvl => {
      const activeLvlConfig = activeLevels.find(al => al.id === lvl);
      if (activeLvlConfig && activeLvlConfig.maxClassSize && size > activeLvlConfig.maxClassSize) {
        score += 500000 + (size - activeLvlConfig.maxClassSize) * 50000;
        penalties.push(`La Classe ${idx + 1} contient le niveau plafonné ${lvl} et dépasse sa limite de ${activeLvlConfig.maxClassSize} élèves (${size} élèves)`);
      }
    });

    // D. Minimize multiple levels
    if (solverConfig.minimizeDoubleLevels && countLevels >= 2) {
      score += 15000 * (countLevels - 1); // Penalty scales with number of levels to favor single levels
    }

    // E. Consecutive level check for all multiple level classes
    if (countLevels >= 2) {
      const indices = levelsInClass.map(lvl => ALL_LEVELS.indexOf(lvl)).sort((a, b) => a - b);
      const minIdx = indices[0];
      const maxIdx = indices[indices.length - 1];
      const gap = maxIdx - minIdx;
      const expectedGap = countLevels - 1;
      if (gap > expectedGap) {
        if (solverConfig.consecutiveDoubleLevelsOnly) {
          score += 45000 * (gap - expectedGap);
          penalties.push(`La Classe ${idx + 1} comporte des niveaux non consécutifs: ${levelsInClass.join('/')}`);
        } else {
          // Soft penalty to guide solver to choose closer levels if it can
          score += 1000 * (gap - expectedGap);
        }
      }
    }
  });

  // F. Minimizing level splitting
  // For each level, check how many classes it is split into.
  activeLevels.forEach(lvl => {
    let splitClasses = 0;
    state.forEach(c => {
      if ((c[lvl.id] || 0) > 0) {
        splitClasses++;
      }
    });

    // If level-count can fit in one class (e.g., population < 26) but is split, penalize.
    // Generally, ideal split is ceil(lvl.count / 26)
    const idealSplits = Math.max(1, Math.ceil(lvl.count / 26));
    if (splitClasses > idealSplits) {
      score += (splitClasses - idealSplits) * 4000;
    }

    // Very critical real-life constraint: we do NOT want "fragment" levels.
    // E.g., a double level class with 2 GS and 24 CP. The 2 GS students are completely isolated.
    // Minimum cohort size in a double class should ideally be at least 4-5 students, unless the entire level is tiny.
    state.forEach((c, idx) => {
      const qty = c[lvl.id] || 0;
      if (qty > 0) {
        const levelsInThisClass = (Object.keys(c) as LevelId[]).filter(l => (c[l] || 0) > 0);
        if (levelsInThisClass.length === 2 && qty <= 4 && lvl.count > 4) {
          score += (5 - qty) * 5000;
          penalties.push(`Le groupe de ${lvl.id} dans la classe double ${idx + 1} est trop restreint (${qty} élève(s))`);
        }
      }
    });
  });

  // G. Standard deviation & balance of non-empty classes
  const nonCentricSizes = sizeByClass.filter(s => s > 0);
  const priority = solverConfig.homogeneityPriority || 'global';
  const globalWeight = priority === 'global' ? 4500 : 500;
  const cycleWeight = priority === 'cycle' ? 4500 : 300;

  if (nonCentricSizes.length > 1) {
    const variance = nonCentricSizes.reduce((sum, v) => sum + Math.pow(v - avgClassSize, 2), 0) / nonCentricSizes.length;
    score += variance * globalWeight;
  }

  // H. Homogénéité par cycles (Facteur très important pour l'algorithme d'optimisation)
  const cycleClasses: Record<1 | 2 | 3, number[]> = { 1: [], 2: [], 3: [] };
  state.forEach((c, idx) => {
    const size = sizeByClass[idx];
    if (size === 0) return;

    const c1Count = (c['PS'] || 0) + (c['MS'] || 0) + (c['GS'] || 0);
    const c2Count = (c['CP'] || 0) + (c['CE1'] || 0) + (c['CE2'] || 0);
    const c3Count = (c['CM1'] || 0) + (c['CM2'] || 0);

    const maxVal = Math.max(c1Count, c2Count, c3Count);
    let cycle: 1 | 2 | 3 = 1;
    if (maxVal === 0) {
      const levels = Object.keys(c) as LevelId[];
      if (levels.some(l => ['CM1', 'CM2'].includes(l))) cycle = 3;
      else if (levels.some(l => ['CP', 'CE1', 'CE2'].includes(l))) cycle = 2;
    } else if (c2Count === maxVal) {
      cycle = 2;
    } else if (c3Count === maxVal) {
      cycle = 3;
    }
    cycleClasses[cycle].push(size);
  });

  ([1, 2, 3] as const).forEach(cycle => {
    const groupSizes = cycleClasses[cycle];
    if (groupSizes.length > 1) {
      const gSum = groupSizes.reduce((a, b) => a + b, 0);
      const gAvg = gSum / groupSizes.length;
      const groupVariance = groupSizes.reduce((acc, v) => acc + Math.pow(v - gAvg, 2), 0) / groupSizes.length;
      score += groupVariance * cycleWeight;
    }
  });

  return { score, penalties };
}

/**
 * Helper to generate a sensible initial random state
 */
function generateInitialState(
  activeLevels: LevelConfig[],
  maxClasses: number
): InternalState {
  const state = getEmptyClassState(maxClasses);

  // Group levels with students
  const active = activeLevels.filter(lvl => lvl.enabled && lvl.count > 0);

  // Distribute levels one by one
  active.forEach(lvl => {
    let remaining = lvl.count;
    // Sensible estimate of splits: usually 1, 2, or 3 splits depending on size
    const numSplits = Math.max(1, Math.min(maxClasses, Math.round(lvl.count / 23)));
    
    // Choose random unique classes to put these splits in
    const chosenClasses: number[] = [];
    while (chosenClasses.length < numSplits) {
      const r = Math.floor(Math.random() * maxClasses);
      if (!chosenClasses.includes(r)) {
        chosenClasses.push(r);
      }
    }

    // Split student count roughly equally
    let baseQty = Math.floor(remaining / numSplits);
    let extras = remaining % numSplits;

    chosenClasses.forEach((classIdx, splitIdx) => {
      const qty = baseQty + (splitIdx < extras ? 1 : 0);
      if (qty > 0) {
        state.classes[classIdx][lvl.id] = (state.classes[classIdx][lvl.id] || 0) + qty;
      }
    });
  });

  return state;
}

/**
 * Mutates state by applying a small random modification
 */
function mutateState(
  state: InternalState,
  activeLevels: LevelConfig[],
  maxClasses: number
): InternalState {
  // Deep clone state
  const newState: InternalState = {
    classes: state.classes.map(c => ({ ...c }))
  };

  const activeLvlIds = activeLevels.filter(l => l.enabled && l.count > 0).map(l => l.id);
  if (activeLvlIds.length === 0) return newState;

  const moveType = Math.random();

  if (moveType < 0.6) {
    // 1. Move students from one class to another for a specific level
    const lvl = activeLvlIds[Math.floor(Math.random() * activeLvlIds.length)];
    
    // Find classes containing this level
    const classesWithLvl: number[] = [];
    newState.classes.forEach((c, idx) => {
      if ((c[lvl] || 0) > 0) classesWithLvl.push(idx);
    });

    if (classesWithLvl.length > 0) {
      const sourceClassIdx = classesWithLvl[Math.floor(Math.random() * classesWithLvl.length)];
      let destClassIdx = Math.floor(Math.random() * maxClasses);
      
      if (destClassIdx !== sourceClassIdx) {
        const sourceQty = newState.classes[sourceClassIdx][lvl] || 0;
        // Move either 1 student, a few, or all of them
        let amountToMove = 1;
        const rand = Math.random();
        if (rand < 0.3) {
          amountToMove = Math.max(1, Math.floor(Math.random() * sourceQty));
        } else if (rand < 0.6) {
          amountToMove = sourceQty; // move the entire level cohort from this class
        } else {
          amountToMove = Math.min(sourceQty, Math.floor(Math.random() * 5) + 1);
        }

        if (amountToMove > 0) {
          newState.classes[sourceClassIdx][lvl] = sourceQty - amountToMove;
          if (newState.classes[sourceClassIdx][lvl] === 0) {
            delete newState.classes[sourceClassIdx][lvl];
          }
          newState.classes[destClassIdx][lvl] = (newState.classes[destClassIdx][lvl] || 0) + amountToMove;
        }
      }
    }
  } else if (moveType < 0.85) {
    // 2. Clear a level out of a class entirely and redistribute it to other classes
    const lvl = activeLvlIds[Math.floor(Math.random() * activeLvlIds.length)];
    const classesWithLvl: number[] = [];
    newState.classes.forEach((c, idx) => {
      if ((c[lvl] || 0) > 0) classesWithLvl.push(idx);
    });

    if (classesWithLvl.length > 1) { // Only make sense if split
      const sourceClassIdx = classesWithLvl[Math.floor(Math.random() * classesWithLvl.length)];
      const sourceQty = newState.classes[sourceClassIdx][lvl] || 0;
      
      // Remove from source
      delete newState.classes[sourceClassIdx][lvl];

      // Reassign to one other class that already has this level (merging cohorts)
      const remainingClasses = classesWithLvl.filter(idx => idx !== sourceClassIdx);
      const destClassIdx = remainingClasses[Math.floor(Math.random() * remainingClasses.length)];
      newState.classes[destClassIdx][lvl] = (newState.classes[destClassIdx][lvl] || 0) + sourceQty;
    }
  } else {
    // 3. Swap students (cross-balancing level quantities)
    const lvl = activeLvlIds[Math.floor(Math.random() * activeLvlIds.length)];
    const classesWithLvl: number[] = [];
    newState.classes.forEach((c, idx) => {
      if ((c[lvl] || 0) > 0) classesWithLvl.push(idx);
    });

    if (classesWithLvl.length >= 2) {
      const idx1 = classesWithLvl[Math.floor(Math.random() * classesWithLvl.length)];
      let idx2 = classesWithLvl[Math.floor(Math.random() * classesWithLvl.length)];
      while (idx2 === idx1) {
        idx2 = classesWithLvl[Math.floor(Math.random() * classesWithLvl.length)];
      }

      const q1 = newState.classes[idx1][lvl] || 0;
      const q2 = newState.classes[idx2][lvl] || 0;

      // Transfer some amount to balance, or swap quantities
      if (Math.random() < 0.5) {
        // Swap values
        newState.classes[idx1][lvl] = q2;
        newState.classes[idx2][lvl] = q1;
      } else {
        // Shift 1 or 2 students
        const diff = Math.floor((q1 - q2) / 2);
        if (diff > 0) {
          newState.classes[idx1][lvl] = q1 - diff;
          newState.classes[idx2][lvl] = q2 + diff;
        }
      }
    }
  }

  return newState;
}

/**
 * Run a multi-restart simulated-annealing level solver.
 * Returns up to `limit` unique solutions scoring as low as possible.
 */
export function solveAllocations(
  levels: LevelConfig[],
  solverConfig: SolverConfig,
  limit: number = 5
): AllocationProposal[] {
  const activeLevels = levels.filter(lvl => lvl.enabled && lvl.count > 0);
  const totalStudents = activeLevels.reduce((sum, lvl) => sum + lvl.count, 0);

  if (totalStudents === 0 || solverConfig.maxClasses <= 0) {
    return [];
  }

  // A helper function to create a canonical string key for the solution
  function getCanonicalKey(state: Array<{ [key in LevelId]?: number }>): string {
    const classRepresentation = state
      .map(c => {
        return Object.entries(c)
          .filter(([_, qty]) => (qty || 0) > 0)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([lvl, qty]) => `${lvl}:${qty}`)
          .join('|');
      })
      .filter(str => str.length > 0)
      .sort()
      .join('||');
    return classRepresentation;
  }

  const uniqueResultsMap = new Map<string, { state: Array<{ [key in LevelId]?: number }>; score: number; penalties: string[] }>();

  const targetClassCount = Math.min(solverConfig.maxClasses, totalStudents);
  const ITERATIONS_PER_RESTART = 1500;
  
  // Run at least 25 restarts, up to 100 restarts if we haven't found at least the requested number of unique valid solutions yet
  const MIN_RESTARTS = 25;
  const MAX_RESTARTS = 100;

  for (let restart = 0; restart < MAX_RESTARTS; restart++) {
    // Stop early if we have enough unique solutions and have performed the minimum restarts
    if (uniqueResultsMap.size >= limit && restart >= MIN_RESTARTS) {
      break;
    }

    let currentState = generateInitialState(activeLevels, solverConfig.maxClasses);
    let currentEval = scoreState(currentState.classes, activeLevels, solverConfig);

    let bestStateInRestart = { classes: currentState.classes.map(c => ({ ...c })) };
    let bestEvalInRestart = currentEval;

    // Simulated Annealing parameters
    let T = 100.0;
    const alpha = 0.95;

    for (let iter = 0; iter < ITERATIONS_PER_RESTART; iter++) {
      const nextState = mutateState(currentState, activeLevels, solverConfig.maxClasses);
      const nextEval = scoreState(nextState.classes, activeLevels, solverConfig);

      const dE = nextEval.score - currentEval.score;

      if (dE <= 0 || Math.random() < Math.exp(-dE / T)) {
        currentState = nextState;
        currentEval = nextEval;

        if (currentEval.score < bestEvalInRestart.score) {
          bestEvalInRestart = currentEval;
          bestStateInRestart = { classes: currentState.classes.map(c => ({ ...c })) };
        }
      }

      T *= alpha;
    }

    // Check if we use exactly the target class count
    const activeClassesCount = bestStateInRestart.classes.filter(c =>
      Object.values(c).reduce((sum, v) => sum + (v || 0), 0) > 0
    ).length;

    if (activeClassesCount === targetClassCount) {
      const key = getCanonicalKey(bestStateInRestart.classes);
      const existing = uniqueResultsMap.get(key);
      if (!existing || bestEvalInRestart.score < existing.score) {
        uniqueResultsMap.set(key, {
          state: bestStateInRestart.classes,
          score: bestEvalInRestart.score,
          penalties: bestEvalInRestart.penalties
        });
      }
    }
  }

  // Sort unique result options by score
  const sortedUniqueResults = Array.from(uniqueResultsMap.values()).sort((a, b) => a.score - b.score);

  // Pick top results up to limit
  const topResults = sortedUniqueResults.slice(0, limit);

  // Map to final format AllocationProposal
  return topResults.map((res, proposalIdx) => {
    const formattedClasses: Class分配[] = res.state
      .map((lvlObj, classIdx) => {
        const levelsInClass = (Object.keys(lvlObj) as LevelId[]).filter(lvl => (lvlObj[lvl] || 0) > 0);
        levelsInClass.sort((a, b) => ALL_LEVELS.indexOf(a) - ALL_LEVELS.indexOf(b));
        const total = levelsInClass.reduce((sum, lvl) => sum + (lvlObj[lvl] || 0), 0);
        const name = levelsInClass.length > 0 ? levelsInClass.join(' / ') : 'Classe Vide';

        return {
          id: `class-${proposalIdx}-${classIdx}`,
          name,
          levels: lvlObj,
          totalStudents: total
        };
      })
      // Keep only non-empty classes from the proposal
      .filter(c => c.totalStudents > 0);

    // Classer les différentes classes par ordre d'âge (du CP au CM2)
    formattedClasses.sort((a, b) => {
      const getWeightedIndex = (cls: Class分配) => {
        let weightedSum = 0;
        let total = 0;
        Object.entries(cls.levels).forEach(([lvl, qty]) => {
          if (qty && qty > 0) {
            const idx = ALL_LEVELS.indexOf(lvl as LevelId);
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

      // Fallback: compare lowest levels in class
      const minIndexA = Math.min(...Object.keys(a.levels).map(l => ALL_LEVELS.indexOf(l as LevelId)));
      const minIndexB = Math.min(...Object.keys(b.levels).map(l => ALL_LEVELS.indexOf(l as LevelId)));
      return minIndexA - minIndexB;
    });

    const activeSizes = formattedClasses.map(c => c.totalStudents);
    const minSize = activeSizes.length > 0 ? Math.min(...activeSizes) : 0;
    const maxSize = activeSizes.length > 0 ? Math.max(...activeSizes) : 0;
    const doubleLevels = formattedClasses.filter(c => Object.keys(c.levels).length >= 2).length;
    const singleLevels = formattedClasses.filter(c => Object.keys(c.levels).length === 1).length;

    const avgClassSize = activeSizes.length > 0 ? totalStudents / activeSizes.length : 0;

    // Calculate actual standard deviation
    let stdDev = 0;
    if (activeSizes.length > 1) {
      const sumSqrDiff = activeSizes.reduce((sum, size) => sum + Math.pow(size - avgClassSize, 2), 0);
      stdDev = Math.sqrt(sumSqrDiff / activeSizes.length);
    }

    return {
      id: `proposal-${proposalIdx}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `Répartition Option ${proposalIdx + 1}`,
      createdAt: new Date().toISOString(),
      config: {
        levels: JSON.parse(JSON.stringify(levels)),
        solver: JSON.parse(JSON.stringify(solverConfig))
      },
      classes: formattedClasses,
      stats: {
        totalStudents,
        totalClasses: formattedClasses.length,
        averageClassSize: parseFloat(avgClassSize.toFixed(1)),
        minClassSize: minSize,
        maxClassSize: maxSize,
        doubleLevelCount: doubleLevels,
        singleLevelCount: singleLevels,
        standardDeviation: parseFloat(stdDev.toFixed(2))
      }
    };
  });
}
