import { createMulticall } from '@uniswap/redux-multicall'
import { combineReducers, createStore } from 'redux'


const multicall = createMulticall({ reducerPath: "multicall" })
const reducer = combineReducers({ [multicall.reducerPath]: multicall.reducer })
export const store = createStore(reducer)

export default multicall
