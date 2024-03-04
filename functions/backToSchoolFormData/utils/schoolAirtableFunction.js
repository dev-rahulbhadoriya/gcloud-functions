const sleep = require("atomic-sleep");
const { getOrderRecord } = require("../../utils/commonFunctions");
const { backToSchoolBase1 } = require("./airtableBase");
const { getBackToSchoolData } = require("./schoolSqlFunction");

function insertToBackToSchoolAirtable(formId) {
  return new Promise((resp, rej) => {
    getBackToSchoolData(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        backToSchoolBase1("Back to School Field Data").create(
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

function updateDataBackToSchoolAirtable(formId, recordId) {
  return new Promise((resp, rej) => {
    getBackToSchoolData(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        backToSchoolBase1("Back to School Field Data").update(
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

function checkBackToSchoolPreviousData(formId) {
  console.log('checkBackToSchoolPreviousData', formId)
  return new Promise((resp, rej) => {
    sleep(1000);
    backToSchoolBase1("Back to School Field Data")
      .select({
        fields: ["Id"],
        filterByFormula: `{Id}=${formId}`,
      })
      .eachPage(function page(records, fetchNextPage) {
        if (records.length) {
          resp(records[0].id);
        } else {
          resp();
        }
      }, function done(err) {
        if (err) { console.error(err); return; }
      });
  });
}

function checkBackToSchoolQaStatus(recId) {
  return new Promise((resp, rej) => {
    sleep(1000);
    backToSchoolBase1('Back to School Field Data').find(recId, function (err, record) {
      if (err) { console.error(err); return; }
      if (record.get('QA Status') !== 'QA Approved') {
        resp()
      } else {
        rej()
      }
    });
  })
}
module.exports = {

};


function getDataFromAirtable(selectBase) {

  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Back to School Parents Data");
    let totalRecords = [];
    table.select({
      maxRecords: 10,
      filterByFormula: "NOT({Data Pushed QA})"
    }).eachPage(function page(records, fetchNextPage) {
      totalRecords = [...records];
      fetchNextPage();
    }, function done(err) {
      if (err) {
        console.error(err);
        rej();
      }
      resp(totalRecords);
    }
    );
  });
}


function updateRefenceIDInBackToSchool(data, selectBase) {
  //  console.log("@@@9999 array data", data)
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Back to School Parents Data");
    table.update([...data], { typecast: true }, function (err) {
      if (err) {
        console.log("recd nhi h", err);
        rej(err);
      } else {
        console.log("update in airtable");
        resp();
      }
    });
  });
}

function insertToBackToSchoolFieldAirtable(fields, orders) {
  let fieldsArr = getOrderRecord(fields, orders);
  return new Promise((resp, rej) => {
    try {
      console.log("TOTAL ORDER ITEMS", (orders.length === 0 || !orders) ? fieldsArr.length - 1 : fieldsArr.length);
      if (fieldsArr.length > 10) {
        let error = [];
        for (let i = 0; i <= Math.floor(fieldsArr.length / 10); i++) {
          let rows = fieldsArr.slice(
            i * 10,
            (i + 1) * 10 > fieldsArr.length ? fieldsArr.length : (i + 1) * 10
          );
          sleep(1000);
          backToSchoolBase1("Back to School Field Data").create(
            rows,
            { typecast: true },
            function (err, records) {
              if (err) {
                console.error(new Error(err));
                error.push(new Error(err));
              }
              console.log('ROW RECORDS', rows.length, JSON.stringify(records))
            }
          );
        }
        if (error.length) {
          rej(error);
        }
        resp(recordsArr);
      } else {
        sleep(1000);
        backToSchoolBase1("Back to School Field Data").create(
          fieldsArr,
          { typecast: true },
          function (err, records) {
            if (err) {
              console.error(new Error(err));
              rej(err);
            }
            resp(records);
          }
        );
      }
    } catch (err) {
      console.error("AIRTABLE INCERT ERROR", new Error(err));
    }
  });
}



module.exports = {
  getDataFromAirtable, updateRefenceIDInBackToSchool, insertToBackToSchoolAirtable,
  updateDataBackToSchoolAirtable,
  checkBackToSchoolPreviousData,
  checkBackToSchoolQaStatus,
  insertToBackToSchoolFieldAirtable
};
