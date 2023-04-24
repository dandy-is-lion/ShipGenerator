const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border-color");
const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue("--foreground-color");
const targetColor = getComputedStyle(document.documentElement).getPropertyValue("--good-color");
const comparisonColor = getComputedStyle(document.documentElement).getPropertyValue("--bad-color");

const targetColorA = targetColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");
const comparisonColorA = comparisonColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");

Chart.defaults.borderColor = borderColor;
Chart.defaults.color = foregroundColor;
Chart.defaults.responsive = false;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.decimation = false;
Chart.defaults.plugins.legend.display = true;

let dataComparison = [0, 0, 0, 0, 0, 0];
let dataTarget = getQueryStats();

const chartLabels = ["Durability", "Thrust", "Top Speed", "Stability", "Steer", "Strafe"];

const chartData = [
	{
		label: "Target",
		data: dataTarget,
		fill: true,
		borderWidth: 3,
		backgroundColor: targetColorA,
		borderColor: targetColor,
		pointHitRadius: 25,
		pointBorderWidth: 0,
		pointBackgroundColor: targetColorA,
		pointBorderColor: targetColor,
		pointHoverBackgroundColor: targetColor,
		pointHoverBorderColor: targetColor,
	},
	{
		label: "Comparison",
		data: dataComparison,
		fill: true,
		hidden: true,
		borderWidth: 3,
		backgroundColor: comparisonColorA,
		borderColor: comparisonColor,
		pointHitRadius: 25,
		pointBorderWidth: 0,
		pointBackgroundColor: comparisonColorA,
		pointBorderColor: comparisonColor,
		pointHoverBackgroundColor: comparisonColor,
		pointHoverBorderColor: comparisonColor,
	},
];

const ctxRadar = document.getElementById("chart-radar").getContext("2d");
const ctxBars = document.getElementById("chart-bars").getContext("2d");

let chartRadar = new Chart(ctxRadar, {
	type: "radar",
	data: {
		labels: chartLabels,
		datasets: chartData,
	},
	options: {
		onHover: function (e) {
			const point = e.chart.getElementsAtEventForMode(
				e,
				"nearest",
				{
					intersect: true,
				},
				false
			);
			if (point.length) e.native.target.style.cursor = "grab";
			else e.native.target.style.cursor = "default";
		},
		plugins: {
			dragData: {
				round: 1,
				showTooltip: true,
				onDragStart: function (e, element) {
					if (!(element === 0)) return false;
				},
				onDrag: function (e, datasetIndex, index, value) {
					if (!(datasetIndex === 0)) return false;
					if (value < 1 || value > 100) return false;
					e.target.style.cursor = "grabbing";
				},
				onDragEnd: function (e, datasetIndex, index, value) {
					inputTargets[index].value = value;
					dataTarget[index] = value;
					chartBars.update();
				},
				magnet: {
					to: Math.round,
				},
			},
		},
		scales: {
			r: {
				min: 0,
				// max: 100,
				suggestedMax: 75,
				beginAtZero: true,
				ticks: {
					showLabelBackdrop: true,
					backdropColor: "rgba(0,0,0,0.2)",
					z: 0,
					stepSize: 15,
				},
				pointLabels: {
					centerPointLabels: false,
					padding: 0,
					display: true,
					font: {
						weight: 600,
						size: 11,
					},
				},
			},
		},
	},
});

let chartBars = new Chart(ctxBars, {
	type: "bar",
	data: {
		labels: chartLabels,
		datasets: chartData,
	},
	options: {
		scales: {
			y: {
				min: 0,
				suggestedMax: 100,
				// max: 100,
				beginAtZero: true,
				ticks: {
					stepSize: 15,
				},
			},
		},
		onHover: function (e) {
			const point = e.chart.getElementsAtEventForMode(
				e,
				"nearest",
				{
					intersect: true,
				},
				false
			);
			if (point.length) e.native.target.style.cursor = "grab";
			else e.native.target.style.cursor = "default";
		},
		plugins: {
			dragData: {
				round: 1,
				showTooltip: true,
				onDragStart: function (e, element) {
					if (!(element === 0)) return false;
				},
				onDrag: function (e, datasetIndex, index, value) {
					if (value < 1 || value > 100) return false;
					if (!(datasetIndex === 0)) return false;
					e.target.style.cursor = "grabbing";
				},
				onDragEnd: function (e, datasetIndex, index, value) {
					inputTargets[index].value = value;
					dataTarget[index] = value;
					chartRadar.update();
				},
				magnet: {
					to: Math.round, // to: (value) => value + 5
				},
			},
		},
	},
});
