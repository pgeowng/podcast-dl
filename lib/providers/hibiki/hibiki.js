// const { downloadJSON } = require("../common");
// const parseData = require("./parseData");

const XHRHeader = {
  headers: { "X-Requested-With": "XMLHttpRequest" },
};

const fetchShows = async (dl, input) => {
  const result = await dl.load(
    "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1",
    XHRHeader
  );

  input.loadShows(_parseShows(result));
};

const _getPerformers = (raw) => {
  const result = [];
  if (!Array.isArray(raw.casts)) throw Error("raws.ep.casts isn't array");
  const casts = raw.casts;
  for (let i = 0; i < casts.length; i++) {
    const person = casts[i];
    if (person.name != null) result.push(person.name);
    if (person.rool_name != null) result.push(person.rool_name);
  }
  return result;
};

const _parseShows = (raws) => {
  const result = [];

  if (!Array.isArray(raws)) throw Error('input is not array')

  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i];
    const showId = raw.access_id;
    const imageUrl = raw.pc_image_url;
    const showTitle = raw.name;
    const performers = _getPerformers(raw.casts);
    const ep = raw.episode;
    const title = ep.name;
    const date = new Date(ep.updated_at);

    result.push(
      new Episode({
        provider: "hibiki",
        date,
        showId,
        showTitle,
        title,
        performers,
        tags: {},
        imageUrl,
        playlistUrl: null,
      })
    );
  }
  return result;
};

const _validateResponse = (raws) => {
  if (!Array.isArray(raws)) throw Error('raws is not an array')
  for (let i = 0; i < raws.length; i++ ) {
    const raw = raws[i]

    if (typeof raw.access_id !== 'string')
      throw Error('bad access_id: '+raw.access_id)

    if (typeof raw.pc_image_url !== 'string')
      throw Error('bad pc_image_url:' + raw.pc_image_url)

    if (typeof raw.name !== 'string')
      throw Error('bad name:' + raw.name)

    if (!Array.isArray(raw.casts))
      throw Error('bad casts:' + raw.casts)
  }
}

// const list = async () => {
//   return (
//     await downloadJSON(
//       "https://vcms-api.hibiki-radio.jp/api/v1//programs?limit=99&page=1",
//       null,
//       OPTIONS_XML
//     )
//   ).map(function (p) {
//     return p.access_id;
//   });
// };

// const info = async (name) =>
//   parseData(
//     await downloadJSON(
//       `https://vcms-api.hibiki-radio.jp/api/v1/programs/${name}`,
//       null,
//       OPTIONS_XML
//     )
//   );

// must be in each provider
// const playlistHook = async (item) => {
//   const playlistUrl = (await downloadJSON(item._checkUrl, null, OPTIONS_XML))
//     .playlist_url;
//   return { playlistUrl };
// };

module.exports = {
  _getPerformers,
  _parseShows,
  fetchShows,
};
