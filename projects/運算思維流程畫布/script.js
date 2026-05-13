const board = document.querySelector("#board");
const svg = document.querySelector("#flow-lines");
const connectButton = document.querySelector("#connect-mode");
const deleteButton = document.querySelector("#delete-selected");
const clearButton = document.querySelector("#clear-board");
const exportButton = document.querySelector("#export-board");

const shapeDefaults = {
  start: "開始",
  process: "執行步驟",
  decision: "判斷條件？",
  input: "輸入資料",
  output: "輸出結果"
};

let nodes = [];
let connections = [];
let selectedId = null;
let connectMode = false;
let connectSourceId = null;
let dragState = null;
let nodeCount = 0;

function createSvgElement(tag) {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function ensureArrowMarker() {
  svg.innerHTML = "";
  const defs = createSvgElement("defs");
  const marker = createSvgElement("marker");
  marker.setAttribute("id", "arrow");
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto-start-reverse");

  const path = createSvgElement("path");
  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
  path.setAttribute("fill", "#334155");
  marker.append(path);
  defs.append(marker);
  svg.append(defs);
}

function getNode(id) {
  return nodes.find((node) => node.id === id);
}

function getNodeCenter(node) {
  const element = document.querySelector(`[data-id="${node.id}"]`);
  const boardRect = board.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2
  };
}

function renderConnections() {
  ensureArrowMarker();

  connections.forEach((connection) => {
    const from = getNode(connection.from);
    const to = getNode(connection.to);
    if (!from || !to) return;

    const start = getNodeCenter(from);
    const end = getNodeCenter(to);
    const line = createSvgElement("line");
    line.classList.add("connector");
    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x);
    line.setAttribute("y2", end.y);
    svg.append(line);
  });
}

function renderNodes() {
  board.innerHTML = "";

  nodes.forEach((node) => {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `node ${node.shape}`;
    element.dataset.id = node.id;
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    element.setAttribute("aria-label", node.text);

    if (node.id === selectedId) {
      element.classList.add("selected");
    }

    if (node.id === connectSourceId) {
      element.classList.add("connect-source");
    }

    const label = document.createElement("span");
    label.className = "node-label";
    label.textContent = node.text;
    element.append(label);
    board.append(element);
  });

  renderConnections();
}

function addNode(shape) {
  nodeCount += 1;
  const offset = (nodeCount - 1) * 22;
  const node = {
    id: `node-${Date.now()}-${nodeCount}`,
    shape,
    text: shapeDefaults[shape],
    x: 80 + (offset % 240),
    y: 70 + (offset % 180)
  };

  nodes.push(node);
  selectedId = node.id;
  renderNodes();
}

function selectNode(id) {
  selectedId = id;

  if (connectMode) {
    if (!connectSourceId) {
      connectSourceId = id;
    } else if (connectSourceId !== id) {
      const exists = connections.some((item) => item.from === connectSourceId && item.to === id);
      if (!exists) {
        connections.push({ from: connectSourceId, to: id });
      }
      connectSourceId = null;
    }
  }

  renderNodes();
}

function editNode(id) {
  const node = getNode(id);
  if (!node) return;

  const nextText = window.prompt("請輸入圖形文字", node.text);
  if (nextText === null) return;

  node.text = nextText.trim() || node.text;
  renderNodes();
}

function deleteSelected() {
  if (!selectedId) return;
  nodes = nodes.filter((node) => node.id !== selectedId);
  connections = connections.filter((item) => item.from !== selectedId && item.to !== selectedId);
  selectedId = null;
  connectSourceId = null;
  renderNodes();
}

function getPointerPosition(event) {
  const boardRect = board.getBoundingClientRect();
  return {
    x: event.clientX - boardRect.left,
    y: event.clientY - boardRect.top
  };
}

function startDrag(event, nodeElement) {
  const node = getNode(nodeElement.dataset.id);
  if (!node) return;

  const pointer = getPointerPosition(event);
  dragState = {
    id: node.id,
    offsetX: pointer.x - node.x,
    offsetY: pointer.y - node.y
  };
}

function moveDrag(event) {
  if (!dragState) return;

  const node = getNode(dragState.id);
  const pointer = getPointerPosition(event);
  const maxX = Math.max(0, board.clientWidth - 150);
  const maxY = Math.max(0, board.clientHeight - 110);

  node.x = Math.min(Math.max(0, pointer.x - dragState.offsetX), maxX);
  node.y = Math.min(Math.max(0, pointer.y - dragState.offsetY), maxY);

  const element = document.querySelector(`[data-id="${node.id}"]`);
  element.style.left = `${node.x}px`;
  element.style.top = `${node.y}px`;
  renderConnections();
}

function endDrag() {
  dragState = null;
}

function clearBoard() {
  if (nodes.length === 0) return;
  const confirmed = window.confirm("確定要清空目前畫布嗎？");
  if (!confirmed) return;

  nodes = [];
  connections = [];
  selectedId = null;
  connectSourceId = null;
  renderNodes();
}

function exportBoard() {
  const boardRect = board.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  canvas.width = boardRect.width * window.devicePixelRatio;
  canvas.height = boardRect.height * window.devicePixelRatio;
  const context = canvas.getContext("2d");
  context.scale(window.devicePixelRatio, window.devicePixelRatio);
  context.fillStyle = "#f7fbff";
  context.fillRect(0, 0, boardRect.width, boardRect.height);

  context.strokeStyle = "rgba(37, 99, 235, 0.14)";
  context.lineWidth = 1;
  for (let x = 0; x < boardRect.width; x += 28) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, boardRect.height);
    context.stroke();
  }
  for (let y = 0; y < boardRect.height; y += 28) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(boardRect.width, y);
    context.stroke();
  }

  connections.forEach((connection) => {
    const from = getNode(connection.from);
    const to = getNode(connection.to);
    if (!from || !to) return;

    const start = getNodeCenter(from);
    const end = getNodeCenter(to);
    drawArrow(context, start.x, start.y, end.x, end.y);
  });

  nodes.forEach((node) => drawNode(context, node));

  const link = document.createElement("a");
  link.download = "flowchart-whiteboard.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawArrow(context, x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  context.strokeStyle = "#334155";
  context.fillStyle = "#334155";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.beginPath();
  context.moveTo(x2, y2);
  context.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
  context.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function drawNode(context, node) {
  const width = node.shape === "decision" ? 132 : 150;
  const height = node.shape === "decision" ? 132 : 76;
  context.save();
  context.translate(node.x, node.y);
  context.fillStyle = {
    start: "#e8fbf6",
    process: "#e8f0ff",
    decision: "#fff7dd",
    input: "#fff0f3",
    output: "#fff0f3"
  }[node.shape];
  context.strokeStyle = "rgba(23, 32, 51, 0.32)";
  context.lineWidth = 2;

  if (node.shape === "start") {
    roundRect(context, 0, 0, width, height, 38);
  } else if (node.shape === "decision") {
    context.translate(width / 2, 0);
    context.rotate(Math.PI / 4);
    context.fillRect(0, 0, 92, 92);
    context.strokeRect(0, 0, 92, 92);
    context.rotate(-Math.PI / 4);
    context.translate(-width / 2, 0);
  } else if (node.shape === "input" || node.shape === "output") {
    context.beginPath();
    context.moveTo(18, 0);
    context.lineTo(width, 0);
    context.lineTo(width - 18, height);
    context.lineTo(0, height);
    context.closePath();
    context.fill();
    context.stroke();
  } else {
    roundRect(context, 0, 0, width, height, 8);
  }

  context.fillStyle = "#172033";
  context.font = "700 16px Microsoft JhengHei, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  wrapText(context, node.text, width / 2, height / 2, width - 24, 22);
  context.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
  context.stroke();
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const chars = [...text];
  const lines = [];
  let line = "";

  chars.forEach((char) => {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  });
  lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) => {
    context.fillText(item, x, startY + index * lineHeight);
  });
}

document.querySelectorAll(".shape-button").forEach((button) => {
  button.addEventListener("click", () => addNode(button.dataset.shape));
});

connectButton.addEventListener("click", () => {
  connectMode = !connectMode;
  connectSourceId = null;
  connectButton.classList.toggle("active", connectMode);
  renderNodes();
});

deleteButton.addEventListener("click", deleteSelected);
clearButton.addEventListener("click", clearBoard);
exportButton.addEventListener("click", exportBoard);

board.addEventListener("pointerdown", (event) => {
  const nodeElement = event.target.closest(".node");
  if (!nodeElement) {
    selectedId = null;
    connectSourceId = null;
    renderNodes();
    return;
  }

  selectNode(nodeElement.dataset.id);
  if (!connectMode) {
    startDrag(event, nodeElement);
  }
});

board.addEventListener("pointermove", moveDrag);
board.addEventListener("pointerup", endDrag);
board.addEventListener("pointercancel", endDrag);
board.addEventListener("dblclick", (event) => {
  const nodeElement = event.target.closest(".node");
  if (nodeElement) {
    editNode(nodeElement.dataset.id);
  }
});

window.addEventListener("resize", renderConnections);

addNode("start");
addNode("process");
addNode("decision");
