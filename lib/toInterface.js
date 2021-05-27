#!/usr/bin/env node
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const cp = require('child_process')
const { tryer } = require('./tryer')

const cwd = process.cwd()

const { host, token, projectId, outDir } = require(`${cwd}/package.json`).yapi

const dir = path.resolve(cwd, outDir)

fs.rmSync(dir, { recursive: true, force: true })
fs.mkdirSync(dir)

const existNames = {}

function camelcase (str = '') {
  return str.replace(/(_\w)/g, $1 => $1.toUpperCase().replace('_', ''))
}

function template ({ menu, title, name, list }) {
  const items = list.filter(o => o.key)
  if (items.length === 0) {
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
      ${camelcase(key)}${flag}: I${name}Item[]
        `
    }

    return `
  /**
   * ${description || ''}
   */
  ${camelcase(key)}${flag}: ${type}
    `
  }

  const filepath = path.resolve(dir, `${menu}.ts`)

  fs.writeFileSync(
    filepath,
    `
  /**
   * ${title}
   */
  export interface I${name} {
    ${items.map((o) => code(o)).join('')}
  }

// *************************************** //\r\n
    `,
    {
      flag: 'a+'
    }
  )
}

function transform (body, requiredNames) {
  const list = []
  const properties = body.properties ? { ...body.properties } : { ...body }
  Object.keys(properties).forEach((key) => {
    properties[key].key = key
    if (requiredNames) {
      properties[key].required = requiredNames.includes(key) ? '1' : '0'
    } else {
      properties[key].required = '1'
    }
    const type = properties[key].type
    if (type === 'integer') {
      properties[key].type = 'number'
    }
    if (typeof type === 'object') {
      properties[key].type = type[0]
    }
    if (type === 'array') {
      if (properties[key].items.properties) {
        properties[key].type = transform(properties[key].items)
      } else {
        properties[key].type = `${properties[key].items.type}[]`
      }
    }
    list.push(properties[key])
  })
  return list
}

async function getApi ({ _id, menu }) {
  await axios.get(`${host}/api/interface/get?id=${_id}&token=${token}`).then((res) => {
    const paths = res.data.data.path.split('/').reverse()
    let name = ''
    tryer({
      tries: paths.length,
      exector: function (index, { stop }) {
        name = name ? camelcase(`${paths[index]}_${name}`) : paths[index]
        if (!existNames[name]) {
          stop()
        }
      },
      finished: function () {
        existNames[name] = true
      }
    })

    const tries = ['res_body', 'req_query', 'req_body_form', 'req_body_other']

    tryer({
      tries: tries.length,
      exector: function (index) {
        const key = tries[index]
        if (key === 'req_body_other' && res.data.data.req_body_type !== 'json') {
          return
        }
        if (key === 'req_body_form' && res.data.data.req_body_type !== 'form') {
          return
        }
        const upperName = `${name[0].toUpperCase()}${name.substr(1)}${key.indexOf('req') === 0 ? 'Param' : ''}`
        const data = res.data.data[key]
        if (typeof data === 'string') {
          try {
            const jsonBody = JSON.parse(data)
            if (typeof jsonBody === 'object' && !Array.isArray(jsonBody)) {
              const body = key === 'req_body_other' ? jsonBody.properties : jsonBody.properties.data
              if (body) {
                if (key === 'res_body' && body.type === 'array' && body.items) {
                  const list = transform(body.items)
                  template({ menu, title: res.data.data.title, name: upperName, list })
                } else {
                  const list = transform(body, jsonBody.required)
                  template({ menu, title: res.data.data.title, name: upperName, list })
                }
              }
            }
          } catch (e) {
            console.log(e)
          }
        }

        if (Array.isArray(data)) {
          const list = data.map((o) => ({ type: o.type === 'text' ? 'string' : 'any', description: o.desc, key: o.name }))
          template({ menu, title: `${res.data.data.title}查询条件`, name: upperName, list })
        }
      }
    })
  })
}

axios.get(`${host}/api/interface/list_menu?project_id=${projectId}&token=${token}`).then(async (res) => {
  for (const menu of res.data.data) {
    for (const api of menu.list) {
      await getApi({ ...api, menu: menu.desc || `api.${menu.uid}` })
    }
  }
  cp.exec(`node ${process.cwd()}/node_modules/prettier/bin-prettier.js --write "${dir}/*.ts"`)
})
