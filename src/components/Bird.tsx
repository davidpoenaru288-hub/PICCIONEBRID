import React from 'react';
import { BIRD_SIZE } from '../utils/gameConstants';

interface BirdProps {
  top: number;
  rotation: number;
}

const Bird: React.FC<BirdProps> = ({ top, rotation }) => {
  return (
    <div
      className="absolute left-10 z-20 transition-transform duration-100 ease-linear"
      style={{
        top: top,
        width: BIRD_SIZE,
        height: BIRD_SIZE,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Corpul păsării - ACUM ALBASTRU */}
      <div className="w-full h-full bg-blue-500 rounded-full border-2 border-black relative overflow-hidden shadow-sm">
        {/* Ochi */}
        <div className="absolute top-1 right-2 w-3 h-3 bg-white rounded-full border border-black">
          <div className="absolute top-1 right-0.5 w-1 h-1 bg-black rounded-full"></div>
        </div>
        {/* Aripă */}
        <div className="absolute top-4 left-1 w-4 h-3 bg-white opacity-50 rounded-full"></div>
        {/* Cioc */}
        <div className="absolute top-4 -right-1 w-3 h-2 bg-orange-500 rounded-r-md border border-black"></div>
      </div>
    </div>
  );
};

export default Bird;
