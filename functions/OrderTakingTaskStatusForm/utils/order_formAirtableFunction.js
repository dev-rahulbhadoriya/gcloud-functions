const sleep = require("atomic-sleep");
const { orderTaskformBase } = require("./order_formAirtableBase");
const { getOrderFormTaskUpdate } = require("./order_formSQlFunctions");


function insertToOrderFormTaskAirtable(formId) {
    return new Promise((resp, rej) => {
      getOrderFormTaskUpdate(formId)
        .then((result) => {
          console.log(
            "INSERT",
            JSON.stringify([{ fields: JSON.parse(result[0].data) }])
          );
          sleep(1000);
          orderTaskformBase("New Order Taking Forms").create(
            [{ fields: JSON.parse(result[0].data) }],
            { typecast: true },
            function (err, records) {
              if (err) {
                console.error(new Error(err));
                rej(err);
              }
              records.forEach(function (record) {
                resp(record.getId());
              });
            }
          );
        })
        .catch((err) => {
          console.error(new Error(err));
          rej(err);
        });
    });
  }
  
  function updateDataOrderFormTaskAirtable(formId, recordId) {
    return new Promise((resp, rej) => {
      getOrderFormTaskUpdate(formId)
        .then((result) => {
          console.log(
            "UPDATE",
            JSON.stringify([{ fields: JSON.parse(result[0].data) }])
          );
          sleep(1000);
          orderTaskformBase("New Order Taking Forms").update(
            [
              {
                id: recordId,
                fields: JSON.parse(result[0].data),
              },
            ],
            { typecast: true },
            function (err, records) {
              if (err) {
                console.error(new Error(err));
                rej(err);
              }
              records.forEach(function (record) {
                resp(record.getId());
              });
            }
          );
        })
        .catch((err) => {
          console.error(new Error(err));
          rej(err);
        });
    });
  }
  
  function checkOrderFormTaskPreviousData(formId) {
    console.log("checkPhonePreviousData", formId);
    return new Promise((resp, rej) => {
      sleep(1000);
      orderTaskformBase("New Order Taking Forms")
        .select({
          fields: ["formId"],
          filterByFormula: `{formId}=${formId}`,
        })
        .eachPage(
          function page(records, fetchNextPage) {
            if (records.length) {
              resp(records[0].id);
            } else {
              resp();
            }
          },
          function done(err) {
            if (err) {
              console.error(err);
              return;
            }
          }
        );
    });
  }
  
  function checkOrderFormQaStatus(recId) {
    return new Promise((resp, rej) => {
      sleep(1000);
      orderTaskformBase("New Order Taking Forms").find(recId, function (err, record) {
        if (err) {
          console.error(err);
          return;
        }
        if (record.get("QA Status") !== "QA Approved") {
          resp();
        } else {
          rej();
        }
      });
    });
  }
  
  module.exports = {
  insertToOrderFormTaskAirtable,
  updateDataOrderFormTaskAirtable,
  checkOrderFormTaskPreviousData,
  checkOrderFormQaStatus
  
  };
  