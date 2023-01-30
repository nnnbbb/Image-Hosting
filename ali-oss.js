const oss = require('ali-oss')
const fs = require('fs')
const path = require("path")

const client = new oss({
  // yourregion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: 'oss-cn-hangzhou',
  // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
  accessKeyId: 'LTAI5tRmJhqQXoSN2uzArPmS',
  accessKeySecret: 'BslDsRq96LWam7UTIKqkOln2iGUf4i',
  // 填写Bucket名称。
  bucket: 'bifunex',
})

const headers = {
  // 指定Object的存储类型。
  'x-oss-storage-class': 'Standard',
  // 指定Object的访问权限。
  'x-oss-object-acl': 'private',
  // 设置Object的标签，可同时设置多个标签。
  'x-oss-tagging': 'Tag1=1&Tag2=2',
  // 指定PutObject操作时是否覆盖同名目标Object。此处设置为true，表示禁止覆盖同名Object。
  'x-oss-forbid-overwrite': 'true',
}

function handlePath(path) {
  path = path.replace(/\\/g, '/')
  path = "images/" + path
  return path
}

async function ossPut(ossFilePath, file) {
  const options = {
    // headers,
    timeout: 120000,//设置超时时间
  }
  try {
    const result = await client.put(ossFilePath, file, options)
    // console.log(result)
  } catch (e) {
    console.log(e)
  }
}

// 处理请求失败的情况，防止promise.all中断，并返回失败原因和失败文件名。
async function handleDel(name, options) {
  try {
    await client.delete(name)
  } catch (error) {
    error.failObjectName = name
    return error
  }
}

// 删除多个文件。
async function ossDeleteDirectory(prefix) {
  prefix = 'images/' + prefix
  const list = await client.list({
    prefix: prefix,
  })

  list.objects = list.objects || []
  const result = await Promise.all(list.objects.map((v) => handleDel(v.name)))
  // console.log(result)
}


async function ossUpload(ossFilePath, file) {
  ossFilePath = handlePath(ossFilePath)

  // Convert the file size to megabytes (optional)
  let mbSize = getFileMb(file)
  if (mbSize < 20) {
    await ossPut(ossFilePath, file)
  } else if (process.env.OSS_HOST != "") {
    await ossMultipartUpload(ossFilePath, file)
  }
}

function getFileMb(file) {
  let stats = fs.statSync(file)
  let fileSizeInBytes = stats.size
  // Convert the file size to megabytes (optional)
  let mb = fileSizeInBytes / (1024 * 1024)
  return mb
}

async function ossMultipartUpload(ossFilePath, file) {
  let list = []
  const options = {
    partSize: 1000 * 1024, //设置分片大小
    timeout: 600000,       //设置超时时间
    progress: ((percent, data, res) => {
      let n = Math.floor(percent * 100)
      let percentVal = n + '%'
      !list.includes(n) && list.push(n) && n % 2 === 0 && console.log('Upload file ->', data.file, percentVal)
    })
  }

  try {
    const result = await client.multipartUpload(ossFilePath, file, options)
    // console.log(result)
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  ossPut,
  ossDeleteDirectory,
  ossUpload,
}