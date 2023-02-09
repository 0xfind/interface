import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {setAuthHeaders} from "../../utils";

export const findServiceSignatureSplitApi = createApi({
  reducerPath: "findServiceSignatureSplitApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND_URL + '/',
    prepareHeaders: setAuthHeaders,
  }),
  keepUnusedDataFor: 3,
  refetchOnMountOrArgChange: 1,
  endpoints: () => ({}),
})