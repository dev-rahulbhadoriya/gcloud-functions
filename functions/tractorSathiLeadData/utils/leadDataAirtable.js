const sleep = require("atomic-sleep");
const {
  TSLeadData,
  misscallbase,
  TsLeadData2,
  TSAirtableBases,
} = require("./airtbaleBases");
const { getTSLeadDataDB } = require("./leadQuerySql");

function insertToTSLeadDataAirtable(formId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getTSLeadDataDB(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = TSAirtableBases[airtableBaseNo];
        let table = base("TS Lead Data");
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

function updateTSLeadDataAirtable(formId, recordId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getTSLeadDataDB(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = TSAirtableBases[airtableBaseNo];
        let table = base("TS Lead Data");
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

function checkTSLeadDataPreviousData(formId,airtableBaseNo) {
  console.log("checkTSLeadDataPreviousData", formId);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = TSAirtableBases[airtableBaseNo];
    let table = base("TS Lead Data");
    table
      .select({
        fields: ["Id"],
        filterByFormula: `{Id}=${formId}`,
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

function checkTSLeadDataQaStatus(recId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = TSAirtableBases[airtableBaseNo];
    let table = base("TS Lead Data");

    table.find(recId, function (err, record) {
      if (err) {
        console.log("RECORD_NOT_FOUND_BASE");
        console.error(err);
        rej();
        return;
      }
      if (record.get("Data Update Status") !== "Updated") {
        resp();
      } else {
        rej();
      }
    });
  });
}

function sendAirtable(Id, fields, is_duplicate, state, employees,airtableBaseNo) {
  return new Promise((resp, rej) => {
    try {
      let base = TSAirtableBases[airtableBaseNo];
      let table;
      if (is_duplicate) {
        table = base("Duplicate Data");
      } else {
        table = base("TS Lead Data");
      }
      let phone_number =
        fields[
          "Met Person Mobile Number (जो व्यक्ति मिला उसका मोबाइल नंबर )"
        ] ||
        fields[
          "Met Person Whatsapp-Alternate No.|जो मिला उसका WhatsApp No.या घर पर जिसके पास smartphone हो उसका No."
        ];
      // if (typeof employees != "undefined" && employees != null) {
      //  // console.log(employees);
      //   let isManagerAdded = false;
      //   employees.forEach((item) => {
      //     if (!isManagerAdded && item.manager == true) {
      //       fields["Manager Mobile Number"] = item.empPhone;
      //       isManagerAdded = true;
      //     } else {
      //      // fields["FE Contact Number"] = item.empPhone;
      //       fields["Filled by Email Id"] = item.empEmail;
      //     }
      //   });
      // }
      checkMissedCallLeadData(phone_number)
        .then(() => {
          fields["Missed Call Received on Toll Free Number?"] = true;
          table.create(
            [{ fields }],
            { typecast: true },
            function (err, records) {
              if (err) {
                console.error(new Error(err));
                rej(err);
              }
              resp(records[0].getId());
            }
          );
        })
        .catch((err) => {
          // console.log("@@", err);
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
            }
          );
        });
    } catch (err) {
      rej(err);
    }
  });
}

function getQAApproveTsLeadAirtable(selectBase){
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("TS Lead Data");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula:"NOT({Data Pushed})",
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


function checkMissedCallLeadData(phonenumber) {
  return new Promise((resp, rej) => {
    misscallbase("Missed Call Data tollfree")
      .select({
        maxRecords: 1,
        view: "Grid view",
        filterByFormula: `{caller_number} = ' 91${phonenumber}'`,
      })
      .eachPage(
        function page(records, fetchNextPage) {
          if (records.length > 0) {
            resp();
          } else {
            rej();
          }
        },
        function done(err) {
          if (err) {
            console.error(err);
            return;
          }
          rej();
        }
      );
  });
}


function updateRefenceIDTS(data, selectBase) {
  //console.log("@@@ array data", data)
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("TS Lead Data");
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
  insertToTSLeadDataAirtable,
  updateTSLeadDataAirtable,
  checkTSLeadDataPreviousData,
  checkTSLeadDataQaStatus,
  sendAirtable,
  checkMissedCallLeadData,
  getQAApproveTsLeadAirtable,
  updateRefenceIDTS
};
