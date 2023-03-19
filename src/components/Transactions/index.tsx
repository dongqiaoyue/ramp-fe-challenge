import { useCallback } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({   transactions,
                                                        transactionApprovals,
                                                        setTransactionApproval, }) => {
  const { fetchWithoutCache, loading } = useCustomFetch()

    const handleSetTransactionApproval = useCallback<SetTransactionApprovalFunction>(
        async ({ transactionId, newValue }) => {
            await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
                transactionId,
                value: newValue,
            })

            // Update the transaction approvals state
            setTransactionApproval(transactionId, newValue)
        },
        [fetchWithoutCache, setTransactionApproval]
    )

    if (transactions === null) {
        return <div className="RampLoading--container">Loading...</div>
    }

    return (
        <div data-testid="transaction-container">
            {transactions.map((transaction) => (
                <TransactionPane
                    key={transaction.id}
                    transaction={transaction}
                    loading={loading}
                    setTransactionApproval={handleSetTransactionApproval}
                    approved={transactionApprovals.get(transaction.id) ?? transaction.approved}
                />
            ))}
        </div>
    )
}
