const cloudsql = require("../utils/cloudSql");
const { AIFBaseData }= require("./utils/airtablebase");
const { fieldsAif } = require("./utils/fieldMapping");

function updateBase(data) {
  console.log(data);
  return new Promise((resp, rej) => {
    let base = AIFBaseData;
    let table = base("Imported table");
    table.update([...data], { typecast: true }, function (err) {
      if (err) {
        console.log(err);
        rej(err);
      }
      resp();
    });
  });
}

function getData() {
  return new Promise((resp, rej) => {
    let base = AIFBaseData;
    let table = base("Imported table");
    let totalRecords = [];
    table
      .select({
        maxRecords: 10,
        filterByFormula: "NOT({Data Push Db})",
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

function runApprovedQuery(query, values, id) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        // console.log(values[0].UniqueNumber);
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate Found UniqueNumber", values[0].FormId);
           updateTrackersData(values[0].FormId,values).then((r)=>{
            // console.log("updating fields");
             resp(id);
           }).catch((e)=>{
             console.log("error in updating ",e);
             rej(err);
           });
        } else {
          resp(id);
        }
      });
    } catch (error) {
      rej(error);
    }
  });
}

function updateTrackersData(formId, values) {
  //console.log("data",values[0]);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE Corona_QADone_Data SET FBy=?,QAStatus_2=?,FilledByMNO=?,GenderOfmetPerson=?,DistrictName=?,StateName=?,Pincode=?,VaccineDoseName=?,DateTime_ofvisit=?,QAStatus_3=?,DateTime_ofvisit=?,MetPersonName=?,yearofbirth=?,AgeOfMetPerson=?,Dose_1st_Date=?,Dose_2nd_Date=?,QADoneDate=?,QADoneBy=?,BeneficiaryReferenceID=?,BaseNo=? WHERE FormId="${formId}";`,
        [
          values[0].FBy,
          values[0].QAStatus_2,
          values[0].FilledByMNO,
          values[0].GenderOfmetPerson,
          values[0].DistrictName,
          values[0].StateName,
          values[0].Pincode,
          values[0].VaccineDoseName,
          values[0].DateTime_ofvisit,
          values[0].QAStatus_3,
          values[0].DateTime_ofvisit,
          values[0].MetPersonName,
          values[0].yearofbirth,
          values[0].AgeOfMetPerson,
          values[0].Dose_1st_Date,
          values[0].Dose_2nd_Date,
          values[0].QADoneDate,
          values[0].QADoneBy,
          values[0].BeneficiaryReferenceID,
          values[0].BaseNo
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

function processValue(value) {
  let result = ``;
  if (Array.isArray(value)) {
    value.forEach((el) => {
      if (
        Object.prototype.toString.call(el) === "[object Object]" &&
        Object.prototype.toString.call(el.url) === "[object String]"
      ) {
        result = `${result}${el.url},`;
      } else {
        result = `${result}${el},`;
      }
    });
  } else {
    return value;
  }
  return result;
}

function insertAIFDataIntodb(_req, _res) {
  let insertPromises = [];
  let baseName = "aifBase1"
  let refdata = [];
  getData()
    .then((res) => {
      res.forEach((form) => {
        //console.log(form);
        let sqlData = {};
        let parsedData = form.fields;
        for (const key in parsedData) {
          const k = fieldsAif[key];
          const value = parsedData[key];
        //  console.log(key, "--", value);
          let data = processValue(value)
          if (k) {
            sqlData[k] = data;
          }
          sqlData["BaseNo"]=baseName
          sqlData["BeneficiaryReferenceID"]=sqlData["FormId"]
         // console.log(k,"-----", data);
        }
        console.log("INSERTING DATA", JSON.stringify(sqlData));
        let query = `INSERT INTO Corona_QADone_Data SET ?`;
        insertPromises.push(runApprovedQuery(query, [sqlData], form.id));
      });
      Promise.allSettled(insertPromises)
        .then((recIds) => {
          // console.log("@@@@",recIds);
          var data = [];
          recIds.forEach((id) => {
            if (id.value) {
              data.push({
                id: id.value,
                fields: {
                  "Data Push Db": true,
                },
              });
            }
          });
          updateBase(data)
            .then((res) => {
              _res.status(200).send("success");
            })
            .catch((err) => {
              console.log(err);
              _res.status(500).send("failed To Update Airtable");
            });
        })
        .catch((err) => {
          console.log(err);
          _res.status(500).send("failed to insert data");
        });
    })
    .catch((err) => {
      console.log(err);
      _res.status(500).send("failed");
    });
}

module.exports = {
  insertAIFDataIntodb,
};
