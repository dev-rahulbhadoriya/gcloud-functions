const cloudsql = require("../../utils/cloudSql");
const axios = require("axios");

function insertIntoVyaparDataDB(fields) {
  console.log(fields);
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO vyapar_data (FormId, data) VALUES (?, ?);",
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

function updateIntoVyaparDataDB(fields, mobile_number, state) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE vyapar_data SET data = ?, mobile_number=?, state_Name=? WHERE FormId=${fields.FormId};`,
      [JSON.stringify(fields), mobile_number, state],
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

function getDataFromDB(formId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `SELECT data, airtableId FROM vyapar_data WHERE FormId=${formId};`,
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

function updateAirtableIdIntoDB(formId, airtableID) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE vyapar_data SET airtableId = ? WHERE FormId=${formId};`,
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
//       `SELECT id from vyapar_data WHERE id="${id}"`,
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

function insertDataCheckDuplicate(
  FormId,
  fields,
  phone_number,
  state,
  employees,
  airtableBaseNo
) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      "INSERT INTO vyapar_data (FormId,data,mobile_number,status,state_Name,airtableBaseNo)VALUES(?,?,?,?,?,?);",
      [FormId, JSON.stringify(fields), phone_number, 0, state, airtableBaseNo],
      (err, result) => {
        if (err) {
          if (err && err.code === "ER_DUP_ENTRY") {
            cloudsql.query(
              "INSERT INTO vyapar_data_duplicate (FormId,data,mobile_number,status,state_Name,airtableBaseNo) VALUES (?, ?, ?, ?, ?, ?);",
              [
                FormId,
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
                  // let farmername =
                  //   fields["7. Shopkeeper Number (दुकानदार का नंबर)"];
                  // let fenumber = "1111111111";
                  // let managernumber = "1111111111";
                  // if (typeof employees != "undefined" && employees != null) {
                  //   let isManagerAdded = false;
                  //   employees.forEach((item) => {
                  //     if (!isManagerAdded && item.manager == true) {
                  //       managernumber = item.empPhone;
                  //       isManagerAdded = true;
                  //     } else {
                  //       fenumber = item.empPhone;
                  //     }
                  //   });
                  // }
                  // console.log("DUPLICATE Data", farmername, fenumber);
                  // let msgBody = {
                  //   sender: "ANAXEE",
                  //   route: "4",
                  //   country: "91",
                  //   DLT_TE_ID: "'1307164172742982413",
                  //   sms: [
                  //     {
                  //       message: ` Mob-No. ${phone_number} | Duplicate Number Found (TS) | Register new farmer | Ask Farmer before Registration | Duplicate data will be rejected.

                  //     Thank you. Anaxee`,
                  //       to: [fenumber, managernumber],
                  //     },
                  //   ],
                  // };
                  // axios
                  //   .post(
                  //     "https://api.msg91.com/api/v2/sendsms?country=91",
                  //     msgBody,
                  //     {
                  //       headers: {
                  //         "Content-Type": "application/json",
                  //         authkey: "103801ASIjpSVep5dadb6b2",
                  //       },
                  //     }
                  //   )
                  //   .then(() => {
                  //     resp([true, true]);
                  //     console.log("dup-num-msg-send", Id, fenumber);
                  //   })
                  //   .catch((err) => {
                  //     resp([true, false]);
                  //     console.log("dup-num-msg-err", Id, err.response.data);
                  //   });
                  resp([true, true]);
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

function updateDataIntoDb(FormId, fields, mobile_number, state, status, recId) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE vyapar_data SET data=?, mobile_number=?, status=?, state_Name=?, airtableId=? WHERE FormId=${FormId};`,
      [JSON.stringify(fields), mobile_number, status, state, recId],
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

function getRow() {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT data FROM vyapar_data WHERE data_cleaned IS NULL ORDER BY FormId DESC LIMIT 250;`,
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

function changeCleanedStatus(id) {
  console.log(id);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE vyapar_data SET data_cleaned=? WHERE FormId=${id};`,
        [1],
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

function getRowsByStatus(status) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `SELECT mobile_number, airtableId, state_Name, call_id FROM vyapar_data WHERE status=${status} and not isnull(airtableId) LIMIT 10;`,
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

function updateStatusRawData(recId, status, call_id) {
  return new Promise((resp, rej) => {
    cloudsql.query(
      `UPDATE vyapar_data SET status=?, call_id=? WHERE airtableId LIKE "%${recId}%";`,
      [status, call_id],
      (err, _result) => {
        if (err) {
          rej(err);
        }
        resp(false);
      }
    );
  });
}

function qaApprovedDataInsertIntoDb(query, values, id, baseNo) {
  // console.log("@@@",values);
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err && err.code === "ER_DUP_ENTRY") {
          console.log("Duplicate Found", values[0].FormId);
          updateQAApprovedfunction(values[0].FormId, values, baseNo)
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
            resp(id);
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

function updateQAApprovedfunction(FormId, value, baseNo) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(
        `UPDATE gram_sathi_QA SET 
        Did_the_Farmer_Allowed=?,
        Name_of_Farmer=?,Gender=?,
        Age=?,
        Year_of_Birth=?,
        Mobile_Number=?,
        Land_Unit=?,
        Total_Land=?,
        Leased_In=?,
        Leased_Out=?,
        Do_you_have_a_smart_phone=?,
        If_yes_WhatsappNo=?,
        Alternate_smartphone_number_to_reach_you=?,
        Have_you_ever_represented_an_Agri_company_as_a_Kissan_Pratinidhi=?,
        Source_of_Irrigation=?,
        If_Other_Source_of_Irrigation_please_mention_here=?,
        Irrigation_Method=?,
        If_Other_Irrigation_Method_please_mention_here=?,
        Commercial_Crops_Grown_for_selling=?,
        If_Other_Crop_please_mention_here=?,
        Do_you_wish_to_avail_soil_testing_services_by_DeHaat=?,
        Where_Do_You_Buy_Agri_Input_From=?,
        If_other_please_mention_here=?,
        Why_this_channel_of_purchase=?,
        Currently_payment_mode_use_for_all_your_transaction=?,
        Your_Nearest_Agri_Input_Supplier=?,
        Do_You_Own_Agri_Machinery=?,
        If_select_other_Machinery_then_mention_here=?,
        Tractor_Purchased_Year=?,
        How_much_Tractor_HP_you_have=?,
        Which_Brand_Tractors_do_you_own=?,
        Are_you_looking_for_refinancing_on_tractor=?,
        Do_you_want_to_sell_tractor=?,
        Do_you_want_to_purchase_New_Tractor=?,
        Any_Challenges_in_Getting_Agri_inputs=?,
        Who_Do_You_Sell_Agri_Produce_To=?,
        Reason_for_Selling_Agri_Produce_to_this_Buyer=?,
        Your_Nearest_Agri_Output_Buyer=?,
        How_Do_You_Get_Updates_on_Mandi_Prices=?,
        From_where_do_you_get_crop_information_or_Advisory=?,
        How_Do_You_Recieve_Crop_advisory=?,
        What_Information_is_Most_Useful_For_You=?,
        If_Other_Most_Useful_Information=?,
        Cattles_available_with_you=?,
        If_Other_Cattle_please_mention_here=?,
        Total_Number_of_Cattle=?,
        Poultry_birds_available_with_you=?,
        If_Poultry_birds_available_mention_here=?,
        Total_Number_of_birds_in_Poultry=?,
        Have_you_taken_any_Agri_Finance_or_Loan=?,
        Have_You_availed_crop_Insurance=?,
        Critical_Concerns=?,
        Any_Remark=?,
        Did_you_choose_the_villages_name_on_Anaxee_Portal=?,
        Select_Village_Code_from_List=?,
        State_Name=?,
        District_Name=?,
        Block_Name=?,
        Panchayat_Name=?,
        Village_Name=?,
        State_Name2=?,
        District_Name2=?,
        Panchayat_Name2=?,
        Village_Name2=?,
        Pincode=?,
        GPS_Location=?,
        Total_Family_Member=?,
        Farmer_Education=?,
        Working_Status=?,
        Vaccination_Status=?,
        Do_you_or_any_family_member_need_Job=?,
        Source_of_Income=?,
        Sarpanch_Name=?,
        Sarpanch_Mobile_Number=?,
        Sachiv_Name=?,
        Sachiv_Mobile_Number=?,
        Filled_By=?,
        Filled_Date=?,
        Modified_By=?,
        Modified_Date=?,
        Filled_by_Mobile_Number=?,
        Filled_by_Email_Id=?,
        Your_Manager_or_Supervisor_Name=?,
        Manager_Mobile_Number=?,
        What_is_the_education_of_those_who_want_a_job=?,
        QA_Status=?,
        QA_Call_Status=?,
        Customer_QA_Status=?,
        QA_Farmer_Photo_Check=?,
        Auto_call_check=?,
        Autocall_attempt=?,
        Base_Name=?,
        QADone_Date=?,
        Education=?,
        QA_DoneBy=?,
        Missed_Call_Received_on_Toll_Free_Number=?,
        Age_bracket=?,
        number_of_cattles1=? WHERE FormId="${FormId}" and Base_Name="${baseNo}";`,
        [
          value[0].Did_the_Farmer_Allowed,
          value[0].Name_of_Farmer,
          value[0].Gender,
          value[0].Age,
          value[0].Year_of_Birth,
          value[0].Mobile_Number,
          value[0].Land_Unit,
          value[0].Total_Land,
          value[0].Leased_In,
          value[0].Leased_Out,
          value[0].Do_you_have_a_smart_phone,
          value[0].If_yes_WhatsappNo,
          value[0].Alternate_smartphone_number_to_reach_you,
          value[0]
            .Have_you_ever_represented_an_Agri_company_as_a_Kissan_Pratinidhi,
          value[0].Source_of_Irrigation,
          value[0].If_Other_Source_of_Irrigation_please_mention_here,
          value[0].Irrigation_Method,
          value[0].If_Other_Irrigation_Method_please_mention_here,
          value[0].Commercial_Crops_Grown_for_selling,
          value[0].If_Other_Crop_please_mention_here,
          value[0].Do_you_wish_to_avail_soil_testing_services_by_DeHaat,
          value[0].Where_Do_You_Buy_Agri_Input_From,
          value[0].If_other_please_mention_here,
          value[0].Why_this_channel_of_purchase,
          value[0].Currently_payment_mode_use_for_all_your_transaction,
          value[0].Your_Nearest_Agri_Input_Supplier,
          value[0].Do_You_Own_Agri_Machinery,
          value[0].If_select_other_Machinery_then_mention_here,
          value[0].Tractor_Purchased_Year,
          value[0].How_much_Tractor_HP_you_have,
          value[0].Which_Brand_Tractors_do_you_own,
          value[0].Are_you_looking_for_refinancing_on_tractor,
          value[0].Do_you_want_to_sell_tractor,
          value[0].Do_you_want_to_purchase_New_Tractor,
          value[0].Any_Challenges_in_Getting_Agri_inputs,
          value[0].Who_Do_You_Sell_Agri_Produce_To,
          value[0].Reason_for_Selling_Agri_Produce_to_this_Buyer,
          value[0].Your_Nearest_Agri_Output_Buyer,
          value[0].How_Do_You_Get_Updates_on_Mandi_Prices,
          value[0].From_where_do_you_get_crop_information_or_Advisory,
          value[0].How_Do_You_Recieve_Crop_advisory,
          value[0].What_Information_is_Most_Useful_For_You,
          value[0].If_Other_Most_Useful_Information,
          value[0].Cattles_available_with_you,
          value[0].If_Other_Cattle_please_mention_here,
          value[0].Total_Number_of_Cattle,
          value[0].Poultry_birds_available_with_you,
          value[0].If_Poultry_birds_available_mention_here,
          value[0].Total_Number_of_birds_in_Poultry,
          value[0].Have_you_taken_any_Agri_Finance_or_Loan,
          value[0].Have_You_availed_crop_Insurance,
          value[0].Critical_Concerns,
          value[0].Any_Remark,
          value[0].Did_you_choose_the_villages_name_on_Anaxee_Portal,
          value[0].Select_Village_Code_from_List,
          value[0].State_Name,
          value[0].District_Name,
          value[0].Block_Name,
          value[0].Panchayat_Name,
          value[0].Village_Name,
          value[0].State_Name2,
          value[0].District_Name2,
          value[0].Panchayat_Name2,
          value[0].Village_Name2,
          value[0].Pincode,
          value[0].GPS_Location,
          value[0].Total_Family_Member,
          value[0].Farmer_Education,
          value[0].Working_Status,
          value[0].Vaccination_Status,
          value[0].Do_you_or_any_family_member_need_Job,
          value[0].Source_of_Income,
          value[0].Sarpanch_Name,
          value[0].Sarpanch_Mobile_Number,
          value[0].Sachiv_Name,
          value[0].Sachiv_Mobile_Number,
          value[0].Filled_By,
          value[0].Filled_Date,
          value[0].Modified_By,
          value[0].Modified_Date,
          value[0].Filled_by_Mobile_Number,
          value[0].Filled_by_Email_Id,
          value[0].Your_Manager_or_Supervisor_Name,
          value[0].Manager_Mobile_Number,
          value[0].What_is_the_education_of_those_who_want_a_job,
          value[0].QA_Status,
          value[0].QA_Call_Status,
          value[0].Customer_QA_Status,
          value[0].QA_Farmer_Photo_Check,
          value[0].Auto_call_check,
          value[0].Autocall_attempt,
          value[0].Base_Name,
          value[0].QADone_Date,
          value[0].Education,
          value[0].QA_DoneBy,
          value[0].Missed_Call_Received_on_Toll_Free_Number,
          value[0].Age_bracket,
          value[0].number_of_cattles1,
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

module.exports = {
  insertDataCheckDuplicate,
  updateAirtableIdIntoDB,
  updateDataIntoDb,
  insertIntoVyaparDataDB,
  updateIntoVyaparDataDB,
  getDataFromDB,
  getRow,
  changeCleanedStatus,
  getRowsByStatus,
  updateStatusRawData,
  qaApprovedDataInsertIntoDb,
};
