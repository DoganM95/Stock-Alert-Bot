Quick and dirty stock watcher & notifier implementation. Built this just to be able to buy a gpu before scalpers do.

#### How it works
- sends a get request for each product in an interval specified by the products parameters (/configuration/products_to_watch_template.json contains examples)
- if a request fails (http response 4xx or 5xx) it waits a minute before sending the next response to unban the bot (useful for e.g. AMD page)
- each product is watched asynchronously, so errors/bans are on a per product base

#### How it notifies
The only notification channels are currently
- The servers logs
- Tasker (android app) plugin autoRemote which provides a per-user link to send messages using e.g. get-requests or web ui to any registered phone with autoremote installed

#### Setup
- `cd` into /server
- run `npm install` (installs necessary packages)
- run `npm run start` to start the server (command can be changed in package.json)
