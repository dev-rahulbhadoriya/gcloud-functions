const { base } = require("airtable")
const cloudsql = require("../../utils/cloudSql")

function insertBackToSchoolData(fields, orders) {
    return new Promise((resp, rej) => {
        cloudsql.query("INSERT INTO back_to_school_field_data (Id, data, orders) VALUES (?, ?, ?);", [fields.Id, JSON.stringify(fields), JSON.stringify(orders)], (err, result) => {
            console.log("@@@", err);
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log("DUPLICATE FOUND");
                    cloudsql.query("INSERT INTO back_to_school_field_data_duplicate (Id, data, orders) VALUES (?, ?, ?);", [fields.Id, JSON.stringify(fields), JSON.stringify(orders)], (err, result) => {
                        if (err) {
                            console.log(err);
                            rej(err)
                        }
                        resp(true)
                    })
                }
                rej(err)
            }
            resp(false)
        })
    })
}


function insertDataInDb(query, values, id, baseNo) {
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(query, values, (err, result) => {
                if (err && err.code === "ER_DUP_ENTRY") {
                    console.log("Duplicate Found", values[0].recID);
                    updateDataInDb(values[0].recID, values, baseNo)
                        .then((r) => {
                            console.log("updating data", JSON.stringify(values[0].RecId));
                            resp(id);
                        })
                        .catch((e) => {
                            console.log("error in updating", e);
                            rej(err);
                        });
                } else {
                    if (err) {
                        console.log("@@", err);
                        rej()
                    } else {
                        console.log("Data inseted", values[0].recID);
                        resp(id);
                    }
                }
            });
        } catch (error) {
            rej(error);
        }
    });
}

function updateDataInDb(RecId, value, baseNo) {
    return new Promise((resp, rej) => {
        try {
            cloudsql.query(
                `UPDATE back_to_school SET 
        Id_copy=?,
        DateTime_of_visit=?,
        Met_person_number=?,
        Gender_of_Met_Person=?,
        Age_of_Met_Person=?,
        Met_person_Name=?,
        Village_Name=?,
        Met_Person_Type=?,
        Number_of_Children=?,
        Name_of_children=?,
        Age_of_Child=?,
        Other_Met_Person_Type=?,
        Number_of_Family_members=?,
        No_of_schools_in_village=?,
        Distance_of_closet_school=?,
        how_children_go_to_school=?,
        What_are_the_facilities_provided_to_you_by_the_school=?,
        if_others_please_mention=?,
        AftrCorona_teachers_cometohouse_under_SarvaShikshaAbhiyan=?,
        Any_Remark=?,
        State_Name=?,
        District_Name=?,
        Taluka_Name=?,
        Pincode=?,
        GPS_Location=?,
        Gender_of_the_child=?,
        What_did_the_child_do_in_2_years_of_Corona=?,
        If_there_is_an_online_class_how_is_it_done=?,
        How_did_you_get_internet_access=?,
        In_which_class_were_you_before_Corona=?,
        In_which_class_are_you_after_Corona=?,
        Why_has_the_child_left_studies=?,
        Other_reasons_for_dropping_out=?,
        Full_name_and_address_of_the_school=?,
        Type_of_school=?,
        Does_your_child_have_any_academic_problems=?,
        Does_your_child_need_any_academic_help=?,
        Filled_By=?,
        Filled_Time=?,
        Modified_By=?,
        Modified_Time=?,
        QA_Remark=?,
        QA_Done_By=?,
        QA_Call_Status=?,
        QA_Status=?,
        Rejection_Reason=?,
        QA_Done_Date=? 
        WHERE RecId="${RecId}" and Base_Name="${baseNo}";`,
                [
                    value[0].Id_copy,
                    value[0].DateTime_of_visit,
                    value[0].Met_person_number,
                    value[0].Gender_of_Met_Person,
                    value[0].Age_of_Met_Person,
                    value[0].Met_person_Name,
                    value[0].Village_Name,
                    value[0].Met_Person_Type,
                    value[0].Number_of_Children,
                    value[0].Name_of_children,
                    value[0].Age_of_Child,
                    value[0].Other_Met_Person_Type,
                    value[0].Number_of_Family_members,
                    value[0].No_of_schools_in_village,
                    value[0].Distance_of_closet_school,
                    value[0].how_children_go_to_school,
                    value[0].What_are_the_facilities_provided_to_you_by_the_school,
                    value[0].if_others_please_mention,
                    value[0].AftrCorona_teachers_cometohouse_under_SarvaShikshaAbhiyan,
                    value[0].Any_Remark,
                    value[0].State_Name,
                    value[0].District_Name,
                    value[0].Taluka_Name,
                    value[0].Pincode,
                    value[0].GPS_Location,
                    value[0].Gender_of_the_child,
                    value[0].What_did_the_child_do_in_2_years_of_Corona,
                    value[0].If_there_is_an_online_class_how_is_it_done,
                    value[0].How_did_you_get_internet_access,
                    value[0].In_which_class_were_you_before_Corona,
                    value[0].In_which_class_are_you_after_Corona,
                    value[0].Why_has_the_child_left_studies,
                    value[0].Other_reasons_for_dropping_out,
                    value[0].Full_name_and_address_of_the_school,
                    value[0].Type_of_school,
                    value[0].Does_your_child_have_any_academic_problems,
                    value[0].Does_your_child_need_any_academic_help,
                    value[0].Filled_By,
                    value[0].Filled_Time,
                    value[0].Modified_By,
                    value[0].Modified_Time,
                    value[0].QA_Remark,
                    value[0].QA_Done_By,
                    value[0].QA_Call_Status,
                    value[0].QA_Status,
                    value[0].Rejection_Reason,
                    value[0].QA_Done_Date,

                ],
                (err, result) => {
                    if (err) {
                        console.log("errrrrrrrr", err);
                        rej(err);
                    } else {
                        console.log("successsss");
                        resp();
                    }
                }
            );
        } catch (error) {
            rej(error);
        }
    });
}



module.exports = { insertDataInDb, updateDataInDb, insertBackToSchoolData };
