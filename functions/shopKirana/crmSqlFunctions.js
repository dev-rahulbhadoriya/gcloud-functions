const crmsql = require("../utils/crmswl");
const { bgvOpenStatusArray } = require("./utils/bgvStatusArray");

const getBGVStatus = (bgvCheckId) => {
  return new Promise((resp, rej) => {
    crmsql.query(
      `SELECT bgvstatus_c FROM cases_cstm WHERE bgvcheckid_c = ?`,
      [bgvCheckId],
      (err, result) => {
        if (err) {
          console.log("error result", err);
        }
        resp(result);
        // console.log("query result------", result);
        // bgv_status = result;
      }
    );
  });
};

const updateCRMStatus = (bgvCheckId, Message, reportReceivedFromFe) => {
  let updateQuery = `UPDATE cases_cstm SET bgvstatus_c = ?,laststatus_c=?, reportreceiveddatefromfe_c = ?, reportreceivedfromspoors_c = ? WHERE bgvcheckid_c = ?`;
  return new Promise((resp, rej) => {
    crmsql.query(
      `SELECT bgvstatus_c FROM cases_cstm WHERE bgvcheckid_c = ?`,
      [bgvCheckId],
      (err, result) => {
        if (err) {
          console.log("error result", err);
        }

        let bgvStatus = result[0].bgvstatus_c;

        // console.log("query result------", result);
        // bgv_status = result;
        // console.log("last status result=====", result);
        crmsql.query(
          updateQuery,
          [Message, bgvStatus, reportReceivedFromFe, "Yes", bgvCheckId],
          (err, results) => {
            if (err) {
              console.error("CRM_UPDATE_ERROR_IN_updateCRMStatus");
            }
            resp();
          }
        );
      }
    );
  });
};

const updateBGVStatus = (bgvCheckId, fields, id) => {
  return new Promise((resp, rej) => {
    // const id = bgvCheckId.toString()
    let updateQueryCrmStatus = `UPDATE cases_cstm SET bgvstatus_c = ?,laststatus_c=? WHERE bgvcheckid_c = ?`;
    crmsql.query(
      `SELECT bgvstatus_c,laststatus_c FROM cases_cstm WHERE bgvcheckid_c = ?`,
      [bgvCheckId],
      (err, result) => {
        if (err) {
          rej(err);
          console.log("error result", err);
        }
        let lastStatus = result[0].bgvstatus_c;
        let actulLastStatus = result[0].laststatus_c;
        console.log("CheckIdsss", bgvCheckId);
        console.log("@@@BGV Status from CRM", lastStatus);
        console.log("###BGV Status From Airtable", fields["BGV Status"]);
        let airFiled = fields["BGV Status"];
        let currentStatus = bgvOpenStatusArray[`${airFiled}`];
        if (lastStatus === "" || lastStatus === null) {
          console.log("NULL section =========");
          if (currentStatus === undefined) {
            console.log(
              "Not updated, status not match from airtable, status undefine"
            );
            rej(currentStatus);
          } else {
            crmsql.query(
              updateQueryCrmStatus,
              [currentStatus, actulLastStatus, bgvCheckId],
              (err, results) => {
                if (err) {
                  rej(err);
                }
                resp(id);
              }
            );
          }
        } else if (
          lastStatus == bgvOpenStatusArray[`${airFiled}`] ||
          currentStatus === undefined ||
          airFiled === "open"
        ) {
          console.log(
            "NOT Updated status, bgv status and airtable status same"
          );
          resp(id);
        } else {
          console.log("changed in status");
          if (currentStatus === undefined) {
            console.log(
              "Not updated, status not match from airtable, status undefind"
            );
            rej(currentStatus);
          } else {
            crmsql.query(
              updateQueryCrmStatus,
              [currentStatus, lastStatus, bgvCheckId],
              (err, results) => {
                if (err) {
                  rej(err);
                }
                resp(id);
              }
            );
          }
        }
      }
    );
  });
};

module.exports = {
  updateCRMStatus,
  getBGVStatus,
  updateBGVStatus,
};
