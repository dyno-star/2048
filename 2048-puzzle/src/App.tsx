import { useState, useEffect } from 'react';

  // Interface for the game grid
  interface Grid {
    [key: number]: number[];
  }

  // Interface for alterOneLine return type
  interface AlterLineResult {
    line: number[];
    changed: boolean;
  }

  // Interface for shift return type
  interface ShiftResult {
    board: Board2048;
    changed: boolean;
  }

  // Board2048 class to handle game logic
  class Board2048 {
    static UP: number = 0;
    static RIGHT: number = 1;
    static DOWN: number = 2;
    static LEFT: number = 3;

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

    // Convert grid to string for display
    toString(): string {
      return this.grid
        .map(row => row.map(val => (val === 0 ? '-' : val)).join('\t'))
        .join('\n');
    }

    // Extract a line (row or column) from the grid
    extractLine(i: number, vertical: boolean, reverse: boolean): number[] {
      let line: number[] = [];
      if (vertical) {
        for (let j = 0; j < this.size; j++) {
          line.push(this.grid[j][i]);
        }
      } else {
        line = [...this.grid[i]];
      }
      return reverse ? line.reverse() : line;
    }

    // Insert a line back into the grid
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

    // Shift one line according to 2048 rules
    static alterOneLine(line: number[]): AlterLineResult {
      let changed: boolean = false;
      let newLine: number[] = line.filter(val => val !== 0); // Remove zeros
      let result: number[] = [];
      let i: number = 0;

      // Merge tiles
      while (i < newLine.length) {
        if (i + 1 < newLine.length && newLine[i] === newLine[i + 1] && newLine[i] !== 0) {
          result.push(newLine[i] * 2);
          i += 2;
          changed: true;
        } else {
          result.push(newLine[i]);
          i++;
        }
      }

      // Fill remaining with zeros
      while (result.length < line.length) {
        result.push(0);
      }

      // Check if line changed
      if (!changed && !line.some((val, idx) => val !== result[idx])) {
        return { line: result, changed: false };
      }

      return { line: result, changed: true };
    }

    // Shift the entire board in the given direction
    shift(direction: number): ShiftResult {
      let newBoard: Board2048 = new Board2048(this.grid.map(row => [...row]));
      let changed: boolean = false;

      for (let i = 0; i < this.size; i++) {
        let vertical: boolean = direction === Board2048.UP || direction === Board2048.DOWN;
        let reverse: boolean = direction === Board2048.RIGHT || direction === Board2048.DOWN;
        let line: number[] = newBoard.extractLine(i, vertical, reverse);
        let result: AlterLineResult = Board2048.alterOneLine(line);
        newBoard.insertLine(result.line, i, vertical, reverse);
        if (result.changed) changed = true;
      }

      return { board: newBoard, changed };
    }

    // Count empty tiles
    numEmpty(): number {
      return this.grid.flat().filter(val => val === 0).length;
    }

    // Add a new tile (2 or 4) to a random empty position
    newTile(): boolean {
      let empty: [number, number][] = [];
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.grid[i][j] === 0) empty.push([i, j]);
        }
      }
      if (empty.length === 0) return false;
      let [row, col] = empty[Math.floor(Math.random() * empty.length)];
      this.grid[row][col] = Math.random() < 0.9 ? 2 : 4;
      return true;
    }

    // Check if the game is over (no valid moves)
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

    // Check if a move in the given direction is valid
    validMove(direction: number): boolean {
      let testBoard: Board2048 = new Board2048(this.grid.map(row => [...row]));
      let result: ShiftResult = testBoard.shift(direction);
      return result.changed;
    }

    // Getter for grid
    getGrid(): Grid {
      return this.grid;
    }
  }

  // Main Game Component
  const App: React.FC = () => {
    const [game, setGame] = useState<Board2048>(() => {
      let board = new Board2048(4);
      board.newTile();
      board.newTile();
      return board;
    });
    const [gameOver, setGameOver] = useState<boolean>(false);

    // Handle keyboard input
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        let direction: number | undefined;
        switch (e.key.toLowerCase()) {
          case 'w':
            direction = Board2048.UP;
            break;
          case 'd':
            direction = Board2048.RIGHT;
            break;
          case 's':
            direction = Board2048.DOWN;
            break;
          case 'a':
            direction = Board2048.LEFT;
            break;
          default:
            return;
        }

        if (game.validMove(direction)) {
          let { board }: ShiftResult = game.shift(direction);
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

    // Reset game
    const resetGame = (): void => {
      let newBoard = new Board2048(4);
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
              {game.getGrid().flat().map((value: number, index: number) => (
                <div
                  key={index}
                  className={`tile tile-${value}`}
                >
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
            Use <strong>WASD</strong> keys to move tiles (W: Up, A: Left, S: Down, D: Right).
          </div>
          <button
            onClick={resetGame}
            className="new-game-button"
          >
            New Game
          </button>
        </main>
      </div>
    );
  };

  export default App;