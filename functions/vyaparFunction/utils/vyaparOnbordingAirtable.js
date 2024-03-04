const sleep = require("atomic-sleep");

const {vyparDataAirtableBases } = require("./airtbaleBases");

const { getVyaparOnbordingDataSql } = require("./vyaparOnbordingSql");

function insertToVyaparOnbordingAirtable(formId, status) {
  console.log("INSERTING VYAPAR ONBORDING", formId);
  return new Promise((resp, rej) => {
    getVyaparOnbordingDataSql(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
       // sleep(1000);
        let base = vyparDataAirtableBases[status];
        let table = base("Onboarding Data");
        table.create(
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

//Updating data in airtable
function updateDataVyaparOnbordingAirtable(formId, recordId, status) {
  return new Promise((resp, rej) => {
    getVyaparOnbordingDataSql(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = vyparDataAirtableBases[status];
        let table = base("Onboarding Data");
        table.update(
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

//checking previous base
function checkVyaparOnbordingPreviousData(formId, status) {
  console.log("checkVyaparOnbordingPreviousData", formId);
  return new Promise((resp, rej) => {
    let base = vyparDataAirtableBases[status];
    let table = base("Onboarding Data");
    table
      .select({
        fields: ["FormId"],
        filterByFormula: `{FormId}=${formId}`,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          var recid = 0;
          if (records.length) {
            resp(records[0].id);
          } else {
            resp(recid);
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

function checkVyaparOnbordingQaStatus(recId, status) {
//  console.log("base status", recId, status);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = vyparDataAirtableBases[status];
    let table = base("Onboarding Data");
    table.find(recId, function (err, record) {
      if (err) {
        console.error(err);
        return;
      }
      if (record.get("QA Status-2") !== "QA Approved") {
        resp();
      } else {
        rej();
      }
    });
  });
}




module.exports = {
  insertToVyaparOnbordingAirtable,
  updateDataVyaparOnbordingAirtable,
  checkVyaparOnbordingPreviousData,
  checkVyaparOnbordingQaStatus,

};
