import JSBI from 'jsbi'; 
import { CurrencyAmount, Fraction, Token } from "@uniswap/sdk-core"
import { FeeAmount, Pool, Tick, TickListDataProvider, TICK_SPACINGS } from "@uniswap/v3-sdk"
// import invariant from 'tiny-invariant'

// small more small, inverse function will more big
const small = JSBI.BigInt(10 ** (18 - 6))
const inverseMaxLoop = 500
const multiplyMax = JSBI.BigInt(500)

function approx0(x: Fraction) {
  return x.lessThan(0) && x.multiply(-1).lessThan(small)
}

function genATB(amount: JSBI) {
  return [JSBI.BigInt(0), JSBI.multiply(amount, JSBI.BigInt(2))]
}

const findOspPoolTicks = [
  new Tick({ index: -115000, liquidityGross: JSBI.BigInt("1030007438799810706687235"), liquidityNet: JSBI.BigInt("1030007438799810706687235") }),
  new Tick({ index: -46000, liquidityGross: JSBI.BigInt("12583509757497773659823316"), liquidityNet: JSBI.BigInt("10523494879898152246448846") }),
  new Tick({ index: -23000, liquidityGross: JSBI.BigInt("15736069674272452038627274"), liquidityNet: JSBI.BigInt("-7370934963123473867644888") }),
  new Tick({ index: -4000, liquidityGross: JSBI.BigInt("15768067289302318412463931"), liquidityNet: JSBI.BigInt("7402932578153340241481545") }),
  new Tick({ index: 0, liquidityGross: JSBI.BigInt("11585499933727829326972738"), liquidityNet: JSBI.BigInt("-11585499933727829326972738") }),
]

// this is only for mortgage token, only sort, because ticks is find < osp tick
export const FindToken = new Token(1, '0x0000000000000000000000000000000000000000', 18, 'Find', 'Find')
export const MorgageOspToken = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'MorgageOsp', 'MorgageOsp')

export const initSqrtPriceX96FindToOsp = "79627299360338032760430980940"
export const initTickFindToOsp = 100

export const initSqrtPriceX96OspToFind = "78831026366734652303669917531"
export const initTickOspToFind = -101

const initLiquidity = "0"
const mortgageFee = new Fraction(5, 1000)
// 99.5%
const mortgageFeeNarrow = new Fraction(995, 1000)

export class MortgagePool extends Pool {
  public constructor() {
    super(FindToken, MorgageOspToken, 0 as any, initSqrtPriceX96FindToOsp, initLiquidity, initTickFindToOsp, new TickListDataProvider(findOspPoolTicks, 1))
  }

  public get tickSpacing(): number {
    return TICK_SPACINGS[FeeAmount.HIGH]
  }
}

export const initOspPool = () => new Pool(
  FindToken, MorgageOspToken, FeeAmount.HIGH,
  initSqrtPriceX96FindToOsp,
  initLiquidity,
  initTickFindToOsp,
  findOspPoolTicks
)

const mortgage = async (ospAmount: JSBI) => {
  const pool = new MortgagePool()
  const [amount, ] = await pool.getInputAmount(CurrencyAmount.fromRawAmount(MorgageOspToken, ospAmount))
  // step1: buy ospamount, will change price
  // const [, p] = await pool.getInputAmount(CurrencyAmount.fromRawAmount(MorgageOspToken, ospAmount))
  // step2: in step1 price, sell ospamount, will get find
  // const [amount,] = await p.getOutputAmount(CurrencyAmount.fromRawAmount(MorgageOspToken, ospAmount))
  return amount
}

export const mortgagedInOsp = async (ospAmount: JSBI, existed: JSBI) => {
  // step1: get existed mortgage find
  const existedMortgage = await mortgage(existed)
  // step2: get current: existed + ospAmount mortgage find
  const currentMortgage = await mortgage(JSBI.add(ospAmount, existed))
  const amount = currentMortgage.subtract(existedMortgage)
  return [amount.multiply(mortgageFeeNarrow), amount.multiply(mortgageFee)]
}

export async function inverseMortgagedInOspByFindAmount(findAmount: JSBI, existed: JSBI) {
  const [a, b] = genATB(findAmount)
  let dSub: Fraction
  let xmin = a
  let xmax = b
  let avgV = a
  let loop = inverseMaxLoop
  while (true) {
    avgV = JSBI.divide(JSBI.add(xmax, xmin), JSBI.BigInt(2))

    dSub = (await mortgagedInOsp(avgV, existed))[0].asFraction.subtract(findAmount)
    if (approx0(dSub)) {
      // console.log("inverseFunc: success", avgV?.toString());
      break
    }
    else if (dSub.greaterThan(0)) xmax = avgV
    else xmin = avgV
    loop -= 1
    if (loop === 0) {
      // console.log("inverseFunc: maxLoop", avgV?.toString());
      break
    }
  }
  const [, fee] = await mortgagedInOsp(avgV, existed)
  return [CurrencyAmount.fromRawAmount(MorgageOspToken, avgV), fee]
}

export async function inverseRedeemInOspByFindAmount(findAmount: JSBI, existed: JSBI) {
  const [a, b] = [JSBI.BigInt(0), JSBI.multiply(existed, JSBI.BigInt(2))]
  let dSub: Fraction
  let xmin = a
  let xmax = b
  let avgV = a
  let loop = inverseMaxLoop
  while (true) {
    avgV = JSBI.divide(JSBI.add(xmax, xmin), JSBI.BigInt(2))

    if (JSBI.greaterThan(avgV, existed)) {
      xmax = avgV
      continue
    }

    const [ret, retFee] = await mortgagedInOsp(avgV, JSBI.subtract(existed, avgV))
    dSub = ret.add(retFee).asFraction.subtract(findAmount)
    if (approx0(dSub)) {
      // console.log("inverseFunc: success", avgV?.toString());
      break
    }
    else if (dSub.greaterThan(0)) xmax = avgV
    else xmin = avgV
    loop -= 1
    if (loop === 0) {
      // console.log("inverseFunc: maxLoop", avgV?.toString());
      break
    }
  }
  return CurrencyAmount.fromRawAmount(MorgageOspToken, avgV)
}

export async function inverseCashInOspByFindAmount(earnAmount: JSBI, marketPool: Pool, ospToken: Token, existed: JSBI) {
  const [a, b] = [JSBI.BigInt(0), JSBI.multiply(existed, JSBI.BigInt(2))]
  let dSub: Fraction
  let xmin = a
  let xmax = b
  let avgV = a
  let loop = inverseMaxLoop
  while (true) {
    avgV = JSBI.divide(JSBI.add(xmax, xmin), JSBI.BigInt(2))

    if (JSBI.greaterThan(avgV, existed)) {
      xmax = avgV
      continue
    }

    const [ret, retFee] = await mortgagedInOsp(avgV, JSBI.subtract(existed, avgV))
    const [marketAmount,] = await marketPool.getOutputAmount(CurrencyAmount.fromRawAmount(ospToken, avgV))
    dSub = marketAmount.asFraction.subtract(ret.add(retFee).asFraction).subtract(earnAmount)
    if (approx0(dSub)) {
      console.log("inverseCashInOspByFindAmount: success", dSub?.toFixed(2), "loop:", loop)
      break
    }
    else if (dSub.greaterThan(0)) xmax = avgV
    else xmin = avgV
    loop -= 1
    if (loop === 0) {
      console.log("inverseCashInOspByFindAmount: loop max", dSub?.toFixed(2))
      break
    }
  }
  return CurrencyAmount.fromRawAmount(MorgageOspToken, avgV)
}

const multiplyGuess = async (pool: Pool, find: Token, guess: JSBI, existed: JSBI) => {
  const [outAllOsp,] = (await pool.getOutputAmount(CurrencyAmount.fromRawAmount(find, guess)))
  // verify: step1, in current price buy out all osp, cost yi
  const [yi,] = await pool.getInputAmount(outAllOsp)
  // verify: step2, morgage outAllOsp, get yo
  const [yo,] = await mortgagedInOsp(outAllOsp.quotient, existed)
  return [outAllOsp, yi, yo]
}

export const multiplyInFindWithInit = async (findAmount: JSBI) => {
  const pool = initOspPool()
  return await multiplyInFind(pool, FindToken, findAmount, JSBI.BigInt(0))
}

export const multiplyInFind = async (pool: Pool, find: Token, findAmount: JSBI, existed: JSBI) => {
  const [a, b] = [findAmount, JSBI.multiply(findAmount, multiplyMax)]
  let dSub: Fraction
  let xmin = a
  let xmax = b
  let avgV = a
  let loop = 0
  while (true) {
    avgV = JSBI.divide(JSBI.add(xmax, xmin), JSBI.BigInt(2))

    const [, yi, yo] = await multiplyGuess(pool, find, avgV, existed)
    // verify: yi-yo <= initFindAmount
    // console.log(yi.asFraction.subtract(yo.asFraction).quotient.toString())
    // console.log(findAmount.toString())
    dSub = yi.asFraction.subtract(yo.asFraction).subtract(findAmount)
    if (yi.greaterThan(yo) && approx0(dSub)) {
      console.log("multiplyInFind: success", dSub?.toFixed(2), "loop:", loop)
      break
    }
    else if (dSub.greaterThan(0)) xmax = avgV
    else xmin = avgV
    loop ++
    if (loop > inverseMaxLoop) {
      console.log("multiplyInFind: loop max", dSub?.toFixed(2))
      avgV = findAmount
      break
    }
  }
  const [outAllOsp, , yo] = await multiplyGuess(pool, find, avgV, existed)
  return [CurrencyAmount.fromRawAmount(find, avgV), outAllOsp, yo.divide(mortgageFeeNarrow).multiply(mortgageFee)]
}

export async function inverseMultiplyInFindByOspAmount(pool: Pool, find: Token, ospAmount: JSBI, existed: JSBI) {
  const [a, b] = genATB(ospAmount)
  let dSub: Fraction
  let xmin = a
  let xmax = b
  let avgV = a
  let loop = inverseMaxLoop
  while (true) {
    avgV = JSBI.divide(JSBI.add(xmax, xmin), JSBI.BigInt(2))
    
    // dSub = JSBI.subtract((await multiplyInFind(chainId, pool, avgV, existed))[1], ospAmount)
    dSub = (await multiplyInFind(pool, find, avgV, existed))[1].asFraction.subtract(ospAmount)
    // console.log(loop, avgV.toString(), dSub.toSignificant(6), xmin.toString(), xmax.toString(), monotonous)
    if (approx0(dSub)) {
      // console.log("inverseFunc: success", avgV?.toString());
      break
    }
    else if (dSub.greaterThan(0)) xmax = avgV
    else xmin = avgV
    loop -= 1
    if (loop === 0) {
      // console.log("inverseFunc: maxLoop", avgV?.toString());
      break
    }
  }
  const r = await multiplyInFind(pool, find, avgV, existed)
  return [r[0].asFraction.divide(1e18), new Fraction(avgV, 1e18), r[2].asFraction.divide(1e18)]
}

// multiply loop proposal
// Deprecated
// export const multiplyInFindV2 = async (pool: Pool, find: Token, findAmount: JSBI, existed: JSBI) => {
//   const maxMultiply = new Fraction(JSBI.multiply(findAmount, multiplyMax))
//   let multiFind = new Fraction(findAmount, 1)
//   let loop = 0
//   let loopFind = findAmount
//   let loopPool = pool
//   let loopExisted = existed
//   while (true) {
//     // step1, round1 get findAmount market price get outOsp
//     const [outOsp, p] = await loopPool.getOutputAmount(CurrencyAmount.fromRawAmount(find, loopFind))
//     // step2, mortgage outOsp, get round1 get morgage find
//     const [outFind,] = await mortgagedInOsp(outOsp.quotient, loopExisted)
//     // step3, Q = outFind / loopFind
//     // const Q = outFind.asFraction.divide(loopFind)
//     // step4, refresh loopPool, findAmount, loopExisted, multiFind
//     loopPool = p
//     loopFind = outFind.quotient
//     loopExisted = JSBI.add(loopExisted, outOsp.quotient)
//     multiFind = multiFind.add(outFind.asFraction)
//     loop ++
//     if (multiFind.greaterThan(maxMultiply)) {
//       multiFind = maxMultiply
//       console.log("multiplyInFind: maxMultiply", multiFind.toFixed(2))
//       break
//     }
//     if (outFind.lessThan(1e18)) {
//       console.log("multiplyInFind: less 1e18, outFind: ", outFind.toFixed(2))
//       break
//     }
//     if (loop > multiplyMaxLoop) {
//       console.log("multiplyInFind: loop max 100, outFind: ", outFind.toFixed(2))
//       break
//     }
//   }
//   // step5, sell costFind, get outAllOsp
//   const [outAllOsp,] = (await pool.getOutputAmount(CurrencyAmount.fromRawAmount(find, multiFind.quotient)))
//   // verify: step1, in current price buy out all osp, cost yi
//   const [yi,] = await pool.getInputAmount(outAllOsp)
//   // verify: step2, morgage outAllOsp, get yo
//   const [yo,] = await mortgagedInOsp(outAllOsp.quotient, existed)
//   // verify: yi-yo <= initFindAmount
//   try {
//     invariant(yi.greaterThan(yo) && yi.asFraction.subtract(yo.asFraction).lessThan(findAmount), "illegal multiply")
//   } catch (error) {
//     console.log(error)
//     console.log(yi.asFraction.subtract(yo.asFraction).quotient.toString())
//     console.log(findAmount.toString())
//   }
//   return [CurrencyAmount.fromRawAmount(find, multiFind.quotient), outAllOsp, yo.divide(mortgageFeeNarrow).multiply(mortgageFee)]
// }

// multiply formula proposal
// Deprecated
// export const multiplyInFindV1 = async (pool: Pool, find: Token, findAmount: JSBI, existed: JSBI) => {
//   const maxMultiply = new Fraction(JSBI.multiply(findAmount, multiplyMax))
//   // step1, round1 get findAmount market price get outOsp
//   const [r1OutOsp,] = await pool.getOutputAmount(CurrencyAmount.fromRawAmount(find, findAmount))
//   // step2, mortgage outOsp, get round1 get morgage find
//   const [r1OutFind,] = await mortgagedInOsp(r1OutOsp.quotient, existed)
//   existed = JSBI.add(existed, r1OutOsp.quotient) 
//   // step3, Q = r1OutFind / findAmount
//   const Q = r1OutFind.asFraction.divide(findAmount)

//   // const [r2OutOsp, r2p] = await r1p.getOutputAmount(CurrencyAmount.fromRawAmount(find, r1OutFind.quotient))
//   // const [r2OutFind,] = await mortgagedInOsp(r2OutOsp.quotient, existed)
//   // existed = JSBI.add(existed, r2OutOsp.quotient) 
//   // const Q2 = r2OutFind.asFraction.divide(r1OutFind)

//   // const [r3OutOsp, r3p] = await r2p.getOutputAmount(CurrencyAmount.fromRawAmount(find, r2OutFind.quotient))
//   // const [r3OutFind,] = await mortgagedInOsp(r3OutOsp.quotient, existed)
//   // const Q3 = r3OutFind.asFraction.divide(r2OutFind)

//   // const [r4OutOsp, r4p] = await r3p.getOutputAmount(CurrencyAmount.fromRawAmount(find, r3OutFind.quotient))
//   // const [r4OutFind,] = await mortgagedInOsp(r4OutOsp.quotient, existed)
//   // const Q4 = r4OutFind.asFraction.divide(r3OutFind)

//   // console.log([Q.toSignificant(6), Q2.toSignificant(6), Q3.toSignificant(6), Q4.toSignificant(6)])
//   // step4, cost all find, summation proportional series
//   // Notice: we need subtract 1 (1e18), because we need ensure multiply is safely
//   // Notice: cmp max multiply, if > maxMultiply, then use maxMultiply
//   const multiFind = (new Fraction(findAmount, 1).divide(Q.multiply(-1).add(1))).subtract(1e18)
//   const costFind = multiFind.greaterThan(maxMultiply) ? maxMultiply : multiFind
//   // step5, sell costFind, get outAllOsp
//   const [outAllOsp,] = (await pool.getOutputAmount(CurrencyAmount.fromRawAmount(find, costFind.quotient)))
//   // verify: step1, in current price buy out all osp, cost yi
//   const [yi, ] = await pool.getInputAmount(outAllOsp)
//   // verify: step2, morgage outAllOsp, get yo
//   const [yo, ] = await mortgagedInOsp(outAllOsp.quotient, existed)
//   // verify: yi-yo <= findAmount
//   console.log(yi.asFraction.subtract(yo.asFraction).quotient.toString())
//   console.log(findAmount.toString())
//   try {
//     invariant(yi.asFraction.subtract(yo.asFraction).lessThan(findAmount), "illegal multiply") 
//   } catch (error) {
//     console.log(error)
//   }
//   return [CurrencyAmount.fromRawAmount(find, costFind.quotient), outAllOsp, yo.divide(mortgageFeeNarrow).multiply(mortgageFee)]
// }