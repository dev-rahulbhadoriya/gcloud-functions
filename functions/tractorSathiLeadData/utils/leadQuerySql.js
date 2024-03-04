const cloudsql = require("../../utils/cloudSql");
const axios = require("axios");

function insertTSLeadDataDB(fields) {
  console.log(fields);
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO ts_Lead_Data (id, data) VALUES (?, ?);",
      [fields.Id, JSON.stringify(fields)],
      (err, result) => {
        if (err) {
          console.log("FAILED_INSERT", JSON.stringify(err));
          rej(err);
        }
        console.log(result);
        resp();
      }
    );
  });
}

function updateTSLeadDataDB(fields, met_person_no, state) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ts_Lead_Data SET data = ?, metPerson_Mobile_Number=?, state_Name=? WHERE id=${fields.Id};`,
      [JSON.stringify(fields), met_person_no, state],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp();
      }
    );
  });
}

function getTSLeadDataDB(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM ts_Lead_Data WHERE id=${formId};`,
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp(result);
      }
    );
  });
}

function updateTSLeadDataDBAirtableId(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ts_Lead_Data SET airtableId = ? WHERE id=${formId};`,
      [airtableID],
      (err, result) => {
        if (err) {
          console.log("FAILED_UPDATE", JSON.stringify(err));
          rej(err);
        }
        resp(formId);
      }
    );
  });
}

// function cheackId(id) {
//   console.log("check kia id", id);
//   return new Promise((resp, rej) => {
//     cloudsql.query(
//       `SELECT id from ts_Lead_Data WHERE id="${id}"`,
//       (err, result) => {
//         if (err) {
//           rej(err);
//         }
//         if (result.length > 0) {
//           resp(true);
//         } else {
//           resp(false);
//         }
//       }
//     );
//   });
// }

function insertLeadData(
  Id,
  fields,
  phone_number,
  state,
  employees,
  airtableBaseNo
) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO ts_Lead_Data (id,data,metPerson_Mobile_Number,status,state_Name,airtableBaseNo)VALUES(?,?,?,?,?,?);",
      [Id, JSON.stringify(fields), phone_number, 0, state, airtableBaseNo],
      (err, result) => {
        if (err) {
          if (err && err.code === "ER_DUP_ENTRY") {
            cloudsql.query(
              "INSERT INTO ts_Lead_Duplicate_Data (id,data,metPerson_Mobile_Number,status,state_Name,airtableBaseNo) VALUES (?, ?, ?, ?, ?, ?);",
              [
                Id,
                JSON.stringify(fields),
                phone_number,
                0,
                state,
                airtableBaseNo,
              ],
              (err, _result) => {
                if (err) {
                  console.log("ID PRESENT IN AIRTABLE");
                  rej();
                } else {
                  let farmername =
                    fields["Met Person Name (जो व्यक्ति मिला उसका नाम)"];
                  let fenumber = "1111111111";
                  let managernumber = "1111111111";
                  if (typeof employees != "undefined" && employees != null) {
                    let isManagerAdded = false;
                    employees.forEach((item) => {
                      if (!isManagerAdded && item.manager == true) {
                        managernumber = item.empPhone;
                        isManagerAdded = true;
                      } else {
                        fenumber = item.empPhone;
                      }
                    });
                  }
                  console.log("DUPLICATE Data", farmername, fenumber);
                  let msgBody = {
                    sender: "ANAXEE",
                    route: "4",
                    country: "91",
                    DLT_TE_ID: "'1307161518717340829",
                    sms: [
                      {
                        message: ` Mob-No. ${phone_number} | Duplicate Number Found (TS) | Register new farmer | Ask Farmer before Registration | Duplicate data will be rejected.
    
                      Thank you. Anaxee`,
                        to: [fenumber, managernumber],
                      },
                    ],
                  };
                  axios
                    .post(
                      "https://api.msg91.com/api/v2/sendsms?country=91",
                      msgBody,
                      {
                        headers: {
                          "Content-Type": "application/json",
                          authkey: "103801ASIjpSVep5dadb6b2",
                        },
                      }
                    )
                    .then(() => {
                      resp([true, true]);
                      console.log("dup-num-msg-send", Id, fenumber);
                    })
                    .catch((err) => {
                      resp([true, false]);
                      console.log("dup-num-msg-err", Id, err.response.data);
                    });
                }
              }
            );
          } else {
            rej(err);
          }
        } else {
          resp([false, false]);
        }
      }
    );
  });
}

function updateLeadData(Id, fields, met_person_no, state, status, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ts_Lead_Data SET data=?, metPerson_Mobile_Number=?, status=?, state_Name=?, airtableId=? WHERE id=${Id};`,
      [JSON.stringify(fields), met_person_no, status, state, recId],
      (err, _result) => {
        if (err) {
          console.log("Faild to update sql row", err);
          rej(err);
        }
        resp(false);
      }
    );
  });
}

function updateQAApprovedfun(FormId, Values, baseNo) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE ts_Lead_QA_Data SET Date_of_Visit=?,Modified_time=?,Filled_by=?,Met_person_name=?,Met_person_mobile_no=?,Gender=?,MetPerson_type=?,Age=?,Do_you_want_to_purchase_tractor=?,When_you_will_purchase_tractor=?,three_brand_of_tractor=?,Interested_buying_Escorts_Powertrac=?,how_many_HP_tractor_you_want=?,Interested_buying_Escorts_Farmtrac=?,From_where_you_will_buy_tractor=?,Will_purchase_tractor_in_cash_or_other=?,usage_for_tractor=?,Planning_tobuy_implement_products=?,do_you_have_any_tractors=?,which_brand_tractor_you_own=?,how_many_HP_tractor_you_have=?,Select_model_number_of_tractor=?,If_any_other_model=?,Tractor_purchase_year=?,Tractor_physically_available=?,Implements_available=?,Take_give_tractor_implements_on_rent=?,choose_village_on_partner_app=?,State=?,District=?,tehsil=?,Village=?,Village_id=?,Pincode=?,Location=?,Heard_about_Tractorsathi=?,Do_you_own_samrtphone=?,Do_you_want_to_sell_tractors=?,Digital_app_being_used=?,Your_manager_or_supervisor_name=?,QA_Done_by=?,QA_call_status=?,Rejection_reason=?,QA_lead_status=?,Filled_by_mobile_number=?,Filled_by_email=?,customer_QA_status=?,Do_you_want_to_purchase_new_tractor=?,Interested_in_escorts=?,Lead_type=?,When_will_you_purchase=?,Enquiry_type=?,Miss_call_status=?,QA_done_date=?,IFFCO_Lead_status=?,IFFCO_Lead_QA_stats=? WHERE FormId="${FormId}" and TSBaseNo="${baseNo}";`,
        [
          Values[0].Date_of_Visit,
          Values[0].Modified_time,
          Values[0].Filled_by,
          Values[0].Met_person_name,
          Values[0].Met_person_mobile_no,
          Values[0].Gender,
          Values[0].MetPerson_type,
          Values[0].Age,
          Values[0].Do_you_want_to_purchase_tractor,
          Values[0].When_you_will_purchase_tractor,
          Values[0].three_brand_of_tractor,
          Values[0].Interested_buying_Escorts_Powertrac,
          Values[0].how_many_HP_tractor_you_want,
          Values[0].Interested_buying_Escorts_Farmtrac,
          Values[0].From_where_you_will_buy_tractor,
          Values[0].Will_purchase_tractor_in_cash_or_other,
          Values[0].usage_for_tractor,
          Values[0].Planning_tobuy_implement_products,
          Values[0].do_you_have_any_tractors,
          Values[0].which_brand_tractor_you_own,
          Values[0].how_many_HP_tractor_you_have,
          Values[0].Select_model_number_of_tractor,
          Values[0].If_any_other_model,
          Values[0].Tractor_purchase_year,
          Values[0].Tractor_physically_available,
          Values[0].Implements_available,
          Values[0].Take_give_tractor_implements_on_rent,
          Values[0].choose_village_on_partner_app,
          Values[0].State,
          Values[0].District,
          Values[0].tehsil,
          Values[0].Village,
          Values[0].Village_id,
          Values[0].Pincode,
          Values[0].Location,
          Values[0].Heard_about_Tractorsathi,
          Values[0].Do_you_own_samrtphone,
          Values[0].Do_you_want_to_sell_tractors,
          Values[0].Digital_app_being_used,
          Values[0].Your_manager_or_supervisor_name,
          Values[0].QA_Done_by,
          Values[0].QA_call_status,
          Values[0].Rejection_reason,
          Values[0].QA_lead_status,
          Values[0].Filled_by_mobile_number,
          Values[0].Filled_by_email,
          Values[0].customer_QA_status,
          Values[0].Do_you_want_to_purchase_new_tractor,
          Values[0].Interested_in_escorts,
          Values[0].Lead_type,
          Values[0].When_will_you_purchase,
          Values[0].Enquiry_type,
          Values[0].Miss_call_status,
          Values[0].QA_done_date,
          Values[0].IFFCO_Lead_status,
          Values[0].IFFCO_Lead_QA_stats,
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            rej(err);
          } else {
            resp();
          }
        }
      );
    } catch (error) {
      rej(error);
    }
  });
}

function qaApprovedDataInsertIntoDb(query, values, id, baseNo) {
  // console.log("@@@",values);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate Found", values[0].FormId);
          updateQAApprovedfun(values[0].FormId, values, baseNo)
            .then((r) => {
              console.log("updating data", JSON.stringify(values[0].FormId));
              resp(id);
            })
            .catch((e) => {
              console.log("error in updating ", e);
              rej(err);
            });
        } else {
          if (err) {
            console.log("@@", err);
            resp();
          } else {
            console.log("Data inseted", values[0].FormId);
            resp(id);
          }
        }
      });
    } catch (error) {
      rej(error);
    }
  });
}

module.exports = {
  insertTSLeadDataDB,
  updateTSLeadDataDB,
  getTSLeadDataDB,
  updateTSLeadDataDBAirtableId,
  insertLeadData,
  updateLeadData,
  qaApprovedDataInsertIntoDb,
};
