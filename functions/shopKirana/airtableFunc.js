const sleep = require("atomic-sleep");

const {
  shopKiranaInternalBase1,
  shopKiranaInternalBases,
  shopKiranaAllotmentBases,
  shopKiranaAllotmentBase1,
} = require("./airtableBases");

const { getShopKiranaDataSql } = require("./sqlFunc");

function insertToShopKiranaDataAirtable(formId, status) {
  return new Promise((resp, rej) => {
    getShopKiranaDataSql(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        // sleep(1000);
        let base = shopKiranaInternalBases[status];
        let table = base("Internal Field Data");
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
function updateShopKiranaDataAirtable(formId, recordId, status) {
  return new Promise((resp, rej) => {
    getShopKiranaDataSql(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = shopKiranaInternalBases[status];
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
}

// Updating CRM status to data to the allotment table of airtable
function updateCRMStatusInAirtable(bgvCheckId) {
  return new Promise((resp, rej) => {
    let count = 0;
    let base = shopKiranaAllotmentBases[1];
    let table = base("Case Assign Table");
    const message = "Report Received, QA Pending";
    // console.log("table.select.first page----", table.select());
    table
      .select({
        filterByFormula: `{BGV CheckID} = "${bgvCheckId}"`,
      })
      .all((err, record) => {
        console.log("count ==== ", ++count);
        if (err) {
          console.log("this", err);
          return;
        }
        if (record) {
          // console.log("record -----------", record);
          let record_id = record[0].id;
          console.log("record id =====", record_id);
          if (record[0].fields["BGV CheckID"] === bgvCheckId) {
            // console.log("record found in the table...");
            table.update(
              record_id,
              {
                "BGV Status": message,
              },
              (err, record) => {
                if (err) {
                  console.log("error in updation of allotment", err);
                  console.error(err);
                  return;
                } else {
                  console.log("Success");
                  resp();
                }
              }
            );
          }
        }
      });
  });
}

//checking previous base
function checkShopKiranaDataPreviousData(formId, status) {
  console.log("checkBlueStarDataPreviousData", formId);
  return new Promise((resp, rej) => {
    let base = shopKiranaInternalBases[status];
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
}

function checkShopKiranaDataQaStatus(recId, status) {
  //  console.log("base status", recId, status);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = shopKiranaInternalBases[status];
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
}

function getDataFromAllomentBase(selectBase) {
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Case Assign Table");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula: "NOT({Check Status})",
      })
      .eachPage(
        function page(records, fetchNextPage) {
          totalRecords = [...records];
          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error(err);
            rej();
          }
          resp(totalRecords);
        }
      );
  });
}

function updateCheckStatusAirtable(data, selectBase) {
  //console.log("@@@ array data", data)
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Case Assign Table");
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

module.exports = {
  insertToShopKiranaDataAirtable,
  updateShopKiranaDataAirtable,
  updateCRMStatusInAirtable,
  checkShopKiranaDataPreviousData,
  checkShopKiranaDataQaStatus,
  getDataFromAllomentBase,
  updateCheckStatusAirtable,
};
