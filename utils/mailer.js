import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';
import mimeMessage from 'mime-message';
import { gmail_v1 as gmailV1, google } from 'googleapis';

// Define the required scopes for GMail API access
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// Path to store the user's access and refresh tokens
const TOKEN_PATH = 'token.json';
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Generates a new token after user authorization and stores it, then executes the provided callback.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to obtain token for.
 * @param {Function} callback The callback to execute with the authorized client.
 */
async function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error('Error retrieving access token', err);
        return;
      }
      oAuth2Client.setCredentials(token);
      writeFileAsync(TOKEN_PATH, JSON.stringify(token))
        .then(() => {
          console.log('Token stored to', TOKEN_PATH);
          callback(oAuth2Client);
        })
        .catch((writeErr) => console.error(writeErr));
    });
  });
}

/**
 * Creates an OAuth2 client with the provided credentials and executes
 * the given callback.
 * @param {Object} credentials The OAuth2 client credentials.
 * @param {Function} callback The callback to execute with the
 * authorized client.
 */

async function authorize(credentials, callback) {
  const clientSecret = credentials.web.client_secret;
  const clientId = credentials.web.client_id;
  const redirectURIs = credentials.web.redirect_uris;
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectURIs[0],
  );
  console.log('Starting client authorization');

  // Check if a token is already stored
  await readFileAsync(TOKEN_PATH)
    .then((token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    }).catch(async () => getNewToken(oAuth2Client, callback));
  console.log('Client authorization completed');
}

/**
 * Sends an email using the GMail API.
 * @param {google.auth.OAuth2} auth The authorized OAuth2 client.
 * @param {gmailV1.Schema$Message} mail The message to be sent.
 */
function sendMailService(auth, mail) {
  const gmail = google.gmail({ version: 'v1', auth });

  gmail.users.messages.send({
    userId: 'me',
    requestBody: mail,
  }, (err, _res) => {
    if (err) {
      console.log(`API error: ${err.message || err.toString()}`);
      return;
    }
    console.log('Email sent successfully');
  });
}

/**
 * Provides methods for sending emails via GMail.
 */
export default class Mailer {
  /**
   * Checks for valid authorization.
   */
  static checkAuth() {
    readFileAsync('credentials.json')
      .then(async (content) => {
        await authorize(JSON.parse(content), (auth) => {
          if (auth) {
            console.log('Authorization successful');
          }
        });
      })
      .catch((err) => {
        console.log('Error loading client secret file:', err);
      });
  }

  /**
   * Constructs a MIME email message.
   * @param {String} dest The recipient's email address.
   * @param {String} subject The email subject.
   * @param {String} message The email body.
   * @returns {Object} The MIME message.
   */
  static buildMessage(dest, subject, message) {
    const senderEmail = process.env.GMAIL_SENDER;
    const msgData = {
      type: 'text/html',
      encoding: 'UTF-8',
      from: senderEmail,
      to: [dest],
      cc: [],
      bcc: [],
      replyTo: [],
      date: new Date(),
      subject,
      body: message,
    };

    if (!senderEmail) {
      throw new Error(`Invalid sender: ${senderEmail}`);
    }
    if (mimeMessage.validMimeMessage(msgData)) {
      const mimeMsg = mimeMessage.createMimeMessage(msgData);
      return { raw: mimeMsg.toBase64SafeString() };
    }
    throw new Error('Invalid MIME message');
  }

  /**
   * Sends an email using the stored credentials.
   * @param {Object} mail The MIME email message to be sent.
   */
  static sendMail(mail) {
    readFileAsync('credentials.json')
      .then(async (content) => {
        await authorize(
          JSON.parse(content),
          (auth) => sendMailService(auth, mail),
        );
      })
      .catch((err) => {
        console.log('Error loading client secret file:', err);
      });
  }
}
