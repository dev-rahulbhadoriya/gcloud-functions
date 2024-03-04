const sleep = require("atomic-sleep");
const {psInternalBases} = require("./ps_airtableBase");
const { getPSFormData } = require("./ps_Sql");

const cloudsql = require("../../utils/cloudSql");

function insertToPSInternalFieldFormAirtable(formId,status) {
  return new Promise((resp, rej) => {
    getPSFormData(formId)
      .then((result) => {
        console.log(
          "INSERT",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        sleep(1000);
        //Status inserting data in base 8
        let base = psInternalBases[status];
        let table = base("Internal Field Form Data")
        table.create(
          [{ fields: JSON.parse(result[0].data) }],
          { typecast: true },
          function (err, records) {
            if (err) {
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

function updatePSInternalFieldFormAirtable(formId, recordId, status) {
  return new Promise((resp, rej) => {
    getPSFormData(formId)
      .then((result) => {
        console.log(
          "UPDATE",
          JSON.stringify([{ fields: JSON.parse(result[0].data) }])
        );
        
        let base = psInternalBases[status];
        let table = base("Internal Field Form Data")
        sleep(1000);
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

function checkPSInternalFieldFormPreviousData(formId, status) {
  console.log("checkPSInternalFieldFormPreviousData", formId, status);
  return new Promise((resp, rej) => {
    let base = psInternalBases[status];
    let table = base("Internal Field Form Data")    
    sleep(1000);
    ta.select({
        fields: ["Id"],
        filterByFormula: `{Id}=${formId}`,
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

// function checkPSInternalFieldFormQaStatus(recId) {
//   return new Promise((resp, rej) => {
//     sleep(1000);
//       PSInternalFieldForm("Internal Field Form Data").find(recId, function (err, record) {
//         if (err) {
//           console.error(err);
//           return;
//         }
//         if (record.get("id") == "") {
//           resp();
//         } else {
//           rej();
//         }
//       });
//   });

//}

function getpsInternalFieldDataAirtable(selectedBase) {
  return new Promise((resp, rej) => {
    let base = selectedBase;
    let table = base("Internal Field Form Data");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula: "AND(NOT({Data Pushed db}))",
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

function updatePSdata(FormId, Values, baseNo) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE psInternalFieldQA SET
        filledDate=?,
        metpersonName=?,
        metpersonNo=?,
        yearOfBirth=?,
        vaccineName=?,
        stateName=?,
        Data_Status=?,
        districtName=?,
        teshilName=?,
        villageName=?,
        pincode=?,
        gpsLocation=?,
        vaccinationStatus=?,
        Filled_By=?,
        internalTeamQA=?,
        BeneficiaryID=?,
        BeneficiaryReferenceID2nddose=?,
        BeneficiaryReferenceID1stDose=? WHERE formId="${FormId}" and BaseNo="${baseNo}";`,
        [
          Values[0].filledDate,
          Values[0].metpersonName,
          Values[0].metpersonNo,
          Values[0].yearOfBirth,
          Values[0].vaccineName,
          Values[0].stateName,
          Values[0].Data_Status,
          Values[0].districtName,
          Values[0].teshilName,
          Values[0].villageName,
          Values[0].pincode,
          Values[0].gpsLocation,
          Values[0].vaccinationStatus,
          Values[0].Filled_By,
          Values[0].internalTeamQA,
          Values[0].BeneficiaryID,
          Values[0].BeneficiaryReferenceID2nddose,
          Values[0].BeneficiaryReferenceID1stDose
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          }
          resp(result);
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function runApprovedQuery(query, values, id, baseNo) {
   // console.log("@@@",FormId);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate Found", values[0].formId);
          updatePSdata(values[0].formId, values, baseNo)
            .then((r) => {
              console.log("updating data", JSON.stringify(values[0]));
              resp(id);
            })
            .catch((e) => {
              console.log("error in updating ", e);
              rej(err);
            });
        } else {
          if(err){
            console.log("@@",err);
            resp()
          }else{
            console.log("INSERTED IN SQL",values[0].formId)
          resp(id);
          }
          
        }
      });
    } catch (error) {
      rej(error);
    }
  });
}

function updateRefenceID(data, selectBase) {
  //console.log("@@@@", data, selectBase);
  return new Promise((resp, rej) => {
    let base = selectBase;
    let table = base("Internal Field Form Data");
    table.update([...data], { typecast: true }, function (err) {
      if (err) {
        console.log(err);
        rej(err);
      }
      resp();
    });
  });
}




module.exports = {
  insertToPSInternalFieldFormAirtable,
  updatePSInternalFieldFormAirtable,
  checkPSInternalFieldFormPreviousData,
  getpsInternalFieldDataAirtable,
  runApprovedQuery,
  updateRefenceID,
  //   checkPSInternalFieldFormQaStatus,
};
