const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
// create a new db request for a "budget" database.
const request = window.indexedDB.open("budget", 1);
request.onupgradeneeded = function(event) {
  // create object store called "pending" and set autoIncrement to true
  const db = event.target.result;
  const objectStore = db.createObjectStore("pending", { autoIncrement: true });
  objectStore.createIndex("nameIndex", "name");
  objectStore.createIndex("valueIndex", "value");
  objectStore.createIndex("dateIndex", "date");
};
request.onsuccess = function(event) {
  db = event.target.result;
  // const statusIndex = objectStore.index("statusIndex");
  // const statusIndex = objectStore.index("statusIndex");
  if (navigator.onLine) {
    // console.log("validated");
    checkDatabase();
  }
};
request.onerror = function(event) {
  // log error here
  console.error("Error Code : " + event.target.errorCode);
};
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const db = request.result;
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const objectStore = transaction.objectStore("pending");
  // add record to your store with add method.
  objectStore.add({
    name: record.name,
    value: record.value,
    date: record.date
  });
}
function checkDatabase() {
  // open a transaction on your pending db
  const db = request.result;
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const objectStore = transaction.objectStore("pending");
  const nameIndex = objectStore.index("nameIndex");
  // get all records from store and set to a variable
  const getAll = nameIndex.getAll();
  getAll.onsuccess = function() {
    // console.log("success");
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const db = request.result;
          const transaction = db.transaction(["pending"], "readwrite");
          // access your pending object store
          const objectStore = transaction.objectStore("pending");
          // clear all items in your store
          objectStore.clear();
        });
    }
    // console.log(getAll.result);
  };
}
window.addEventListener("online", checkDatabase);