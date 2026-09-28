import { useEffect, useRef, useState } from "react";

const COURT_WIDTH = 800;
const COURT_HEIGHT = 460;
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 90;
const PADDLE_PADDING = 18;
const PLAYER_SPEED = 5;
const AI_SPEED = 3.8;
const BALL_SIZE = 12;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function PongPage() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const keyStateRef = useRef({ up: false, down: false });
  const playerTargetYRef = useRef(COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const playerYRef = useRef(COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const aiYRef = useRef(COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const ballRef = useRef({
    x: COURT_WIDTH / 2 - BALL_SIZE / 2,
    y: COURT_HEIGHT / 2 - BALL_SIZE / 2,
    vx: -4,
    vy: 2.4
  });
  const [isRunning, setIsRunning] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  const resetBall = (direction = 1) => {
    const verticalDirection = Math.random() > 0.5 ? 1 : -1;
    ballRef.current = {
      x: COURT_WIDTH / 2 - BALL_SIZE / 2,
      y: COURT_HEIGHT / 2 - BALL_SIZE / 2,
      vx: direction * (4 + Math.random() * 0.5),
      vy: verticalDirection * (1.8 + Math.random() * 1.2)
    };
  };

  const resetGame = () => {
    setPlayerScore(0);
    setComputerScore(0);
    playerYRef.current = COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    aiYRef.current = COURT_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    playerTargetYRef.current = playerYRef.current;
    resetBall(Math.random() > 0.5 ? 1 : -1);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        keyStateRef.current.up = true;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        keyStateRef.current.down = true;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowUp") keyStateRef.current.up = false;
      if (event.key === "ArrowDown") keyStateRef.current.down = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const playerY = playerYRef.current;
      const aiY = aiYRef.current;
      const ball = ballRef.current;

      ctx.clearRect(0, 0, COURT_WIDTH, COURT_HEIGHT);
      ctx.fillStyle = "#0e1835";
      ctx.fillRect(0, 0, COURT_WIDTH, COURT_HEIGHT);

      ctx.setLineDash([7, 10]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(COURT_WIDTH / 2, 0);
      ctx.lineTo(COURT_WIDTH / 2, COURT_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#eaf0ff";
      ctx.fillRect(PADDLE_PADDING, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(
        COURT_WIDTH - PADDLE_PADDING - PADDLE_WIDTH,
        aiY,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      ctx.beginPath();
      ctx.arc(
        ball.x + BALL_SIZE / 2,
        ball.y + BALL_SIZE / 2,
        BALL_SIZE / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const step = () => {
      const ball = ballRef.current;
      let playerY = playerYRef.current;
      let aiY = aiYRef.current;

      if (keyStateRef.current.up) {
        playerY -= PLAYER_SPEED;
      } else if (keyStateRef.current.down) {
        playerY += PLAYER_SPEED;
      } else {
        const diff = playerTargetYRef.current - playerY;
        playerY += clamp(diff, -PLAYER_SPEED, PLAYER_SPEED);
      }
      playerY = clamp(playerY, 0, COURT_HEIGHT - PADDLE_HEIGHT);

      const aiCenter = aiY + PADDLE_HEIGHT / 2;
      const ballCenter = ball.y + BALL_SIZE / 2;
      if (ballCenter > aiCenter + 8) aiY += AI_SPEED;
      if (ballCenter < aiCenter - 8) aiY -= AI_SPEED;
      aiY = clamp(aiY, 0, COURT_HEIGHT - PADDLE_HEIGHT);

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy *= -1;
      } else if (ball.y + BALL_SIZE >= COURT_HEIGHT) {
        ball.y = COURT_HEIGHT - BALL_SIZE;
        ball.vy *= -1;
      }

      const playerX = PADDLE_PADDING;
      const aiX = COURT_WIDTH - PADDLE_PADDING - PADDLE_WIDTH;

      const hitPlayerPaddle =
        ball.x <= playerX + PADDLE_WIDTH &&
        ball.x + BALL_SIZE >= playerX &&
        ball.y + BALL_SIZE >= playerY &&
        ball.y <= playerY + PADDLE_HEIGHT &&
        ball.vx < 0;

      if (hitPlayerPaddle) {
        ball.x = playerX + PADDLE_WIDTH;
        ball.vx = Math.abs(ball.vx) + 0.2;
        const impact = ball.y + BALL_SIZE / 2 - (playerY + PADDLE_HEIGHT / 2);
        ball.vy += impact * 0.04;
      }

      const hitAiPaddle =
        ball.x + BALL_SIZE >= aiX &&
        ball.x <= aiX + PADDLE_WIDTH &&
        ball.y + BALL_SIZE >= aiY &&
        ball.y <= aiY + PADDLE_HEIGHT &&
        ball.vx > 0;

      if (hitAiPaddle) {
        ball.x = aiX - BALL_SIZE;
        ball.vx = -(Math.abs(ball.vx) + 0.2);
        const impact = ball.y + BALL_SIZE / 2 - (aiY + PADDLE_HEIGHT / 2);
        ball.vy += impact * 0.03;
      }

      if (ball.x + BALL_SIZE < 0) {
        setComputerScore((score) => score + 1);
        resetBall(1);
      } else if (ball.x > COURT_WIDTH) {
        setPlayerScore((score) => score + 1);
        resetBall(-1);
      }

      playerYRef.current = playerY;
      aiYRef.current = aiY;
      draw();
      animationFrameRef.current = requestAnimationFrame(step);
    };

    draw();
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning]);

  const handleStartRestart = () => {
    resetGame();
    setIsRunning(true);
  };

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.height) return;
    const scaleY = COURT_HEIGHT / rect.height;
    const mouseY = (event.clientY - rect.top) * scaleY;
    playerTargetYRef.current = clamp(mouseY - PADDLE_HEIGHT / 2, 0, COURT_HEIGHT - PADDLE_HEIGHT);
  };

  return (
    <section className="pong-page">
      <div className="hero">
        <h1>Pong</h1>
        <p>Move your paddle with mouse or Arrow keys and play against the computer.</p>
      </div>

      <div className="pong-card">
        <div className="pong-scoreboard" aria-live="polite">
          <div>
            <strong>Player:</strong> {playerScore}
          </div>
          <div>
            <strong>Computer:</strong> {computerScore}
          </div>
          <button className="btn primary pong-start-btn" onClick={handleStartRestart}>
            {isRunning ? "Restart Game" : "Start Game"}
          </button>
        </div>
        <div className="pong-canvas-wrap" onMouseMove={handleMouseMove}>
          <canvas
            ref={canvasRef}
            className="pong-canvas"
            width={COURT_WIDTH}
            height={COURT_HEIGHT}
            role="img"
            aria-label="Pong game area"
          />
        </div>
      </div>
    </section>
  );
}

export default PongPage;
