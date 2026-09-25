import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const googleClientId = process.env.GOOGLE_CLIENT_ID as string
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const redirectUri = process.env.GOOGLE_REDIRECT_URI

export const oauth2Client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret,
    redirectUri
)

const getGoogleAuthUrl = () => {
    const scopes = ["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/calendar.events"];

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
        response_type: "code",
        prompt: "consent"
    })
    return url;
}

async function getCode(code:string) {
    const token = await oauth2Client.getToken(code);
    if(!token.tokens.id_token) throw new Error("No Id token");

    const {} = token.tokens;

    const ticket = await oauth2Client.verifyIdToken({
        idToken: token.tokens.id_token!,
        audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if(!payload) throw new Error("Invalid Google ID Payload");

    const {name,sub} = payload;
    console.log(`Name: ${name},\nSub: ${sub}`)
    return {name, sub}
}

export { getCode, getGoogleAuthUrl}