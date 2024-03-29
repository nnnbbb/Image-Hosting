require('dotenv').config()
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const sharp = require('sharp')
const uid = require('uid-safe')
const { asyncPool } = require("./utils")
const { engine } = require('express-handlebars')
const { Group } = require("./model/group")
const mime = require('mime-types')

const app = express()
const host = process.env.HOST
const port = +process.env.PORT
const API = `http://${host}:${port}`
const IMAGES = path.join(__dirname, 'images')


app.engine('handlebars', engine({
  extname: 'handlebars',
  defaultLayout: 'main',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/'
}));

app.set('view engine', 'handlebars')

// app.all('*', (req, res, next) => {
// if (req.path == '/') return next();

//   next();
// });


app.use(express.static(IMAGES))
app.use(express.json())


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(IMAGES)) {
      fs.mkdirSync(IMAGES)
    }

    cb(null, IMAGES)
  },
  filename: function (req, file, cb) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    cb(null, file.originalname)
  }
})


const multiUpload = multer({
  storage: multer.memoryStorage(),
  // limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    if (!fs.existsSync(IMAGES)) {
      fs.mkdirSync(IMAGES)
    }
    const mimetype = file.mimetype
    if (mimetype.indexOf("image") === 0 || mimetype.indexOf("video") === 0) {
      cb(null, true)
    } else {
      cb(null, false)
      const err = new Error('Only .png, .jpg and .jpeg format allowed!')
      err.name = 'ExtensionError'
      return cb(err)
    }
  },
})

app.get('/', (req, res) => {
  res.render("index", { API })
})

// 删除一组图片
app.get('/delete/:tagId', (req, res) => {
  const tagId = req.params.tagId
  const newDir = path.join(IMAGES, tagId)
  if (!fs.existsSync(newDir)) {
    return res.status(404).send("Not Found").end()
  }
  fs.rmSync(newDir, { recursive: true })
  Group.destroy({ where: { directory: tagId } })
  res.redirect('/links')
})

// 查看全部图片链接
app.get('/links', async (req, res) => {
  // const files = fs.readdirSync(IMAGES)
  let groups = await Group.findAll({
    order: [
      ['id', 'DESC'],
    ]
  })
  const files = groups.map(it => it.directory)
  let links = files
    .filter(it => {
      let p = path.join(IMAGES, it)
      return fs.existsSync(p) && fs.lstatSync(p).isDirectory()
    })
    .map(it => {
      let filePath = path.join(IMAGES, it)
      fs.readdirSync(filePath)
      // let mimeType = mime.lookup(it)
      let mimetype = fs.readdirSync(filePath).length === 1 ? "video" : "image"

      let res = {
        link: `http://${host}:${port}/${it}`,
        file: it,
        mimetype,
      }
      return res
    })
  res.render("links", { list: links })
})

// 上传图片
app.post('/projects', multiUpload.array('uploadedImages'), async (req, res) => {
  const files = req.files

  if (files.length == 0) {
    return res.status(500).send("File is require").end()
  }

  for (const file of files) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    let savePath = path.join(IMAGES, file.originalname)
    let buffer = file.buffer
    let mimetype = file.mimetype

    if (mimetype.indexOf("video") === 0) {
      fs.writeFileSync(savePath, buffer)
      return res.status(200).send("successfully").end()
    }

    const image = sharp(file.buffer)
    const metadata = await image.metadata()
    // image size > 5M  and  height > 1440px
    if (mimetype.indexOf("image") === 0 && (metadata.height > 1440 && file.size > 5 * 1024 * 1024)) {
      buffer = await image
        .resize({ height: 1440, fit: 'inside' })
        .toBuffer()
    }
    fs.writeFileSync(savePath, buffer)
  }
  return res.status(200).send("successfully").end()

})

// 查看图片
app.get('/:tagId', async (req, res) => {
  let tagId = req.params.tagId
  let imgPath = path.join(IMAGES, tagId)
  if (!fs.existsSync(imgPath)) {
    return res.status(404).send({ error: { message: "Not Found!" } })
  }
  // let files = fs.readdirSync(imgPath)
  let group = await Group.findOne({ where: { directory: tagId } })
  if (!group) {
    return res.status(404).send({ error: { message: "Not Found!" } })
  }
  let files = JSON.parse(group.files)

  let imgs = files
    .filter(it => it.mimetype.indexOf("image") === 0)
    .map(it => it.randomName)

  let others = files
    .filter(it => it.mimetype.indexOf("image") !== 0)
    .map(it => it.randomName)
  return res.render("img", { imgs, videos: others, title: tagId })
})

// 图片分组
app.post('/create-directory', async (req, res) => {
  const directory = uid.sync(10)
  const imgs = req.body.imgs
  const newDirectory = path.join(IMAGES, directory)
  if (!directory) {
    return res.status(200).send({ error: { message: `Require directory` } }).end()
  }
  if (!fs.existsSync(newDirectory)) {
    fs.mkdirSync(newDirectory)
  }

  let newImgs = imgs.map(it => {
    const filename = it.name
    const filePath = path.join(IMAGES, filename)
    const randomName = `${uid.sync(10)}.${path.extname(it.name)}`
    const newfilePath = path.join(IMAGES, directory, randomName)
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, newfilePath)
    }
    let res = {
      originalname: filename,
      randomName,
      mimetype: it.type,
    }
    return res
  })
  let group = await Group.create({
    directory,
    files: newImgs,
  })
  return res.status(200).json(directory).end()
})


app.listen(port, () => {
  console.log(`App listening at http://${host}:${port}`)
})