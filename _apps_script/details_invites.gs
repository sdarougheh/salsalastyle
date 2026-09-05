/**
 * Invitation mail-merge — deliberately NOT part of the deployed web app.
 *
 * Apps Script decides which permissions to request by scanning the code for
 * API usage, so the mere presence of GmailApp in a project makes Google ask
 * for permission to send mail as you. Keeping this out of the deployed script
 * means the web app cannot send an email even if it wanted to.
 *
 * To use it: add a file to the Apps Script project (Files → + → Script), paste
 * this in, save, and run sendInvites() from the editor. Google asks for the
 * Gmail permission once, at that point — not before.
 *
 * PREREQUISITE: every person must already have a personal form link in
 * People!F. That is what makeFormLinks() in Form.gs writes. Without it there
 * is nothing to send, and sendInvites() will refuse rather than send someone
 * a blank or generic link.
 *
 * It skips anyone already stamped in "Sent at", so re-running after adding
 * people sends only to the new ones. Set REMINDER_MODE to chase the people who
 * have not answered instead.
 *
 * Gmail's daily cap on a free account is 100 recipients — above the current
 * list, but check GmailApp.getRemainingDailyQuota() before a bigger run.
 */

// Send as the school, not as whoever happens to own the script. This only
// works if the address is a VERIFIED send-as alias on the account running the
// script (Gmail → Settings → Accounts and Import → Send mail as). It is not a
// spoof: Gmail will refuse an address it has not verified, and sendInvites_()
// checks up front rather than discovering it 40 messages in.
//
// Set to '' to send from the account's own address.
var SEND_AS = 'salsalastyledk@gmail.com';
var SEND_AS_NAME = 'Salsa LA-Style';

var SUBJECT = 'A minute of your time — Salsa LA-Style needs two details';

// {{name}} and {{link}} are filled in per person. {{link}} MUST be the personal
// prefilled link from People!F: it carries the reference that ties the answer
// back to the right person. The plain form address would arrive with nothing
// filled in and no way to tell whose reply is whose.
var BODY_TEMPLATE = [
  'Dear {{name}},',
  '',
  "We're really happy that the school is growing -- and so is the need to keep records!",
  '',
  'To comply with Danish law, we need from you your birthday and your current address.',
  'Please fill them in the form below, it takes only a minute. Please reach out if you',
  'have any questions.',
  '',
  'Link to the form: {{link}}',
  '',
  'Thank you so much for your help!',
  'Saman and the team of Salsa LA-Style'
].join('\n');

// false: send to everyone not yet emailed.  true: re-send only to people who
// were emailed but have not answered.
var REMINDER_MODE = false;

var LINK_COLUMN_ = 6;         // People!F, written by makeFormLinks()
var SENT_COLUMN_ = 4;         // People!D


/**
 * Sends the invitation. Run sendInvitesDryRun() first — it logs exactly who
 * would be written to and what the first message looks like, and sends nothing.
 */
function sendInvites() {
  return sendInvites_(false);
}

function sendInvitesDryRun() {
  return sendInvites_(true);
}


function sendInvites_(dryRun) {
  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  if (!sheet || sheet.getLastRow() < 2) throw new Error('No rows in ' + PEOPLE_SHEET);

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, LINK_COLUMN_).getValues();
  var queue = [], skipped = [];

  for (var i = 0; i < rows.length; i++) {
    var token = String(rows[i][0]).trim();
    var name  = String(rows[i][1]).trim();
    var email = String(rows[i][2]).trim();
    var sentAt = rows[i][3];
    var completedAt = rows[i][4];
    var link  = String(rows[i][5]).trim();

    if (!token && !email) continue;                       // blank row
    if (!email)  { skipped.push(token + ': no email'); continue; }
    if (!link)   { skipped.push(token + ': no link in column F — run makeFormLinks()'); continue; }
    if (link.indexOf('viewform') === -1 || link.indexOf('entry.') === -1) {
      skipped.push(token + ': column F is not a prefilled link'); continue;
    }
    if (REMINDER_MODE) {
      if (!sentAt || completedAt) continue;               // only the unanswered
    } else {
      if (sentAt) continue;                               // only the not-yet-sent
    }
    queue.push({ row: i + 2, name: name, email: email, link: link });
  }

  if (skipped.length) {
    Logger.log('SKIPPED ' + skipped.length + ':');
    skipped.forEach(function (s) { Logger.log('  ' + s); });
  }

  if (!queue.length) {
    Logger.log('Nothing to send.');
    return 0;
  }

  var sendOptions = { name: SEND_AS_NAME };
  if (SEND_AS) {
    var aliases = GmailApp.getAliases();
    if (aliases.indexOf(SEND_AS) === -1) {
      throw new Error(
        'Cannot send as ' + SEND_AS + ': it is not a verified send-as alias on ' +
        'this account. Available: ' + (aliases.length ? aliases.join(', ') : '(none)') +
        '. Add it in Gmail → Settings → Accounts and Import → "Send mail as" ' +
        '(Google emails a confirmation link to that address), or set SEND_AS to ' +
        "'' to send from the account's own address.");
    }
    sendOptions.from = SEND_AS;
    sendOptions.replyTo = SEND_AS;
  }

  var quota = GmailApp.getRemainingDailyQuota();
  Logger.log((dryRun ? 'DRY RUN — ' : '') + 'would send ' + queue.length +
             ' message(s); Gmail quota remaining today: ' + quota);
  Logger.log('--- first message ---');
  Logger.log('From: ' + (SEND_AS || '(this account)') + ' as "' + SEND_AS_NAME + '"');
  Logger.log('To: ' + queue[0].email);
  Logger.log('Subject: ' + SUBJECT);
  Logger.log(render_(queue[0]));
  Logger.log('---------------------');

  if (dryRun) return queue.length;

  if (queue.length > quota) {
    throw new Error('Need ' + queue.length + ' sends but only ' + quota +
                    ' left today. Wait for the quota to reset rather than ' +
                    'sending half the list.');
  }

  var sent = 0;
  for (var j = 0; j < queue.length; j++) {
    GmailApp.sendEmail(queue[j].email, SUBJECT, render_(queue[j]), sendOptions);
    sheet.getRange(queue[j].row, SENT_COLUMN_).setValue(new Date());
    sent++;
  }
  Logger.log('Sent ' + sent + ' invitation(s).');
  return sent;
}


function render_(entry) {
  return BODY_TEMPLATE
    .replace(/\{\{name\}\}/g, firstName_(entry.name))
    .replace(/\{\{link\}\}/g, entry.link);
}


/** "Helena Sørensen Møller" → "Helena". The greeting is a first name. */
function firstName_(full) {
  var parts = String(full).trim().split(/\s+/);
  return parts.length ? parts[0] : full;
}
