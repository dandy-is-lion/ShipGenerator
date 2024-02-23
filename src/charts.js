const borderColor = getComputedStyle(document.documentElement).getPropertyValue("--border-color");
const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue("--foreground-color");
const targetColor = getComputedStyle(document.documentElement).getPropertyValue("--bad-color");
const comparisonColor = getComputedStyle(document.documentElement).getPropertyValue("--good-color");

const targetColorA = targetColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");
const comparisonColorA = comparisonColor.replace(/rgb/i, "rgba").replace(/\)/i, ",0.15)");

// Chart.defaults.animation = false;
Chart.defaults.borderColor = borderColor;
Chart.defaults.color = foregroundColor;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = true;
// Chart.defaults.aspectRatio = 1;
Chart.defaults.plugins.decimation = false;
Chart.defaults.plugins.legend.display = !window.mobileCheck();
Chart.defaults.plugins.tooltip.multiKeyBackground = "black";

// console.log(Chart.defaults.plugins.tooltip);

let dataComparison = new Array(6).fill(-1);
let dataTarget = Array.from(input.targets, (target) => target.value);
// let chartTitle = "XXXX";

const chartAspectRatio = 0.93;
const chartIcons = ["\u002b", "\uf5b0", "\uf625", "\uf076", "\uf021", "\uf337"];
const chartLabels = ["Durability", "Thrust", "Top Speed", "Stability", "Steer", "Strafe"];
const chartLabelColors = new Array(6).fill(foregroundColor);
const chartRadarLabels = new Array(6).fill("");
const chartBarsLabels = [
  ["DUR", ""],
  ["THR", ""],
  ["SPD", ""],
  ["STB", ""],
  ["STR", ""],
  ["STF", ""],
];

const chartData = [
  {
    label: "Target",
    data: dataTarget,
    fill: true,
    borderWidth: 2,
    backgroundColor: targetColorA,
    borderColor: targetColor,
    borderDash: [6, 6],
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
    borderColor: comparisonColor,
    backgroundColor: comparisonColorA,
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
    labels: chartRadarLabels,
    datasets: chartData,
  },
  options: {
    aspectRatio: chartAspectRatio,
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
      // title: {
      //   display: true,
      //   position: "bottom",
      //   text: chartTitle,
      // },
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
          title: function (tooltipItem) {
            return chartLabels[tooltipItem[0].dataIndex];
          },
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
          // console.log(element);
        },
        onDrag: function (e, datasetIndex, index, value) {
          if (!(datasetIndex === 0)) return false;
          if (value < 0 || value > 40) return false;
          e.target.style.cursor = "grabbing";
        },
        onDragEnd: function (e, datasetIndex, index, value) {
          dataTarget[index] = value;
          input.targets[index].value = value;
          input.span.target.innerHTML = "";

          updateStatCharts(0, chartData[0].data);
          // chartData[datasetIndex].label = "Target";
          // chartRadar.update();
          // chartBars.update();
        },
        magnet: {
          to: Math.round,
        },
      },
    },
    scales: {
      r: {
        // callbacks: {
        //   afterUpdate: function (axis) {
        //     console.log(axis);
        //   },
        // },
        min: 0,
        suggestedMax: 30,
        beginAtZero: true,
        ticks: {
          display: !window.mobileCheck(),
          showLabelBackdrop: false,
          textStrokeColor: "black",
          textStrokeWidth: 2,
          stepSize: 6,
          z: 0,
          // padding: -100,
          // padding: {
          //   top: 10,
          // },
          // major: {
          //   enabled: true,
          // },
        },
        pointLabels: {
          display: !window.mobileCheck(),
          centerPointLabels: false,
          padding: -3,
          backdropPadding: 0,
          // backdropColor: "black",
          // borderRadius: 5,
          color: chartLabelColors,
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
    labels: chartBarsLabels,
    datasets: chartData,
  },
  options: {
    aspectRatio: chartAspectRatio,
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
          color: chartLabelColors,
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
          dataTarget[index] = value;
          input.targets[index].value = value;
          input.span.target.innerHTML = "";

          updateStatCharts(0, chartData[0].data);
          // chartData[datasetIndex].label = "Target";
          // chartRadar.update();
          // chartBars.update();
        },
        magnet: {
          to: Math.round,
        },
      },
    },
  },
});
