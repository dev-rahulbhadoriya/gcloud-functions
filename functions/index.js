const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors")({ origin: true });
const bodyParser = require("body-parser");

const cloudsql = require("./utils/cloudSql");
const { getAllFields, getFormData } = require("./utils/commonFunctions");
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.text({ defaultCharset: "utf-8" }));
app.use;



//Function getting data from sql show's on web content in anaxee partner application ------->

const webDataQuery = require("./utils/webDataQuery");
exports.getWebData = functions
  .region("asia-south1")
  .https.onRequest((_req, _res) => {
    const databody = _req.body;
    console.log("Body", JSON.stringify(databody));

    const dataFileds = {};
    for (const el in databody) {
      dataFileds[el] = databody[el];
    }
    try {
      webDataQuery
        .getWebData(dataFileds)
        .then((result) => {
          console.log(result);
          _res.set("Access-Control-Allow-Methods", "*");
          _res.set("Access-Control-Allow-Headers", "*");
          _res.status(200).send(JSON.stringify(result));
        })
        .catch((err) => {
          console.log("Sql check failed", err);
          _res.status(500).send("Sql connnetion Failed");
        });
    } catch (error) {
      _res.status(500).send("Failed");
    }
  });

const tempates_1 = require("./utils/templates");
app.get("/", (_req, _res) => {
  const phoneNumber = _req.query.number;
  _res.send(tempates_1.webViewHtml(phoneNumber));
});

//Function for display data on web page for anaxee partner application ----->

exports.webDataHtmlPage = functions.region("asia-south1").https.onRequest(app);

//parterApp api
exports.insertRunnerIssueAirtable = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 320 })
  .https.onRequest((_request, _response) => {
    sendRunnerIssueToAirtable(_request, _response);
  });


exports.vyaparDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 256 })
  .https.onRequest((_request, _response) => {
    vayparData(_request, _response);
  });

exports.vyaparOnbordingDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 256 })
  .https.onRequest((_request, _response) => {
    vyparOnboradingfun(_request, _response);
  });


exports.sewaInternationalPrerakDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 256 })
  .https.onRequest((_request, _response) => {
    sewaInternationalPrerakForm(_request, _response);
  });


const { backToSchool, backToSchoolQa } = require("./backToSchoolFormData");
exports.backToSchoolDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 256 })
  .https.onRequest((_request, _response) => {
    backToSchool(_request, _response);
  });
exports.backToSchoolQAData = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 256 })
  .https.onRequest((_request, _response) => {
    backToSchoolQa(_request, _response);
  });


const { ttkBmstInternalData } = require("./TTK_BMST/index");
exports.ttkBmstInternalBaseData = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    ttkBmstInternalData(_request, _response);
  });



const { attendanceData } = require("./attendanceData/index");
exports.attendanceDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSecond: 540 })
  .https.onRequest((_request, _response) => {
    attendanceData(_request, _response);
  });

const { blueStarData } = require("./blueStar/index");
exports.blueStarDataFunctions = functions
  .region("asia-south1")
  .runWith({ timeoutSecond: 540 })
  .https.onRequest((_request, _response) => {
    blueStarData(_request, _response);
  });

const { wealthyData } = require("./wealthy/index");
exports.wealthyDataFunctions = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    wealthyData(_request, _response);
  });

const { VSTTrillerData } = require("./VstTriller/index");
exports.VSTTrillerDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    VSTTrillerData(_request, _response);
  });

const { shopKiranaData, shopKiranaAllotment } = require("./shopKirana/index");
exports.shopKiranaDataFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    shopKiranaData(_request, _response);
  });


const { tsDemoData } = require("./ts_baseToDb/index");
exports.tsDemoFunction = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    tsDemoData(_request, _response);
  });

// shopAllotment in function
exports.shopKiranaBGVStatusUpdateINCrm = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540 })
  .https.onRequest((_request, _response) => {
    shopKiranaAllotment(_request, _response);
  });