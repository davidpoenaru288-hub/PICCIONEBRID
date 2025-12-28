import React, { useState, useEffect, useRef, useCallback } from 'react';
import Bird from './components/Bird';
import Pipe from './components/Pipe';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  PIPE_SPEED, 
  PIPE_WIDTH, 
  PIPE_GAP, 
  BIRD_SIZE, 
  GAME_HEIGHT,
  GAME_WIDTH,
  PIPE_DISTANCE,
  LEVEL_THRESHOLD
} from './utils/gameConstants';
import { loadStats, saveStats, GameStats } from './utils/storage';
import { Trophy, RotateCcw, Play, Medal, BarChart3, X, WifiOff } from 'lucide-react';

type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

interface PipeData {
  x: number;
  topHeight: number;
  passed: boolean;
  id: number;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [birdPos, setBirdPos] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [showStats, setShowStats] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Statistici persistente
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalGames: 0,
    totalScore: 0,
    maxLevel: 1
  });
  
  const gameLoopRef = useRef<number | null>(null);
  const pipeIdCounter = useRef(0);
  
  // Inițializare și monitorizare online/offline
  useEffect(() => {
    // Încarcă datele salvate
    const savedStats = loadStats();
    setStats(savedStats);

    // Monitorizare conexiune
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actualizare nivel în timp real
  useEffect(() => {
    const newLevel = Math.floor(score / LEVEL_THRESHOLD) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
    }
  }, [score]);

  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      setBirdVelocity(JUMP_STRENGTH);
    } else if (gameState === 'START' || gameState === 'GAME_OVER') {
      // Prevenim startul accidental dacă suntem în modalul de statistici
      if (!showStats) {
        startGame();
      }
    }
  }, [gameState, showStats]);

  const startGame = () => {
    setGameState('PLAYING');
    setBirdPos(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setLevel(1);
    pipeIdCounter.current = 0;
    setShowStats(false);
  };

  // Gestionare input tastatură
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Bucla principală de joc
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const loop = () => {
      // 1. Fizică Pasăre
      setBirdPos((prev) => {
        const newPos = prev + birdVelocity;
        if (newPos < 0 || newPos > GAME_HEIGHT - BIRD_SIZE) {
          gameOver();
          return prev;
        }
        return newPos;
      });

      setBirdVelocity((prev) => prev + GRAVITY);

      // 2. Gestionare Țevi
      setPipes((prevPipes) => {
        let newPipes = prevPipes
          .map((pipe) => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter((pipe) => pipe.x + PIPE_WIDTH > -100);

        const lastPipe = newPipes[newPipes.length - 1];
        const shouldSpawn = !lastPipe || (GAME_WIDTH - (lastPipe.x + PIPE_WIDTH)) > PIPE_DISTANCE;

        if (shouldSpawn) {
          const minPipeHeight = 50;
          const maxPipeHeight = GAME_HEIGHT - PIPE_GAP - minPipeHeight;
          const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
          
          newPipes.push({
            x: GAME_WIDTH,
            topHeight: randomHeight,
            passed: false,
            id: pipeIdCounter.current++,
          });
        }

        return newPipes;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, birdVelocity]);

  // Verificare coliziuni și scor
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const birdX = 40;
    const birdY = birdPos;
    let collision = false;

    pipes.forEach((pipe) => {
      if (
        birdX + BIRD_SIZE > pipe.x + 4 &&
        birdX < pipe.x + PIPE_WIDTH - 4
      ) {
        if (
          birdY < pipe.topHeight || 
          birdY + BIRD_SIZE > pipe.topHeight + PIPE_GAP
        ) {
          collision = true;
        }
      }

      if (pipe.x + PIPE_WIDTH < birdX && !pipe.passed) {
        setScore((s) => s + 1);
        setPipes(current => current.map(p => p.id === pipe.id ? { ...p, passed: true } : p));
      }
    });

    if (collision) {
      gameOver();
    }
  }, [birdPos, pipes, gameState]);

  const gameOver = () => {
    setGameState('GAME_OVER');
    
    // Actualizare și Salvare Statistici
    setStats(prevStats => {
      const newStats = {
        highScore: Math.max(prevStats.highScore, score),
        totalGames: prevStats.totalGames + 1,
        totalScore: prevStats.totalScore + score,
        maxLevel: Math.max(prevStats.maxLevel, level)
      };
      saveStats(newStats); // Salvare persistentă
      return newStats;
    });
  };

  const birdRotation = Math.min(Math.max(birdVelocity * 3, -25), 90);

  const getBackgroundStyle = () => {
    const cycle = (level - 1) % 4;
    switch (cycle) {
      case 0: return 'linear-gradient(to bottom, #4fc3f7, #ffffff)';
      case 1: return 'linear-gradient(to bottom, #f97316, #fcd34d)';
      case 2: return 'linear-gradient(to bottom, #1e1b4b, #312e81)';
      case 3: return 'linear-gradient(to bottom, #ec4899, #fbcfe8)';
      default: return 'linear-gradient(to bottom, #4fc3f7, #ffffff)';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div 
        className="relative overflow-hidden shadow-2xl rounded-xl border-4 border-slate-800 transition-colors duration-1000"
        style={{ 
          width: GAME_WIDTH, 
          height: GAME_HEIGHT,
          background: getBackgroundStyle()
        }}
        onMouseDown={(e) => {
          // Prevenim săritura dacă dăm click pe butoane
          if ((e.target as HTMLElement).closest('button')) return;
          jump();
        }}
        onTouchStart={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          jump();
        }}
      >
        {/* Indicator Offline */}
        {isOffline && (
          <div className="absolute top-2 right-2 z-50 bg-black/50 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 backdrop-blur-sm">
            <WifiOff size={12} /> Offline
          </div>
        )}

        {/* Elemente decorative */}
        <div className="absolute bottom-0 w-full h-32 bg-white/20 blur-xl"></div>
        {level % 4 === 2 && (
          <>
             <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
             <div className="absolute top-20 left-40 w-1 h-1 bg-white rounded-full animate-pulse delay-75"></div>
             <div className="absolute top-5 left-80 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-150"></div>
          </>
        )}
        
        <Bird top={birdPos} rotation={birdRotation} />

        {pipes.map((pipe) => (
          <React.Fragment key={pipe.id}>
            <Pipe left={pipe.x} height={pipe.topHeight} isTop={true} />
            <Pipe left={pipe.x} height={GAME_HEIGHT - pipe.topHeight - PIPE_GAP} isTop={false} />
          </React.Fragment>
        ))}

        <div className="absolute bottom-0 w-full h-12 bg-[#ded895] border-t-4 border-[#73bf2e] z-30 flex items-center justify-center">
          <div className="w-full h-full opacity-50" 
               style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, #d0c874 10px, #d0c874 20px)' }}>
          </div>
        </div>

        {/* HUD */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-0 w-full p-4 flex justify-between items-start z-40 pointer-events-none">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase drop-shadow-md">Scor</span>
              <span className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] stroke-black">
                {score}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white uppercase drop-shadow-md">Nivel</span>
              <span className="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-1">
                <Medal size={20} className="text-yellow-300" /> {level}
              </span>
            </div>
          </div>
        )}

        {/* Ecran Start */}
        {gameState === 'START' && !showStats && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-sky-500 animate-bounce-slow max-w-[85%]">
              <h1 className="text-4xl font-black text-sky-600 mb-2 uppercase tracking-wider">Flappy Bird</h1>
              <p className="text-gray-500 mb-6 font-medium">Mod Infinit & Offline</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Play fill="currentColor" /> Start Joc
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowStats(true); }}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-md"
                >
                  <BarChart3 size={18} /> Statistici
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Statistici */}
        {showStats && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-[60] backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-blue-600 p-4 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <BarChart3 size={20} /> Statistici Jucător
                </h3>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowStats(false); }}
                  className="text-white/80 hover:text-white hover:bg-blue-500 rounded-full p-1 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 grid gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">Scor Record</span>
                  <span className="text-2xl font-black text-yellow-500">{stats.highScore}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">Nivel Maxim</span>
                  <span className="text-xl font-bold text-purple-600">{stats.maxLevel}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600 font-medium">Jocuri Totale</span>
                  <span className="text-xl font-bold text-blue-600">{stats.totalGames}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Scor Total</span>
                  <span className="text-xl font-bold text-green-600">{stats.totalScore}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                Datele sunt salvate local pe dispozitiv.
              </div>
            </div>
          </div>
        )}

        {/* Ecran Game Over */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center border-4 border-red-500 min-w-[280px]">
              <h2 className="text-4xl font-black text-red-500 mb-6 uppercase">Ai Pierdut!</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <span className="text-xs font-bold text-orange-600 uppercase block">Scor</span>
                  <span className="text-3xl font-bold text-orange-800">{score}</span>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <span className="text-xs font-bold text-yellow-600 uppercase block">Nivel</span>
                  <span className="text-3xl font-bold text-yellow-800">{level}</span>
                </div>
              </div>
              
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 mb-6 flex items-center justify-center gap-2">
                 <Trophy size={16} className="text-yellow-600" />
                 <span className="text-sm font-bold text-gray-600 uppercase">Record:</span>
                 <span className="text-xl font-bold text-gray-800">{stats.highScore}</span>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <RotateCcw size={20} /> Reîncepe Jocul
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowStats(true); }}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 px-6 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                  <BarChart3 size={16} /> Vezi Statistici
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-4 right-4 text-white/30 text-xs flex flex-col items-end">
        <span>Creat cu Dualite</span>
        {isOffline && <span className="text-red-400 font-bold">Mod Offline Activat</span>}
      </div>
    </div>
  );
}

export default App;
