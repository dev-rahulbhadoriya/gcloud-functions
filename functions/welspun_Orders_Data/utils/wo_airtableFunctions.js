const sleep = require("atomic-sleep");
const { welspunShopBase } = require("./wo_airtableBases");
const { getWOFormData } = require("./wo_SqlFunctions");

function insertToWelspunOrderAirtable(formId) {
  return new Promise((resp, rej) => {
    getWOFormData(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        welspunShopBase("Shops Data").create(
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

function updateDataWelspunOrderAirtable(formId, recordId) {
  return new Promise((resp, rej) => {
    getWOFormData(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        welspunShopBase("Shops Data").update(
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

function checkWelspunOrderPreviousData(formId) {
  console.log("checkPhonePreviousData", formId);
  return new Promise((resp, rej) => {
    sleep(1000);
    welspunShopBase("Shops Data")
      .select({
        fields: ["Id"],
        filterByFormula: `{Id}=${formId}`,
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

function checkWelspunOrderQaStatus(recId) {
  return new Promise((resp, rej) => {
    sleep(1000);
    welspunShopBase("Shops Data").find(recId, function (err, record) {
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
  checkWelspunOrderPreviousData,
  updateDataWelspunOrderAirtable,
  insertToWelspunOrderAirtable,
  checkWelspunOrderQaStatus
};
