import React, { useState, useEffect } from 'react';

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export default function MinesweeperApp() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const rows = 9;
  const cols = 9;
  const mines = 10;

  const initGrid = () => {
    let newGrid: Cell[][] = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({ isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 }))
    );
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (r + i >= 0 && r + i < rows && c + j >= 0 && c + j < cols && newGrid[r + i][c + j].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }
    setGrid(newGrid);
    setGameOver(false);
    setWin(false);
  };

  useEffect(() => {
    initGrid();
  }, []);

  const revealCell = (r: number, c: number) => {
    if (gameOver || win || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    const newGrid = [...grid];
    newGrid[r][c].isRevealed = true;

    if (newGrid[r][c].isMine) {
      setGameOver(true);
      // Reveal all mines
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (newGrid[i][j].isMine) newGrid[i][j].isRevealed = true;
        }
      }
    } else if (newGrid[r][c].neighborMines === 0) {
      // Flood fill
      const queue = [[r, c]];
      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = cr + i;
            const nc = cc + j;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newGrid[nr][nc].isRevealed && !newGrid[nr][nc].isFlagged) {
              newGrid[nr][nc].isRevealed = true;
              if (newGrid[nr][nc].neighborMines === 0) queue.push([nr, nc]);
            }
          }
        }
      }
    }

    setGrid(newGrid);
    checkWin(newGrid);
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || win || grid[r][c].isRevealed) return;
    const newGrid = [...grid];
    newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
    setGrid(newGrid);
  };

  const checkWin = (currentGrid: Cell[][]) => {
    let unrevealedSafe = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!currentGrid[r][c].isMine && !currentGrid[r][c].isRevealed) {
          unrevealedSafe++;
        }
      }
    }
    if (unrevealedSafe === 0) setWin(true);
  };

  return (
    <div className="flex flex-col items-center bg-[#c0c0c0] p-4 font-pixel select-none">
      <div className="win-border-inset p-2 bg-[#c0c0c0] flex flex-col items-center">
        <div className="win-border-inset w-full flex justify-between items-center p-1 mb-2 bg-[#c0c0c0]">
          <div className="lcd-display px-1 text-red-500 bg-black">{mines}</div>
          <button className="win-button w-8 h-8 flex items-center justify-center text-xl" onClick={initGrid}>
            {gameOver ? '😵' : win ? '😎' : '🙂'}
          </button>
          <div className="lcd-display px-1 text-red-500 bg-black">000</div>
        </div>
        <div className="win-border-inset bg-[#c0c0c0]">
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <div 
                  key={c}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`w-6 h-6 flex items-center justify-center text-sm font-bold cursor-default
                    ${cell.isRevealed ? 'border border-gray-400 bg-[#c0c0c0]' : 'win-button'}
                  `}
                  style={{
                    color: cell.isRevealed && cell.neighborMines > 0 ? 
                      ['blue', 'green', 'red', 'darkblue', 'darkred', 'teal', 'black', 'gray'][cell.neighborMines - 1] : 'black'
                  }}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? '💣' : cell.neighborMines > 0 ? cell.neighborMines : ''
                  ) : (
                    cell.isFlagged ? '🚩' : ''
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
