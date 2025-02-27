import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const COLS = 48;
const ROWS = 48;

const DEFAULT_LENGHT = 10;

const UP = Symbol("up");
const DOWN = Symbol("down");
const RIGHT = Symbol("right");
const LEFT = Symbol("left");


function App() {
  const timer = useRef(null);
  const grid = useRef(Array.from({ length : ROWS }, () => Array(COLS).fill("")));
  const snakeCoordinates = useRef([]);
  const direction = useRef(RIGHT);
  const snakeCoordinatesMap = useRef(new Set());
  const foodCoords = useRef({
    row: -1,
    col:-1,
  })
  const [points, setPoints] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setPlaying] = useState(0);

  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem('highScore')) || 0
  );

  useEffect(() => {
    const savedHighScore = Number(localStorage.getItem('highScore')) || 0;
    setHighScore(savedHighScore);
  },[]);

  useEffect(() => {
    if (gameOver) {
      if (points > highScore){
        setHighScore(points);
        localStorage.setItem('highScore', points);
      }
    }
  },[gameOver,points,highScore]);


  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => handleDirectionChange(e.key);
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  },[]);

  useEffect(() => {
    initiatePos();

    syncSnakeCoordinatesMap();
    populateFoodBall();
  }, []);

  const handleDirectionChange = (key) => {
    direction.current = getNewDirection(key);
  };

  const initiatePos = () => {

    const snake_postions = [];
    for(let i = 0;i < DEFAULT_LENGHT; i++){
      snake_postions.push({
        row: 0,
        col: i,
        isHead: false,
      });
    }

    snake_postions[DEFAULT_LENGHT - 1].isHead = true;
    snakeCoordinates.current = snake_postions;

  };

  const getNewDirection = (key) => {
    const currentDir = direction.current;
    switch (key) {
      case "ArrowUp":
      return currentDir !== DOWN ? UP : currentDir;
    case "ArrowDown":
      return currentDir !== UP ? DOWN : currentDir;
    case "ArrowRight":
      return currentDir !== LEFT ? RIGHT : currentDir;
    case "ArrowLeft":
      return currentDir !== RIGHT ? LEFT : currentDir;
    default:
      return currentDir;
    }
  };


  const syncSnakeCoordinatesMap = () => {
    const snakeCoordsSet = new Set(
      snakeCoordinates.current.map((coords) => `${coords.row}:${coords.col}`)
    );
    snakeCoordinatesMap.current = snakeCoordsSet;
  };


  const moveSnake = () => {
    if (gameOver) return;

    setPlaying((s) => s +1);

    const coords = snakeCoordinates.current;
    const snakeTail = coords[0];
    const snakeHead = coords.pop();
    const curr_direction = direction.current;

    const foodConsumed = 
        snakeHead.row === foodCoords.current.row && 
        snakeHead.col === foodCoords.current.col;

    coords.forEach((_, idx) => {
      if(idx === coords.length -1){
        coords[idx] = { ...snakeHead };
        coords[idx].isHead = false;
        return;
      }

      coords[idx] = coords[idx + 1];
    });

    switch(curr_direction){
      case UP:
        snakeHead.row -= 1;
        break;
      case DOWN:
        snakeHead.row += 1;
        break;
      case RIGHT:
        snakeHead.col += 1;
        break;
      case LEFT: 
        snakeHead.col -= 1;
        break;
    }

    if(foodConsumed){
      setPoints((points) => points + 1);
      populateFoodBall();
    }

    const collided = collisionCheck(snakeHead);
    if(collided){
      stopGame();
      return;
    }

    coords.push(snakeHead);
    snakeCoordinates.current = foodConsumed
      ? [snakeTail, ...coords]
      : coords;
    syncSnakeCoordinatesMap();

  }

  const populateFoodBall = async () => {
    const row = Math.floor(Math.random() * ROWS );
    const col = Math.floor(Math.random() * COLS );
    
    foodCoords.current = {
      row,
      col,
    };
  };

  const collisionCheck = (snakeHead) => {
    if (
      snakeHead.col >= COLS ||
      snakeHead.row >= ROWS ||
      snakeHead.col < 0 ||
      snakeHead.row < 0
    ){
      return true;
    }

    const coordsKey = `${snakeHead.row}:${snakeHead.col}`;
    if (snakeCoordinatesMap.current.has(coordsKey)){
      return true;
    }
  };

  const startGame = async () => {
    const interval = setInterval(() => {
      moveSnake();
    }, 100)

    timer.current = interval;
  };

  const stopGame = async () => {
    setGameOver(true);
    setPlaying(false);
    if(timer.current){
      clearInterval(timer.current);
    }
  };

  const retry = () => {

    direction.current = RIGHT;

    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }

    // Reset game state
    setPoints(0);
    setGameOver(false);
    setPlaying(false);

    // Reset snake position
    initiatePos();

    // Sync snake positions and generate new food
    syncSnakeCoordinatesMap();
    populateFoodBall();

  }

  const getCell = useCallback(
    (row_idx, col_idx) => {
      const coords = `${row_idx}:${col_idx}`;
      const foodPos = `${foodCoords.current.row}:${foodCoords.current.col}`;
      const head =
        snakeCoordinates.current[snakeCoordinates.current.length - 1];
      const headPos = `${head?.row}:${head?.col}`;

      const isFood = coords === foodPos;
      const isSnakeBody = snakeCoordinatesMap.current.has(coords);
      const isHead = headPos === coords;

      let className = "cell";
      if (isFood) {
        className += " food";
      }
      if (isSnakeBody) {
        className += " body";
      }
      if (isHead) {
        className += " head";
      }

      return <div key={col_idx} className={className}></div>;
    },
    [isPlaying]
  );

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {
        gameOver && (<p className="game-over">GAME OVER</p>)
      }
      {gameOver ? (
        <button onClick={retry}>
            RETRY
        </button>
      ) : (
          <button onClick={isPlaying ? stopGame : startGame}>
            {isPlaying ? "STOP" : "START"} GAME
          </button>
      )}
      <div className="board">
        {grid.current?.map((row, row_idx) => (
          <div key={row_idx} className="row">
            {row.map((_, col_idx) => getCell(row_idx, col_idx))}
          </div>
        ))}
      </div>
      <p className="score">SCORE   :   {points}</p>
      <p className="high-score">HIGH SCORE: {highScore}</p>
      <div className="keys-container">
          <button onClick={() => handleDirectionChange("ArrowUp")}>
              UP
          </button>
          <div className="key-row">
              <button onClick={() => handleDirectionChange("ArrowLeft")}>
                  LEFT
              </button>
              <button onClick={() => handleDirectionChange("ArrowRight")}>
                  RIGHT
              </button>
          </div>
          <button onClick={() => handleDirectionChange("ArrowDown")}>
              DOWN
          </button>
      </div>
    </div>
  );
}

export default App
