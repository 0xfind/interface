import type {ConfigFile} from '@rtk-query/codegen-openapi'
import { BACKEND_URL } from './env'

const schemaFile = `${BACKEND_URL}/q/service/find.service.v1.Claim`

const config: ConfigFile = {
  schemaFile,
  apiFile: '../../../src/state/service/claimApi.ts',
  apiImport: 'findServiceClaimSplitApi',
  outputFile: '../../../src/state/service/generatedClaimApi.ts',
  exportName: 'generatedClaimApi',
  hooks: true,
}

export default config