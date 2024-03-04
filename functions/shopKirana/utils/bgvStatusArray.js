const reportReceivedMessage = "ReportReceivedQAPending";

const bgvOpenStatusArray = {
  "Waiting On Partner-1stFE": "WaitingOnPartner",
  "Waiting On Partner-2ndFE": "WaitingOnPartner2ndFE",
  "Waiting On Partner-3rdFE": "WaitingOnPartner3rdF",
  "Partner Identified-1stFE": "VisitInProgress",
  "Partner Identified-2ndFE": "VisitInProgress2ndFE",
  "Partner Identified-3rdFE": "VisitInProgress3rdFE",
  "Need Change to 2ndFE": "NeedChangeto2ndFE",
  "Need Change to 3rdFE": "NeedChangeto3rdFE",
  "Report Received, QA Pending": "ReportReceivedQAPending",
  "QA in Process, Query to FE": "QAinProcessQuerytoFE",
  "QA Call Pending": "QACallPending",
  "QA Completed, Report Sent": "QACompletedReportSent",
  "Stop Check": "StopbyCustomer",
  "Query Raised To Customer": "QueryRaisedToCustomer",
  "Query Raise to Customer beyond 5 days": "QueryRaisetoCustomerbeyond5days",
  "Returned to Customer": "ReturnedToCustomer",
  "Insufficient Data": "ReportInsuff",
  "Lost due to SLA Overdue": "LostDueToSLAOverdue",
  Pending: "Pending",
  "FreshDesk Case": "Freshdesk",
  Closed: "Closed",
  "Query Reverted By Customer": "QueryRevertedbyCustomer",
  Open: "Open",
};

module.exports = { bgvOpenStatusArray, reportReceivedMessage };
