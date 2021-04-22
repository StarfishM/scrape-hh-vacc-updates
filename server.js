const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const app = express();
const PORT = 8080;
const compareState = require("./compareState.json");
const recentState = require("./recentState.json");

const getCurrentPageState = async () => {
    try {
        const { data } = await axios.get(
            "https://www.hamburg.de/corona-impfung/"
        );
        const $ = cheerio.load(data);
        const paragraphs = [];

        $("div.richtext p").map((_idx, el) => {
            const paraText = $(el).text();
            if (_idx === 0) {
                console.log("first paragraph!");
                const matchDate = /(\d\d)\.(\d\d)\.(\d\d\d\d)/;
                const dateUpdated = matchDate.exec(paraText);
                paragraphs.push({ dateUpdated: dateUpdated[0] });
            }

            paragraphs.push({ [_idx]: paraText });
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
        console.log("update date the same");
        return false;
    } else {
        console.log("updated date not the same");
        return true;
    }
};

const comparePastAndCurrPageState = async () => {
    const paragraphs = await getCurrentPageState().catch((err) =>
        console.log("err in getCurrentPageState", err)
    );
    writeRecentState(paragraphs);
    const updated = pageUpdated(compareState, recentState);
    console.log("updated?", updated);
    if (updated) {
        // send email! OR text message
        // make recentState new compareState
    } else {
        // don't do anything
    }
};

comparePastAndCurrPageState();

app.listen(PORT, console.log(`server running on ${PORT}`));
