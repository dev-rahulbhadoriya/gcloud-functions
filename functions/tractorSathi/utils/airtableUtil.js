const {
  tractorSathiBase,
  mybase,
  runnerIssue,
  techBase,
  tractorSathiCustomerBase,
} = require("./airtableBases");
const { updateRecIdFE } = require("./sqlFunctions");

function sendToAirtable(fields, is_duplicate, state, employees) {
  return new Promise((resp, rej) => {
    try {
      let base = tractorSathiBase[state];
      let table;
      if (is_duplicate) {
        table = base("Report_duplicate");
      } else {
        table = base("Report_");
      }
      let phone_number =
        fields[
          "Met Person Mobile Number (जो व्यक्ति मिला उसका मोबाइल नंबर )"
        ] ||
        fields[
          "Met Person Whatsapp-Alternate No.|जो मिला उसका WhatsApp No.या घर पर जिसके पास smartphone हो उसका No."
        ];
      if (typeof employees != "undefined" && employees != null) {
        console.log(employees);
        let isManagerAdded = false;
        employees.forEach((item) => {
          if (!isManagerAdded && item.manager == true) {
            fields["Manager Contact No."] = item.empPhone;
            isManagerAdded = true;
          } else {
            fields["FE Contact Number"] = item.empPhone;
            fields["Runner Email id"] = item.empEmail;
          }
        });
      }
      checkMissedCallData(phone_number)
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
          table.create(
            [{ fields }],
            { typecast: true },
            function (err, records) {
              if (err) {
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
    } catch (error) {
      rej(error);
    }
  });
}
function checkMissedCallData(phonenumber) {
  return new Promise((resp, rej) => {
    mybase("Missed Call Data tollfree")
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
function getQAApprovedDataAirtable(state) {
  return new Promise((resp, rej) => {
    let base = tractorSathiBase[state];
    let table = base("Report_");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula:
          "AND(OR({Customer QA Status}='QA rejected', {Customer QA Status}='Lead QA Approved', {Customer QA Status}='Tractor Owner QA Approved', {Customer QA Status}='General Data QA Approved'), NOT({Data Pushed to QA Done Table}))",
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

function updateToAirtable(data, state) {
  return new Promise((resp, rej) => {
    let base = tractorSathiBase[state];
    let table = base("Report_");
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

function addToAirtableFE(data) {
  console.log(data.fields);
  return new Promise((resp, rej) => {
    runnerIssue("TS Follow Up Call").create(
      data.fields,
      { typecast: true },
      function (err, record) {
        if (err) {
          console.log(err);
          rej(err);
        }
        updateRecIdFE(data.fields.empPhone, record.getId())
          .then(() => {
            resp(record.getId());
          })
          .catch((err) => {
            rej(err);
          });
      }
    );
  });
}

function updateToAirtableFE(data) {
  console.log(data);
  return new Promise((resp, rej) => {
    runnerIssue("TS Follow Up Call").update(
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

function updateAllToAirtable(data, state) {
  console.log(data);
  return new Promise((resp, rej) => {
    let base = tractorSathiBase[state];
    let table = base("Report_");
    table.update([...data], { typecast: true }, function (err) {
      if (err) {
        console.log(err);
        rej(err);
      }
      resp();
    });
  });
}

function sendToAirtableNew(fields) {
  return new Promise((resp, rej) => {
    mybase("MyBaseTable").create(
      fields,
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
  });
}

function sendToAirtableDataTollFree(fields) {
  return new Promise((resp, rej) => {
    let table = "";
    switch (fields[0].fields.did_no) {
      case "18001237199":
        table = "Missed Call Data tollfree";
        break;
      case "07447178907":
        table = "Missed Call Data new";
        break;
      case "7412913555":
        table = "Welspun Call Data";
        break;
      default:
        table = "Missed Call Data fe";
        break;
    }
    mybase(table).create(fields, { typecast: true }, function (err, records) {
      if (err) {
        console.log(err);
        rej(err);
      }
      resp(records[0].getId());
    });
  });
}

function sendToAirtableDataVillage(fields) {
  return new Promise((resp, rej) => {
    techBase("Selected Village").create(
      fields,
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
  });
}

function manualPushedDataLog(fields) {
  return new Promise((resp, rej) => {
    techBase("Manual Pushed Data").create(
      fields,
      { typecast: true },
      function (err, record) {
        if (err) {
          console.error(new Error(err));
          rej(err);
        }
        if (record && record.length) {
          resp(record[0].getId());
        } else {
          resp();
        }
      }
    );
  });
}

function sendLeadToCustomer(state) {
  return new Promise((resp, rej) => {
    let base = tractorSathiCustomerBase[state];
    let table = base("CS RJ Sync View");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        //filterByFormula:
        //"(IS_BEFORE([1/2/2021],Today()){Data and Time of visit})",
        //"AND(NOT({Customer QA Status} ='Lead'),NOT({Customer QA Status} = 'Rejected'))",
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

module.exports = {
  sendToAirtable,
  updateToAirtable,
  sendToAirtableNew,
  sendToAirtableDataTollFree,
  getQAApprovedDataAirtable,
  updateAllToAirtable,
  updateToAirtableFE,
  addToAirtableFE,
  sendToAirtableDataVillage,
  manualPushedDataLog,
  sendLeadToCustomer,
};
