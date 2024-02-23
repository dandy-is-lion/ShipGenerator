const input = {
  table: document.getElementById("tbody-results"),
  buttons: {
    query: document.getElementById("button-query"),
    save: document.getElementById("button-save"),
  },
  id: document.getElementById("select-id"),
  score: document.getElementById("select-score"),
  targets: [
    document.getElementById("durability-input"),
    document.getElementById("thrust-input"),
    document.getElementById("speed-input"),
    document.getElementById("stability-input"),
    document.getElementById("steer-input"),
    document.getElementById("strafe-input"),
  ],
  parts: [
    document.getElementById("select-propulsor"),
    document.getElementById("select-stabilizer"),
    document.getElementById("select-rudder"),
    document.getElementById("select-hull"),
    document.getElementById("select-intercooler"),
    document.getElementById("select-esc"),
  ],
  shipdatalist: document.getElementById("ship-datalist"),
  checkbox: {
    greaterOnly: document.getElementById("check-greaterOnly"),
  },
  span: {
    comparison: document.getElementById("span-comparison"),
    target: document.getElementById("span-target"),
  },
};

// Read data.json and store it in redoutDB
const partCode = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
let redoutDB;
fetch("./src/data.json")
  .then((response) => response.json())
  .then((json) => {
    redoutDB = json;
    redoutDB.gliders.forEach((glider) => {
      input.shipdatalist.innerHTML += `<option value='${glider.nick}'>`;
    });
    redoutDB.parts.forEach((partType, partTypeIndex) => {
      partType.details.forEach((part, partIndex) => {
        Object.assign(part, { id: partCode[partIndex] });
        input.parts[partTypeIndex].innerHTML += `<option value='${partIndex}-${partIndex + 1}' title="${part.name} (${part.class}) {${part.score}} [${part.stats}]\n\n${part.desc}">${part.code}</option>`;
      });
    });
  });

function downloadTable(e) {
  e.preventDefault();
  if (lastResults) {
    const separator = ",";
    let csv = ["ID, Ship, Propulsor, Stabilizer, Rudder, Hull, Intercooler, ESC, Score, Durability, Thrust, Top_Speed, Stability, Steer, Strafe, Delta"];
    lastResults.forEach((result) => {
      let _row = [];
      _row.push(`${result.glider.code}-${result.id}`);
      _row.push(result.glider.name);
      result.rig.forEach((part) => {
        _row.push(part.code);
      });
      _row.push(result.score);
      _row.push(...result.stats);
      _row.push(result.delta);
      csv.push(_row.join(separator));
    });
    const file = `shipgen_${new Date().toLocaleDateString()}.csv`;
    let a = document.createElement("a");
    a.style.display = "none";
    a.setAttribute("target", "_blank");
    a.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv.join("\n"))}`);
    a.setAttribute("download", file);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function targetInputChange(e, i) {
  if (!e.target.checkValidity()) e.target.value = e.target.defaultValue;
  dataTarget[i] = e.target.value;
  input.span.target.innerHTML = "";
  updateStatCharts(0, dataTarget);
}

function selectIDChange(e) {
  if (!e.target.checkValidity()) e.target.value = "";
}

function resetClick(e) {
  e.preventDefault();
  document.getElementById("form-query").reset();
  dataTarget = Array.from(input.targets, (target) => target.value);
  input.span.target.innerHTML = "";
  updateStatCharts(0, dataTarget);
}

function randomTargets(e) {
  e.preventDefault();
  input.targets.forEach((_input, _inputIndex) => {
    let target = Number(dataTarget[_inputIndex]);
    dataTarget[_inputIndex] = clamp(Math.round(target + getRandomInt(-1, 2) * target * 0.1), 0, 40);
    _input.value = dataTarget[_inputIndex];
  });
  input.span.target.innerHTML = "";
  updateStatCharts(0, dataTarget);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function decreaseTargets(e) {
  e.preventDefault();
  input.targets.forEach((_input, _inputIndex) => {
    dataTarget[_inputIndex] = Math.round(Math.max(1, dataTarget[_inputIndex] * 0.9));
    _input.value = dataTarget[_inputIndex];
  });
  input.span.target.innerHTML = "";
  updateStatCharts(0, dataTarget);
}

function increaseTargets(e) {
  e.preventDefault();
  input.targets.forEach((_input, _inputIndex) => {
    dataTarget[_inputIndex] = Math.round(Math.min(40, dataTarget[_inputIndex] * 1.1));
    _input.value = dataTarget[_inputIndex];
  });
  input.span.target.innerHTML = "";
  updateStatCharts(0, dataTarget);
}

function rotateTargetsRight(e) {
  e.preventDefault();
  let newTargets = new Array(6);
  input.targets.forEach((_input, _inputIndex) => {
    if (_inputIndex === 0) {
      newTargets[_inputIndex] = dataTarget[input.targets.length - 1];
    } else {
      newTargets[_inputIndex] = dataTarget[_inputIndex - 1];
    }
    _input.value = newTargets[_inputIndex];
  });
  input.span.target.innerHTML = "";
  dataTarget = newTargets;
  updateStatCharts(0, dataTarget);
}

function rotateTargetsLeft(e) {
  e.preventDefault();
  let newTargets = new Array(6);
  input.targets.forEach((_input, _inputIndex) => {
    if (_inputIndex === input.targets.length - 1) {
      newTargets[_inputIndex] = dataTarget[0];
    } else {
      newTargets[_inputIndex] = dataTarget[_inputIndex + 1];
    }
    _input.value = newTargets[_inputIndex];
  });
  input.span.target.innerHTML = "";
  dataTarget = newTargets;
  updateStatCharts(0, dataTarget);
}

// Set Comparison to row hovered
function rowHover(row) {
  let result = lastResults[row.rowIndex - 2];
  let stats = result.stats;
  let rowID = `${result.glider.code}-${result.id}`;
  let glider = `<span class="part comparison" title="${result.glider.name} (${result.glider.code}) {${result.glider.score}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
  let rig = Array.from(result.rig, (part) => `<span class='part cell-class-${part.class}' title="${part.name} (${part.class}) {${part.score}} [${part.stats}]\n\n${part.desc}">${part.code}</span>`);
  input.span.comparison.innerHTML = `${glider}: ${rig.join(" / ")}`;
  // console.log(chartRadar);
  // chartRadar.titleBlock.options.text = `${result.glider.nick}: ${result.rig[0].code}`;
  dataComparison = stats;
  updateStatCharts(1, stats, rowID);
}

// Set Comparison to row clicked, and Target if ID is already selected
let selectedRig = { glider: [{ code: "" }], id: "" };
function rowClick(row, e) {
  e.preventDefault();
  let result = lastResults[row.rowIndex - 2];
  let stats = result.stats;
  let rowID = `${result.glider.code}-${result.id}`;
  let glider = `<span class="part comparison" title="${result.glider.name} (${result.glider.code}) {${result.glider.score}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
  let rig = Array.from(result.rig, (part) => `<span class='part cell-class-${part.class}' title="${part.name} (${part.class}) {${part.score}} [${part.stats}]\n\n${part.desc}">${part.code}</span>`);
  input.span.comparison.innerHTML = `${glider}: ${rig.join(" / ")}`;
  dataComparison = stats;
  updateStatCharts(1, stats, rowID);
  if (rowID === `${selectedRig.glider.code}-${selectedRig.id}`) {
    let glider = `<span class="part target" title="${result.glider.name} (${result.glider.code}) {${result.glider.score}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
    dataTarget = stats;
    input.targets.forEach((input, id) => {
      input.value = stats[id];
    });
    updateStatCharts(0, stats, rowID);
    navigator.clipboard.writeText(rowID);
    input.span.target.innerHTML = `${glider}: ${rig.join(" / ")}`;

    querySubmit(null, true);
  }
  selectedRig = result;
  row.classList.add("results-selected");
  console.log(row);
  // row.innerHTML += `<span class="tooltiptext" id="myTooltip">Copy to clipboard</span>`;
  let siblings = getSiblings(row);
  for (i = 0; i < siblings.length; i++) {
    siblings[i].classList.remove("results-selected");
  }
}

function getSiblings(e) {
  // for collecting siblings
  let siblings = [];
  // if no parent, return no sibling
  if (!e.parentNode) {
    return siblings;
  }
  // first child of the parent node
  let sibling = e.parentNode.firstChild;

  // collecting siblings
  while (sibling) {
    if (sibling.nodeType === 1 && sibling !== e) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling;
  }
  return siblings;
}

// // Get stat values by reading columns 8 to 13 on the table and return it as an array
// function getStats(row) {
//   let stats = [];
//   for (i = 8; i < 14; i++) {
//     stats.push(getColumn(row, i));
//   }
//   return stats;
// }

// function getColumn(row, cell) {
//   return Math.max(0, row.getElementsByTagName("td")[cell].innerHTML);
// }

function statChange(comparison, target) {
  const change = new Array(6).fill("");
  const colors = new Array(6).fill(foregroundColor);

  for (let i = 0; i < change.length; i++) {
    if (comparison[i] == -1) break;
    let delta = comparison[i] - target[i];
    if (delta > 0) {
      change[i] = `+${delta}`;
      colors[i] = comparisonColor;
    } else if (delta < 0) {
      change[i] = delta.toString();
      colors[i] = targetColor;
    }
  }

  return [change, colors];
}

function updateStatCharts(dataset, data, dataLabel = "Target") {
  chartRadar.data.datasets[dataset].data = data;
  chartRadar.data.datasets[dataset].label = dataLabel;
  chartRadar.data.datasets[dataset].hidden = false;

  chartBars.data.datasets[dataset].data = data;
  chartBars.data.datasets[dataset].label = dataLabel;
  chartBars.data.datasets[dataset].hidden = false;

  let change = statChange(dataComparison, dataTarget);

  change[0].forEach((label, id) => {
    chartRadarLabels[id] = label;
    chartBarsLabels[id][1] = label;
    chartRadar.options.scales.r.pointLabels.color[id] = change[1][id];
    chartBars.options.scales.y.ticks.color[id] = change[1][id];
  });

  // console.log(chartRadar.options.scales.r.pointLabels);
  // console.log(change[1], chartLabelColors);

  // chartLabelColors.forEach((color, id) => (chartLabelColors[id] = change[1][id]));
  // chartLabelColors.forEach((color, id) => console.log(color, id));
  chartRadar.update();
  chartBars.update();
}
