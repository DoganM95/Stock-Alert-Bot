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
    while (true) {
        await getStock(product);
        await sleepFor(product.checkInterval);
    }
})

async function getStock(product) {
    let sleep = false;
    console.log(new Date().getTime() + " - checking: " + product.name)
    // Get product status from website
    try {
        await axios.get(product.url)
            .then(res => {
                product.response = res;
            })
            .catch(err => {
                console.error("Error on " + product.name + ": " + err.response.status);
                // console.log("Waiting " + product.recoveryTime + " ms for next check on: " + product.name)
                // console.log("Current recovery time (until next request is made to undo a ban): " + product.recoveryTime);
                sleep = true;
            })
    } catch (err) {}

    if (sleep) {
        console.log(product.name + " bot sleeping " + product.recoveryTime / 1000 + " seconds");
        await sleepFor(product.recoveryTime); // sleep a minute for banned product
        // await sleepFor(product.recoveryTime += 1000);
        // product.checkInterval += 10;
        // console.log("Increasing recovery time by 1 second on next failure, until the ban is gone. Currently: " + product.recoveryTime);
        // console.log("Increasing request interval by 100 ms until no more bans occur. Currently: " + product.checkInterval)
        sleep = false;
    }

    product.notificationKeywordPairs.forEach(async (keywordPair, keywordIndex) => {
        try {
            if (String(product.response.data).toLowerCase().includes(keywordPair[1]) && product.lastNotifiedKeywordIndex != keywordIndex) {
                product.lastNotifiedKeywordIndex = keywordIndex;
                // Put any actions/functions to be called on stock status change here
                await notifyTaskerAutoRemote(product.name + " - " + keywordPair[0]);
            }
        } catch (err) {}
    })
}

async function notifyTaskerAutoRemote(message) {
    message = String(escape(message)).replaceAll(" ", "%20"); // needed, as message is sent as a url-param
    await axios.get(taskerAutoRemote.url + message);
    console.log("sent message: " + message)
}

function sleepFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}