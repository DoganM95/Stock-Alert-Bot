import {
    createRequire
} from "module";
const require = createRequire(
    import.meta.url);
const escape = require("escape-html");
const axios = require('axios');

const credentials = require("../credentials/tasker_autoremote")

// urlToWatch = process.env.page_to_watch; //docker env var access for later

let productsToWatch = [{
        name: "AMD RX 6800 XT",
        url: "https://amd.com/en/direct-buy/5458374100/de",
        inStockString: "add to cart",
        outOfStockString: "out of stock"
    },
    // {
    //     name: "AMD RX 6800 XT MB",
    //     url: "https://www.amd.com/de/direct-buy/5496921500/de"
    // }
]

// Adding flags to each product
productsToWatch.map(product => {
    product.inStock = true;
    product.notified = false;
    product.response = undefined;
});


console.log(productsToWatch);
console.log(credentials);



productsToWatch.forEach(async product => {

    while (true) {
        product.notified = false; // Flag setting on each stock state switch

        // Out of stock loop
        while (product.inStock == false) {
            await getStock(product, false);
        }

        // In stock loop
        while (product.inStock == true) {
            await getStock(product, true);
        }
    }
})

async function getStock(product) {
    // Get product status from website
    await axios.get(product.url)
        .then(res => {
            if (res.status != 200)
                throw new Error("HTTP response code: " + res.status)

            if (String(res.data).toLowerCase().includes(product.inStockString)) {

                if (!product.notified) {
                    console.log(product.name + " in stock!!!");
                    product.inStock = true;
                    product.notified = true;
                }

            } else if (String(res.data).toLowerCase().includes(product.outOfStockString)) {

                if (!product.notified) {
                    console.log(product.name + " out of stock.");
                    product.inStock = false;
                    product.notified = true;
                }
            }
        })
        .catch(err => {
            console.log(err);
            // Wait 10 seconds after an error (recovery pause)
            setTimeout(() => {}, 10000);
        })

    // wait 0.5 seconds after each processed response
    setTimeout(() => {}, 500);
}