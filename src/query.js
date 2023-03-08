const supabaseUrl = "https://rijnlxwbcvnlmlwnagic.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpam5seHdiY3ZubG1sd25hZ2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc5MzgxNDcsImV4cCI6MTk5MzUxNDE0N30.kphwi9awGU4U5CZgrZNpULj6jYH60-f5sXxHznKOt-M";
const db = supabase.createClient(supabaseUrl, supabaseKey);
var buttonQuery = document.getElementById("button-query");

async function getData(e) {
	e.preventDefault();
	buttonQuery.disabled = true;
	buttonQuery.innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
	let selectedShip = document.getElementById("select-ship").value;
	if (selectedShip === "Any") {
		let { data: combosX, error } = await db.rpc("comboxcalcany", { data_target: dataTarget }).order("deviation").limit(100);
		runQuery(combosX, error);
	} else {
		let { data: combosX, error } = await db.rpc("comboxcalcship", { data_target: dataTarget, data_ship: selectedShip }).order("deviation").limit(100);
		runQuery(combosX, error);
	}
	buttonQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
	buttonQuery.disabled = false;
}

function runQuery(combosX, error) {
	if (combosX) {
		let html = "";
		for (const obj of combosX) {
			html += "<tr onmouseover='rowHover(this)' onclick='rowClick(this, event)' class='border-bottom'>";
			let i = 0;
			for (const key in obj) {
				let cellValue = obj[key];
				let htmlAppend = "''>";
				// Html to append to certain cells
				switch (i) {
					case 0: // ID column
						htmlAppend = "'cell-id'>";
						break;
					case 1: // Ship column
						htmlAppend = `'border-left border-right cell-ship'><img src='./img/${cellValue}.webp'></img>`;
						break;
					case 8: // Score column
						htmlAppend = "'border-left border-right cell-score'>";
						break;
					case 15: // Deviation column
						htmlAppend = "'border-left'>";
						break;
					default: // Parts and stats columns
						if (i > 1 && i < 8) {
							htmlAppend = getPartClass(cellValue, i - 1);
						}
						if (i > 8 && i < 15) {
							if (cellValue > dataTarget[i - 9] * 1.1) {
								htmlAppend = "'cell-good'>";
							} else if (cellValue < dataTarget[i - 9] * 0.9) {
								htmlAppend = "'cell-bad'>";
							}
						}
				}
				html += `<td class=${htmlAppend}${cellValue}</td>`;
				i++;
			}
			html += "</tr>";
		}
		document.getElementById("tbody-results").innerHTML = html;
	} else {
		alert(error.message);
	}
}

// See if cell value matches short name of component, if so add a CSS style to it
function getPartClass(cell, i) {
	const components = statsData["Parts"]["Components"][i]["Details"];
	for (const j in components) {
		if (cell === components[j]["Short"]) {
			return `'cell-class-${components[j]["Class"]}'>`;
		}
	}
	console.error(`Part ${cell} has no style for it!`);
	return "''>";
}

// Change the values of the Comparison data to whatever row's hovered
function rowHover(row) {
	let stats = getStats(row);
	updateStatCharts(chartRadar, 1, stats);
	updateStatCharts(chartBars, 1, stats);
}

// Change the values of the Selection data to whatever row's been clicked
function rowClick(row, e) {
	let stats = getStats(row);
	updateStatCharts(chartRadar, 0, stats);
	updateStatCharts(chartBars, 0, stats);
	dataTarget = stats;
	updateQueryTargets(stats);
	getData(e);
	// row.classList.add("results-selected");
	// var siblings = getSiblings(row);
	// for (i = 0; i < siblings.length; i++) {
	// 	siblings[i].classList.remove("results-selected");
	// }
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

// Get stat values by reading columns 9 - 14 on the table and return it as an array
function getStats(row) {
	let stats = [];
	for (i = 9; i < 15; i++) {
		stats.push(getCellValue(row, i));
	}
	return stats;
}

function getCellValue(row, cell) {
	return Math.max(0, row.getElementsByTagName("td")[cell].innerHTML);
}

function updateStatCharts(chart, dataset, data) {
	chart.data.datasets[dataset].data = data;
	chart.data.datasets[dataset].hidden = false;
	chart.update();
}

// function targetInputKeyDown(e) {
// 	console.log(e, isNaN(e.target.value));
// 	if (isNaN(e.target.value)) {
// 		e.target.value = "";
// 		return;
// 	}
// }
