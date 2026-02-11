import { Account, LogicSig, op, TemplateVar } from '@algorandfoundation/algorand-typescript'

const owner = TemplateVar<Account>('OWNER')

export class AlgolandFundingLsig extends LogicSig {
  public program() {
    return op.arg(0) === owner.bytes
  }
}
