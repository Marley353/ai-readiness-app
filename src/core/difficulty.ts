import { DIFFICULTY_NAMES, type Difficulty } from '../data/types';
export const difficultyName = (d: Difficulty) => DIFFICULTY_NAMES[d];
export const DIFFICULTIES: Difficulty[] = [0, 1, 2, 3, 4];
