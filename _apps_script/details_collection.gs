/**
 * Details collection — Google Apps Script side.
 *
 * NOT part of the built site (Jekyll ignores _-prefixed folders). This is the
 * code for a SEPARATE, STANDALONE Apps Script project pointed at a SEPARATE
 * spreadsheet from the registrations one. Keep it separate: this holds home
 * addresses and dates of birth, and redeploying it must never be able to break
 * the live registration form that takes money.
 *
 * Spreadsheet layout — two tabs:
 *
 *   People      A Token   B Name   C Email   D Sent at   E Completed at
 *   Responses   A Token   B Submitted at   C Date of birth   D Street   E Postcode   F City
 *
 * `People` is filled from invites.csv, produced by _db/make_invites.py.
 * `Responses` NEVER contains a name or an email — the two tabs join on the
 * token, which is what lets the response export be handed to an analyst.
 *
 * The page at https://www.salsalastyle.dk/details?t=<token> talks to this with
 * a plain POST and no custom headers, so the browser sends no CORS preflight —
 * the same transport the registration forms already use.
 *
 * The invitation mail-merge deliberately lives in a separate file,
 * details_invites.gs, and is NOT part of this project. Apps Script decides
 * which permissions to request by scanning for API usage, so keeping GmailApp
 * out of here means the deployed web app is authorised for spreadsheets only
 * and is incapable of sending mail.
 *
 * DEPLOY: Deploy → New deployment → Web app →
 *   Execute as: Me
 *   Who has access: Anyone            ← required; the visitor is not logged in
 * then paste the /exec URL into SCRIPT_URL in details.md.
 *
 * SECURITY. "Anyone" means this URL is reachable by the whole internet and runs
 * with your Drive permissions. The token is the only gate. Therefore:
 *   - a lookup returns the name and nothing else, ever;
 *   - an unknown token returns a generic failure with no detail;
 *   - nothing here ever returns a list, a count, or another person's row.
 * Keep it that way when you edit this file.
 */

// The details-collection spreadsheet. This is a STANDALONE script that opens
// the sheet by id rather than a bound one, so the target is explicit and the
// project is reachable at script.google.com even if the sheet is moved.
var SPREADSHEET_ID = '1s0HQmLsDmioK57JKVLdqmWSgjeU_Xim-EM3ONd1uv4k';

var PEOPLE_SHEET    = 'People';
var RESPONSES_SHEET = 'Responses';

function ss_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

var PEOPLE_HEADERS    = ['Token', 'Name', 'Email', 'Sent at', 'Completed at'];
var RESPONSES_HEADERS = ['Token', 'Submitted at', 'Date of birth', 'Street', 'Postcode', 'City'];


function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var token = String(data.token || '').trim();

    if (!token) return json({ result: 'error' });

    var row = findPersonRow_(token);
    if (!row) return json({ result: 'error' });        // deliberately no detail

    if (data.action === 'lookup') {
      // The name, and only the name. Never the email, never the row.
      return json({
        result: 'success',
        name: row.name,
        completed: !!row.completedAt
      });
    }

    if (data.action === 'save') {
      saveResponse_(row, data);
      return json({ result: 'success' });
    }

    return json({ result: 'error' });

  } catch (err) {
    Logger.log('details doPost failed: ' + err);
    return json({ result: 'error' });
  }
}


/**
 * A GET is what someone gets if they paste the /exec URL into the address bar.
 * Send them to the real page rather than showing them a raw script response.
 */
function doGet(e) {
  var token = (e && e.parameter && e.parameter.t) ? e.parameter.t : '';
  var url = 'https://www.salsalastyle.dk/details' + (token ? '?t=' + encodeURIComponent(token) : '');
  return HtmlService.createHtmlOutput(
    '<script>window.location.href=' + JSON.stringify(url) + ';</script>' +
    '<p>Redirecting to <a href="' + url + '">salsalastyle.dk</a>…</p>');
}


function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Linear scan of the People tab. Fine at this size — a few hundred rows — and
 * it avoids keeping a second index that could drift out of step.
 */
function findPersonRow_(token) {
  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;

  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, PEOPLE_HEADERS.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === token) {
      return {
        rowNumber:   i + 2,
        token:       String(values[i][0]).trim(),
        name:        String(values[i][1]),
        completedAt: values[i][4]
      };
    }
  }
  return null;
}


/**
 * One row per person in Responses: submitting again replaces what is there,
 * so a correction does not become a second conflicting record.
 */
function saveResponse_(person, data) {
  var ss    = ss_();
  var sheet = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET);
  ensureHeaders_(sheet, RESPONSES_HEADERS);

  var now = new Date();
  var row = [
    person.token,
    now,
    String(data.dob      || '').trim(),
    String(data.street   || '').trim(),
    String(data.postcode || '').trim(),
    String(data.city     || '').trim()
  ];

  var existing = 0;
  if (sheet.getLastRow() >= 2) {
    var tokens = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < tokens.length; i++) {
      if (String(tokens[i][0]).trim() === person.token) { existing = i + 2; break; }
    }
  }

  if (existing) {
    sheet.getRange(existing, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  // Stamp the People tab so reminders can skip whoever has already answered.
  ss_().getSheetByName(PEOPLE_SHEET).getRange(person.rowNumber, 5).setValue(now);
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


/**
 * Run once from the editor to lay out a fresh spreadsheet.
 */
function setUpSheets() {
  var ss = ss_();
  var people = ss.getSheetByName(PEOPLE_SHEET) || ss.insertSheet(PEOPLE_SHEET);
  ensureHeaders_(people, PEOPLE_HEADERS);
  var responses = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET);
  ensureHeaders_(responses, RESPONSES_HEADERS);
}
