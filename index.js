const assert = require('http-assert')
const hyperquest = require('hyperquest')
const mime = require('mime')
const { send } = require('micro')
const { Telegram } = require('telegraf')
const { LRUMap } = require('lru_map')

const tg = new Telegram(process.env.BOT_TOKEN)
const fileInfos = new LRUMap(1000)

module.exports = async function (req, res) {
  const fileId = req.url.slice(1)
  assert(fileId, 404)
  const fileInfo = fileInfos.get(fileId) || await tg.getFile(fileId).catch(() => {})
  assert(fileInfo, 404)
  fileInfos.set(fileId, fileInfo)
  const link = await tg.getFileLink(fileInfo)
  assert(link, 404)
  res.setHeader('cache-control', 'public, max-age=31536000')
  res.setHeader('content-type', mime.lookup(fileInfo.file_path))
  hyperquest(link).pipe(res)
}

