import { openDB } from './db.js';

const operator = localStorage.getItem("operator");
if (!operator) window.location.href = "login.html";
document.getElementById("operatorName").textContent = operator;

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

document.getElementById("backupBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(allData)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("restoreBtn").addEventListener("click", () => {
  document.getElementById("restoreInput").click();
});

document.getElementById("restoreInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      openDB(db => {
        const tx = db.transaction("entries", "readwrite");
        const store = tx.objectStore("entries");
        data.forEach(entry => store.put(entry));
        tx.oncomplete = () => {
          alert("✅ Data restored!");
          location.reload();
        };
      });
    } catch {
      alert("❌ Invalid backup file.");
    }
  };
  reader.readAsText(file);
});
