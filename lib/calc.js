// 中缀表达式 转 逆波兰表达式,实现表达式计算(未实现科学计数法)

const WEIGHT = {
  '(': 100,
  '*': 99,
  '/': 99,
  '+': 98,
  '-': 98,
  ')': 0
}
const NEGATIVE_FLAG = '@'

const NUM_REG = /@?\d+(\.\d+)?/
const SPLIT_REG = /(@?\d+(\.\d+)?)|[+\-*/()]/g
const NEGATIVE_REG = /([+\-*/])(-)/g

function convert (exp) {
  const stack = []
  let symbolStack = []

  const matchs = exp
    .replace(NEGATIVE_REG, `$1${NEGATIVE_FLAG}`)
    .match(SPLIT_REG)

  for (let i = 0; i < matchs.length; i++) {
    const item = matchs[i]
    const last = symbolStack[symbolStack.length - 1]
    const len = symbolStack.length

    if (NUM_REG.test(item)) {
      stack.push(item)
    } else if (last === '(') {
      symbolStack.push(item)
    } else {
      if (WEIGHT[item] > WEIGHT[last]) {
        symbolStack.push(item)
      } else if (item === ')') {
        const leftBracketIndex = symbolStack.lastIndexOf('(')
        stack.push(...symbolStack.splice(leftBracketIndex, len - 1).slice(1).reverse())
      } else {
        stack.push(...symbolStack.reverse())
        symbolStack = [item]
      }
    }
  }
  return stack.concat(...symbolStack)
}

function parse (stack) {
  if (stack.length < 3) {
    return stack[0]
  }
  for (let i = 0; i < stack.length; i++) {
    if (!NUM_REG.test(stack[i])) {
      const value = exec(String(stack[i - 2]), stack[i], String(stack[i - 1]))
      stack.splice(i - 2, 3, value)
      return parse(stack)
    }
  }
}

function exec (strNumA, op, strNumB) {
  const lens = [strNumA, strNumB].map(
    n => (n.split('.')[1] ? n.split('.')[1].length : 0)
  )
  const maxLen = Math.max.apply(null, lens)
  const p = 10 ** maxLen
  const [calcA, calcB] = [strNumA, strNumB].map(
    n => n.replace(NEGATIVE_FLAG, '-') * p
  )
  switch (op) {
    case '+':
      return (calcA + calcB) / p
    case '-':
      return (calcA - calcB) / p
    case '*':
      return (calcA * calcB) / p / p
    case '/':
      return calcA / calcB
    default:
      break
  }
}

export function calc (exp) {
  const convertResult = convert(exp)
  const value = `${parse(convertResult)}`
  return {
    value,
    format ({ precision, isPadZero }) {
      const [int, decimal] = value.split('.')
      if (decimal && precision > 0) {
        let decimalStr
        if (isPadZero) {
          decimalStr = decimal.padEnd(precision, '0').substr(0, precision)
        } else {
          decimalStr = decimal.substr(0, precision)
        }
        return `${int}.${decimalStr}`
      }
      return value
    }
  }
}
