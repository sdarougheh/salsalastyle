/**
 * Invitation mail-merge — deliberately NOT part of the deployed script.
 *
 * Apps Script decides which permissions to request by scanning the code for
 * API usage, so the mere presence of GmailApp anywhere in the project makes
 * Google ask for permission to send mail as you. Keeping this in a separate
 * file means the deployed web app is authorised for spreadsheets only and is
 * incapable of sending an email, which is a better place to be while the
 * invitation text is still unwritten.
 *
 * When the text is ready: add a file to the Apps Script project, paste this
 * in, fill in SUBJECT and BODY_TEMPLATE, save, and run sendInvites() from the
 * editor. Google will then ask for the Gmail permission, once.
 *
 * It skips anyone already stamped in "Sent at", so re-running after adding
 * people to the tab sends only to the new ones. Change the filter to
 * "Completed at" instead to chase non-responders.
 *
 * Gmail's daily cap on a free account is 100 recipients; check
 * GmailApp.getRemainingDailyQuota() before a bigger run.
 */
function sendInvites() {
  throw new Error('sendInvites() is not ready: write SUBJECT and BODY_TEMPLATE first, ' +
                  'then delete this line.');

  var SUBJECT = '';                 // ← to be written
  var BODY_TEMPLATE = '';           // ← to be written; use {{name}} and {{link}}

  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  var rows  = sheet.getRange(2, 1, sheet.getLastRow() - 1, PEOPLE_HEADERS.length).getValues();
  var sent  = 0;

  for (var i = 0; i < rows.length; i++) {
    var token = String(rows[i][0]).trim();
    var name  = String(rows[i][1]);
    var email = String(rows[i][2]).trim();
    var sentAt = rows[i][3];
    if (!token || !email || sentAt) continue;

    var link = 'https://www.salsalastyle.dk/details?t=' + encodeURIComponent(token);
    var body = BODY_TEMPLATE.replace(/\{\{name\}\}/g, name).replace(/\{\{link\}\}/g, link);

    GmailApp.sendEmail(email, SUBJECT, body);
    sheet.getRange(i + 2, 4).setValue(new Date());
    sent++;
  }
  Logger.log('sent ' + sent + ' invitation(s)');
}
