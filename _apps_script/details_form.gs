/**
 * Details collection via Google Forms — the blocker-proof route.
 *
 * Paste this into the "Salsa LA-Style - details collection" Apps Script
 * project as a SECOND FILE (Files → + → Script → name it "Form"), then run
 * createDetailsForm() once, and makeFormLinks() whenever People gains rows.
 *
 * Why a Form at all. The /details page on salsalastyle.dk makes a background
 * request to script.google.com, and tracker blockers stop exactly that kind of
 * request while leaving ordinary page loads alone — which is why the page can
 * look broken for some people and fine for everyone else. A Google Form makes
 * no cross-origin call: the page and the submission are the same origin, so
 * there is nothing for a blocker to interrupt.
 *
 * What each person gets is a PREFILLED link — their own URL with their token
 * and name already in the fields, so they only fill in the parts we don't know.
 *
 * The trade-off, stated plainly: a Form cannot make a field read-only. The
 * name is prefilled and labelled "please don't change it", but a determined
 * visitor could edit it, and because it is a real field the responses sheet
 * DOES contain names — unlike the old /details flow. So the response export is
 * no longer automatically safe to hand to an analyst: delete the Name column
 * first, or use `enrich.py --key token`, which ignores it.
 */

// CREATION ONLY. The live form's title, description and confirmation message
// are edited by hand in the Forms UI, and that copy is the real one — these
// constants are just what a brand-new form starts life with. Nothing pushes
// them onto an existing form; see applyFormLabels().
var FORM_TITLE = 'Salsa LA-Style — your details';

var FORM_DESCRIPTION =
  'To comply with Danish tax law, we need the following information from you.\n\n' +
  'Why we are asking. Danish VAT rules exempt dance teaching for participants ' +
  'under 30. To apply that exemption, the Danish Tax Agency requires us to be ' +
  "able to document each participant's full name, address and date of birth — " +
  'so all three are part of the record we have to keep, and the address is not ' +
  'an extra we have added on top.\n\n' +
  'We keep this with your class records and do not share it with anyone ' +
  'outside the services we need to run the school. You can ask us to correct ' +
  'it at any time. We cannot delete it on request while the tax rules require ' +
  'us to keep it, which is five years; after that we delete it. Email ' +
  'salsalastyledk@gmail.com. See ' +
  'https://www.salsalastyle.dk/privacy for the full detail, including how long ' +
  'we keep it and how to complain.';

var CONFIRMATION = 'Thank you so much for helping us';

// Item labels live here so applyFormLabels() can push a wording change onto a
// form that already exists. Renaming an item does NOT change its entry id, so
// prefilled links already sitting in people's inboxes keep working.
var TOKEN_TITLE = 'Reference';
var TOKEN_HELP  = 'Already filled in from your email link — please leave it as it is.';

var NAME_TITLE = 'Your legal name (please correct if incomplete)';
var NAME_HELP  = 'We have filled in the name you signed up with. If it is short of ' +
                 'your full legal name, please correct it — the tax rules need the ' +
                 'full one.';

var DOB_TITLE = 'Date of birth';
var DOB_HELP  = 'This is the part the tax rules require.';

// Script Properties keys — so makeFormLinks() can find the form and its fields
// again without anything being hard-coded to one particular form.
var PROP_FORM_ID = 'DETAILS_FORM_ID';
var PROP_TOKEN_ITEM = 'DETAILS_TOKEN_ITEM_ID';
var PROP_NAME_ITEM = 'DETAILS_NAME_ITEM_ID';

var LINK_COLUMN = 6;   // People!F — where the personal link is written


/**
 * Run once. Creates the form, points its responses at the details spreadsheet,
 * and remembers the ids the prefill needs.
 */
function createDetailsForm() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty(PROP_FORM_ID);

  // Idempotent on purpose. Creating a second form would orphan every link
  // already sent, so a re-run reuses the form that exists and just tops up
  // the links for any People rows added since.
  if (existingId) {
    var existing = FormApp.openById(existingId);
    // The wording is NOT re-applied. The title and description are edited by
    // hand in the Forms UI, so the live form is the authority on them —
    // re-running this to top up the links must not cost someone their copy.
    Logger.log('Form already exists — reusing it. Wording left untouched.');
    Logger.log('Published: ' + existing.getPublishedUrl());
    Logger.log('Links written: ' + makeFormLinks());
    return existing.getPublishedUrl();
  }

  var form = FormApp.create(FORM_TITLE);
  applyFormCopy_(form);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);
  form.setCollectEmail(false);

  // Anonymous response, no Google account needed. Not available on consumer
  // accounts (where it is already the behaviour), so failure here is fine.
  try { form.setRequireLogin(false); } catch (e) {}

  var token = form.addTextItem()
    .setTitle(TOKEN_TITLE).setHelpText(TOKEN_HELP).setRequired(true);

  var name = form.addTextItem()
    .setTitle(NAME_TITLE).setHelpText(NAME_HELP).setRequired(true);

  form.addDateItem()
    .setTitle(DOB_TITLE).setHelpText(DOB_HELP)
    .setIncludesYear(true).setRequired(true);

  form.addTextItem().setTitle('Street and number').setRequired(true);
  form.addTextItem().setTitle('Postcode').setRequired(true);
  form.addTextItem().setTitle('City').setRequired(true);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, SPREADSHEET_ID);

  props.setProperty(PROP_FORM_ID, form.getId());
  props.setProperty(PROP_TOKEN_ITEM, String(token.getId()));
  props.setProperty(PROP_NAME_ITEM, String(name.getId()));

  Logger.log('Form created.');
  Logger.log('Edit:      ' + form.getEditUrl());
  Logger.log('Published: ' + form.getPublishedUrl());
  Logger.log('Links written: ' + makeFormLinks());
  return form.getPublishedUrl();
}


/**
 * Called ONLY from createDetailsForm(), to give a brand-new form its starting
 * copy. It is not for updating a form that already exists: the title and
 * description are edited by hand in the Forms UI, and that hand-edited version
 * is the one people actually read. Calling this on a live form would replace
 * their wording with whatever this file happens to say.
 */
function applyFormCopy_(form) {
  form.setTitle(FORM_TITLE);
  form.setDescription(FORM_DESCRIPTION);
  form.setConfirmationMessage(CONFIRMATION);
}


/**
 * Push a wording change onto the form that already exists. Safe to re-run, and
 * safe after links have been sent: entry ids survive a rename.
 */
function applyFormLabels() {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(PROP_FORM_ID);
  if (!formId) throw new Error('No form yet — run createDetailsForm() first.');
  var form = FormApp.openById(formId);

  // Deliberately does NOT touch the title, description or confirmation
  // message. Those are edited by hand in the Forms UI and the live form is
  // the authority on them — setting them from the constants below would
  // silently throw away someone's wording. Only the two prefilled questions
  // are managed from code, because their labels have to stay in step with
  // what enrich.py matches on.
  // Titles only. A question's TITLE becomes its column header in the
  // responses sheet, and enrich.py matches that header by name — so the two
  // have to agree or the column is silently dropped on import. Help text has
  // no such constraint and is edited by hand, so it is left alone.
  form.getItemById(Number(props.getProperty(PROP_TOKEN_ITEM))).setTitle(TOKEN_TITLE);
  form.getItemById(Number(props.getProperty(PROP_NAME_ITEM))).setTitle(NAME_TITLE);

  Logger.log('Question titles applied. Help text, description and title left alone.');
  Logger.log(form.getPublishedUrl());
}


/**
 * Writes a personal prefilled link into People!F for every row that has a
 * token and no link yet. Safe to re-run: existing links are never rewritten,
 * so a link already sitting in someone's inbox keeps working.
 */
function makeFormLinks() {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(PROP_FORM_ID);
  if (!formId) throw new Error('No form yet — run createDetailsForm() first.');

  var form = FormApp.openById(formId);
  var tokenItem = form.getItemById(Number(props.getProperty(PROP_TOKEN_ITEM))).asTextItem();
  var nameItem  = form.getItemById(Number(props.getProperty(PROP_NAME_ITEM))).asTextItem();

  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  if (sheet.getLastRow() < 2) throw new Error('No rows in ' + PEOPLE_SHEET);

  sheet.getRange(1, LINK_COLUMN).setValue('Link');

  var n = sheet.getLastRow() - 1;
  var rows = sheet.getRange(2, 1, n, LINK_COLUMN).getValues();
  var written = 0;

  for (var i = 0; i < rows.length; i++) {
    var tokenValue = String(rows[i][0]).trim();
    var nameValue  = String(rows[i][1]);
    var existing   = String(rows[i][LINK_COLUMN - 1]).trim();
    if (!tokenValue || existing) continue;

    var response = form.createResponse()
      .withItemResponse(tokenItem.createResponse(tokenValue))
      .withItemResponse(nameItem.createResponse(nameValue));

    sheet.getRange(i + 2, LINK_COLUMN).setValue(response.toPrefilledUrl());
    written++;
  }

  Logger.log('Wrote ' + written + ' link(s) into ' + PEOPLE_SHEET + '!F');
  return written;
}


/**
 * Zero-argument, so the editor's Run button can use it: logs the first link
 * sitting in People!F. That is the one to open when checking the form.
 */
function logFirstLink() {
  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  if (!sheet || sheet.getLastRow() < 2) throw new Error('No rows in ' + PEOPLE_SHEET);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, LINK_COLUMN).getValues();
  for (var i = 0; i < rows.length; i++) {
    var link = String(rows[i][LINK_COLUMN - 1]).trim();
    if (link) { Logger.log(link); return link; }
  }
  throw new Error('No links in ' + PEOPLE_SHEET + '!F — run makeFormLinks() first.');
}


/**
 * Convenience for testing: the prefilled link for one token, logged rather
 * than written to the sheet.
 */
function previewLinkFor(token) {
  var props = PropertiesService.getScriptProperties();
  var form = FormApp.openById(props.getProperty(PROP_FORM_ID));
  var tokenItem = form.getItemById(Number(props.getProperty(PROP_TOKEN_ITEM))).asTextItem();
  var nameItem  = form.getItemById(Number(props.getProperty(PROP_NAME_ITEM))).asTextItem();

  var sheet = ss_().getSheetByName(PEOPLE_SHEET);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(token).trim()) {
      var url = form.createResponse()
        .withItemResponse(tokenItem.createResponse(String(rows[i][0]).trim()))
        .withItemResponse(nameItem.createResponse(String(rows[i][1])))
        .toPrefilledUrl();
      Logger.log(url);
      return url;
    }
  }
  throw new Error('No People row with token ' + token);
}
