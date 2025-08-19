import { openDB } from './db.js';

let chart;
let allData = [];

const summary = {
  total: document.getElementById("totalProduced"),
  avgWaste: document.getElementById("avgWastePercent"),
  top: document.getElementById("topOperator")
};

const monthFilter = document.getElementById("monthFilter");
const exportBtn = document.getElementById("exportBtn");

openDB(db => {
  const tx = db.transaction("entries", "readonly");
  tx.objectStore("entries").getAll().onsuccess = e => {
    allData = e.target.result;
    populateMonthFilter();
    renderChart();
  };
});

function populateMonthFilter() {
  const months = [...new Set(allData.map(e => e.date.slice(0, 7)))].sort();
  monthFilter.innerHTML = `<option value="">All Months</option>` +
    months.map(m => `<option value="${m}">${formatMonth(m)}</option>`).join("");
}

function formatMonth(ym) {
  const [y, m] = ym.split("-");
  return `${new Date(y, m - 1).toLocaleString('default', { month: 'short' })} ${y}`;
}

monthFilter.addEventListener("change", renderChart);
exportBtn.addEventListener("click", () => exportCSV(filteredData()));

function filteredData() {
  const m = monthFilter.value;
  return m ? allData.filter(e => e.date.startsWith(m)) : allData;
}

function renderChart() {
  const data = filteredData();
  if (!data.length) return;

  const operators = [...new Set(data.map(e => e.operator))];
  const produced = operators.map(op =>
    data.filter(e => e.operator === op).reduce((s, e) => s + e.producedQty, 0)
  );
  const waste = operators.map(op =>
    data.filter(e => e.operator === op).reduce((s, e) => s + e.wasteQty, 0)
  );
  const wastePercent = operators.map((_, i) =>
    produced[i] ? ((waste[i] / produced[i]) * 100).toFixed(2) : "0.00"
  );

  const total = produced.reduce((s, v) => s + v, 0);
  const avgWaste = wastePercent.reduce((s, v) => s + parseFloat(v), 0) / wastePercent.length;
  const top = operators[produced.indexOf(Math.max(...produced))];

  summary.total.textContent = total.toLocaleString();
  summary.avgWaste.textContent = avgWaste.toFixed(2) + "%";
  summary.top.textContent = `🏆 ${top}`;

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("performanceChart"), {
    type: "bar",
    data: {
      labels: operators,
      datasets: [{
        label: "Waste %",
        data: wastePercent,
        backgroundColor: "#007acc"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Waste %"
          }
        }
      }
    }
  });

}
document.getElementById("operatorName").textContent = operator;
