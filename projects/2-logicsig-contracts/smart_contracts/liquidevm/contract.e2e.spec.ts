import { AlgorandClient, Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import { Account } from 'algosdk'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { beforeAll, beforeEach, describe, test } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const approvalProgram = readFileSync(join(__dirname, '../artifacts/liquidevm/AlgolandFundingLsig.teal'), 'utf8')
let approvalBytes: Uint8Array | undefined = undefined

async function createLogicSigAccount({
  account,
  args,
  algorand,
}: {
  account: Account
  args: Uint8Array[]
  algorand: AlgorandClient
}) {
  const compiledBase64ToBytes =
    approvalBytes ??
    (
      await algorand.app.compileTealTemplate(approvalProgram, {
        TMPL_OWNER: account.addr.publicKey,
      })
    ).compiledBase64ToBytes
  if (!approvalBytes) approvalBytes = compiledBase64ToBytes
  return algorand.account.logicsig(compiledBase64ToBytes, args)
}

describe('Liquidevm contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
      // traceAll: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  test('should create logic sig', async () => {
    const { testAccount } = localnet.context
    const lsigAccount = await createLogicSigAccount({
      account: testAccount,
      args: [testAccount.addr.publicKey],
      algorand: localnet.algorand,
    })
    await localnet.algorand.account.ensureFundedFromEnvironment(lsigAccount, (1).algos())
    await localnet.algorand.send.payment({
      sender: lsigAccount,
      receiver: lsigAccount,
      amount: (0.1).algos(),
      signer: lsigAccount.signer,
    })
  })
})
