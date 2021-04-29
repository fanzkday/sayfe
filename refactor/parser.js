const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const shell = require('shelljs')
const generate = require('@babel/generator').default

function parse (file, { getNode, getCode }) {
  const ast = parser.parse(file, {
    sourceType: 'module'
  })

  traverse(ast, {
    ImportDeclaration ({ node }) {
      if (typeof getCode === 'function') {
        getNode(node)
      }
    }
  })

  const code = generate(ast, {}).code
  if (typeof getCode === 'function') {
    getCode(generate(ast, {}).code)
  }
  return code
}

function getRelations (dir) {
  const relations = {}

  shell.ls('-R', dir).slice(0, 10000).forEach(file => {
    const key = path.resolve(file).replace('.js', '')
    relations[key] = {}
    parse(shell.cat(file), {
      getNode: node => {
        const root = path.parse(file).dir
        const { dir, base } = path.parse(node.source.value)
        const p = path.resolve(root, dir)
        const position = `${p}${path.sep}${base}`
        if (relations[position]) {
          relations[position][key] = false
        }
      }
    })
  })

  fs.writeFileSync('./relations.json', JSON.stringify(relations, null, 2))
  return relations
}

module.exports = exports = {
  getRelations,
  parse
}
