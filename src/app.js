const input = {
    buttons: {
        query: document.getElementById("button-query"),
        save: document.getElementById("button-save"),
    },
    id: document.getElementById("select-id"),
    ships: document.getElementById("select-ship"),
    power: {
        min: document.getElementById("slider-power-min"),
        max: document.getElementById("slider-power-max")
    },
    targets: [
        document.getElementById("select-durability"),
        document.getElementById("select-thrust"),
        document.getElementById("select-speed"),
        document.getElementById("select-stability"),
        document.getElementById("select-steer"),
        document.getElementById("select-strafe"),
    ],
    types: [
        document.getElementById("select-propulsor"),
        document.getElementById("select-stabilizer"),
        document.getElementById("select-rudder"),
        document.getElementById("select-hull"),
        document.getElementById("select-intercooler"),
        document.getElementById("select-esc"),
    ],
    option: {
        greaterOnly: document.getElementById("check-greaterOnly"),
        percentageScale: document.getElementById("check-percentageScale"),
    },
};

const output = {
    headings: document.getElementById("row-headings").querySelectorAll("th"),
    table: document.getElementById("tbody-results"),
    power: document.getElementById("power-label"),
    ships: document.getElementById("ship-datalist"),
    chart: {
        target: {
            id: document.getElementById("header-target-id"),
            ship: document.getElementById("header-target-ship"),
            power: document.getElementById("header-target-power"),
            stats: [
                document.getElementById("cell-target-durability"),
                document.getElementById("cell-target-thrust"),
                document.getElementById("cell-target-speed"),
                document.getElementById("cell-target-stability"),
                document.getElementById("cell-target-steer"),
                document.getElementById("cell-target-strafe"),
            ],
            parts: [
                document.getElementById("cell-target-propulsor"),
                document.getElementById("cell-target-stabilizer"),
                document.getElementById("cell-target-rudder"),
                document.getElementById("cell-target-hull"),
                document.getElementById("cell-target-intercooler"),
                document.getElementById("cell-target-esc"),
            ],
        },
        comparison: {
            id: document.getElementById("header-comparison-id"),
            ship: document.getElementById("header-comparison-ship"),
            power: document.getElementById("header-comparison-power"),
            stats: [
                document.getElementById("cell-comparison-durability"),
                document.getElementById("cell-comparison-thrust"),
                document.getElementById("cell-comparison-speed"),
                document.getElementById("cell-comparison-stability"),
                document.getElementById("cell-comparison-steer"),
                document.getElementById("cell-comparison-strafe"),
            ],
            parts: [
                document.getElementById("cell-comparison-propulsor"),
                document.getElementById("cell-comparison-stabilizer"),
                document.getElementById("cell-comparison-rudder"),
                document.getElementById("cell-comparison-hull"),
                document.getElementById("cell-comparison-intercooler"),
                document.getElementById("cell-comparison-esc"),
            ],
        },
        delta: {
            power: document.getElementById("header-delta-power"),
            stats: [
                document.getElementById("cell-delta-durability"),
                document.getElementById("cell-delta-thrust"),
                document.getElementById("cell-delta-speed"),
                document.getElementById("cell-delta-stability"),
                document.getElementById("cell-delta-steer"),
                document.getElementById("cell-delta-strafe"),
            ],
        }
    },
    info: document.getElementById("info-banner"),
};


// If there are previous queries saved in local storage, use them
let lastQuery = JSON.parse(localStorage.getItem("lastQuery"));

// Read data.json to store it in redoutDB and populate some web elements
const partCode = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];
let redoutDB;
fetch("./src/data.json")
    .then((response) => response.json())
    .then((json) => {
        redoutDB = json;
        redoutDB.gliders.forEach((glider, i) => {
            input.ships.innerHTML += `<input class="checkbox-part" value="${i}" type="checkbox" id="checkbox-${glider.code}" ${lastQuery ? ((lastQuery.gliders.includes(i)) && "checked") : "checked"} hidden /><label for="checkbox-${glider.code}" class="label-checkbox" title="${glider.name} (${glider.code}) {${glider.power}} [${glider.stats}]\n\n${glider.desc}"><img src='./img/${glider.code}.webp'></label>`;
            output.ships.innerHTML += `<option value='${glider.code}'>`;
        });
        redoutDB.parts.forEach((part, i) => {
            part.details.forEach((detail, j) => {
                Object.assign(detail, { id: partCode[j] });
                input.types[i].innerHTML += `<input class="checkbox-part part-class-${detail.class}" value="${j}" type="checkbox" onchange="partsCheck(event,'${part.type}')" id="checkbox-${detail.code}" ${lastQuery ? ((lastQuery.parts[i].includes(j)) && "checked") : (detail.class == "S" || detail.class == "X") && "checked"} hidden /><label for="checkbox-${detail.code}" class="label-checkbox part-class-${detail.class}" title="${detail.name} (${detail.class}) {${detail.power}} [${detail.stats}]\n\n${detail.desc}">${detail.code}</label>`;
            });
            partsCheck(new Event("Initialize"), part.type);
        });
        if (lastQuery) {
            input.power.min.value = lastQuery.power[0];
            input.power.max.value = lastQuery.power[1];
            input.targets.forEach((target, i) => target.value = lastQuery.stats[i]);
        }
        powerChange(new Event("Initialize"));
    });


function scaleChange(e) {
    e.preventDefault();
    if (output.table.innerHTML != "") {
        output.table.innerHTML = parseResults(Array.from(queries.results.at(queries.current), (result) => parseResult(result.id, result.delta)), queries.inputs.at(queries.current));
    }
    updateStatCharts(0, searchData.target.stats, (selectedRig.id != "") ? parseResult(selectedRig.id) : null);
}

function quickSelect(e, parts) {
    e.preventDefault();
    let active = document.querySelector(`.part-selector:not(.hide)`);
    let checkboxes = document.querySelectorAll(`#${active.id} input[type = "checkbox"]`);
    switch (parts) {
        case "none":
            checkboxes.forEach((checkbox) => checkbox.checked = false);
            break;
        case "B":
            checkboxes.forEach((checkbox) => checkbox.checked = checkbox.classList.contains("part-class-C") | checkbox.classList.contains("part-class-B"));
            break;
        case "A":
            checkboxes.forEach((checkbox) => checkbox.checked = checkbox.classList.contains("part-class-B") | checkbox.classList.contains("part-class-A"));
            break;
        case "S":
            checkboxes.forEach((checkbox) => checkbox.checked = checkbox.classList.contains("part-class-A") | checkbox.classList.contains("part-class-S"));
            break;
        case "X":
            checkboxes.forEach((checkbox) => checkbox.checked = checkbox.classList.contains("part-class-S") | checkbox.classList.contains("part-class-X"));
            break;
        case "all":
            checkboxes.forEach((checkbox) => checkbox.checked = true);
            break;
        default:
            break;
    }
    partsCheck(e, active.id.split('-')[1]);
}

function powerChange(e, range) {
    e.preventDefault();
    // console.log(input.power.min.value, input.power.max.value);
    if (Number(input.power.min.value) > Number(input.power.max.value)) {
        switch (range) {
            case 'min':
                input.power.max.value = input.power.min.value;
                break;
            case 'max':
                input.power.min.value = input.power.max.value;
                break;
            default:
                break;
        }
    };
    document.documentElement.style.setProperty("--power-min-value", `${Math.round(100 * (input.power.min.value - input.power.min.min) / (input.power.min.max - input.power.min.min))}%`);
    document.documentElement.style.setProperty("--power-max-value", `${Math.round(100 * (input.power.max.value - input.power.max.min) / (input.power.max.max - input.power.max.min))}%`);
    output.power.innerHTML = `${input.power.min.value}-${input.power.max.value}`;
}

function partsCheck(e, type) {
    e.preventDefault();
    let checked = document.querySelectorAll(`#select-${type} input[type = "checkbox"]:checked`);
    document.querySelector(`#label-${type}`).innerHTML = `${checked.length}`;
}

function changeChart(e, chart) {
    e.preventDefault();
    Array.from(document.getElementsByClassName("chart-tab")).forEach((tabButton) => {
        tabButton.classList.remove("active");
    });
    Array.from(document.getElementsByClassName("charts")).forEach((chart) => {
        chart.style.display = "none";
    });
    e.currentTarget.classList.add("active");
    document.getElementById(`chart-${chart}`).style.display = "block";
}

function changeParts(e, part) {
    e.preventDefault();
    Array.from(document.getElementsByClassName("column-select")).forEach((column) => {
        column.classList.remove("active");
    });
    Array.from(document.getElementsByClassName("part-selector")).forEach((part) => {
        part.classList.add("hide");
    });
    e.currentTarget.classList.add("active");
    document.getElementById(`select-${part}`).classList.remove("hide");
}

function columnSort(e, isNumber = false) {
    e.preventDefault();
    if (output.table.innerHTML != "") {
        if (e.currentTarget.classList.contains("active")) {
            e.currentTarget.classList.toggle("asc");
            if (e.currentTarget.classList.contains("asc")) {
                // Reset order
                output.headings.forEach((head) => head.classList.remove("active"));
                let results = Array.from(queries.results.at(queries.current), (result) => parseResult(result.id, result.delta));
                results.sort(function (a, b) {
                    return a.delta - b.delta;
                });
                output.table.innerHTML = parseResults(results, queries.inputs.at(queries.current));
                return;
            }
        }
        output.headings.forEach((head) => head.classList.remove("active"));
        // console.log(output.headings);
        let column = e.currentTarget.cellIndex;
        let isAscending = e.currentTarget.classList.contains("asc") ? -1 : 1;
        let moveOperations = [];
        [...output.table.querySelectorAll("tr")]
            .sort((a, b) => {
                let firstRow = (isNumber) ? Number(a.querySelectorAll("td")[column].textContent.toLowerCase()) : a.querySelectorAll("td")[column].textContent.toLowerCase(),
                    secondRow = (isNumber) ? Number(b.querySelectorAll("td")[column].textContent.toLowerCase()) : b.querySelectorAll("td")[column].textContent.toLowerCase();
                let direction = isAscending * (firstRow < secondRow ? -1 : 1);
                moveOperations.push(direction);
                return direction;
            })
            .map((sorted_row, i) => {
                output.table.appendChild(sorted_row);
            });
        // console.log(moveOperations);
        let sortIteration = -1;
        queries.results.at(queries.current).sort((a, b) => {
            sortIteration++;
            return moveOperations[sortIteration];
        });
        e.currentTarget.classList.add("active");
    }
}

function downloadTable(e) {
    e.preventDefault();
    if (queries.results) {
        const separator = ",";
        let csv = [
            "ID, Ship, Propulsor, Stabilizer, Rudder, Hull, Intercooler, ESC, Power, Durability, Thrust, Top_Speed, Stability, Steer, Strafe, Delta",
        ];
        queries.results.at(queries.current).forEach((result) => {
            result = parseResult(result.id, result.delta);
            let row = [];
            row.push(`${result.glider.code}-${result.id}`);
            row.push(result.glider.name);
            result.rig.forEach((part) => {
                row.push(part.code);
            });
            row.push(result.power);
            row.push(...result.stats);
            row.push(result.delta);
            csv.push(row.join(separator));
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

function targetInputChange(e, targetInput, i) {
    if (!e.target.checkValidity()) e.target.value = e.target.defaultValue;
    // (e.target.value == 0) ? targetInput.classList.add("ignored") : targetInput.classList.remove("ignored");
    searchData.target.power = 0;
    searchData.target.stats[i] = e.target.value;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function selectIDChange(e) {
    if (!e.target.checkValidity()) e.target.value = "";
    e.target.value = e.target.value.toUpperCase();
}

function resetClick(e) {
    e.preventDefault();
    document.getElementById("form-query").reset();
    searchData.target.power = 0;
    searchData.target.stats = Array.from(input.targets, (target) => target.value);
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
    redoutDB.parts.forEach((part) => partsCheck(e, part.type));
    powerChange(e);
}


function balanceTargets(e) {
    e.preventDefault();
    let nonZero = input.targets.filter((target) => target.value != 0);
    if (nonZero.length == 0) return;
    let average = Math.round(Array.from(nonZero, (target) => Number(target.value)).reduce((x, y) => x + y) / nonZero.length);
    input.targets.forEach((target, i) => {
        if (target.value != 0) {
            searchData.target.stats[i] = average;
            target.value = searchData.target.stats[i];
        }
    })
    searchData.target.power = 0;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function randomTargets(e) {
    e.preventDefault();
    input.targets.forEach((target, i) => {
        if (target.value != 0) {
            searchData.target.stats[i] = clamp(Math.round(Number(target.value) + Number(target.value) * getRandomInt(-1, 2) * 0.1), 1, 40);
            target.value = searchData.target.stats[i];
        }
    });
    searchData.target.power = 0;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function decreaseTargets(e) {
    e.preventDefault();
    input.targets.forEach((target, i) => {
        if (target.value != 0) {
            searchData.target.stats[i] = Math.round(Math.max(1, searchData.target.stats[i] * 0.9));
            target.value = searchData.target.stats[i];
        }
    });
    searchData.target.power = 0;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function increaseTargets(e) {
    e.preventDefault();
    input.targets.forEach((target, i) => {
        if (target.value != 0) {
            searchData.target.stats[i] = Math.round(Math.min(40, searchData.target.stats[i] * 1.1));
            target.value = searchData.target.stats[i];
        }
    });
    searchData.target.power = 0;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function shiftTargetsRight(e) {
    e.preventDefault();
    let newTargets = new Array(6);
    input.targets.forEach((target, i) => {
        if (i === 0) {
            newTargets[i] = searchData.target.stats[input.targets.length - 1];
        } else {
            newTargets[i] = searchData.target.stats[i - 1];
        }
        target.value = newTargets[i];
    });
    searchData.target.power = 0;
    searchData.target.stats = newTargets;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

function shiftTargetsLeft(e) {
    e.preventDefault();
    let newTargets = new Array(6);
    input.targets.forEach((target, i) => {
        if (i === input.targets.length - 1) {
            newTargets[i] = searchData.target.stats[0];
        } else {
            newTargets[i] = searchData.target.stats[i + 1];
        }
        target.value = newTargets[i];
    });
    searchData.target.power = 0;
    searchData.target.stats = newTargets;
    selectedRig = { glider: [{ code: "" }], id: "" };
    updateStatCharts(0, searchData.target.stats);
}

// function shipClick(e, cell) {
//     e.preventDefault();
//     console.log(e, cell);
// }

let selectedRig = { glider: [{ code: "" }], id: "" };
// Set Comparison to row hovered
function rowHover(e, row) {
    e.preventDefault();
    let result = parseResult(queries.results.at(queries.current)[row.rowIndex - 3].id);
    // let result = queries.results.at(queries.current)[row.rowIndex - 3];
    searchData.comparison.power = result.power;
    searchData.comparison.stats = result.stats;
    updateStatCharts(1, result.stats, result);
    // let glider = `<span class="part comparison" title="${result.glider.name} (${result.glider.code}) {${result.glider.power}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
    // let rig = Array.from(result.rig, (part) => `<span class='part cell-class-${part.class}' title="${part.name} (${part.class}) {${part.power}} [${part.stats}]\n\n${part.desc}">${part.code}</span>`);
    // output.span.comparison.innerHTML = `${glider}: ${rig.join(" / ")}`;
    // console.log(chartRadar);
    // chartRadar.titleBlock.options.text = `${result.glider.nick}: ${result.rig[0].code}`;
}

// Set Comparison to row clicked
// If ID is already selected, set Target and do a quick search of related results
function rowClick(e, row) {
    e.preventDefault();
    let result = parseResult(queries.results.at(queries.current)[row.rowIndex - 3].id);
    // let result = queries.results.at(queries.current)[row.rowIndex - 3];
    // let glider = `<span class="part comparison" title="${result.glider.name} (${result.glider.code}) {${result.glider.power}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
    // let rig = Array.from(result.rig, (part) => `<span class='part cell-class-${part.class}' title="${part.name} (${part.class}) {${part.power}} [${part.stats}]\n\n${part.desc}">${part.code}</span>`);
    // output.span.comparison.innerHTML = `${glider}: ${rig.join(" / ")}`;
    searchData.comparison.power = result.power;
    searchData.comparison.stats = result.stats;
    updateStatCharts(1, result.stats, result);
    output.info.innerHTML = "Click Selected Result again to Quick Search";
    output.info.style.setProperty("filter", "invert(0%)");
    document.querySelectorAll(`#tbody-results tr`).forEach((row) => row.classList.remove("selected"));
    row.classList.add("selected");
    if (result.id === selectedRig.id) {
        // let glider = `<span class="part target" title="${result.glider.name} (${result.glider.code}) {${result.glider.power}} [${result.glider.stats}]\n\n${result.glider.desc}">${result.glider.nick}</span>`;
        searchData.target.power = result.power;
        searchData.target.stats = result.stats;
        input.targets.forEach((target, i) => {
            target.value = result.stats[i];
        });
        updateStatCharts(0, result.stats, result);
        // navigator.clipboard.writeText(rowID);
        // output.span.target.innerHTML = `${glider}: ${rig.join(" / ")}`;
        // output.chart.target.id.innerHTML = result.id;
        // output.chart.target.ship.innerHTML = result.glider.nick;
        // output.chart.target.power.innerHTML = result.power;
        // output.chart.target.parts.forEach((part, i) => part.innerHTML = result.rig[i].code);
        // output.chart.target.stats.forEach((stat, i) => stat.innerHTML = (input.option.percentageScale.checked) ? Math.round((result.stats[i]) * 100 / 40) : result.stats[i]);
        // output.chart.delta.power.innerHTML = `${searchData.comparison.power - searchData.target.power}`;
        querySubmit(e, true);
    }
    selectedRig = result;
    // console.log(row);
    // row.innerHTML += `<span class="tooltiptext" id="myTooltip">Copy to clipboard</span>`;
    // console.log(row);
    // let siblings = getSiblings(row);
    // for (i = 0; i < siblings.length; i++) {
    //     siblings[i].classList.remove("selected");
    // }
}

// function getSiblings(e) {
//     // for collecting siblings
//     let siblings = [];
//     // if no parent, return no sibling
//     if (!e.parentNode) {
//         return siblings;
//     }
//     // first child of the parent node
//     let sibling = e.parentNode.firstChild;

//     // collecting siblings
//     while (sibling) {
//         if (sibling.nodeType === 1 && sibling !== e) {
//             siblings.push(sibling);
//         }
//         sibling = sibling.nextSibling;
//     }
//     return siblings;
// }

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
        let delta = (input.option.percentageScale.checked) ? Math.round((comparison[i] - target[i]) * 100 / 40) : comparison[i] - target[i];
        if (delta > 0) {
            change[i] = `+${delta}`;
            colors[i] = comparisonColor;
        } else if (delta < 0) {
            change[i] = `${delta}`;
            colors[i] = targetColor;
        }
    }

    return { delta: change, color: colors };
}

function powerDelta(comparison, target) {
    let delta = comparison - target;
    if (delta == 0) { return ""; }
    if (delta > 0) { return `+${delta}`; }
    return `${delta}`;
}

function updateStatCharts(dataset, data, result = null) {
    chartRadar, chartBars.data.datasets[dataset].data = data;
    chartRadar, chartBars.data.datasets[dataset].label = result ? result.id : "Target";
    chartRadar, chartBars.data.datasets[dataset].hidden = false;

    let changes = statChange(searchData.comparison.stats, searchData.target.stats);
    let chartTable = dataset ? output.chart.comparison : output.chart.target;

    chartTable.id.innerHTML = result ? result.id : "Target";
    chartTable.ship.innerHTML = result && result.glider.nick;
    chartTable.ship.title = result ? `${result.glider.name} (${result.glider.code}) {${result.glider.power}} [${result.glider.stats}]\n\n${result.glider.desc}` : "N/A";
    chartTable.power.innerHTML = result ? result.power : "N/A";
    output.chart.delta.power.innerHTML = powerDelta(searchData.comparison.power, searchData.target.power);

    data.forEach((data, i) => {
        chartRadarLabels[i] = changes.delta[i];
        chartBarsLabels[i][1] = changes.delta[i];
        chartRadar.options.scales.r.pointLabels.color[i] = changes.color[i];
        chartBars.options.scales.y.ticks.color[i] = changes.color[i];
        chartTable.parts[i].innerHTML = result && result.rig[i].code;
        chartTable.parts[i].title = result ? `${result.rig[i].name} (${result.rig[i].class}) {${result.rig[i].power}} [${result.rig[i].stats}]\n\n${result.rig[i].desc}` : "N/A";
        chartTable.stats[i].innerHTML = input.option.percentageScale.checked ? Math.round(100 * data / 40) : data;
        output.chart.delta.stats[i].innerHTML = changes.delta[i];
        // output.chart.target.stats[i].innerHTML = searchData.target.stats[i];
        // output.chart.delta.stats[i].innerHTML = change[0][i];
    });

    // console.log(chartRadar.options.scales.r.pointLabels);
    // console.log(change[1], chartLabelColors);

    // chartLabelColors.forEach((color, id) => (chartLabelColors[id] = change[1][id]));
    // chartLabelColors.forEach((color, id) => console.log(color, id));
    chartRadar.update();
    chartBars.update();
}
