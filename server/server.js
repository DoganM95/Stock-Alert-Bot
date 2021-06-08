import {
    createRequire
} from "module";
const require = createRequire(
    import.meta.url);
const escape = require('escape-html');
const axios = require('axios');

const taskerAutoRemoteUrl = require("../credentials/tasker_autoremote")
let productsToWatchJson = require("../configuration/products_to_watch.json")

// urlToWatch = process.env.page_to_watch; //docker env var access for later

let productsToWatch = productsToWatchJson;

// Adding flags to each product
productsToWatch.map(product => {
    product.lastNotifiedKeywordIndex = -1;
});

console.log("Watching the following products:");
console.log(productsToWatch);
console.log("Tasker AutoRemote destination: " + taskerAutoRemoteUrl);


// Starts one stock watchdog for each product, independent of each other
productsToWatch.forEach(async product => {
    while (true) {
        await getStock(product);
        await sleep(product.checkInterval);
    }
})

async function getStock(product) {
    console.log(new Date().getTime() + " - checking: " + product.name)
    // Get product status from website
    await axios.get(product.url)
        .then(res => {
            if (res.status != 200) {
                console.log(rest.status + " status for " + product.name)
                console.log("Waiting " + product.recoveryTime + " seconds for next request on product:")
                console.log(product.name);
                console.log("Current recovery time (until next request is made to undo a ban): " + (product.recoveryTime += 1000));
                console.log("Increasing recovery time by 1 second on next failure, until the ban is gone");
            }
            product.response = res;
        })
        .catch(err => {
            console.error("Error on " + product.name);
            console.log(err);
        })

    try {
        product.notificationKeywordPairs.forEach(async (keywordPair, keywordIndex) => {
            if (String(product.response.data).toLowerCase().includes(keywordPair[1]) && product.lastNotifiedKeywordIndex != keywordIndex) {
                product.lastNotifiedKeywordIndex = keywordIndex;
                await action(product.name + " - " + keywordPair[0]);
            }
        })
    } catch (err) {
        console.log(err);
    }

}

async function action(message) {
    message = String(escape(message)).replaceAll(" ", "%20");
    await axios.get(taskerAutoRemoteUrl.url + message);
    console.log("sent message: " + message)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}