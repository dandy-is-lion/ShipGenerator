onmessage = (e) => {
	self.postMessage(runQuery(...e.data));
};

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

function runQuery(query, glider, count) {
	let maxDelta = 9999;
	let maxDeltaIndex = 0;

	const candidateLimit = Math.round(100 / count);
	const candidates = new Array(candidateLimit).fill({ id: "", glider: {}, rig: [], score: 0, stats: [], delta: maxDelta }, 0, candidateLimit);

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

	return candidates.filter((_candidate) => _candidate.delta != 9999);
}
