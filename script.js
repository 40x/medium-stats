const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');


// launch chrome
chromeLauncher
  .launch({
    port: 9222,
    // run in headless mode, for testing, comment out headless mode
    chromeFlags: [
      // '--headless'
    ]
  })
  .then(async chrome => {
    // fake sleep method which allows API calls to finish
    const sleep = async ms => {
      return new Promise(resolve => {
        setTimeout(resolve, ms);
      });
    };

    const fudgeTheStats = async (Page, Runtime, Network, runCount = 1000) => {
      console.log(`--------------${runCount}----------------`, new Date());

      await Network.clearBrowserCookies();

      await sleep(1000);

      await Runtime.evaluate({
        expression: "window.localStorage.clear();"
      });

      await sleep(1000);

      await Runtime.evaluate({
        expression: "window.sessionStorage.clear();"
      });

      await sleep(1000);

      await Page.navigate({
        url: 'https://medium.com/@kashyap.mukkamala/fudging-stats-on-medium-proof-e7cc30baf1d4'
      });

      // opens a new tab instead
      // await CDP.New({
      //   url: 'https://medium.com/@kashyap.mukkamala/fudging-stats-on-medium-proof-e7cc30baf1d4'
      // });

      await sleep(3000);

      await Runtime.evaluate({
        expression: "document.querySelector('footer').scrollIntoView()"
      });

      await sleep(3000);

      if (runCount > 0) {
        fudgeTheStats(Page, Runtime, Network, runCount - 1);
      } else {
        process.exit(0);
      }
    };

    try {
      // browser setup
      const client = await CDP();

      const {
        DOM,
        Security,
        Network,
        Page,
        Runtime
      } = client;

      // set browser defaults
      await Network.setUserAgentOverride({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36'
      });
      await Network.enable();
      await Security.enable();
      await Page.enable();
      await DOM.enable();
      // disable cache
      await Network.setCacheDisabled({
        cacheDisabled: true
      });

      // take action
      await fudgeTheStats(Page, Runtime, Network);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  });