/**
 * Details collection — the shared half. This is "Code.gs" in the Apps Script
 * project "Salsa LA-Style - details collection".
 *
 * NOT part of the built site (Jekyll ignores _-prefixed folders).
 *
 * This file used to serve a web app behind salsalastyle.dk/details. That page
 * is gone: it made a background request to script.google.com, and tracker
 * blockers stop exactly that kind of request while leaving ordinary page loads
 * alone, so it looked broken for some people and fine for everyone else. The
 * Google Form in Form.gs replaced it — a form makes no cross-origin call, so
 * there is nothing for a blocker to interrupt.
 *
 * What is left here is the plumbing the Form still needs: which spreadsheet,
 * which tab, and the columns of it. Form.gs and the invitation mail-merge both
 * call ss_() and use PEOPLE_SHEET, so do not delete this file.
 *
 * Spreadsheet layout:
 *
 *   People              A Token  B Name  C Email  D Sent at  E Completed at  F Link
 *   Form responses 1    created and owned by the Form; do not hand-edit
 *
 * `People` is filled from invites.csv, produced by _db/make_invites.py.
 *
 * The old web app deployment should be archived (Deploy → Manage deployments →
 * Archive). It is a world-reachable endpoint that returns a name for a valid
 * token, and nothing points at it any more.
 */

var SPREADSHEET_ID = '1s0HQmLsDmioK57JKVLdqmWSgjeU_Xim-EM3ONd1uv4k';

var PEOPLE_SHEET = 'People';
var PEOPLE_HEADERS = ['Token', 'Name', 'Email', 'Sent at', 'Completed at', 'Link'];


function ss_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}


/** Run once to lay out a fresh spreadsheet. */
function setUpSheets() {
  var people = ss_().getSheetByName(PEOPLE_SHEET) || ss_().insertSheet(PEOPLE_SHEET);
  ensureHeaders_(people, PEOPLE_HEADERS);
}


function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return;
  }
  var current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var needs = current.some(function (v, i) { return String(v).trim() !== headers[i]; });
  if (needs) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}
