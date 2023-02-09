require("dotenv").config({ path: "../../../.env" })

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://service-test.harberger.money'