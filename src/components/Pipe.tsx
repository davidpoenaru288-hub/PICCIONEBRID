import React from 'react';
import { PIPE_WIDTH } from '../utils/gameConstants';

interface PipeProps {
  left: number;
  height: number;
  isTop: boolean;
}

const Pipe: React.FC<PipeProps> = ({ left, height, isTop }) => {
  return (
    <div
      className="absolute border-2 border-black bg-green-500"
      style={{
        left: left,
        top: isTop ? 0 : undefined,
        bottom: !isTop ? 0 : undefined,
        width: PIPE_WIDTH,
        height: height,
        // Adăugăm un gradient pentru un efect 3D subtil
        backgroundImage: 'linear-gradient(90deg, #22c55e 0%, #4ade80 20%, #22c55e 50%, #15803d 100%)'
      }}
    >
      {/* Capătul țevii (flange) */}
      <div 
        className="absolute w-[110%] -left-[5%] h-6 bg-green-500 border-2 border-black"
        style={{
          bottom: isTop ? 0 : undefined,
          top: !isTop ? 0 : undefined,
          backgroundImage: 'linear-gradient(90deg, #22c55e 0%, #4ade80 20%, #22c55e 50%, #15803d 100%)'
        }}
      />
    </div>
  );
};

export default Pipe;
