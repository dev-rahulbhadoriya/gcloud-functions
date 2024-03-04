const sleep = require("atomic-sleep");
const {misscallbase, vyparDataAirtableBases} = require("./airtbaleBases");
const { getDataFromDB } = require("./vyaparDataSql");

function inserIntoVyaparDataAirtable(formId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getDataFromDB(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = vyparDataAirtableBases[airtableBaseNo];
        let table = base("Vyapar Mapping Form");
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

function updateVyaparDataAirtable(formId, recordId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    getDataFromDB(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        let base = vyparDataAirtableBases[airtableBaseNo];
        let table = base("Vyapar Mapping Form");
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

function checkVyaparPreviousData(formId, airtableBaseNo) {
  console.log("checkPreviousData", formId);
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = vyparDataAirtableBases[airtableBaseNo];
    let table = base("Vyapar Mapping Form");
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

function checkVyaparDataQaStatus(recId, airtableBaseNo) {
  return new Promise((resp, rej) => {
    sleep(1000);
    let base = vyparDataAirtableBases[airtableBaseNo];
    let table = base("Vyapar Mapping Form");

    table.find(recId, function (err, record) {
      if (err) {
        console.log("RECORD_NOT_FOUND_BASE");
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

function sendAirtable(fields, is_duplicate,employees,airtableBaseNo) {
  return new Promise((resp, rej) => {
    try {
      let base = vyparDataAirtableBases[airtableBaseNo];
      let table;
      if (is_duplicate) {
        table = base("Duplicate Data");
        
      } else {
        table = base("Vyapar Mapping Form");
        
      }
      let phone_number = fields["7. Shopkeeper Number (दुकानदार का नंबर)"]; 
       
      // // if (typeof employees != "undefined" && employees != null) {
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

function getQAApproveVyaparDataAirtable(selectBase) {
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Vyapar Mapping Form");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula: "NOT({Data Pushed})",
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


function updateRefenceID(data, selectBase) {
  //console.log("@@@ array data", data)
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Vyapar Mapping Form");
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

function updateToAirtable(data) {
  return new Promise((resp, rej) => {
    let baseNumber = 1
    let base = vyparDataAirtableBases[baseNumber];;
    let table = base("Vyapar Mapping Form");
    table.update(
      data.id,
      data.fields,
      { typecast: true },
      function (err, record) {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(record.getId());
      }
    );
  });
}

function qaApproveVyaparData(selectBase){
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Vyapar Mapping Form");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula:"NOT({Data Pushed QA})",
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

function updateRefenceIDInVyaparDataBase(data, selectBase) {
 // console.log("@@@ array data", data)
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Vyapar Mapping Form");
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
  inserIntoVyaparDataAirtable,
  updateVyaparDataAirtable,
  getQAApproveVyaparDataAirtable,
  checkVyaparDataQaStatus,
  checkVyaparPreviousData,
  sendAirtable,
  checkMissedCallLeadData,
  updateRefenceID,
  updateToAirtable,
  qaApproveVyaparData,
  updateRefenceIDInVyaparDataBase
};
