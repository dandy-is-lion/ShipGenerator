onmessage = (e) => {
	self.postMessage(addArrays(e.data));
};

function addArrays(arrays) {
	// console.log(arrays);
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
