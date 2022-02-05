const assert = require("assert/strict");
const Episode = require("../../types/Episode");

const Got = require("../Got");
const GOT_PROPS = {
  headers: {
    Referer: "https://www.onsen.ag/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0",
  },
};

const shows = async () => {
  const got = new Got(GOT_PROPS);
  const text = await got.load("https://onsen.ag/web_api/programs/", null, {});
  const raws = JSON.parse(text);
  return parseShows(raws);
};

const parseShows = (raws) => {
  let result = [];
  if (!Array.isArray(raws)) throw Error("received raws isn't array");

  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i];
    try {
      const showName = raw.directory_name;
      if (showName == null) throw Error("empty showName");

      const showTitle = raw.title || "";
      if (!Array.isArray(raw.performers)) throw Error("performers isn't array");

      const performers = raw.performers.map((e) => {
        if (e.name == null) throw Error("performers doesn't contain names");
        return e.name;
      });
      const today = new Date();

      for (let j = 0; j < raw.contents.length; j++) {
        const ep = raw.contents[j];
        try {
          const title = ep.title || "";
          if (!Array.isArray(ep.guests)) throw Error("guests isn't array");

          const guests = ep.guests.map((e) => {
            if (e.name == null) throw Error("guests doesn't contain names");
            return e.name;
          });
          const imageUrl = ep.poster_image_url || "";

          let date = "000000";
          if (ep.delivery_date != null) {
            let year = +today.slice(0, 2);
            let info = String(ep.delivery_date)
              .split("/")
              .map((e) => parseInt(e));
            try {
              assert(1 <= info[0] && info[0] <= 12);
              assert(1 <= info[1] && info[1] <= 31);
              assert(info.length === 2);
            } catch (e) {
              console.log("date:" + ep.delivery_date);
              console.error("wrong date");
              throw Error("wrong delivery_date");
            }

            date = new Date(year, info[0] - 1, info[1]);
            if (+date > +today) {
              date = new Date(year - 1, info[0] - 1, info[1]);
            }
          }

          const isTrial = title.indexOf("予告") !== -1;
          const playlistUrl = ep.streaming_url;

          result.push(
            new Episode({
              provider: "onsen",
              date,
              showName: showName,
              showTitle: showTitle,
              title: title,
              performers: performers,
              guests: guests,
              tags: {
                premium: ep.premium,
                trial: isTrial,
              },
              imageUrl: imageUrl,
              hooks: {},
              playlistUrl,
            })
          );
        } catch (e) {
          console.error("ep:", JSON.stringify(ep, null, 2));
          console.error("raw: ", JSON.stringify(raw, null, 2));
          console.error("error: ", e)
        }
      }
    } catch (e) {
      console.error("raw: ", JSON.stringify(raw, null, 2));
      console.error(e)
    }
  }
  return result;
};

module.exports = {
  shows,
  parseShows,
  GOT_PROPS
};
