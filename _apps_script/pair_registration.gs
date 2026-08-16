/**
 * "With a Friend" pair registration — Google Apps Script side.
 *
 * NOT part of the built site (Jekyll ignores _-prefixed folders). This is the
 * code for the Apps Script project behind SCRIPT_URL in registration_friend.md
 * (Sheet → Extensions → Apps Script). Nothing on /registration_friend works
 * until this is pasted in AND re-deployed as a NEW VERSION of the EXISTING
 * deployment (Deploy → Manage deployments → pencil → Version: New version).
 *
 * What the pair form posts:
 *
 *   { type: "pair",
 *     classes: ["Beginners Autumn"],
 *     discount: "20%",
 *     amount: 1280, currency: "DKK",
 *     people: [ {name, email, role}, {name, email, role} ],
 *     comments, referral, recaptchaToken }
 *
 * It writes ONE ROW PER PERSON to 'Registrations' — the same 8 columns as a
 * normal registration, plus 4 more:
 *
 *   I  Pair ID       shared id — this is the column that links the two rows
 *   J  Pair Partner  the other person's name, for reading the sheet by eye
 *   K  Discount      "20%"
 *   L  Amount Due    640 on each row (they pay 1280 together, in one payment)
 *
 * Column C ("young"/under-30) is left blank: the pair form doesn't ask, because
 * the pair price is the same for everyone and already beats the student price.
 *
 * The Pair ID is returned to the browser and shown on the success page as the
 * MobilePay reference, so one incoming payment can be matched to both rows.
 */

/**
 * Replaces the existing doPost. The only change is the `data.type === 'pair'`
 * branch after the sheet is opened — everything else is untouched.
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Verify reCAPTCHA
    var recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    var payload = {
      'secret': '6Ld7gCcsAAAAAFdodJCNQo4CTqE0zMFioeD-Wi1J',
      'response': data.recaptchaToken
    };

    var options = {
      'method': 'post',
      'payload': payload
    };

    var response = UrlFetchApp.fetch(recaptchaUrl, options);
    var result = JSON.parse(response.getContentText());

    if (!result.success || result.score < 0.3) {
      return ContentService
        .createTextOutput(JSON.stringify({'result': 'error', 'error': 'Spam detected'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Write to spreadsheet (your original working code)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
    var timestamp = new Date();

    // "With a friend" signup: both people arrive in one request and are written
    // as two linked rows, then both get a confirmation email.
    if (data.type === 'pair') {
      var pairId = handlePairRegistration_(data, sheet, timestamp);

      try {
        data.people.forEach(function(person, i) {
          sendConfirmationEmail({
            name: person.name,
            email: person.email,
            classes: data.classes,
            role: person.role,
            comments: data.comments,
            young: '',
            // Extra context in case you want a pair-specific email later.
            pairId: pairId,
            pairPartner: data.people[1 - i].name,
            amountDue: data.amount
          });
        });
      } catch(emailError) {
        Logger.log('Pair email failed but registration succeeded: ' + emailError.toString());
      }

      return ContentService
        .createTextOutput(JSON.stringify({'result': 'success', 'pairId': pairId}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    data.classes.forEach(function(className) {
      sheet.appendRow([
        timestamp,
        data.name,
        data.young,
        data.email,
        className,
        data.role,
        data.comments,
        data.referral || ''          // ← postcard/campaign referral
      ]);
    });

    // Try to send email, but don't let it break registration if it fails
    try {
      sendConfirmationEmail(data);
    } catch(emailError) {
      Logger.log('Email failed but registration succeeded: ' + emailError.toString());
      // Continue anyway - registration is more important than email
    }

    return ContentService
      .createTextOutput(JSON.stringify({'result': 'success'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({'result': 'error', 'error': error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Writes the two linked rows and returns the shared pair id.
 * Same column order as a normal registration, with the four pair columns
 * appended — so the sheet stays readable either way.
 */
function handlePairRegistration_(data, sheet, timestamp) {
  var people = data.people || [];
  if (people.length !== 2) {
    throw new Error('A pair registration needs exactly two people');
  }
  for (var i = 0; i < 2; i++) {
    if (!people[i] || !people[i].name || !people[i].email) {
      throw new Error('Both people need a name and an email');
    }
  }

  var pairId = 'P-' + Utilities.getUuid().replace(/-/g, '').substring(0, 6).toUpperCase();
  var className = (data.classes || []).join(', ');
  // One payment covers both, so the total is split evenly across the two rows.
  var perPerson = data.amount ? (Number(data.amount) / 2) : '';

  ensurePairHeaders_(sheet);

  people.forEach(function(person, idx) {
    sheet.appendRow([
      timestamp,
      person.name,
      '',                          // under-30 — not asked on the pair form
      person.email,
      className,
      person.role,
      data.comments,
      data.referral || '',
      pairId,                      // I — links the two rows
      people[1 - idx].name,        // J
      data.discount || '',         // K
      perPerson                    // L
    ]);
  });

  return pairId;
}

/**
 * Labels columns I–L in the header row, once. Skipped entirely if row 1 holds
 * data rather than headers (a real registration always starts with a Date in
 * column A), so an unlabelled sheet is never corrupted.
 */
function ensurePairHeaders_(sheet) {
  var labels = ['Pair ID', 'Pair Partner', 'Discount', 'Amount Due'];

  if (sheet.getLastRow() === 0) return;
  if (sheet.getRange(1, 1).getValue() instanceof Date) return;   // row 1 is data

  var range = sheet.getRange(1, 9, 1, labels.length);
  var current = range.getValues()[0];
  var needsLabels = current.some(function(v, i) {
    return String(v).trim() !== labels[i];
  });
  if (needsLabels) {
    range.setValues([labels]);
  }
}


/**
 * TEMPORARY TEST — run this from the Apps Script editor (Run ▶) to exercise the
 * pair path without reCAPTCHA, which is domain-locked to salsalastyle.dk and so
 * can't be satisfied from a local build or a curl.
 *
 * Writes two real rows to 'Registrations'. Delete them afterwards.
 * Sends no email; flip SEND_EMAIL to true to test that too.
 */
function testPairRegistration() {
  var SEND_EMAIL = false;

  var data = {
    type: 'pair',
    classes: ['Beginners Autumn'],
    discount: '20%',
    amount: 1280,
    currency: 'DKK',
    people: [
      { name: 'TEST Anna Nielsen', email: 'anna@example.com', role: 'Follow' },
      { name: 'TEST Bo Jensen',    email: 'bo@example.com',   role: 'Lead'   }
    ],
    comments: 'test pair — delete me',
    referral: 'test'
  };

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  var pairId = handlePairRegistration_(data, sheet, new Date());

  if (SEND_EMAIL) {
    data.people.forEach(function(person, i) {
      sendConfirmationEmail({
        name: person.name, email: person.email, classes: data.classes,
        role: person.role, comments: data.comments, young: '',
        pairId: pairId, pairPartner: data.people[1 - i].name, amountDue: data.amount
      });
    });
  }

  Logger.log('Pair ID: ' + pairId + ' — check the last two rows of the sheet, then delete them.');
  return pairId;
}
