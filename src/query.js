// const supabaseUrl = "http://localhost:54321";
// const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabaseUrl = "https://rijnlxwbcvnlmlwnagic.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpam5seHdiY3ZubG1sd25hZ2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc5MzgxNDcsImV4cCI6MTk5MzUxNDE0N30.kphwi9awGU4U5CZgrZNpULj6jYH60-f5sXxHznKOt-M";
const db = supabase.createClient(supabaseUrl, supabaseKey);

async function getData(e) {
	e.preventDefault();
	const start = Date.now();
	buttonSave.disabled = true;
	buttonQuery.disabled = true;
	tableResults.disabled = true;
	buttonQuery.innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i>';
	const dataID = document.getElementById("select-id").value;
	const dataRange = document.getElementById("select-class").value.split("-");
	const dataGlider = document.getElementById("select-ship").value;
	const dataPropulsor = document.getElementById("select-propulsor").value;
	const dataStabilizer = document.getElementById("select-stabilizer").value;
	const dataRudder = document.getElementById("select-rudder").value;
	const dataHull = document.getElementById("select-hull").value;
	const dataIntercooler = document.getElementById("select-intercooler").value;
	const dataESC = document.getElementById("select-esc").value;
	let { data, error } = await db.rpc("get_dev", {
		data_target: dataTarget,
		data_glider: dataGlider,
		data_range: dataRange,
		data_parts: [dataPropulsor, dataStabilizer, dataRudder, dataHull, dataIntercooler, dataESC],
		data_id: dataID,
	});
	runQuery(data, error, start);

	buttonQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
}

function runQuery(data, error, start) {
	if (data) {
		if (data.length === 0) {
			alert("No results found!");
			buttonSave.disabled = true;
			buttonQuery.disabled = false;
		} else {
			// console.log(combos_sx);
			let html = "";
			for (const obj of data) {
				html += "<tr onmouseover='rowHover(this)' onclick='rowClick(this, event)'>";
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
							cellValue = statsData["gliders"][cellValue - 1]["name"];
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
								htmlAppend = `'cell-class-${statsData.parts[i - 2].details[cellValue - 1].class}'>`;
								cellValue = statsData.parts[i - 2].details[cellValue - 1].name;
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
			tableResults.innerHTML = html;
			buttonSave.disabled = false;
			buttonQuery.disabled = false;
			tableResults.disabled = false;
			const end = Date.now();
			console.log(`Query time: ${end - start} ms`);
		}
	} else {
		const end = Date.now();
		console.error(`Query time: ${end - start} ms`);
		alert(error.message);
		buttonSave.disabled = true;
		buttonQuery.disabled = false;
		tableResults.disabled = false;
	}
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
