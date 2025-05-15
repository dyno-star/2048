import { useState, useEffect } from 'react';

// Interfaces
interface Grid {
  [key: number]: number[];
}

interface AlterLineResult {
  line: number[];
  changed: boolean;
}

interface ShiftResult {
  board: Board2048;
  changed: boolean;
}

// 2048 Game Board Logic
class Board2048 {
  static UP = 0;
  static RIGHT = 1;
  static DOWN = 2;
  static LEFT = 3;

  private size: number;
  private grid: Grid;

  constructor(sizeOrGrid: number | number[][]) {
    if (typeof sizeOrGrid === 'number') {
      this.size = sizeOrGrid;
      this.grid = Array(sizeOrGrid)
        .fill(null)
        .map(() => Array(sizeOrGrid).fill(0));
    } else {
      this.size = sizeOrGrid.length;
      this.grid = sizeOrGrid.map(row => [...row]);
    }
  }

  toString(): string {
    return this.grid
      .map(row => row.map(val => (val === 0 ? '-' : val)).join('\t'))
      .join('\n');
  }

  extractLine(i: number, vertical: boolean, reverse: boolean): number[] {
    let line: number[] = vertical
      ? this.grid.map(row => row[i])
      : [...this.grid[i]];
    return reverse ? line.reverse() : line;
  }

  insertLine(line: number[], i: number, vertical: boolean, reverse: boolean): void {
    let newLine = [...line];
    if (reverse) newLine.reverse();
    if (vertical) {
      for (let j = 0; j < this.size; j++) {
        this.grid[j][i] = newLine[j];
      }
    } else {
      this.grid[i] = newLine;
    }
  }

  static alterOneLine(line: number[]): AlterLineResult {
    let changed = false;
    let newLine = line.filter(val => val !== 0);
    let result: number[] = [];
    let i = 0;

    while (i < newLine.length) {
      if (i + 1 < newLine.length && newLine[i] === newLine[i + 1]) {
        result.push(newLine[i] * 2);
        i += 2;
        changed = true;
      } else {
        result.push(newLine[i]);
        i++;
      }
    }

    while (result.length < line.length) {
      result.push(0);
    }

    if (!changed) {
      for (let j = 0; j < line.length; j++) {
        if (line[j] !== result[j]) {
          changed = true;
          break;
        }
      }
    }

    return { line: result, changed };
  }

  shift(direction: number): ShiftResult {
    let newBoard = new Board2048(this.grid.map(row => [...row]));
    let changed = false;

    for (let i = 0; i < this.size; i++) {
      const vertical = direction === Board2048.UP || direction === Board2048.DOWN;
      const reverse = direction === Board2048.RIGHT || direction === Board2048.DOWN;
      const line = newBoard.extractLine(i, vertical, reverse);
      const result = Board2048.alterOneLine(line);
      newBoard.insertLine(result.line, i, vertical, reverse);
      if (result.changed) changed = true;
    }

    return { board: newBoard, changed };
  }

  numEmpty(): number {
    return this.grid.flat().filter(val => val === 0).length;
  }

  newTile(): boolean {
    const empty: [number, number][] = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.grid[i][j] === 0) empty.push([i, j]);
      }
    }

    if (empty.length === 0) return false;

    const [row, col] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  gameOver(): boolean {
    if (this.numEmpty() > 0) return false;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size - 1; j++) {
        if (this.grid[i][j] === this.grid[i][j + 1]) return false;
        if (this.grid[j][i] === this.grid[j + 1][i]) return false;
      }
    }
    return true;
  }

  validMove(direction: number): boolean {
    const testBoard = new Board2048(this.grid.map(row => [...row]));
    const result = testBoard.shift(direction);
    return result.changed;
  }

  getGrid(): Grid {
    return this.grid;
  }
}

// React App Component
const App: React.FC = () => {
  const [game, setGame] = useState<Board2048>(() => {
    const board = new Board2048(4);
    board.newTile();
    board.newTile();
    return board;
  });

  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let direction: number | undefined;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          direction = Board2048.UP;
          break;
        case 'd':
        case 'arrowright':
          direction = Board2048.RIGHT;
          break;
        case 's':
        case 'arrowdown':
          direction = Board2048.DOWN;
          break;
        case 'a':
        case 'arrowleft':
          direction = Board2048.LEFT;
          break;
        default:
          return;
      }

      if (game.validMove(direction)) {
        const { board } = game.shift(direction);
        board.newTile();
        setGame(board);
        if (board.gameOver()) {
          setGameOver(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game]);

  const resetGame = (): void => {
    const newBoard = new Board2048(4);
    newBoard.newTile();
    newBoard.newTile();
    setGame(newBoard);
    setGameOver(false);
  };

  return (
    <div className="container">
      <main className="main">
        <h1 className="title">2048 Puzzle</h1>
        <div className="grid-container">
          <div className="grid">
            {game.getGrid().flat().map((value, index) => (
              <div key={index} className={`tile tile-${value}`}>
                {value !== 0 ? value : ''}
              </div>
            ))}
          </div>
        </div>
        {gameOver && (
          <div className="game-over">
            Game Over!{' '}
            <button onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}
        <div className="instructions">
          Use <strong>WASD</strong> or <strong>Arrow Keys</strong> to move tiles.
        </div>
        <button onClick={resetGame} className="new-game-button">
          New Game
        </button>
      </main>
    </div>
  );
};

export default App;