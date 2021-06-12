import {
    createRequire
} from "module";
const require = createRequire(
    import.meta.url);
const escape = require('escape-html');
const axios = require('axios');

const taskerAutoRemote = require("../credentials/tasker_autoremote")
let productsToWatchJson = require("../configuration/products_to_watch.json")

// urlToWatch = process.env.page_to_watch; //docker env var access for later

let productsToWatch = productsToWatchJson;

// Adding flags to each product
productsToWatch.map(product => {
    product.lastNotifiedKeywordIndex = -1;
});

console.log("Watching the following products:");
console.log(productsToWatch);
console.log("Tasker AutoRemote destination: " + taskerAutoRemote);


// Starts one stock watchdog for each product, independent of each other
productsToWatch.forEach(async product => {
    let date = new Date();
    let sleep;
    let toCollect;

    setInterval(() => {
        getStock(product, sleep, date, toCollect);
    }, product.checkInterval);
})

async function getStock(product, sleep, date, toCollect) {
    sleep = false;
    console.log(Date.now() + " - checking: " + product.name)

    // Get product status from website
    try {
        toCollect = await axios.get(product.url)
            .then(res => {
                product.response = res;
            })
    } catch (err) {
        console.log("Waiting for an unban: " + product.name);
    }

    // sleep for X seconds specified per product, to unban
    if (sleep) {
        console.log(product.name + " bot sleeping " + product.recoveryTime / 1000 + " seconds");
        await sleepFor(product.recoveryTime); // sleep a minute for banned product
        sleep = false;
    }

    // call functions on state change from out of stock to in stock & vice versa
    product.notificationKeywordPairs.forEach(async (keywordPair, keywordIndex, toCollect) => {
        try {
            if (String(product.response.data).toLowerCase().includes(keywordPair[1]) && product.lastNotifiedKeywordIndex != keywordIndex) {
                product.lastNotifiedKeywordIndex = keywordIndex;
                // Put any actions/functions to be called on stock status change here
                await notifyTaskerAutoRemote(product.name + " - " + keywordPair[0], toCollect);
            }
        } catch (err) {
            console.log(err);
        }
    })
}

async function notifyTaskerAutoRemote(message, toCollect) {
    message = String(escape(message)).replaceAll(" ", "%20"); // needed, as message is sent as a url-param
    toCollect = await axios.get(taskerAutoRemote.url + message);
    console.log("sent message: " + message)
}

function sleepFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}