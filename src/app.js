let selectedID = "";

function downloadTable(e) {
	e.preventDefault();
	if (results) {
		const separator = ",";
		let csv = ["ID, Ship, Propulsor, Stabilizer, Rudder, Hull, Intercooler, ESC, Score, Durability, Thrust, Top_Speed, Stability, Steer, Strafe, Delta"];
		results.forEach((row, rowIndex) => {
			let _row = [];
			row.forEach((column, columnIndex) => {
				if (columnIndex === 1) {
					_row.push(query[0][column].name);
				} else if (columnIndex >= 2 && columnIndex <= 7) {
					_row.push(query[columnIndex - 1][column].name);
				} else {
					_row.push(column);
				}
			});
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
	if (e.target.value < 1 || e.target.value > 100) {
		e.target.value = e.target.defaultValue;
	}
	dataTarget[i] = e.target.value;
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function selectIDChange(e) {
	if (e.target.value.length > 10 && e.target.value.length <= 20) {
		e.target.size = e.target.value.length;
	} else if (e.target.value.length <= 10) {
		e.target.size = 10;
	} else if (e.target.value.length > 20) {
		e.target.size = 20;
	}
}

function getQueryStats() {
	let stats = [];
	inputTargets.forEach((input, inputIndex) => {
		stats.push(input.value);
	});
	return stats;
}

function resetClick(e) {
	e.preventDefault();
	document.getElementById("form-query").reset();
	dataTarget = getQueryStats();
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function randomTargets(e) {
	e.preventDefault();
	dataTarget = [getRandomInt(1, 100), getRandomInt(1, 100), getRandomInt(1, 100), getRandomInt(1, 100), getRandomInt(1, 100), getRandomInt(1, 100)];
	inputTargets.forEach((input, inputIndex) => {
		input.value = dataTarget[inputIndex];
	});
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

function decreaseTargets(e) {
	e.preventDefault();
	inputTargets.forEach((input, inputIndex) => {
		dataTarget[inputIndex] = Math.round(Math.max(1, dataTarget[inputIndex] * 0.9));
		input.value = dataTarget[inputIndex];
	});
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function increaseTargets(e) {
	e.preventDefault();
	inputTargets.forEach((input, inputIndex) => {
		dataTarget[inputIndex] = Math.round(Math.min(100, dataTarget[inputIndex] * 1.1));
		input.value = dataTarget[inputIndex];
	});
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function rotateTargetsRight(e) {
	let newTargets = new Array(6);
	inputTargets.forEach((input, inputIndex) => {
		if (inputIndex === 0) {
			newTargets[inputIndex] = dataTarget[inputTargets.length - 1];
		} else {
			newTargets[inputIndex] = dataTarget[inputIndex - 1];
		}
		input.value = newTargets[inputIndex];
	});
	dataTarget = newTargets;
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function rotateTargetsLeft(e) {
	let newTargets = new Array(6);
	inputTargets.forEach((input, inputIndex) => {
		if (inputIndex === inputTargets.length - 1) {
			newTargets[inputIndex] = dataTarget[0];
		} else {
			newTargets[inputIndex] = dataTarget[inputIndex + 1];
		}
		input.value = newTargets[inputIndex];
	});
	dataTarget = newTargets;
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

// Change the values of the Comparison data to whatever row's hovered
function rowHover(row) {
	let stats = getStats(row);
	updateStatCharts(chartRadar, 1, stats);
	updateStatCharts(chartBars, 1, stats);
}

// Change the values of the Target data to whatever row's been clicked
function rowClick(row, e) {
	selectedID = row.getElementsByTagName("td")[0].getElementsByTagName("span")[0].innerHTML;
	let stats = getStats(row);
	dataTarget = stats;
	inputTargets.forEach((input, inputIndex) => {
		input.value = stats[inputIndex];
	});
	updateStatCharts(chartRadar, 0, stats);
	updateStatCharts(chartBars, 0, stats);
	// getData(e);
	row.classList.add("results-selected");
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

// Get stat values by reading columns 8 to 13 on the table and return it as an array
function getStats(row) {
	let stats = [];
	for (i = 8; i < 14; i++) {
		stats.push(getColumn(row, i));
	}
	return stats;
}

function getColumn(row, cell) {
	return Math.max(0, row.getElementsByTagName("td")[cell].innerHTML);
}

function updateStatCharts(chart, dataset, data) {
	chart.data.datasets[dataset].data = data;
	chart.data.datasets[dataset].hidden = false;
	chart.update();
}
