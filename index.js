const assert = require('http-assert')
const hyperquest = require('hyperquest')
const mime = require('mime')
const { send } = require('micro')
const { Telegram } = require('telegraf')
const LRU = require('lru-cache')

const tg = new Telegram(process.env.BOT_TOKEN)
const fileInfos = new LRU({ max: 1000 })
const fileLinks = new LRU({ max: 1000, maxAge: 1000 * 60 * 45 })

module.exports = async function (req, res) {
  const fileId = req.url.slice(1)
  assert(fileId, 404)
  const fileInfo = fileInfos.get(fileId) || await tg.getFile(fileId).catch(() => null)
  assert(fileInfo, 404)
  fileInfos.set(fileId, fileInfo)
  const link = fileLinks.get(fileId) || await tg.getFileLink(fileInfo)
  assert(link, 404)
  fileLinks.set(fileId, link)
  res.setHeader('cache-control', 'public, max-age=31536000')
  res.setHeader('content-type', mime.getType(fileInfo.file_path))
  hyperquest(link).pipe(res)
}

