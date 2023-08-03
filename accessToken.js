const fs = require("fs");
const axios = require("axios");

exports.getAccessToken = async () => {
    try {
        // reading file Data
        const readFile = fs.readFileSync("accessToken.txt", "utf-8");
        const fileData = JSON.parse(readFile);
        const storedTime = new Date(fileData.expiresAt);
        // console.log("fileData", fileData);

        // runs when token expires or doesn't exist
        if (
            new Date().getTime() > storedTime.getTime() ||
            fileData.token === "" ||
            fileData.token === undefined ||
            fileData.expiresAt === "" ||
            fileData.expiresAt === undefined
        ) {
            // adding 55 minutes to current time
            var d = new Date();
            d.setMinutes(d.getMinutes() + 55);

            // generating ZOHO access token
            const response = await axios.post(
                "https://accounts.zoho.com/oauth/v2/token",
                {},
                {
                    params: {
                        refresh_token: "1000.8e7f90cd29c937b85e2f58f684ff1b8a.64103d96aa358e8afe1fbdf4e8b32af7",
                        client_id: "1000.G73LKHN42126L4O4L6AGP0Y57B48UA",
                        client_secret: "b24d8b4b3a7fe61ca795fa59d29c28af2c3d578223",
                        grant_type: "refresh_token",
                    },
                }
            );

            const newToken = response.data.access_token;

            // Storing Token in accessToken.txt file
            fs.writeFileSync(
                "accessToken.txt",
                JSON.stringify({
                    token: newToken,
                    expiresAt: d,
                }, null, 2),
                "utf8"
            );

            console.log("New token", newToken);
            return newToken;
        } 
        // runs when token exist and expires
        else {
            console.log("fileData", fileData);
            return fileData.token;
        }
    } catch (err) {
        console.log(err);
        return err.message;
    }
};
