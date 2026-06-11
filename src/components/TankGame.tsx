import React, { useEffect, useRef, useState } from 'react';
import { GameManager } from '../game/GameManager';

export default function TankGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOverScore, setGameOverScore] = useState<number | null>(null);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    
    // Set canvas resolution to container size
    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const game = new GameManager(
      canvas,
      (finalScore) => {
        setIsPlaying(false);
        setGameOverScore(finalScore);
      },
      (newScore) => {
        setScore(newScore);
      },
      (newHealth, newMaxHealth) => {
        setHealth(newHealth);
        setMaxHealth(newMaxHealth);
      }
    );
    
    game.start();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      game.isGameOver = true; // Stop loop
    };
  }, [isPlaying]);

  const handleStart = () => {
    setScore(0);
    setHealth(100);
    setGameOverScore(null);
    setIsPlaying(true);
  };

  const healthPercent = Math.max(0, (health / maxHealth) * 100);

  return (
    <div className="flex flex-col w-full h-screen bg-[#0c0d0e] text-[#d1d5db] font-mono select-none overflow-hidden">
      {/* Tactical Header HUD */}
      <div className="h-20 bg-[#161b22] border-b-2 border-[#30363d] flex items-center justify-between px-8 shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-10">
          <div>
            <div className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-1">Armor Integrity</div>
            <div className="w-48 h-4 bg-[#0d1117] border border-[#30363d] p-[2px]">
              <div 
                className="h-full bg-[#3fb950] transition-all duration-200" 
                style={{ width: `${healthPercent}%`, boxShadow: '0 0 10px rgba(63,185,80,0.4)' }}
              ></div>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-1">Weapon Status</div>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-[#f85149]"></div>
              <div className="w-3 h-3 bg-[#f85149]"></div>
              <div className="w-3 h-3 bg-[#f85149]"></div>
              <div className="w-3 h-3 bg-[#30363d]"></div>
              <div className="w-3 h-3 bg-[#30363d]"></div>
            </div>
          </div>
        </div>
        
        <div className="text-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 hidden sm:block">
          <div className="text-2xl font-bold text-[#f0f6fc] tracking-tighter">BATTLEFRONT-01</div>
          <div className="text-[10px] text-[#58a6ff] animate-pulse uppercase">Satellite Uplink: Active</div>
        </div>

        <div className="flex items-center gap-10 text-right">
          <div>
            <div className="text-[10px] text-[#8b949e] uppercase tracking-widest">Eliminations</div>
            <div className="text-xl font-bold text-[#f0f6fc]">{score}</div>
          </div>
          <div className="w-12 h-12 border-2 border-[#30363d] rounded-full flex items-center justify-center text-xs text-[#8b949e]">
             {isPlaying ? "LIVE" : "WAIT"}
          </div>
        </div>
      </div>

      {/* Main Combat Zone */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Sidebar Radar */}
        <div className="w-64 bg-[#0d1117] border-r border-[#30363d] p-6 flex-col gap-6 hidden md:flex shrink-0 z-10">
          <div className="relative aspect-square bg-[#161b22] border border-[#30363d] rounded-sm">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-[#30363d]/50 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#58a6ff] shadow-[0_0_8px_#58a6ff]"></div>
            <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-[#f85149] animate-ping"></div>
            <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-[#f85149]"></div>
            <div className="absolute top-0 left-0 p-2 text-[8px] text-[#8b949e] uppercase">Local Radar</div>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-[#161b22] border-l-2 border-[#d29922] text-[11px]">
              <span className="text-[#d29922] font-bold uppercase mr-1">Warning:</span> 
              Multiple hostiles detected in Sector 4.
            </div>
            <div className="p-3 bg-[#161b22] border-l-2 border-[#3fb950] text-[11px]">
              <span className="text-[#3fb950] font-bold uppercase mr-1">Info:</span> 
              Supply drop available at North-West coordinate.
            </div>
          </div>

          <div className="mt-auto border-t border-[#30363d] pt-6">
            <div className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-4">Controls</div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="p-2 border border-[#30363d] rounded bg-[#161b22] flex flex-col items-center">
                <span className="text-[#58a6ff]">WASD</span>
                <span className="opacity-60">Move</span>
              </div>
              <div className="p-2 border border-[#30363d] rounded bg-[#161b22] flex flex-col items-center">
                <span className="text-[#58a6ff]">LCLICK</span>
                <span className="opacity-60">Fire</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex-1 bg-[#010409] relative" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className={`block w-full h-full relative z-10 cursor-none ${isPlaying ? 'block' : 'hidden'}`}
          />
          {/* Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(#30363d 1px, transparent 1px), linear-gradient(90deg, #30363d 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
          
          {/* Main Menu Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#010409]/90 backdrop-blur-sm z-30">
              <div className="bg-[#161b22] p-8 border border-[#30363d] shadow-2xl rounded-sm max-w-md w-full text-center">
                <h1 className="text-4xl font-bold mb-2 tracking-tighter text-[#f0f6fc]">Tank Simulator</h1>
                <p className="text-[#8b949e] mb-8 text-sm lowercase tracking-widest">Survive as long as you can.</p>
                
                {gameOverScore !== null && (
                  <div className="mb-8 p-4 bg-[#0d1117] border border-[#30363d] rounded-sm">
                    <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mb-1">Final Score</p>
                    <p className="text-4xl font-mono font-bold text-[#3fb950] mt-2">{gameOverScore}</p>
                  </div>
                )}
                
                <button
                  onClick={handleStart}
                  className="w-full py-4 px-6 bg-[#238636] hover:bg-[#2ea043] border border-[#3fb950]/50 text-[#f0f6fc] font-bold rounded-sm transition-colors text-sm tracking-widest shadow-[0_0_15px_rgba(35,134,54,0.3)] hover:shadow-[0_0_25px_rgba(63,185,80,0.5)] uppercase cursor-pointer"
                >
                  {gameOverScore !== null ? 'INITIALIZE NEXT DROP' : 'INITIATE COMBAT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-10 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between px-6 text-[10px] text-[#8b949e] shrink-0 z-20">
        <div className="flex gap-6 hidden sm:flex">
          <span>ENGINE: NOMINAL</span>
          <span>GPS: 34.0522° N, 118.2437° W</span>
          <span>SIGNAL: <span className="text-[#3fb950]">STRONG</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#f85149] animate-pulse"></div>
          <span>SIMULATION RUNNING - BUILD 0.9.4a</span>
        </div>
      </div>
    </div>
  );
}
