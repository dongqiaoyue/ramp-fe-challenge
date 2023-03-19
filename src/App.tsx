import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import {Employee, Transaction} from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)

    const [transactionApprovals, setTransactionApprovals] = useState(new Map<string, boolean>())

    const updateTransactionApproval = useCallback((transactionId: string, approved: boolean) => {
        setTransactionApprovals((prevApprovals) => new Map(prevApprovals.set(transactionId, approved)))
    }, [])

  const transactions = useMemo(
      () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
      [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    try {
      setIsEmployeesLoading(true)
      await employeeUtils.fetchAll()
    } finally {
      setIsEmployeesLoading(false)
    }

    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
      async (employeeId: string) => {
        paginatedTransactionsUtils.invalidateData()

        try {
          setIsEmployeesLoading(true)
          await transactionsByEmployeeUtils.fetchById(employeeId)
        } finally {
          setIsEmployeesLoading(false)
        }
      },
      [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const isLastPage = paginatedTransactions?.nextPage === null

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
      <Fragment>
        <main className="MainContainer">
          <Instructions />

          <hr className="RampBreak--l" />

          <InputSelect<Employee>
              isLoading={isEmployeesLoading}
              defaultValue={EMPTY_EMPLOYEE}
              items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
              label="Filter by employee"
              loadingLabel="Loading employees"
              parseItem={(item) => ({
                value: item.id,
                label: `${item.firstName} ${item.lastName}`,
              })}
              onChange={async (newValue) => {
                if (newValue === null || newValue.id.length === 0) {
                  await loadAllTransactions();
                  return
                }

                await loadTransactionsByEmployee(newValue.id)
              }}
          />

          <div className="RampBreak--l" />

          <div className="RampGrid">
            <Transactions
                transactions={transactions}
                transactionApprovals={transactionApprovals}
                setTransactionApproval={updateTransactionApproval}
            />

              {!isLastPage && transactions !== null && transactionsByEmployee === null && (
                  <button
                      className="RampButton"
                      disabled={paginatedTransactionsUtils.loading}
                      onClick={async () => {
                          await paginatedTransactionsUtils.fetchAll();
                      }}
                  >
                      View More
                  </button>
              )}
          </div>
        </main>
      </Fragment>
  )
}
