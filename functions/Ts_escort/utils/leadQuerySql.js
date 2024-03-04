const cloudsql = require("../../utils/cloudSql");
const axios = require("axios");

function insertTSLeadDataDB(fields) {
  console.log(fields);
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO ts_Mahindra_Escort_Data (id, data) VALUES (?, ?);",
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
      `UPDATE ts_Mahindra_Escort_Data SET data = ?, metPerson_Mobile_Number=?, state_Name=? WHERE id=${fields.Id};`,
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
      `SELECT data, airtableId FROM ts_Mahindra_Escort_Data WHERE id=${formId};`,
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
      `UPDATE ts_Mahindra_Escort_Data SET airtableId = ? WHERE id=${formId};`,
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
//       `SELECT id from ts_Mahindra_Escort_Data WHERE id="${id}"`,
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
      "INSERT INTO ts_Mahindra_Escort_Data (id,data,metPerson_Mobile_Number,state_Name,airtableBaseNo)VALUES(?,?,?,?,?);",
      [Id, JSON.stringify(fields), phone_number, state, airtableBaseNo],
      (err, result) => {
        console.log("@@@@@", result);
        if (err) {
          console.log("###", err);
          if (err && err.code === "ER_DUP_ENTRY") {
            cloudsql.query(
              `SELECT * FROM ts_Mahindra_Escort_Data WHERE metPerson_Mobile_Number = ${phone_number}`,
              (err, result) => {
                if (err) {
                  rej(err);
                } else {
                  cloudsql.query(
                    "INSERT INTO ts_Mahindra_Duplicate_Data (id,data,metPerson_Mobile_Number,status,state_Name,airtableBaseNo,old_Filled_By) VALUES (?, ?, ?, ?, ?, ?,?);",
                    [
                      Id,
                      JSON.stringify(fields),
                      phone_number,
                      result[0].status || "dup_entry",
                      state,
                      airtableBaseNo,
                      result[0].old_Filled_By || "dup_entry",
                    ],
                    (err, _result) => {
                      fields["P1P2 Status"] = result[0].status || "dup_entry";
                      fields["P1P2 Filled By"] =
                        result[0].old_Filled_By || "dup_entry";
                      if (err) {
                        console.log("ID PRESENT IN AIRTABLE");
                        rej();
                      } else {
                        // resp([true, fields]);
                        let fenumber = fields["Filled by Mobile Number"];
                        let farmername = fields["Filled By"];
                        let managernumber = "1111111111";
                        if (
                          typeof employees != "undefined" &&
                          employees != null
                        ) {
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
                        console.log("DUPLICATE Data", phone_number, fenumber);
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
                            console.log(
                              "dup-num-msg-err",
                              Id,
                              err.response.data
                            );
                          });
                      }
                    }
                  );
                }
              }
            );
            return;
          } else {
            console.log("ERROR before duplicate", err);
            rej(err);
          }
        } else {
          resp([false, fields]);
        }
      }
    );
  });
}

function updateLeadData(Id, fields, met_person_no, state, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE ts_Mahindra_Escort_Data SET data=?, metPerson_Mobile_Number=?, state_Name=?, airtableId=? WHERE id=${Id};`,
      [JSON.stringify(fields), met_person_no, state, recId],
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

function updateQAApprovedMahidraEscort(FormId, Values, baseNo) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE ts_phase3 SET Met_Person_Mobile_Number=?,Modified_Time=?, Modified_By=?,Filled_By=?, Filled_Time=?,Met_Person_Name=?,Gender_of_Met_Person=?,Met_Person_Type=?,Age_Bracket_of_Met_Person=?,Do_you_want_to_purchase_Tractor=?,When_you_will_purchase_tractor=?,Ask_3_Brands_of_Tractor_for_purchase=?,Are_you_interested_in_buying_Mahindra_Tractors=?,How_many_HP_Tractor_you_want=?,Are_you_interested_in_buying_Escorts_Farmtrac_Tractors=?,From_where_you_will_buy_tractor=?,Will_Purchase_Tractor_in_Cash_or_other_method=?,What_is_Usage_for_tractor=?,Planning_to_buy_any_implements_or_products=?,Do_you_have_any_Tractors=?,Which_Brand_Tractors_do_you_own=?,How_much_Tractor_HP_you_have=?,Select_the_model_number_of_tractor=?,Tractor_Purchased_Year=?,Tractor_Physically_Available=?,What_are_implements_availble_with_you=?,Do_you_take_or_give_Tractor_and_implements_on_rent=?,Did_you_choose_the_villages_name_on_Anaxee_Portal=?,State_Name=?,District_Name=?,Tehsil_Name=?,Village_Name=?,Select_Village_Name_by_Village_Id=?,Pincode=?,GPS_Location=?,Do_you_own_a_smartphone=?,Do_you_want_to_sell_tractor=?,Your_Manager_or_Supervisor_Name=?,QA_Done_By=?,QA_Call_Status=?,Rejection_Reason=?,QA_Lead_Status=?,Filled_by_Mobile_Number=?,Filled_by_Email_Id=?,Customer_QA_Status=?,Interested_in_Escorts=?,Lead_Type=?,When_will_you_purchase_in_days=?,QA_Done_Date=?,P1P2_Status=?,P1P2_Filled_By=?,Date_and_Time_of_Visit=?, Met_Person_Whatsapp_Alternate_No=?,Tractor_Owner_or_Buyer_Full_Address=?, If_Other_Village_then_Mention_Here=?, If_Others_usage_Please_Mention_here=?,If_Others_implements_Please_Mention_here=?, Condition_of_Tractor=?,Your_Anaxee_Support_Name=?,QA_Call_Attempt=?, QA_Remark=?,Customer_QA_Status=?, Tractor_with_Met_Person_Photo_Check_QA=?, Only_Met_Person_Photo_Check_QA=?, QADone_Date_Dont_Use=?, Manager_Mobile_Number=?, Expected_Date_of_Purchase=?, Number_of_days_to_Purchase=?,Upload_To_Customer_Base=?, Report_Sent_Date=?, Payment_Status=?,Payment_Process_Date=?, Email_Sent=?, Created_Time=?, Did_u_tk_details_from_dealerShowroom_abt_tractor=?, If_Yes_Mention_the_Dealer_or_Agency_Name=?,Do_you_have_a_smartphone=?,Did_the_Met_Person_Allowed_for_Data=?,Are_you_satisfied_with_your_tractor=?,If_no_then_why=?,Anaxee_Leads_Converted_in_TO=?,Mention_Tractor_Number_from_Number_Plate=?,Hot_Lead_Shared_with_Runner=?, Priority_District=?, Focus_Brand=? WHERE Id="${FormId}" and BaseNo="${baseNo}";`,
        [
          Values[0].Met_Person_Mobile_Number,
          Values[0].Modified_Time,
          Values[0].Modified_By,
          Values[0].Filled_By,
          Values[0].Filled_Time,
          Values[0].Met_Person_Name,
          Values[0].Gender_of_Met_Person,
          Values[0].Met_Person_Type,
          Values[0].Age_Bracket_of_Met_Person,
          Values[0].Do_you_want_to_purchase_Tractor,
          Values[0].When_you_will_purchase_tractor,
          Values[0].Ask_3_Brands_of_Tractor_for_purchase,
          Values[0].Are_you_interested_in_buying_Mahindra_Tractors,
          Values[0].How_many_HP_Tractor_you_want,
          Values[0].Are_you_interested_in_buying_Escorts_Farmtrac_Tractors,
          Values[0].From_where_you_will_buy_tractor,
          Values[0].Will_Purchase_Tractor_in_Cash_or_other_method,
          Values[0].What_is_Usage_for_tractor,
          Values[0].Planning_to_buy_any_implements_or_products,
          Values[0].Do_you_have_any_Tractors,
          Values[0].Which_Brand_Tractors_do_you_own,
          Values[0].How_much_Tractor_HP_you_have,
          Values[0].Select_the_model_number_of_tractor,
          Values[0].Tractor_Purchased_Year,
          Values[0].Tractor_Physically_Available,
          Values[0].What_are_implements_availble_with_you,
          Values[0].Do_you_take_or_give_Tractor_and_implements_on_rent,
          Values[0].Did_you_choose_the_villages_name_on_Anaxee_Portal,
          Values[0].State_Name,
          Values[0].District_Name,
          Values[0].Tehsil_Name,
          Values[0].Village_Name,
          Values[0].Select_Village_Name_by_Village_Id,
          Values[0].Pincode,
          Values[0].GPS_Location,
          Values[0].Do_you_own_a_smartphone,
          Values[0].Do_you_want_to_sell_tractor,
          Values[0].Your_Manager_or_Supervisor_Name,
          Values[0].QA_Done_By,
          Values[0].QA_Call_Status,
          Values[0].Rejection_Reason,
          Values[0].QA_Lead_Status,
          Values[0].Filled_by_Mobile_Number,
          Values[0].Filled_by_Email_Id,
          Values[0].Customer_QA_Status,
          Values[0].Interested_in_Escorts,
          Values[0].Lead_Type,
          Values[0].When_will_you_purchase_in_days,
          Values[0].QA_Done_Date,
          Values[0].P1P2_Status,
          Values[0].P1P2_Filled_By,
          Values[0].Date_and_Time_of_Visit,
          Values[0].Met_Person_Whatsapp_Alternate_No,
          Values[0].Tractor_Owner_or_Buyer_Full_Address,
          Values[0].If_Other_Village_then_Mention_Here,
          Values[0].If_Others_usage_Please_Mention_here,
          Values[0].If_Others_implements_Please_Mention_here,
          Values[0].Condition_of_Tractor,
          Values[0].Your_Anaxee_Support_Name,
          Values[0].QA_Call_Attempt,
          Values[0].QA_Remark,
          Values[0].Customer_QA_Status,
          Values[0].Tractor_with_Met_Person_Photo_Check_QA,
          Values[0].Only_Met_Person_Photo_Check_QA,
          Values[0].QADone_Date_Dont_Use,
          Values[0].Manager_Mobile_Number,
          Values[0].Expected_Date_of_Purchase,
          Values[0].Number_of_days_to_Purchase,
          Values[0].Upload_To_Customer_Base,
          Values[0].Report_Sent_Date,
          Values[0].Payment_Status,
          Values[0].Payment_Process_Date,
          Values[0].Email_Sent,
          Values[0].Created_Time,
          Values[0].Did_u_tk_details_from_dealerShowroom_abt_tractor,
          Values[0].If_Yes_Mention_the_Dealer_or_Agency_Name,
          Values[0].Do_you_have_a_smartphone,
          Values[0].Did_the_Met_Person_Allowed_for_Data,
          Values[0].Are_you_satisfied_with_your_tractor,
          Values[0].If_no_then_why,
          Values[0].Anaxee_Leads_Converted_in_TO,
          Values[0].Mention_Tractor_Number_from_Number_Plate,
          Values[0].Hot_Lead_Shared_with_Runner,
          Values[0].Priority_District,
          Values[0].Focus_Brand,
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

function qaApprovedMahidraEscortDataInsertIntoDb(query, values, id, baseNo) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate Found", values[0].Id);
          updateQAApprovedMahidraEscort(values[0].Id, values, baseNo)
            .then((r) => {
              console.log("updating data", JSON.stringify(values[0].Id));
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
          }
          console.log("Data inseted", values[0].Id);
          resp(id);
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
  qaApprovedMahidraEscortDataInsertIntoDb,
};
