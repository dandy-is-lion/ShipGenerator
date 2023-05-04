let lastResults;
let lastQuery;

async function querySubmit(e) {
	e.preventDefault();
	input.buttons.query.disabled = true;
	input.buttons.query.innerHTML = '<i class="fa-solid fa-cog fa-spin fa-fw"></i>';

	let query = {
		id: input.id.value.split("-"),
		scores: input.score.value.split("-"),
		gliders: redoutDB.gliders,
		parts: Array.from(input.parts, (part, partIndex) => redoutDB.parts[partIndex].details.slice(...part.value.split("-"))),
		stats: Array.from(input.targets, (target) => target.value),
	};

	query.id.forEach((id) => {
		if (id) {
			if (id.length === 6 && [...id].every((idChar) => partCode.includes(idChar.toUpperCase()) || idChar.toUpperCase() === "X")) {
				// Looks like an ID, set query parts accordingly and ignore score range
				query.scores = [0, 1200];
				[...id].forEach((idChar, idCharIndex) => {
					if (partCode.includes(idChar.toUpperCase())) {
						query.parts[idCharIndex] = redoutDB.parts[idCharIndex].details.slice(...[partCode.indexOf(idChar.toUpperCase()), partCode.indexOf(idChar.toUpperCase()) + 1]);
					}
				});
			} else if (query.gliders.length === redoutDB.gliders.length) {
				// Might be a ship name instead
				query.gliders = [].concat(
					...Array.from(id.split(","), (glider) =>
						redoutDB.gliders.filter((item) => glider.toUpperCase() === "ANY" || glider.toUpperCase() === item.code || glider.toUpperCase() === item.nick.toUpperCase() || glider.toUpperCase() === item.name.toUpperCase())
					)
				);
			}
		}
	});

	// If browser supports Web Workers, run threaded; but user can force single thread if Ctrl is held
	let results = window.Worker ? await runQueryThreaded(query) : await runQuery(query);
	input.table.innerHTML = parseResults(results, query);
	input.buttons.save.disabled = false;
	input.buttons.query.disabled = false;
	input.buttons.query.innerHTML = '<i class="fa-solid fa-magnifying-glass fa-fw"></i>';
	lastResults = results;
	lastQuery = query;
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

			let maxDelta = 9999;
			let maxDeltaIndex = 0;

			const candidateLimit = 100;
			const candidates = new Array(candidateLimit).fill({ id: "", glider: {}, rig: [], score: 0, stats: [], delta: maxDelta }, 0, candidateLimit);

			query.gliders.forEach((glider) => {
				query.parts[0].forEach((propulsor) => {
					query.parts[1].forEach((stabilizer) => {
						query.parts[2].forEach((rudder) => {
							query.parts[3].forEach((hull) => {
								query.parts[4].forEach((intercooler) => {
									query.parts[5].forEach((esc) => {
										const candidate = { id: "", glider: {}, rig: [], score: 0, stats: [], delta: maxDelta };
										candidate.score = glider.score + propulsor.score + stabilizer.score + rudder.score + hull.score + intercooler.score + esc.score;
										if (candidate.score >= query.scores[0] && candidate.score <= query.scores[1]) {
											candidate.stats = addArrays([glider.stats, propulsor.stats, stabilizer.stats, rudder.stats, hull.stats, intercooler.stats, esc.stats]);
											candidate.delta = calculateDelta([candidate.stats, query.stats]);
											if (candidate.delta <= maxDelta) {
												candidate.glider = glider;
												candidate.rig = [propulsor, stabilizer, rudder, hull, intercooler, esc];
												candidate.id = `${glider.code}-${propulsor.id}${stabilizer.id}${rudder.id}${hull.id}${intercooler.id}${esc.id}`;
												candidates[maxDeltaIndex] = candidate;
												maxDelta = 0;
												candidates.forEach((_candidate, _candidateIndex) => {
													if (_candidate.delta > maxDelta) {
														maxDelta = _candidate.delta;
														maxDeltaIndex = _candidateIndex;
													}
												});
											}
										}
									});
								});
							});
						});
					});
				});
			});

			let count = query.gliders.length;
			query.parts.forEach((part) => {
				count = count * part.length;
			});

			console.timeEnd("Query");
			console.warn(`Searched ${count.toLocaleString()} combinations on a single thread`);
			resolve(candidates.filter((_candidate) => _candidate.delta != 9999));
		}, 0);
	});
}

async function runQueryThreaded(query) {
	return new Promise((resolve) => {
		setTimeout(() => {
			console.time("Query");

			let workers = {
				count: query.gliders.length,
				results: [],
				done: 0,
			};

			query.gliders.forEach((glider) => {
				let arrayWorker = new Worker("./src/worker.js");
				arrayWorker.postMessage([query, glider, workers.count]);
				arrayWorker.onmessage = (e) => {
					workers.results.push(e.data);
					workers.done++;
					if (workers.done === workers.count) {
						const mergedResults = [].concat(...workers.results);
						let count = query.gliders.length;
						query.parts.forEach((part) => {
							count = count * part.length;
						});

						console.timeEnd("Query");
						console.info(`Searched ${count.toLocaleString()} combinations with ${workers.count} thread(s)`);
						console.info(`Showing top ${mergedResults.length} result(s)`);
						resolve(mergedResults);
					}
					arrayWorker.terminate();
				};
			});
		}, 0);
	});
}

// async function runQueryThreaded(query) {
// 	return new Promise((resolve) => {
// 		setTimeout(() => {
// 			console.time("Query");

// 			let count = query.gliders.length;
// 			query.parts.forEach((part) => {
// 				count = count * part.length;
// 			});

// 			let maxDelta = 9999;

// 			let workers = {
// 				count: window.navigator.hardwareConcurrency || 4,
// 				threads: [],
// 				results: [],
// 				done: [],
// 				totalDone: 0,
// 				maxDeltas: [],
// 				candidateLimit: Math.round(100 / workers.count),
// 			};

// 			for (let i = 0; i < workers.count; i++) {
// 				const worker = new Worker("./src/worker.js");
// 				worker.onmessage = (e) => {
// 					workers.results.push(e.data);
// 					workers.totalDone++;
// 					if (workers.totalDone === workers.count) {
// 						const mergedResults = [].concat(...workers.results);
// 						console.timeEnd("Query");
// 						console.info(`Searched ${count.toLocaleString()} combinations with ${workers.count} thread(s)`);
// 						resolve(mergedResults.filter((result) => result.delta != 9999));
// 					}
// 					worker.terminate();
// 				};
// 				workers.threads.push(worker);
// 				workers.results.push(null);
// 				workers.done.push(false);
// 				workers.maxDeltas.push(maxDelta);
// 			}

// 			console.log(workers);

// 			let index = 0;
// 			query.gliders.forEach((glider) => {
// 				query.parts[0].forEach((propulsor) => {
// 					query.parts[1].forEach((stabilizer) => {
// 						query.parts[2].forEach((rudder) => {
// 							query.parts[3].forEach((hull) => {
// 								query.parts[4].forEach((intercooler) => {
// 									query.parts[5].forEach((esc) => {
// 										if (!workers.done[index % workers.count]) {
// 											workers.threads[index % workers.count].postMessage([query, workers.count, glider, propulsor, stabilizer, rudder, hull, intercooler, esc]);
// 										}
// 										index++;
// 									});
// 								});
// 							});
// 						});
// 					});
// 				});
// 			});
// 		}, 0);
// 	});
// }

function calculatePartDelta(stat, target) {
	delta = stat - target;
	if (delta > 0) return `+${delta}`;
	return delta;
}

function parseResults(candidates, query) {
	if (candidates.length === 0) {
		alert("No results found!");
		return null;
	} else {
		// Sort by delta from least to greatest
		candidates.sort(function (a, b) {
			return a.delta - b.delta;
		});
		let html = "";
		candidates.forEach((candidate) => {
			html += `<tr ${candidate.id === selectedID ? "class=results-selected" : ""} onmouseover='rowHover(this)' onclick='rowClick(this, event)'>`;
			html += `<td class='results-cell-bottom results-cell-right cell-ship' title="${candidate.glider.name} (${candidate.glider.code}) {${candidate.glider.score}} [${candidate.glider.stats}]\n\n${candidate.glider.desc}"><img src='./img/${candidate.glider.code}.webp'></img><span>${candidate.id}</span></td>`;
			candidate.rig.forEach((part) => {
				html += `<td class='results-cell-bottom cell-class-${part.class}' title="${part.name} (${part.class}) {${part.score}} [${part.stats}]\n\n${part.desc}">${part.code}</td>`;
			});
			html += `<td class='results-cell-bottom results-cell-left results-cell-right cell-score' title='Stat delta: ${candidate.delta}'><span>${candidate.score}</span></td>`;
			candidate.stats.forEach((stat, statIndex) => {
				let statType = "";
				if (stat > query.stats[statIndex] * 1.1) {
					statType = "cell-good";
				} else if (stat < query.stats[statIndex] * 0.9) {
					statType = "cell-bad";
				}
				html += `<td class='results-cell-bottom ${statType}' title='${calculatePartDelta(stat, query.stats[statIndex])}'>${stat}</td>`;
			});
			html += "</tr>";
		});
		return html;
	}
}
