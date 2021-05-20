#!/usr/bin/env node
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const cwd = process.cwd()

const { host, token, projectId, outDir } = require(`${cwd}/package.json`).yapi

const dir = path.resolve(cwd, outDir)

fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir)

function template ({ menu, title, name, list }) {
  if (list.filter(o => o.key).length === 0) {
    return
  }
  const code = ({ description, key, type, required }) => {
    const flag = required === '0' ? '?' : ''
    if (Array.isArray(type)) {
      process.nextTick(() => {
        template({ menu, title: `${title}子项`, name: `${name}Item`, list: type })
      })
      return `
      /**
       * 列表子项
       */
      ${key}${flag}: I${name}Item[]
        `
    }

    return `
  /**
   * ${description || ''}
   */
  ${key}${flag}: ${type}
    `
  }

  const filepath = path.resolve(dir, `${menu}.ts`)
  let data = ''
  if (fs.existsSync(filepath)) {
    data = fs.readFileSync(filepath).toString()
  }

  fs.writeFileSync(
    filepath,
    `
  ${data}
  /**
   * ${title}
   */
  export interface I${name} {
    ${list.map((o) => code(o)).join('')}
  }

// *************************************** //
    `
  )
}

function transform (body) {
  const list = []
  const properties = body.properties ? { ...body.properties } : { ...body }
  Object.keys(properties).forEach((key) => {
    properties[key].key = key
    const type = properties[key].type
    if (type === 'integer') {
      properties[key].type = 'number'
    }
    if (typeof type === 'object') {
      properties[key].type = type[0]
    }
    if (type === 'array') {
      properties[key].type = transform(properties[key].items)
    }
    list.push(properties[key])
  })
  return list
}

async function getApi ({ _id, menu }) {
  await axios.get(`${host}/api/interface/get?id=${_id}&token=${token}`).then((res) => {
    // 下行数据接口
    const resBody = JSON.parse(res.data.data.res_body)
    const name = res.data.data.path.split('/').slice(-1)[0]
    const upperName = `${name[0].toUpperCase()}${name.substr(1)}`
    if (typeof resBody === 'object' && !Array.isArray(resBody)) {
      const body = resBody.properties.data
      if (body) {
        const list = transform(body)
        template({ menu, title: res.data.data.title, name: upperName, list })
      }
    }
    // 上行数据接口
    const reqQuery = res.data.data.req_query
    if (Array.isArray(reqQuery)) {
      const list = reqQuery.map((o) => ({ type: 'string', description: o.desc, key: o.name }))
      template({ menu, title: `${res.data.data.title}查询条件`, name: `${upperName}Query`, list })
    }
  })
}

axios.get(`${host}/api/interface/list_menu?project_id=${projectId}&token=${token}`).then(async (res) => {
  for (const menu of res.data.data) {
    if (/[a-zA-Z]/.test(menu.desc)) {
      for (const api of menu.list) {
        await getApi({ ...api, menu: menu.desc })
      }
    }
  }
  cp.exec(`node ${process.cwd()}/node_modules/prettier/bin-prettier.js --write "${dir}/*.ts"`)
})
