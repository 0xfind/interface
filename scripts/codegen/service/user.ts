import type {ConfigFile} from '@rtk-query/codegen-openapi'
import { BACKEND_URL } from './env'

const schemaFile = `${BACKEND_URL}/q/service/find.service.v1.User`

const config: ConfigFile = {
  schemaFile,
  apiFile: '../../../src/state/service/userApi.ts',
  apiImport: 'findServiceUserSplitApi',
  outputFile: '../../../src/state/service/generatedUserApi.ts',
  exportName: 'generatedUserApi',
  hooks: true,
}

export default config