const sleep = require("atomic-sleep");
const { unacademyBases } = require("./airtbaleBases");
const { getDataFromDB } = require("./unacademySql");

function inserIntoUnacademyAirtable(formId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getDataFromDB(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = unacademyBases[airtableBaseNo];
        let table = base("Field Data");
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

function updateUnacademyAirtable(formId, recordId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getDataFromDB(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = unacademyBases[airtableBaseNo];
        let table = base("Field Data");
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

function checkUnacademyPreviousData(formId, airtableBaseNo) {
  console.log("checkPreviousData", formId);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = unacademyBases[airtableBaseNo];
    let table = base("Field Data");
    table
      .select({
        fields: ["FormId"],
        filterByFormula: `{FormId}=${formId}`,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          var id = 0;
          if (records.length) {
            resp(records[0].id);
          } else {
            resp(id);
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

function checkUnacademyDataQaStatus(recId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = unacademyBases[airtableBaseNo];
    let table = base("Field Data");

    table.find(recId, function (err, record) {
      if (err) {
        console.error(err);
        rej(recId);
        return;
      }
      if (record.get("Customer QA Status") !== "QA approved") {
        resp(recId);
      } else {
        rej();
      }
    });
  });
}

function sendAirtable(fields, is_duplicate, employees, airtableBaseNo) {
  return new Promise((resp, rej) => {
    try {
      let base = unacademyBases[airtableBaseNo];
      let table;
      if (is_duplicate) {
        table = base("Duplicate Famers Data");
      } else {
        table = base("Field Data");
      }
      table.create(
        [{ fields }],
        { typecast: true },
        function (err, records) {
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
}







module.exports = {
  inserIntoUnacademyAirtable,
  updateUnacademyAirtable,
  checkUnacademyPreviousData,
  checkUnacademyDataQaStatus,
  sendAirtable,
};
