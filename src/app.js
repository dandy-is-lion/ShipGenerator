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
