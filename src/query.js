const letterIndex = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];

// Read data.json and store it in redoutDB
let redoutDB;
fetch("./src/data.json")
	.then((response) => response.json())
	.then((json) => {
		redoutDB = json;
		let ships = "";
		redoutDB.gliders.forEach((glider) => {
			ships += `<option value='${glider.name}'><option value='${glider.short}'>`;
		});
		document.getElementById("ship").innerHTML += ships;
		redoutDB.parts.forEach((partType) => {
			partType.details.forEach((part, partIndex) => {
				Object.assign(part, { id: letterIndex[partIndex] });
			});
		});
	});

let results = [];
let query = [];
async function querySubmit(e) {
	e.preventDefault();
	buttonSave.disabled = true;
	buttonQuery.disabled = true;
	tableResults.disabled = true;
	buttonQuery.innerHTML = '<i class="fa-solid fa-cog fa-spin fa-fw"></i>';
	const queryID = document.getElementById("select-id").value.split("-");
	const queryGliders = queryID[0].toUpperCase();
	let queryScores = document.getElementById("select-score").value.split("-");
	let queryParts = [
		document.getElementById("select-propulsor").value.split("-"),
		document.getElementById("select-stabilizer").value.split("-"),
		document.getElementById("select-rudder").value.split("-"),
		document.getElementById("select-hull").value.split("-"),
		document.getElementById("select-intercooler").value.split("-"),
		document.getElementById("select-esc").value.split("-"),
	];
	if (queryID.length > 1 && queryID[queryID.length - 1].length === 6) {
		queryScores = [200, 1200];
		[...queryID[queryID.length - 1]].forEach((idChar, idCharIndex) => {
			queryParts[idCharIndex] = [letterIndex.indexOf(idChar.toUpperCase()), letterIndex.indexOf(idChar.toUpperCase()) + 1];
		});
	}

	query = [
		redoutDB.gliders.filter((item) => !queryGliders || queryGliders === "ANY" || item.short === queryGliders || item.name.toUpperCase() === queryGliders),
		redoutDB.parts[0].details.slice(...queryParts[0]),
		redoutDB.parts[1].details.slice(...queryParts[1]),
		redoutDB.parts[2].details.slice(...queryParts[2]),
		redoutDB.parts[3].details.slice(...queryParts[3]),
		redoutDB.parts[4].details.slice(...queryParts[4]),
		redoutDB.parts[5].details.slice(...queryParts[5]),
		{
			stats: dataTarget,
			scores: queryScores,
		},
	];
	results = await runQuery(query);
	let html = parseResults(results, query);
	tableResults.innerHTML = html;
	buttonSave.disabled = false;
	buttonQuery.disabled = false;
	buttonQuery.innerHTML = '<i class="fa-solid fa-magnifying-glass fa-fw"></i>';
}

function addArrays(arrays) {
	const numArrays = arrays.length;
	const arrayLength = arrays[0].length;
	const result = new Array(arrayLength).fill(0);

	for (let i = 0; i < numArrays; i++) {
		for (let j = 0; j < arrayLength; j++) {
			result[j] += arrays[i][j];
		}
	}

	return result;
}

function calculateDelta(arrays) {
	const [arrayA, arrayB] = arrays;
	let delta = 0;

	for (let i = 0; i < arrayA.length; i++) {
		delta += Math.abs(arrayA[i] - arrayB[i]);
	}

	return delta;
}

async function runQuery(query) {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.time("Query");
			const count = query[0].length * query[6].length * query[4].length * query[5].length * query[1].length * query[3].length * query[2].length;
			const candidateShipLimit = 100;
			let delta = 0;
			let maxDelta = 9999;
			let maxDeltaIndex = 0;
			let candidateStats = [0, 0, 0, 0, 0, 0];
			let candidates = new Array(candidateShipLimit);
			let candidateScore = 0;
			let candidateRig = [];
			let candidateID = "";
			candidates.fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, maxDelta], 0, candidateShipLimit);
			query[0].forEach((glider, gliderID) => {
				query[6].forEach((esc, escID) => {
					query[4].forEach((hull, hullID) => {
						query[5].forEach((intercooler, intercoolerID) => {
							query[1].forEach((propulsor, propulsorID) => {
								query[3].forEach((rudder, rudderID) => {
									query[2].forEach((stabilizer, stabilizerID) => {
										candidateStats = addArrays([glider.stats, propulsor.stats, stabilizer.stats, rudder.stats, hull.stats, intercooler.stats, esc.stats]);
										delta = calculateDelta([candidateStats, query[7].stats]);
										if (delta <= maxDelta) {
											candidateScore = glider.score + propulsor.score + stabilizer.score + rudder.score + hull.score + intercooler.score + esc.score;
											if (candidateScore >= query[7].scores[0] && candidateScore <= query[7].scores[1]) {
												candidateRig = [gliderID, propulsorID, stabilizerID, rudderID, hullID, intercoolerID, escID];
												candidateID = `${glider.short}-${propulsor.id}${stabilizer.id}${rudder.id}${hull.id}${intercooler.id}${esc.id}`;
												candidates[maxDeltaIndex] = [candidateID, ...candidateRig, candidateScore, ...candidateStats, delta];
												maxDelta = 0;
												for (i = 0; i < candidateShipLimit; i++) {
													if (candidates[i][15] > maxDelta) {
														maxDelta = candidates[i][15];
														maxDeltaIndex = i;
													}
												}
											}
										}
									});
								});
							});
						});
					});
				});
			});
			console.timeEnd("Query");
			console.info(`Searched ${count.toLocaleString()} combinations`);
			resolve(candidates.filter((item) => item[15] != 9999));
		}, 1);
	});
}

function parseResults(results, query) {
	if (results.length === 0) {
		alert("No results found!");
		return null;
	} else {
		// Sort by delta from least to greatest
		results.sort(function (a, b) {
			return a[15] - b[15];
		});
		let html = "";
		results.forEach((row, rowIndex) => {
			let ifSelectedID = selectedID === row[0] ? "class=results-selected" : "";
			html += `<tr ${ifSelectedID} onmouseover='rowHover(this)' onclick='rowClick(this, event)'>`;
			row.forEach((column, columnIndex) => {
				switch (columnIndex) {
					case 0: // Ship ID column
						let ship = query[0][row[1]];
						html += `<td class='results-cell-bottom results-cell-right cell-ship' title='${ship.name}\n${[...ship.stats]}'><img src='./img/${ship.short}.webp'></img><span>${column}</span></td>`;
						break;
					case 8: // Score column
						html += `<td class='results-cell-bottom results-cell-left results-cell-right cell-score'><span>${column}</span></td>`;
						break;
					default: // Parts and stats columns
						if (columnIndex > 1 && columnIndex < 8) {
							let part = query[columnIndex - 1][column];
							html += `<td class='results-cell-bottom cell-class-${part.class}' title='${part.name} (${part.class})\n${[...part.stats]}'>${part.name}</td>`;
						}
						if (columnIndex > 8 && columnIndex < 15) {
							if (column > dataTarget[columnIndex - 9] * 1.1) {
								html += `<td class='results-cell-bottom cell-good'>${column}</td>`;
							} else if (column < dataTarget[columnIndex - 9] * 0.9) {
								html += `<td class='results-cell-bottom cell-bad'>${column}</td>`;
							} else {
								html += `<td class='results-cell-bottom cell-close'>${column}</td>`;
							}
						}
				}
			});
			html += "</tr>";
		});
		return html;
	}
}

// Change the values of the Comparison data to whatever row's hovered
function rowHover(row) {
	let stats = getStats(row);
	updateStatCharts(chartRadar, 1, stats);
	updateStatCharts(chartBars, 1, stats);
}

let selectedID = "";

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
