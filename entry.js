// entry.js
import { openDB } from './db.js';

const form = document.getElementById("entryForm");

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const record = {
      date: document.getElementById("entryDate").value,
      orderNo: document.getElementById("orderNo").value.trim(),
      item: document.getElementById("item").value.trim(),
      orderQty: +document.getElementById("orderQty").value,
      producedQty: +document.getElementById("producedQty").value,
      wasteQty: +document.getElementById("wasteQty").value,
      operator: document.getElementById("operator").value.trim(),
      remark: document.getElementById("remark").value.trim()
    };

    openDB(db => {
      const tx = db.transaction("entries", "readwrite");
      tx.objectStore("entries").add(record);
      tx.oncomplete = () => {
        alert("✅ Entry saved!");
        window.location.href = "dashboard.html";
      };
    });
  });
}
