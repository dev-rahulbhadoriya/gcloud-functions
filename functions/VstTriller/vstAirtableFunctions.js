const sleep = require("atomic-sleep");
const { VSTInternalBases } = require("./airtableBases");
const { getVSTDataSql } = require("./vstSqlFunctions");

const insertVSTDataAirtable = (formId, airtableBaseNo) => {
  return new Promise((resp, rej) => {
    getVSTDataSql(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        // sleep(1000);
        let base = VSTInternalBases[airtableBaseNo];
        let table = base("Internal Field Data");
        table.create(
          [{ fields: JSON.parse(result[0].data) }],
          { typecast: true },
          function (err, records) {
            if (err) {
              console.log("errors and records", err, records);
              console.error(new Error(err));
              rej(err);
            }
            console.log("records------------->>>>", records);
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
};

//Updating data in airtable
const updateVSTDataAirtable = (formId, recordId, status) => {
  return new Promise((resp, rej) => {
    getVSTDataSql(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = VSTInternalBases[status];
        let table = base("Internal Field Data");
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
};

const checkVSTDataPreviousData = (formId, status) => {
  console.log("checkVSTDataPreviousData", formId, status);
  return new Promise((resp, rej) => {
    let base = VSTInternalBases[status];
    console.log("base", base);
    let table = base("Internal Field Data");
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
};

const checkVSTDataQaStatus = (recId, status) => {
  //  console.log("base status", recId, status);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = VSTInternalBases[status];
    let table = base("Internal Field Data");
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
};

const sendAirtable = (fields, is_duplicate, airtableBaseNo) => {
  return new Promise((resp, rej) => {
    try {
      let base = VSTInternalBases[airtableBaseNo];
      let table;
      if (is_duplicate) {
        table = base("Duplicate Data");
      } else {
        table = base("Internal Field Data");
      }
      table.create([{ fields }], { typecast: true }, function (err, records) {
        if (err) {
          //  console.log("@@", err);
          console.error(new Error(err));
          rej(err);
        }
        if (records && records.length) {
          resp(records[0].getId());
        } else {
          resp();
        }
      });
    } catch (err) {
      rej(err);
    }
  });
};

module.exports = {
  insertVSTDataAirtable,
  updateVSTDataAirtable,
  checkVSTDataPreviousData,
  checkVSTDataQaStatus,
  sendAirtable,
};
