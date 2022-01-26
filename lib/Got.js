const got = require("got");
const fse = require("fs-extra");
const log = require("./logger");
const path = require("path");

const sleep = (timeout) =>
  new Promise((res) => {
    setTimeout(() => res(), timeout);
  });

// const Q = (() => {
//   P = Promise.resolve()

//   return {
//     async push(fn) {
//       let resolved = false
//       let delayed = false
//       let p = fn()
//       p.then(() => {
//         resolved = true
//       })

//       (async () => {
//       await sleep(3000)
//       if (!resolved) {
//           delayed = true
//           promise = Promise.all([promise, p])
//         }
//       })()

//       await P
//       return await fn()

//       promise.then(() => )
//     }
//   }
// })()

// let loadLock = false
// let loadQueue = Promise.resolve()
let holdPromise = Promise.resolve()

module.exports = class Got {
  constructor(props = {}) {
    this.saveCookie = props.saveCookie || true;
    this._headers = props.headers || {};
    this.cookie = "";
  }

  checkCookie(res) {
    if (this.saveCookie && res.headers["set-cookie"] != null) {
      this.cookie = res.headers["set-cookie"][0].split(";")[0];
    }
  }

  headers() {
    return {
      ...this._headers,
      cookie: this.cookie,
    };
  }

  async load(url) {
    const request = async () => {
      console.log('got.load', url)
      const res = await got(url, { headers: this.headers() });
      this.checkCookie(res);
      return "" + res.body;
    }

    try {
      await holdPromise
      return await retry(request);
    } catch (e) {
      throw log.error("Got.load", e, {
        url,
      });
    }
  }

  async save(url, dest, cb) {
    const request = async () => {
      const res = await got(url, { headers: this.headers() });
      this.checkCookie(res);

      const mime = res.headers["content-type"];
      let ext = path.extname(dest);
      if (ext === "") {
        switch (mime) {
          case "image/jpeg":
            ext = ".jpg";
            break;
          case "image/png":
            ext = ".png";
            break;
          default:
            log.msg("unsupported mime type " + mime + " for " + url);
            break;
        }
        dest += ext;
      }

      if (cb != null) {
        cb(url, dest, res);
      }

      fse.outputFileSync(dest, res.rawBody);
      return dest;
    };

    try {
      console.log('got.save', url)
      await holdPromise
      return await retry(request);
    } catch (e) {
      throw log.error("Got.save", e, {
        url,
      });
    }
  }
};

const retry = async (fn) => {
  let errorList = []
  const promise = (async () => {
    let tryCount = 0
    let trying = true
    while (trying) {
      try {
        if (tryCount) {
          const timeout = Math.min(Math.pow(2, tryCount-1), 300);
          log.msg("retrying after", timeout + "s");
          await sleep(timeout * 1000);
          log.msg("trying...")
        }
        tryCount++
        return await fn();
      } catch (e) {
        const code = e.code;
        if (code === 'EAI_AGAIN') {
          log.error('got.retry', Error('EAI_AGAIN: no internet connection'))
          if (holdPromise !== promise) {
            await holdPromise
            holdPromise = promise
          }
        }
        else if (code === "EHOSTUNREACH") {
          log.error("got.retry", e);
          if (holdPromise !== promise) {
            await holdPromise
            holdPromise = promise
          }
        } else {
          throw e;
        }
        errorList.push(e)
      }
    }

    throw log.error("got.retry", null, {
      errorList,
    });
  })();

  return promise
};
