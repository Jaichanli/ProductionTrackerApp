import { openDB } from './db.js';

document.getElementById("entryForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const record = {
    date: entryDate.value,
    orderNo: orderNo.value.trim(),
    item: item.value.trim(),
    orderQty: +orderQty.value,
    producedQty: +producedQty.value,
    wasteQty: +wasteQty.value,
    operator: operator.value.trim(),
    remark: remark.value.trim()
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
