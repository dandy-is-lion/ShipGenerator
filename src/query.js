const letterIndex = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "J", "K"];

const buttonQuery = document.getElementById("button-query");
const buttonSave = document.getElementById("button-save");
const rowQuery = document.getElementById("row-query").getElementsByTagName("th");
const tableResults = document.getElementById("tbody-results");

buttonSave.disabled = true;

let inputTargets = [
	document.getElementById("durability-input"),
	document.getElementById("thrust-input"),
	document.getElementById("speed-input"),
	document.getElementById("stability-input"),
	document.getElementById("steer-input"),
	document.getElementById("strafe-input"),
];

let inputParts = [
	document.getElementById("select-propulsor"),
	document.getElementById("select-stabilizer"),
	document.getElementById("select-rudder"),
	document.getElementById("select-hull"),
	document.getElementById("select-intercooler"),
	document.getElementById("select-esc"),
];

// Read data.json and store it in redoutDB
let redoutDB;
fetch("./src/data.json")
	.then((response) => response.json())
	.then((json) => {
		redoutDB = json;
		redoutDB.gliders.forEach((glider) => {
			document.getElementById("ship").innerHTML += `<option value='${glider.nick}'>`;
		});
		redoutDB.parts.forEach((partType, partTypeIndex) => {
			partType.details.forEach((part, partIndex) => {
				Object.assign(part, { id: letterIndex[partIndex] });
				inputParts[partTypeIndex].innerHTML += `<option value='${partIndex}-${partIndex + 1}' title="${part.name} (${part.class}) [${part.stats}]\n\n${part.desc}">${part.code}</option>`;
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
	let queryParts = [];
	inputParts.forEach((part) => {
		queryParts.push(part.value.split("-"));
	});
	if (queryID.length > 1 && queryID[queryID.length - 1].length === 6) {
		queryScores = [0, 1200];
		[...queryID[queryID.length - 1]].forEach((idChar, idCharIndex) => {
			if (letterIndex.includes(idChar.toUpperCase())) {
				queryParts[idCharIndex] = [letterIndex.indexOf(idChar.toUpperCase()), letterIndex.indexOf(idChar.toUpperCase()) + 1];
			}
		});
	}

	query = {
		gliders: redoutDB.gliders.filter((item) => !queryGliders || queryGliders === "ANY" || item.code === queryGliders || item.nick.toUpperCase() === queryGliders || item.name.toUpperCase() === queryGliders),
		parts: [
			redoutDB.parts[0].details.slice(...queryParts[0]),
			redoutDB.parts[1].details.slice(...queryParts[1]),
			redoutDB.parts[2].details.slice(...queryParts[2]),
			redoutDB.parts[3].details.slice(...queryParts[3]),
			redoutDB.parts[4].details.slice(...queryParts[4]),
			redoutDB.parts[5].details.slice(...queryParts[5]),
		],
		scores: queryScores,
		stats: dataTarget,
	};
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
			let count = query.gliders.length;
			query.parts.forEach((part) => {
				count = count * part.length;
			});
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
			query.gliders.forEach((glider, gliderID) => {
				query.parts[0].forEach((propulsor, propulsorID) => {
					query.parts[1].forEach((stabilizer, stabilizerID) => {
						query.parts[2].forEach((rudder, rudderID) => {
							query.parts[3].forEach((hull, hullID) => {
								query.parts[4].forEach((intercooler, intercoolerID) => {
									query.parts[5].forEach((esc, escID) => {
										candidateScore = glider.score + propulsor.score + stabilizer.score + rudder.score + hull.score + intercooler.score + esc.score;
										if (candidateScore >= query.scores[0] && candidateScore <= query.scores[1]) {
											candidateStats = addArrays([glider.stats, propulsor.stats, stabilizer.stats, rudder.stats, hull.stats, intercooler.stats, esc.stats]);
											delta = calculateDelta([candidateStats, query.stats]);
											if (delta <= maxDelta) {
												candidateRig = [gliderID, propulsorID, stabilizerID, rudderID, hullID, intercoolerID, escID];
												candidateID = `${glider.code}-${propulsor.id}${stabilizer.id}${rudder.id}${hull.id}${intercooler.id}${esc.id}`;
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

function calculatePartDelta(stat, target) {
	delta = stat - target;
	if (delta > 0) return `+${delta}`;
	return delta;
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
						let ship = query.gliders[row[1]];
						html += `<td class='results-cell-bottom results-cell-right cell-ship' title="${ship.name} (${ship.code}) [${ship.stats}]\n\n${ship.desc}"><img src='./img/${ship.code}.webp'></img><span>${column}</span></td>`;
						break;
					case 8: // Score column
						html += `<td class='results-cell-bottom results-cell-left results-cell-right cell-score'><span>${column}</span></td>`;
						break;
					default: // Parts and stats columns
						if (columnIndex > 1 && columnIndex < 8) {
							let part = query.parts[columnIndex - 2][column];
							html += `<td class='results-cell-bottom cell-class-${part.class}' title="${part.name} (${part.class}) [${part.stats}]\n\n${part.desc}">${part.code}</td>`;
						}
						if (columnIndex > 8 && columnIndex < 15) {
							html += "<td class='results-cell-bottom cell-";
							if (column > query.stats[columnIndex - 9] * 1.1) {
								html += "good";
							} else if (column < query.stats[columnIndex - 9] * 0.9) {
								html += "bad";
							} else {
								html += "close";
							}
							html += `'title='${calculatePartDelta(column, query.stats[columnIndex - 9])}'>${column}</td>`;
						}
				}
			});
			html += "</tr>";
		});
		return html;
	}
}
