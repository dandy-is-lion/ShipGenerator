const buttonQuery = document.getElementById("button-query");
const buttonSave = document.getElementById("button-save");
const rowQuery = document.getElementById("row-query").getElementsByTagName("th");
const tableResults = document.getElementById("tbody-results");

buttonSave.disabled = true;

// Read data.json and store it in statsData
let statsData;
let xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
	if (this.readyState == 4 && this.status == 200) {
		statsData = JSON.parse(this.responseText);
	}
};
xhttp.open("GET", "./data/data.json", true);
xhttp.send();

// Quick and simple export target #tableID into a csv
function downloadTable(e, separator = ",") {
	e.preventDefault();
	tableID = "tbody-results";
	// Select rows from tableID
	let rows = document.querySelectorAll("tbody#" + tableID + " tr");
	// Construct csv
	let csv = ['"ID", "Ship", "Propulsor", "Stabilizer", "Rudder", "Hull", "Intercooler", "ESC", "Class", "Durability", "Thrust", "TopSpeed", "Stability", "Steer", "Strafe", "Deviation"'];
	for (let i = 0; i < rows.length; i++) {
		let row = [],
			cols = rows[i].querySelectorAll("td, th");
		for (let j = 0; j < cols.length; j++) {
			// Clean innertext to remove multiple spaces and jumpline (break csv)
			let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/(\s\s)/gm, " ");
			// Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
			data = data.replace(/"/g, '""');
			// Push escaped string
			row.push('"' + data + '"');
		}
		csv.push(row.join(separator));
	}
	let csv_string = csv.join("\n");
	// Download it
	let filename = "ship_results_" + new Date().toLocaleDateString() + ".csv";
	let link = document.createElement("a");
	link.style.display = "none";
	link.setAttribute("target", "_blank");
	link.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv_string));
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function targetInputChange(e, i) {
	if (e.target.value < 0 || e.target.value > 100) {
		e.target.value = e.target.defaultValue;
	}
	dataTarget[i] = e.target.value;
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function updateQueryTargets(stats) {
	for (i = 9; i < 15; i++) {
		rowQuery[i].getElementsByTagName("input")[0].value = stats[i - 9];
	}
}

function getQueryStats() {
	let stats = [];
	for (i = 9; i < 15; i++) {
		stats.push(rowQuery[i].getElementsByTagName("input")[0].value);
	}
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
	for (i = 9; i < 15; i++) {
		rowQuery[i].getElementsByTagName("input")[0].value = dataTarget[i - 9];
	}
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
