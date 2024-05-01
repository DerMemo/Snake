let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let scoreDiv = document.getElementById("score");
let rows = 20;
let cols = 20;
let snake = [{ x: 10, y: 3 }];
let food;
let cellWidth = canvas.width / cols;
let cellHeight = canvas.height / rows;
let direction = "LEFT";
let foodCollected = false;
let score = 0;
let speed = 200;
let gameInterval;
let isPaused = false;
let powerUp = null;
let powerUpActive = false;
let powerUpTimer = 0;
let walls = [];
let maxWalls = 5;
document.getElementById("startButton").addEventListener('click', startGame);
document.getElementById("restartButton").addEventListener('click', restartGame);
document.getElementById("pauseOverlay").style.display = "none";
document.addEventListener("keydown", keyDown);
document.getElementById('howToPlayButton').addEventListener('click', toggleInstructions);

function toggleInstructions() {
    var instructions = document.getElementById('instructions');
    instructions.style.display = (instructions.style.display === 'none' ? 'block' : 'none');
}

function startGame() {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none'; // Stelle sicher, dass Game-Over versteckt ist
    gameInterval = setInterval(gameLoop, speed);
}
function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    testGameOver();
    gameInterval = setInterval(gameLoop, speed);
}
placeFood();
draw();

function placeWalls() {
  if (score % 50 === 0 && score !== 0 && walls.length < maxWalls) {
    let newWall;
    do {
      newWall = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (
      snake.some(
        (segment) => segment.x === newWall.x && segment.y === newWall.y
      ) ||
      (food && food.x === newWall.x && food.y === newWall.y) ||
      walls.some((wall) => wall.x === newWall.x && wall.y === newWall.y)
    );

    walls.push(newWall);
  }
}
function updateScore() {
  scoreDiv.innerHTML = "Punkte: " + score;
}
function activatePowerUp() {
  powerUpActive = true;
  powerUpTimer = 10;
  adjustSpeed(-speed / 2); // Beispiel: Halbiere die Geschwindigkeit
  powerUp = null; // Entferne das Power-Up nach Aktivierung
}
function deactivatePowerUp() {
  adjustSpeed(speed * 2); // Geschwindigkeit zurücksetzen
  powerUpActive = false;
}
function adjustSpeed(change) {
  clearInterval(gameInterval);
  speed += change;
  gameInterval = setInterval(gameLoop, speed);
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); //x,y,höhe,breite
  
  //Schlange zeichnen
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  snake.forEach((part) => add(part.x, part.y, "white"));

  //Futter zeichnen
  add(food.x, food.y, "yellow");
  if (powerUp) add(powerUp.x, powerUp.y, "blue");
  
  //Wand zeichnen
  walls.forEach((wall) => add(wall.x, wall.y, "gray"));

  requestAnimationFrame(draw);
}

function testGameOver() {
  let firstPart = snake[0]; // Kopf der Schlange
  let otherParts = snake.slice(1);
  let hitWall = walls.some(
    (wall) => wall.x === firstPart.x && wall.y === firstPart.y
  );
  let duplicatePart = otherParts.find(
    (part) => part.x == firstPart.x && part.y == firstPart.y
  );

  if (
    snake[0].x < 0 ||
    snake[0].x > cols - 1 ||
    snake[0].y < 0 ||
    snake[0].y > rows - 1 ||
    duplicatePart ||
    hitWall
  ) {
    score = 0;
    placeFood();
    walls = [];
    powerUp = null;
    powerUpActive = false;
    powerUpTimer = 0;
    snake = [{ x: 10, y: 3 }];
    direction = "LEFT";
    updateScore();
    speed = 200;
    clearInterval(gameInterval);

    document.getElementById('gameOverScreen').style.display = 'flex';
  }
}

function placeFood() {
  // Futter bekommt RandomStelle
  let randomX, randomY;
  let collision;
  do {
    randomX = Math.floor(Math.random() * cols);
    randomY = Math.floor(Math.random() * rows);
    collision = snake.some(
      (segment) => segment.x === randomX && segment.y === randomY
    );
  } while (collision);
  food = { x: randomX, y: randomY };
}

function add(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth - 1, cellHeight - 1);
}

function shiftSnake() {
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i] = { ...snake[i - 1] };
  }
}
function togglePause() {
  if (isPaused) {
    document.getElementById("pauseOverlay").style.display = "none";
    gameInterval = setInterval(gameLoop, speed);
    isPaused = false;
  } else {
    document.getElementById("pauseOverlay").style.display = "flex";
    clearInterval(gameInterval);
    isPaused = true;
  }
}

function gameLoop() {
  testGameOver();

  if (score % 100 === 0 && score !== 0 && !powerUp) {
    placePowerUp(); // Platziere ein Power-Up, wenn noch keines aktiv ist
  }

  // Berechne die neue Position des Kopfes basierend auf der aktuellen Richtung
  let newX = snake[0].x;
  let newY = snake[0].y;
  if (direction == "LEFT") newX--;
  if (direction == "RIGHT") newX++;
  if (direction == "UP") newY--;
  if (direction == "DOWN") newY++;

  // Überprüfe, ob die neue Position auf das Essen trifft
  if (newX == food.x && newY == food.y) {
    foodCollected = true;
    placeFood(); // Platziere neues Essen
    score += 10; // Erhöhe die Punkte
    updateScore(); // Aktualisiere die Anzeige der Punkte
    placeWalls();

    // Wenn die Geschwindigkeit erhöht werden kann, erhöhe sie und aktualisiere das Intervall
    if (speed > 60) {
      speed -= 10;
      clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, speed);
    }
  } else {
    // Verschiebe die Schlange: entferne das letzte Segment, wenn kein Essen gesammelt wurde
    snake.pop();
  }
  if (powerUp && newX == powerUp.x && newY == powerUp.y) {
    activatePowerUp();
  }
  // Füge das neue Kopfsegment an der berechneten neuen Position hinzu
  snake.unshift({ x: newX, y: newY });

  // Power-Up zeichnen
  if (powerUp) {
    ctx.fillStyle = "blue"; // Blaues Rechteck für das Power-Up
    ctx.fillRect(
      powerUp.x * cellWidth,
      powerUp.y * cellHeight,
      cellWidth,
      cellHeight
    );
  }
  if (powerUpActive && --powerUpTimer <= 0) {
    deactivatePowerUp();
  }

  draw();

  // Verhindere, dass die Schlange aus dem Spielfeld läuft oder sich selbst isst
  testGameOver();
}

function keyDown(e) {
  if ([37, 38, 39, 40].includes(e.keyCode)) {
    e.preventDefault();
  }
  if (e.keyCode === 32) {
    e.preventDefault();
    togglePause();
    return;
  }
  if (isPaused) return;

  if (e.keyCode == 37 && direction != "RIGHT") {
    direction = "LEFT";
  }
  if (e.keyCode == 38 && direction != "DOWN") {
    direction = "UP";
  }
  if (e.keyCode == 39 && direction != "LEFT") {
    direction = "RIGHT";
  }
  if (e.keyCode == 40 && direction != "UP") {
    direction = "DOWN";
  }
}
function placePowerUp() {
  if (score % 100 === 0 && score != 0) {
    do {
      powerUp = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    } while (
      snake.some(
        (segment) => segment.x === powerUp.x && segment.y === powerUp.y
      ) ||
      (food.x === powerUp.x && food.y === powerUp.y)
    );
  }
}
function checkPowerUpCollision() {
  if (snake[0].x === powerUp.x && snake[0].y === powerUp.y) {
    powerUpActive = true;
    powerUpTimer = 10;
    speed /= 2;
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
  }
}
