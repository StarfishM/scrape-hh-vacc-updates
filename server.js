const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const app = express();
const PORT = 8080;
const compareState = require("./compareState.json");
const recentState = require("./recentState.json");

app.get("/", async (req, res) => {
    await comparePastAndCurrPageState();
    return res.send(`<h1> well hello there 👋 </h1>
    <h2>hh vacc page update:${recentState[0].dateUpdated}</h2>
    `);
});

const getCurrentPageState = async () => {
    try {
        const { data } = await axios.get(
            "https://www.hamburg.de/corona-impfung/"
        );
        const $ = cheerio.load(data);
        const paragraphs = [];
        // might not need this maß, might only need the date!!!!
        $("div.richtext p").map((i, el) => {
            const paraText = $(el).text();
            if (i === 0) {
                const matchDate = /(\d\d)\.(\d\d)\.(\d\d\d\d)/;
                const dateUpdated = matchDate.exec(paraText);
                paragraphs.push({ dateUpdated: dateUpdated[0] });
            }

            paragraphs.push({ [i]: paraText });
        });
        // definitely keep those for checking if it's mums turn yet!
        $("ul.normal-list li").map((i, el) => {
            const lis = $(el).text();
            paragraphs.push({ group: lis });
        });
        return paragraphs;
    } catch (err) {
        throw err;
    }
};

const writeRecentState = (arr) => {
    fs.writeFileSync(
        `${__dirname}/recentState.json`,
        JSON.stringify(arr, null, 4)
    );
};

const pageUpdated = (refArr, currArr) => {
    if (refArr[0].dateUpdated === currArr[0].dateUpdated) {
        return false;
    } else {
        return true;
    }
};

const comparePastAndCurrPageState = async () => {
    const paragraphs = await getCurrentPageState().catch((err) =>
        console.log("err in getCurrentPageState", err)
    );
    writeRecentState(paragraphs);
    const updated = pageUpdated(compareState, recentState);
    const yes = checkIfTurn(recentState);
    console.log("updated?", updated);
    console.log("yes?", yes);
    if (updated) {
        // send email! OR text message
        // make recentState new compareState
    } else if (yes) {
        // mum's turn
    } else {
        // don't do anything
    }
};

const checkIfTurn = (arr) => {
    let oui = false;
    arr.map((el) => {
        // instead get number value from paragrpahk, and check if it is <= 65 , if yes, set to true!
        if (
            el.group &&
            (el.group.indexOf("65") > -1 || el.group.indexOf("60") > -1)
        ) {
            console.log("65 is part of the group");
            oui = true;
        }
    });
    return oui;
};

app.listen(PORT, console.log(`server running on ${PORT}`));
