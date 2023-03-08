// Quick and simple export target #tableID into a csv
function downloadTable(e, separator = ",") {
	e.preventDefault();
	tableID = "tbody-results";
	// Select rows from tableID
	var rows = document.querySelectorAll("tbody#" + tableID + " tr");
	// Construct csv
	var csv = ['"ID", "Ship", "Propulsor", "Stabilizer", "Rudder", "Hull", "Intercooler", "ESC", "Class", "Durability", "Thrust", "TopSpeed", "Stability", "Steer", "Strafe", "Deviation"'];
	for (var i = 0; i < rows.length; i++) {
		var row = [],
			cols = rows[i].querySelectorAll("td, th");
		for (var j = 0; j < cols.length; j++) {
			// Clean innertext to remove multiple spaces and jumpline (break csv)
			var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/(\s\s)/gm, " ");
			// Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
			data = data.replace(/"/g, '""');
			// Push escaped string
			row.push('"' + data + '"');
		}
		csv.push(row.join(separator));
	}
	var csv_string = csv.join("\n");
	// Download it
	var filename = "export_" + tableID + "_" + new Date().toLocaleDateString() + ".csv";
	var link = document.createElement("a");
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
		e.target.value = "";
		return;
	}
	dataTarget[i] = e.target.value;
	updateStatCharts(chartRadar, 0, dataTarget);
	updateStatCharts(chartBars, 0, dataTarget);
}

function updateQueryTargets(stats) {
	for (i = 9; i < 15; i++) {
		document.getElementById("row-query").getElementsByTagName("th")[i].getElementsByTagName("input")[0].value = stats[i - 9];
	}
}

function getQueryStats() {
	let stats = [];
	for (i = 9; i < 15; i++) {
		stats.push(document.getElementById("row-query").getElementsByTagName("th")[i].getElementsByTagName("input")[0].value);
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
