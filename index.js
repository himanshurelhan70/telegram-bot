require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

let access_token = ""; // will be Updated to store the access token
let contact_id = "5734012000000580003";
// let contact_id = "";
const PORT = process.env.PORT || 6900;

app.listen(PORT, () => {
  console.log("🚀 app running on port", PORT);
});


// Function to obtain Zoho access token
function getZohoAccessToken() {
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://accounts.zoho.com/oauth/v2/token?refresh_token=1000.ccf806f0a7e032f28d21f6c67a4e9258.37f77fc63d0ea6b169c3897a4774028e&client_id=1000.G73LKHN42126L4O4L6AGP0Y57B48UA&client_secret=b24d8b4b3a7fe61ca795fa59d29c28af2c3d578223&grant_type=refresh_token",
  };

  return axios
    .request(config)
    .then((response) => {
      access_token = response.data.access_token; // Store the access token
      return access_token;
    })
    .catch((error) => {
      throw error;
    });
}

getZohoAccessToken()
  .then(() => {
    console.log("successfully generated access token");
    setupRouteHandler(access_token);
  })
  .catch((error) => {
    console.log("Not able to generate access token");
  });




async function setupRouteHandler(access_token) {
    setWebhook()
    .then((URI) => {
      console.log("URI is", URI);
      fetchAndPushMessage(URI);
    });
    
}



const setWebhook = async () => {
  const { TOKEN, SERVER_URL } = process.env;
  const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
  const URI = `/webhook/${TOKEN}`;
  const WEBHOOK_URL = SERVER_URL + URI;

  const response = await axios.get(
    `${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`
  );
  console.log("setWebhook Info - ", response.data);

  return URI;
};

setupRouteHandler(access_token);

const fetchAndPushMessage = (URI) => {
  app.post(URI, async (req, res) => {
    console.log("Request obj", req.body);
    var content = "";

    const group_name = req?.body?.message?.chat?.title;
    const user_name = req?.body?.message?.from?.username;
    const first_name = req?.body?.message?.from?.first_name;
    const last_name = req?.body?.message?.from?.last_name;
    const unixDate = req?.body?.message?.date;
    const message = req?.body?.message?.text;

    if(message.includes("/assign")){
      const id = message.replace("/assign", "").trim();
      console.log("New contact id is -",id);
      contact_id = id;

      return res.send("Contact Id is updated");
    }

    // setting up dateTime into required format
    const dateTimeObj = new Date(unixDate * 1000);
    const dateTimeString = dateTimeObj.toLocaleString("en-US");
    console.log(`Decoded dateTimeString is ${dateTimeString}`);

    const dateTimeArr = dateTimeString.split(",");

    // setting up Date format
    const dateArr = dateTimeArr[0].trim().split("/");
    const date = dateArr[0];
    const month = dateArr[1];
    const year = dateArr[2];
    const finalDate = `${month}-${date}-${year}`;
    console.log("FinalDate is ", finalDate);

    // setting up Time format
    const timeString = dateTimeArr[1].trim();
    const timeArr = timeString.split(" ");
    const timeArr1 = timeArr[0].split(":");
    timeArr1.pop();
    const finalTime = `${timeArr1.join(":")}${timeArr[1]}`;
    console.log("FinalTime is ", finalTime);

    if (user_name) {
      content = `${group_name} | ${user_name} | ${finalDate} ${finalTime} - ${message}`;
    } else if (typeof last_name === "undefined" || last_name === null) {
      content = `${group_name} | ${first_name} | ${finalDate} ${finalTime} - ${message}`;
    } else {
      content = `${group_name} | ${first_name} ${last_name} | ${finalDate} ${finalTime} - ${message}`;
    }

    let data = JSON.stringify({
      data: [
        {
          Note_Content: content,
        },
      ],
    });

    let config = {
      method: "POST",
      maxBodyLength: Infinity,
      url: `https://www.zohoapis.com/bigin/v1/Accounts/${contact_id}/Notes`,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + access_token,
      },
      data: data,
    };

    console.log("Contact id is -",contact_id);
    axios
      .request(config)
      .then((response) => {
        console.log(`Data successfully pushed to Bigin - ${content}`);
      })
      .catch((error) => {
        console.log(error);
      });

    // end of insert record

    return res.send();
  });
};

