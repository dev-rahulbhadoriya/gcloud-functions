const cloudsql = require("../../utils/cloudSql");

function qaApprovedDataInsertIntoDb(formId, parsedData, id) {
     return new Promise((resp, rej) => {
      cloudsql.query(
        `INSERT INTO tsDemoData1 (formId, data) VALUES (?, ?);`,
        [formId, JSON.stringify(parsedData)],
        (err, result) => {
            if (err && err.code === "ER_DUP_ENTRY"){
                updateQAfunction(formId,parsedData)
                .then((r)=>{
                    console.log("updating data ........", r);
                    resp(id);

                })
                .catch((e)=>{
                    rej(e); 
                })
              }else{
                if (err){
                    console.log("@@", err);
                    rej()
                }
                else{
                    resp(id);
                }
            }
        }
      );
    });
  }
  
  function updateQAfunction(formId, parsedData) {
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(`UPDATE tsDemoData1 SET data = ? WHERE formId = ${formId}`,[JSON.stringify(parsedData)], (errrrr, result) => {
                    if (errrrr) {
                        console.log("@@@@FAILED UPDATE",errrrr);
                       // rej(err);
                    } else {
                      console.log("DATA UPDATED");
                        resp(formId);
                    }
                }
            );
        } catch (error) {
          console.log("######",error);
            rej(error);
        }
    });
}

module.exports = {
    qaApprovedDataInsertIntoDb,
};
