import { CurrencyAmount, Fraction } from "@uniswap/sdk-core"
import {  parseUnits } from "ethers/lib/utils"
import JSBI from "jsbi"
import { mortgagedInOsp, MortgagePool, MorgageOspToken, FindToken, multiplyInFind, initOspPool } from "../mortgage"

it("testMortage", async () => {
  const [outFind, fee] = await mortgagedInOsp(JSBI.BigInt(21.7549 * 1e18), JSBI.BigInt(0))
  console.log(outFind.toSignificant(6), fee.toSignificant(6))
  const pool = new MortgagePool()
  const [a,] = await pool.getInputAmount(CurrencyAmount.fromRawAmount(MorgageOspToken, JSBI.BigInt(100 * 1e18)))
  console.log(a.toSignificant(6))
})

it("testMultiplyInFind", async () => {
  const pool = new MortgagePool()
  const [multiFind, outAllOsp,] = await multiplyInFind(pool, FindToken, JSBI.BigInt(100 * 1e18), JSBI.BigInt(0))
  console.log(multiFind.toExact(), outAllOsp.toExact())
})

it("whitepaperExample0", async () => {
  const init = initOspPool()
  const [out1e4,] = await init.getOutputAmount(CurrencyAmount.fromRawAmount(FindToken, parseUnits("500000", 18).toBigInt().toString()))
  const [mortgageOut, mortgageOutFee] = await mortgagedInOsp(out1e4.asFraction.quotient, JSBI.BigInt(0))
  console.log(out1e4.toFixed(2), mortgageOut.toFixed(2), mortgageOut.add(mortgageOutFee).toFixed(2))
  // 9886.22 9850.5 9900
  // 10000 - 9850.5 = 149.5 
})

it("whitepaperExample1", async () => {
  const init = initOspPool()
  // 5.2 
  // Pay find buy 1000 X
  const coin1000 = JSBI.BigInt(parseUnits("1000", 18).toBigInt().toString())
  const [payFind,] = await init.getInputAmount(CurrencyAmount.fromRawAmount(MorgageOspToken, coin1000))
  // Mortgage 1000 X
  const [mortgageOut, mortgageOutFee] = await mortgagedInOsp(coin1000, JSBI.BigInt(0))
  console.log(payFind.toFixed(2), mortgageOut.toFixed(2), mortgageOutFee.toFixed(2), mortgageOut.add(mortgageOutFee).toFixed(2))
  // 5.3
  // multiply 40 find
  const [outAllFind, outAllOsp,] = await multiplyInFind(init, FindToken, JSBI.BigInt(parseUnits("40", 18).toBigInt().toString()), JSBI.BigInt(0))
  console.log(outAllOsp.toFixed(2), outAllFind.toFixed(2))
  // 5.5 Position Merge
  console.log("5.5")
  const coina = JSBI.BigInt(parseUnits("200000", 18).toBigInt().toString())
  const coinb = JSBI.BigInt(parseUnits("160000", 18).toBigInt().toString())
  const coinc = JSBI.add(coina, coinb)
  const [, np] = await init.getOutputAmount(CurrencyAmount.fromRawAmount(FindToken, coinc))
  console.log(np.token0Price.toSignificant(6), np.token1Price.toSignificant(6))
  const [pa, paFee] = await mortgagedInOsp(coinb, JSBI.BigInt(0))
  const [newPa, newPaFee] = await mortgagedInOsp(coinb, coina)
  console.log(pa.toSignificant(6))
  console.log(pa.add(paFee).toSignificant(6))
  console.log(newPa.add(newPaFee).toSignificant(6))
  console.log(newPa.add(newPaFee).subtract(pa.add(paFee)).toSignificant(6))
  console.log(newPa.add(newPaFee).subtract(pa.add(paFee)).multiply(new Fraction(995, 1000)).toSignificant(6))
  console.log(newPa.add(newPaFee).subtract(pa.add(paFee)).multiply(new Fraction(5, 1000)).toSignificant(6))
  // 5.5 Position Split
  
})

export { }

