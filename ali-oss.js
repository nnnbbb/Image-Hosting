const oss = require('ali-oss')
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

async function ossPut(ossFilePath, file) {
  ossFilePath = ossFilePath.replace(/\\/g, '/')
  ossFilePath = "images/" + ossFilePath
  try {
    // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    // const result = await client.put('Tone/1.png', path.normalize('C:/Users/nnn/Pictures/1.png')
    const result = await client.put(ossFilePath, file
      // 自定义headers
      //,{headers}
    )
    // console.log(result)
  } catch (e) {
    console.log(e)
  }
}

// put()
module.exports = {
  ossPut,
}