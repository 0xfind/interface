import { Fraction } from '@uniswap/sdk-core';
import JSBI from 'jsbi';

// help func
const small = JSBI.BigInt(10 ** (18 - 6))

function greaterThanOrEqual0(x: Fraction) {
  return !x.lessThan(JSBI.BigInt(0))
}

function monotGreather(x: Fraction, monotonous: boolean) {
  if (!monotonous) return x.lessThan(JSBI.BigInt(0))
  return x.greaterThan(JSBI.BigInt(0))
}

function add(x: JSBI, y: JSBI) {
  return JSBI.add(x, y)
}

function abs(x: Fraction) {
  if (greaterThanOrEqual0(x)) return x
  return opposite(x)
}

function opposite(x: Fraction) {
  return x.multiply(JSBI.BigInt(-1))
}

function avg(x: JSBI, y: JSBI) {
  return JSBI.divide(add(x, y), JSBI.BigInt(2))
}

function approx0(x: Fraction) {
  return abs(x).lessThan(small) || abs(x).equalTo(small)
}

// only for monotonic functions
export function inverseFunc(
  func: (...arg0: any[]) => Fraction,
  yValues: Fraction,
  args: any[],
  domain: [JSBI, JSBI],
  maxLoop = 1000,
  monotonous = true
): JSBI {
  const [a, b] = domain
  let dSub: Fraction

  // specified monotonicity
  // let dSub = func(b, ...args).subtract(func(a, ...args))
  // const monotonous = greaterThanOrEqual0(dSub)

  let xmin = a
  let xmax = b
  let avgV = a
  let loop = maxLoop
  while (true) {
    avgV = avg(xmax, xmin)
    dSub = func(avgV, ...args).subtract(yValues)
    // console.log(loop, avgV.toString(), dSub.toSignificant(6), xmin.toString(), xmax.toString(), monotonous)
    if (approx0(dSub)) {
      // console.log("inverseFunc: success", avgV?.toString());
      break
    }
    else if (monotGreather(dSub, monotonous)) xmax = avgV
    else xmin = avgV
    loop -= 1
    if (loop === 0) {
      // console.log("inverseFunc: maxLoop", avgV?.toString());
      break
    }
  }
  return avgV
}
