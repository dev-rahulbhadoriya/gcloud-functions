const cloudsql = require("../utils/cloudSql");
const { getFormData, getAllFields } = require("./blueStar_commonFile");
const { 
    insertToBlueStarDataAirtable,
    updateBlueStarDataAirtable,
    checkBlueStarDataPreviousData,
    checkBlueStarDataQaStatus
      } = require("./blueStarAirtable");
const {
    insertBlueStarDataSql,
    updateBlueStarDataSql,
    updateBlueStarDataIdSql} = require("./blueStarSql")
function blueStarData(_request, _response) {
    try {
        getFormData(_request.body.form.formId.toString())
            .then((formData) => {
                // console.log("FormData ----------------->>>>", formData);
                let hasOrders = formData.sectionFields.length !== 0 ? true : false;
                // console.log("hasOrders outside the block", hasOrders);
                getAllFields(formData,hasOrders)
                    .then(({fields,orders}) => {
                        fields["FormId"] = formData.form.formId;
                        fields["Filled Time"] = formData.form.createdTime;
                        fields["Filled By"] = formData.form.filledByName;
                        fields["Modified By"] = formData.form.modifiedByName;
                        fields["Modified Time"] = formData.form.modifiedTime;
                        fields["42. Extra Photo"] = orders;

                        // console.log("Fields-------------->>>>>", fields);
                        cloudsql.query(
                            `SELECT * FROM blueStarData WHERE FormId=${fields.FormId};`,
                            (err, result) => {
                                console.log("result blue star ======",result.length);
                                if (err) {
                                    _response.send(err).status(500);
                                }
                                if (result.length > 0) {
                                    //if airtable id is not found
                                    //current base
                                    //update airtableId and
                                    if (result[0].airtableId) {
                                        checkBlueStarDataQaStatus(
                                            result[0].airtableId,
                                            result[0].basechange
                                        )
                                            .then(() => {
                                                updateBlueStarDataSql(fields)
                                                    .then(() => {
                                                        updateBlueStarDataAirtable(
                                                            fields.FormId,
                                                            result[0].airtableId,
                                                            result[0].basechange
                                                        ).then(() => {
                                                            console.info("BlueStar_DATA_UPDATED");
                                                            _response.status(200).end();
                                                        });
                                                    })
                                                    .catch((err) => {
                                                        console.error(
                                                            "BlueStar_DATA_UPDATE_ERROR",
                                                            new Error(err)
                                                        );
                                                        _response.status(500).end();
                                                    });
                                            })
                                            .catch(() => {
                                                console.log(
                                                    "NOT UPDATED AS QA APPROVED",
                                                    fields.FormId
                                                );
                                                _response.status(500).end();
                                            });
                                    } else {
                                        //  console.log(fields.fields.Id, result[0].basechange);
                                        checkBlueStarDataPreviousData(
                                            fields.FormId,
                                            result[0].basechange
                                        )
                                            .then((recId) => {
                                                if (recId == 0) {
                                                    console.log(
                                                        "Id Not Found In Base",
                                                        fields.FormId
                                                    );
                                                    _response.status(500).end();
                                                } else {
                                                    checkBlueStarDataQaStatus(recId, result[0].basechange)
                                                        .then(() => {
                                                            console.log(
                                                                "QA status check",
                                                                result[0].basechange
                                                            );
                                                            updateBlueStarDataAirtable(
                                                                fields.FormId,
                                                                recId,
                                                                result[0].basechange
                                                            )
                                                                .then(() => {
                                                                    updateBlueStarDataIdSql(
                                                                        fields.FormId,
                                                                        recId
                                                                    )
                                                                        .then(() => {
                                                                            // console.info(" @@ BlueStar_DATA_INSERTED");
                                                                            _response
                                                                                .send("success")
                                                                                .status(200)
                                                                                .end();
                                                                        })
                                                                        .catch((err) => {
                                                                            console.log(
                                                                                "BlueStar_DATA_UPDATE_ERROR",
                                                                                new Error(err)
                                                                            );
                                                                            _response.send(err).end();
                                                                        });
                                                                })
                                                                .catch((err) => {
                                                                    console.log(
                                                                        "BLUE_STAR_DATA_UPDATE_ERROR",
                                                                        new Error(err)
                                                                    );
                                                                    _response.send(err).end();
                                                                });
                                                        })
                                                        .catch((err) => {
                                                            console.log(
                                                                "BLUESTAR_DATA_QA_ERROR",
                                                                new Error(err)
                                                            );
                                                            _response.send(err).end();
                                                        });
                                                }
                                            })
                                            .catch((err) => {
                                                console.log(
                                                    "BLUESTAR_DATA_QA_ERROR",
                                                    new Error(err)
                                                );
                                                _response.send(err).end();
                                            });
                                    }
                                } else {
                                    const basechange = 1;
                                    insertBlueStarDataSql(fields, basechange)
                                        .then(() => {
                                            insertToBlueStarDataAirtable(
                                                fields.FormId,
                                                basechange
                                            )
                                            .then((recordId) => {
                                                    updateBlueStarDataIdSql(
                                                        fields.FormId,
                                                        recordId
                                                    )
                                                        .then(() => {
                                                            console.log("BlueStar_INSERTED BASE");
                                                            _response.status(200).end();
                                                        })
                                                        .catch((err) => {
                                                            console.log(
                                                                "BlueStar_DATA_UPDATE_ERROR",
                                                                new Error(err)
                                                            );
                                                            _response.send(err).end();
                                                        });
                                                })
                                                .catch((err) => {
                                                    console.log(
                                                        "BLUESTAR_DATA_INSERT_ERROR",
                                                        new Error(err)
                                                    );
                                                    _response.send(err).end();
                                                });
                                            // }
                                        })
                                        .catch((err) => {
                                            console.log("BLUESTAR_DATA_INSERT_ERROR", new Error(err));
                                            _response.send(err).end();
                                        });
                                }
                            }
                        );
                    })
                    .catch((err) => {
                        console.log("Blue_STAR_GET_FIELDS_ERROR", new Error(err));
                        _response.send(err).end();
                    });
            })
            .catch((err) => {
                console.log("BLUE_STAR_GET_DATA_ERROR", new Error(err));
                _response.send(err).end();
            });
    } catch (err) {
        console.error("BLUE_STAR_SQLINSERT_FAILED", new Error(err));
        _response.send(err).end();
    }
}

module.exports = {
    blueStarData
}