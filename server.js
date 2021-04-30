const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const app = express();
const compareState = require("./compareState.json");
let recentState;
const { sendEmail } = require("./ses");

app.get("/", async (req, res) => {
    await comparePastAndCurrPageState();
    return res.send(`<h1> well hello there 👋 </h1>
    <h2>hh vacc page updated last on:${recentState.dateUpdated}</h2>
    `);
});

const getCurrentPageState = async () => {
    try {
        const { data } = await axios.get(
            "https://www.hamburg.de/corona-impfung/"
        );
        const $ = cheerio.load(data);
        const infoObj = {};
        // get updatedDate
        $("div.richtext p").map((i, el) => {
            const paraText = $(el).text();
            if (i === 0) {
                const matchDate = /(\d\d)\.(\d\d)\.(\d\d\d\d)/;
                const dateUpdated = matchDate.exec(paraText);
                infoObj.dateUpdated = dateUpdated[0];
            }
        });
        // get groups curr getting vacc
        infoObj.groups = [];
        $("ul.normal-list li").map((i, el) => {
            const li = $(el).text();
            infoObj.groups.push({ group: li });
        });
        return infoObj;
    } catch (err) {
        throw err;
    }
};

const pageUpdated = (refObj, currObj) => {
    if (refObj.dateUpdated === currObj.dateUpdated) {
        return false;
    } else {
        return true;
    }
};

const comparePastAndCurrPageState = async () => {
    const data = await getCurrentPageState().catch((err) =>
        console.log("err in getCurrentPageState", err)
    );
    recentState = data;
    const updated = pageUpdated(compareState, recentState);
    const yes = checkIfTurn(recentState.groups);
    console.log("updated?", updated);
    console.log("yes?", yes);
    if (updated || yes) {
        const subject = `HH Vacc page updated`;
        let message1 = `page updated https://www.hamburg.de/corona-impfung/`;
        let message2 = `YESSS her turn https://www.hamburg.de/corona-impfung/`;
        await sendEmail(updated ? message1 : message2, subject);
    }
};

const checkIfTurn = (arr) => {
    let oui = false;
    arr.map((el) => {
        const checkForAge = /(\d\d\s\bJ)/;
        const getDoubleDigits = /(\d\d)/;
        const agePresent = checkForAge.exec(el.group);
        if (agePresent) {
            const age = getDoubleDigits.exec(el.group);
            age[0] <= 65 ? (oui = true) : undefined;
        }
    });
    return oui;
};

app.listen(process.env.PORT || 8080, console.log(`server running...`));
