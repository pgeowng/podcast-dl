const { download, downloadJSON, err } = require('../common')
// const parseData = require('./parseData')

const { JSDOM } = require('jsdom')
const { URL } = require('url')

const parseDate = (str) => {
  const match = str.match(/(\d+)\.(\d+)\.(\d+)/)
  return match[1].slice(-2) + match[2] + match[3]
}

const parseContent = (dom, origin) => {
  return Array.from(
    dom.window.document.querySelectorAll('.list-main-product li')
  ).map((show) => {
    const a = show.querySelector('a')
    console.log(a.href, origin)
    const url = new URL(a.href, origin).href
    const image = show.querySelector('img').src
    const title = show.querySelector('.txt-ttl span').innerHTML

    const type = show.querySelector('.txt-category').innerHTML.toLowerCase()
    const member = show.querySelector('.txt-member').innerHTML

    const isPremium = member === 'プレミアム会員限定'

    const date = parseDate(
      Array.from(show.querySelectorAll('.txt-date time'))
        .map((e) => e.innerHTML)
        .slice(0, 1)[0]
    )

    const btn = show.querySelector('.inner-btn a')

    let showTitle = ''
    if (btn != null) showTitle.innerHTML

    return {
      url,
      image,
      title,
      type,
      isPremium,
      isTrial: false,
      date,
      showTitle,
    }
  })
}

const list = async () => {
  const origin = 'https://asobistore.jp/special/List?category_seq%5B0%5D=9'
  // return await download(
  //   'https://asobistore.jp/special/List?category_seq%5B0%5D=9',
  //   null,
  //   null,
  const handler = (body, response) => {
    const dom = new JSDOM(body)

    const lastPageNum = parseInt(
      Array.from(
        dom.window.document.querySelectorAll('.list-pager li ~ :not(.next) a')
      ).slice(-1)[0].innerHTML
    )
    console.log(lastPageNum)
    // console.log(dom)

    console.log(parseContent(dom, origin))
  }
  // )

  const body = '' + require('fs').readFileSync('./index.html')
  handler(body)

  //     let window = {},
  //       code

  //     try {
  //       code = text.match(/<script>(window.__NUXT__=.+?)<\/script>/)[1]
  //     } catch (e) {
  //       throw err('<script> not found')
  //     }

  //     try {
  //       require = () => {}
  //       eval(code) // really dangerous - they can use fs, net
  //       return window.__NUXT__.state.programs.programs.all.map(
  //         (e) => e.directory_name
  //       )
  //     } catch (e) {
  //       throw err('error when executing script', e)
  //     }
  //   }
  // )
}

const info = async (name) =>
  parseData(await downloadJSON('https://www.onsen.ag/web_api/programs/' + name))

// must be in each provider - cant
const playlistHook = async (item) => ({
  playlistUrl: item._playlistUrl,
})

module.exports = {
  list,
  info,
  playlistHook,
}
