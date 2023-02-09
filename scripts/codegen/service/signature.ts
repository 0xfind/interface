import type {ConfigFile} from '@rtk-query/codegen-openapi'
import { BACKEND_URL } from './env'

const schemaFile = `${BACKEND_URL}/q/service/find.service.v1.Signature`

const config: ConfigFile = {
  schemaFile,
  apiFile: '../../../src/state/service/signatureApi.ts',
  apiImport: 'findServiceSignatureSplitApi',
  outputFile: '../../../src/state/service/generatedSignatureApi.ts',
  exportName: 'generatedSignatureApi',
  hooks: true,
}

export default config