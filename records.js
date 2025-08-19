import { openDB } from './db.js';

const tableBody = document.querySelector("#recordsTable tbody");
const searchInput = document.getElementById("searchInput");
const headers = document.querySelectorAll("th[data-sort]");
const pageInfo = document.getElementById("pageInfo");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
const exportBtn = document.getElementById("exportCSV");

let dbRef;
let allEntries = [];
let filteredEntries = [];
let currentPage = 1;
const pageSize = 10;
let sortField = null;
let sortAsc = true;

openDB(db => {
  dbRef = db;
  const tx = db.transaction("entries", "readonly");
  tx.objectStore("entries").getAll().onsuccess = e => {
    allEntries = e.target.result;
    filteredEntries = [...allEntries];
    renderTable();
  };
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  filteredEntries = allEntries.filter(entry =>
    entry.orderNo.toLowerCase().includes(query) ||
    entry.operator.toLowerCase().includes(query)
  );
  currentPage = 1;
  renderTable();
});

headers.forEach(header => {
  header.addEventListener("click", () => {
    const field = header.dataset.sort;
    sortAsc = sortField === field ? !sortAsc : true;
    sortField = field;
    filteredEntries.sort((a, b) => {
      if (a[field] < b[field]) return sortAsc ? -1 : 1;
      if (a[field] > b[field]) return sortAsc ? 1 : -1;
      return 0;
    });
    renderTable();
  });
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < Math.ceil(filteredEntries.length / pageSize)) {
    currentPage++;
    renderTable();
  }
});

exportBtn.addEventListener("click", () => {
  const csv = filteredEntries.map(e =>
    `${e.date},${e.orderNo},${e.item},${e.orderQty},${e.producedQty},${e.wasteQty},${e.operator}`
  );
  csv.unshift("Date,Order No,Item,Order Qty,Produced Qty,Waste Qty,Operator");
  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "production_records.csv";
  a.click();
  URL.revokeObjectURL(url);
});

function renderTable() {
  const start = (currentPage - 1) * pageSize;
  const pageData = filteredEntries.slice(start, start + pageSize);
  tableBody.innerHTML = pageData.map(entry => `
    <tr>
      <td><input value="${entry.date}" data-field="date" data-id="${entry.orderNo}"></td>
      <td>${entry.orderNo}</td>
      <td><input value="${entry.item}" data-field="item" data-id="${entry.orderNo}"></td>
      <td><input type="number" value="${entry.orderQty}" data-field="orderQty" data-id="${entry.orderNo}"></td>
      <td><input type="number" value="${entry.producedQty}" data-field="producedQty" data-id="${entry.orderNo}"></td>
      <td><input type="number" value="${entry.wasteQty}" data-field="wasteQty" data-id="${entry.orderNo}"></td>
      <td><input value="${entry.operator}" data-field="operator" data-id="${entry.orderNo}"></td>
      <td>
       