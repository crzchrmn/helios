const API_URL = "/api/raffle/winner";

const canvas = document.querySelector("#wheel");
const context = canvas.getContext("2d");
const namesInput = document.querySelector("#names");
const spinButton = document.querySelector("#spin-button");
const result = document.querySelector("#result");

let rotation = 0;
let currentNames = [];
let animationFrame = null;

function readNames() {
  return namesInput.value
    .split(/\r?\n/)
    .map(name => name.trim())
    .filter(Boolean);
}

function resizeCanvas() {
  const size = canvas.getBoundingClientRect().width;
  if (!size) return;

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * pixelRatio);
  canvas.height = Math.round(size * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  drawWheel();
}

function drawWheel() {
  const size = canvas.getBoundingClientRect().width;
  if (!size) return;

  const center = size / 2;
  const radius = center - 8;

  context.clearRect(0, 0, size, size);

  if (currentNames.length === 0) {
    context.beginPath();
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.fillStyle = "#e8ebf3";
    context.fill();
    context.fillStyle = "#667085";
    context.font = "600 16px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Add names to begin", center, center);
    return;
  }

  const slice = (Math.PI * 2) / currentNames.length;

  context.save();
  context.translate(center, center);
  context.rotate(rotation);

  currentNames.forEach((name, index) => {
    const startAngle = -Math.PI / 2 + index * slice;
    const endAngle = startAngle + slice;
    const middleAngle = startAngle + slice / 2;

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = `hsl(${(index * 360) / currentNames.length}, 72%, 55%)`;
    context.fill();

    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.stroke();

    context.save();
    context.rotate(middleAngle);
    if (middleAngle > Math.PI / 2 && middleAngle < (Math.PI * 3) / 2) {
      context.rotate(Math.PI);
    }

    context.fillStyle = "white";
    context.font = `700 ${Math.max(11, Math.min(17, 220 / currentNames.length))}px system-ui`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    const label = name.length > 20 ? `${name.slice(0, 18)}…` : name;
    context.fillText(label, 0, -radius * 0.65, radius * 0.7);
    context.restore();
  });

  context.restore();

  context.beginPath();
  context.arc(center, center, 11, 0, Math.PI * 2);
  context.fillStyle = "white";
  context.fill();
  context.strokeStyle = "#202538";
  context.lineWidth = 3;
  context.stroke();
}

function parseWinner(responseText) {
  let payload;

  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = responseText.trim();
  }

  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload && typeof payload === "object") {
    return String(payload.winner ?? payload.name ?? "").trim();
  }

  return "";
}

function animateToWinner(winnerIndex) {
  return new Promise(resolve => {
    const slice = (Math.PI * 2) / currentNames.length;
    const winnerCenter = -Math.PI / 2 + (winnerIndex + 0.5) * slice;
    const pointerAngle = -Math.PI / 2;

    // Choose the equivalent target angle that adds several full turns.
    const desiredAngle = pointerAngle - winnerCenter;
    const fullTurn = Math.PI * 2;
    const extraTurns = 5;
    const remaining = ((desiredAngle - rotation) % fullTurn + fullTurn) % fullTurn;
    const startRotation = rotation;
    const targetRotation = rotation + remaining + extraTurns * fullTurn;
    const duration = 4200;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      rotation = startRotation + (targetRotation - startRotation) * eased;
      drawWheel();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        rotation = targetRotation % fullTurn;
        drawWheel();
        animationFrame = null;
        resolve();
      }
    }

    animationFrame = requestAnimationFrame(frame);
  });
}

namesInput.addEventListener("input", () => {
  currentNames = readNames();
  drawWheel();
  result.textContent = currentNames.length
    ? `${currentNames.length} name${currentNames.length === 1 ? "" : "s"} ready.`
    : "Add names to get started.";
});

spinButton.addEventListener("click", async () => {
  currentNames = readNames();

  if (currentNames.length < 2) {
    result.textContent = "Enter at least two names.";
    drawWheel();
    return;
  }

  drawWheel();
  spinButton.disabled = true;
  result.textContent = "Asking the raffle API to select a winner…";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ names: currentNames })
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(responseText || `Request failed (${response.status}).`);
    }

    const winner = parseWinner(responseText);
    const winnerIndex = currentNames.findIndex(
      name => name.toLowerCase() === winner.toLowerCase()
    );

    if (!winner) {
      throw new Error("The API response did not contain a winner.");
    }

    if (winnerIndex === -1) {
      throw new Error(`The API returned "${winner}", which is not in the names list.`);
    }

    result.textContent = "Spinning…";
    await animateToWinner(winnerIndex);
    result.textContent = `Winner: ${winner}`;
  } catch (error) {
    result.textContent = `Could not spin: ${error.message}`;
  } finally {
    spinButton.disabled = false;
  }
});

window.addEventListener("resize", resizeCanvas);

currentNames = readNames();
resizeCanvas();