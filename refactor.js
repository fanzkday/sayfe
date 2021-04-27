const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');
const shell = require('shelljs');

const { getRelations, parse } = require('./refactor/parser')
const { migrations, root } = require(`${process.cwd()}/sayfe`)

function compareRelative(from = '', to = '') {
  const relative = from.split('/').length - to.split('/').length;
  if (relative > 0) {
    return { type: 'up', step: relative }
  }
  if (relative < 0) {
    return { type: 'down', step: -relative }
  }
  return { step: 0 };
}

function handlerPath(p, { type, step }) {
  if (!path.isAbsolute(p) && p.startsWith('../')) {
    const ps = p.split('/')
    if (type === 'up') {
      return ps.slice(step).join('/')
    } else {
      for (let i = 0; i < step; i++) {
        ps.unshift('..')
      }
      return ps.join('/')
    }
  }
  return p;
}

const relations = getRelations(`${path.join(process.cwd(), root)}/**/*.js`);
Object.entries(migrations).forEach(([from, to]) => {
  const { type, step } = compareRelative(from, to);
  if (step !== 0) {
    shell.ls('-R', `.${from}/**/*.js`).forEach(file => {
      // 1.更新当前路径下所有文件的引用(本路径下内部的引用不会处理)
      parse(file, node => {
        node.source.value = handlerPath(node.source.value, { type, step })
      })
      fs.writeFileSync(file, generator(ast, {}).code);
      // 2.更新被依赖的文件
      const key = path.resolve(file).replace('.js', '');
      const bedependeds = relations[key].bedepended;
      Object.keys(bedependeds).forEach(bedepended => {
        parse(shell.cat(bedepended + '.js'), {
          getNode: node => {
            if (path.resolve(node.source.value) === key) {

            }
          }
        })
      })
    })
    shell.cp('-rf', `.${from}/`, `.${to}/`);
  }
})
