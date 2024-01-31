const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border-color");
const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue("--foreground-color");
const targetColor = getComputedStyle(document.documentElement).getPropertyValue("--good-color");
const comparisonColor = getComputedStyle(document.documentElement).getPropertyValue("--bad-color");

const targetColorA = targetColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");
const comparisonColorA = comparisonColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");

Chart.defaults.borderColor = borderColor;
Chart.defaults.color = foregroundColor;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = true;
Chart.defaults.aspectRatio = 1;
Chart.defaults.plugins.decimation = false;
Chart.defaults.plugins.legend.display = !window.mobileCheck();
Chart.defaults.plugins.tooltip.multiKeyBackground = "#000";

// console.log(Chart.defaults.plugins.tooltip);

let dataComparison = [0, 0, 0, 0, 0, 0];
let dataTarget = Array.from(input.targets, (target) => target.value);

const chartIcons = ["\u002b", "\uf5b0", "\uf625", "\uf076", "\uf021", "\uf337"];
const chartLabels = ["Durability", "Thrust", "Top Speed", "Stability", "Steer", "Strafe"];
const chartShort = ["DUR", "THR", "SPD", "STB", "STR", "STF"];

const chartData = [
  {
    label: "Target",
    data: dataTarget,
    fill: true,
    borderWidth: 2,
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
    borderWidth: 2,
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
      tooltip: {
        callbacks: {
          // labelColor: function (context) {
          //   return {
          //     borderColor: "rgb(0, 0, 255)",
          //     backgroundColor: "rgb(255, 0, 0)",
          //     borderWidth: 2,
          //     borderDash: [2, 2],
          //     borderRadius: 2,
          //   };
          // },
          // labelTextColor: function (context) {
          //   return "#543453";
          // },
          label: function (context) {
            let label = context.dataset.label || "";

            if (label) {
              label += ": ";
            }
            if (context.parsed.r !== null) {
              label += `${Math.round(context.parsed.r)} (${new Intl.NumberFormat("en-US", {
                style: "percent",
                minimumFractionDigits: 0,
              }).format(context.parsed.r / 40)})`;
            }
            return label;
          },
        },
      },
      dragData: {
        round: 1,
        onDragStart: function (e, element) {
          if (!(element === 0)) return false;
        },
        onDrag: function (e, datasetIndex, index, value) {
          if (!(datasetIndex === 0)) return false;
          if (value < 0 || value > 40) return false;
          e.target.style.cursor = "grabbing";
        },
        onDragEnd: function (e, datasetIndex, index, value) {
          input.targets[index].value = value;
          dataTarget[index] = value;
          chartData[datasetIndex].label = "Target";
          chartRadar.update();
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
        suggestedMax: 30,
        beginAtZero: true,
        ticks: {
          display: !window.mobileCheck(),
          showLabelBackdrop: true,
          backdropColor: "rgba(0,0,0,0.5)",
          z: 0,
          stepSize: 6,
        },
        pointLabels: {
          // display: !window.mobileCheck(),
          display: false,
          centerPointLabels: false,
          font: {
            // family: '"Font Awesome 6 Free"',
            weight: "bold",
            size: 16,
          },
        },
      },
    },
  },
});

let chartBars = new Chart(ctxBars, {
  type: "bar",
  data: {
    labels: chartShort,
    datasets: chartData,
  },
  options: {
    indexAxis: "y",
    scales: {
      x: {
        min: 0,
        suggestedMax: 40,
        beginAtZero: true,
        ticks: {
          display: !window.mobileCheck(),
          stepSize: 6,
        },
      },
      y: {
        ticks: {
          display: !window.mobileCheck(),
          font: {
            // family: '"Font Awesome 6 Free"',
            weight: "bold",
            size: 16,
          },
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
      tooltip: {
        callbacks: {
          title: function (tooltipItem) {
            return chartLabels[tooltipItem[0].dataIndex];
          },
          label: function (context) {
            let label = context.dataset.label || "";

            if (label) {
              label += ": ";
            }
            if (context.parsed.x !== null) {
              label += `${Math.round(context.parsed.x)} (${new Intl.NumberFormat("en-US", {
                style: "percent",
                minimumFractionDigits: 0,
              }).format(context.parsed.x / 40)})`;
            }
            return label;
          },
        },
      },
      dragData: {
        round: 1,
        showTooltip: true,
        onDragStart: function (e, element) {
          if (!(element === 0)) return false;
        },
        onDrag: function (e, datasetIndex, index, value) {
          if (value < 0 || value > 40) return false;
          if (!(datasetIndex === 0)) return false;
          // value = clamp(value, 0, 40);
          e.target.style.cursor = "grabbing";
        },
        onDragEnd: function (e, datasetIndex, index, value) {
          input.targets[index].value = value;
          dataTarget[index] = value;
          chartData[datasetIndex].label = "Target";
          chartRadar.update();
          chartBars.update();
        },
        magnet: {
          to: Math.round,
        },
      },
    },
  },
});
