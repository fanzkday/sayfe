const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');
const shell = require('shelljs');

const relations = {};

shell.ls('-R', './demo/**/*.js').slice(0, 10000).forEach(file => {

  const key = path.resolve(file).replace('.js', '');
  relations[key] = {
    depended: {},
    bedepended: {},
  }

  const ast = parser.parse(shell.cat(file), {
    sourceType: 'module'
  })

  traverse(ast, {
    ImportDeclaration({ node }) {
      const root = path.parse(file).dir;
      const { dir, base } = path.parse(node.source.value);
      const p = path.resolve(root, dir);
      const position = `${p}${path.sep}${base}`;
      relations[key].depended[position] = true;
      if (relations[position]) {
        relations[position].bedepended[key] = true;
      }
    },
  });
})

fs.writeFileSync('./relations.json', JSON.stringify(relations, null, 2))
