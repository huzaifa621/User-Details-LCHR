const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const leetCode = require("./scripts/leetcode");
const hackerRank = require("./scripts/hackerrank");
require("dotenv").config();

// Something...

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
   try {
      const content = await fs.readFile(TOKEN_PATH);
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
   } catch (err) {
      return null;
   }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
   const content = await fs.readFile(CREDENTIALS_PATH);
   const keys = JSON.parse(content);
   const key = keys.installed || keys.web;
   const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
   });
   await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
   let client = await loadSavedCredentialsIfExist();
   if (client) {
      return client;
   }
   client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
   });
   if (client.credentials) {
      await saveCredentials(client);
   }
   return client;
}

const appendData = async (auth, response) => {
   const service = google.sheets({ version: "v4", auth });
   let values = [];
   const resLength = response.length;
   for (let i = 0; i < resLength / 2; i++) {
      const temp = [
         response[i],
         response[i + resLength / 2].easy,
         response[i + resLength / 2].medium,
         response[i + resLength / 2].hard,
      ];
      values.push(temp);
   }

   const resource = {
      values,
   };
   try {
      const result = await service.spreadsheets.values.update({
         spreadsheetId: "1U3Z4s-RXQpAUWAzY7SJpwCXzdSB3qCyyb6y27IhKx50",
         range: "Main!E2:H",
         valueInputOption: "RAW",
         resource,
      });
      console.log("%d cells updated.", result.data.updatedCells);
      return result;
   } catch (err) {
      throw err;
   }
};

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function listMajors(auth) {
   const sheets = google.sheets({ version: "v4", auth });
   const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Main!C2:D",
   });
   const rows = res.data.values;
   if (!rows || rows.length === 0) {
      console.log("No data found.");
      return;
   }
   const leetCodeIDs = rows.map((el) => el[0]);
   const hackerRankIDs = rows.map((el) => el[1]);

   const arrayOfFetchUserDataFromHackerRank = hackerRank(hackerRankIDs);
   const arrayOfFetchUserDataFromLeetCode = leetCode(leetCodeIDs);

   let mainRequest = Promise.all([
      ...arrayOfFetchUserDataFromHackerRank,
      ...arrayOfFetchUserDataFromLeetCode,
   ]);

   mainRequest
      .then((response) => {
         appendData(auth, response);
      })
      .catch((error) => console.log(error));
}

authorize().then(listMajors).catch(console.error);
