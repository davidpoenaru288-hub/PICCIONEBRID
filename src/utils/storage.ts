export interface GameStats {
  highScore: number;
  totalGames: number;
  totalScore: number;
  maxLevel: number;
}

const STORAGE_KEY = 'flappy_bird_ro_data_v1';

const defaultStats: GameStats = {
  highScore: 0,
  totalGames: 0,
  totalScore: 0,
  maxLevel: 1,
};

export const saveStats = (stats: GameStats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Eroare la salvarea datelor:', e);
  }
};

export const loadStats = (): GameStats => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return defaultStats;
    
    const parsed = JSON.parse(data);
    // Asigurăm că toate câmpurile există (în caz de update-uri viitoare)
    return { ...defaultStats, ...parsed };
  } catch (e) {
    console.error('Eroare la încărcarea datelor:', e);
    return defaultStats;
  }
};
