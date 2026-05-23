import { getDatabase, initializeDatabase } from "@/database/database";
import type { BackupPayload } from "@/services/backupService";

export async function replaceAllDataFromBackup(payload: BackupPayload) {
  await initializeDatabase();

  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    await database.runAsync("DELETE FROM payment_histories;");
    await database.runAsync("DELETE FROM loans;");

    for (const loan of payload.loans) {
      await database.runAsync(
        `
          INSERT INTO loans (
            id,
            borrower_name,
            principal,
            interest_rate,
            payment_cycle,
            current_due_date,
            unpaid_interest,
            credit_balance,
            accumulated_profit,
            status,
            created_at,
            updated_at,
            closed_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          loan.id,
          loan.borrowerName.trim(),
          loan.principal,
          loan.interestRate,
          loan.paymentCycle,
          loan.currentDueDate,
          loan.unpaidInterest,
          loan.creditBalance,
          loan.accumulatedProfit,
          loan.status,
          loan.createdAt,
          loan.updatedAt,
          loan.closedAt ?? null
        ]
      );
    }

    for (const history of payload.paymentHistories) {
      await database.runAsync(
        `
          INSERT INTO payment_histories (
            id,
            loan_id,
            type,
            paid_amount,
            expected_amount,
            unpaid_interest_created,
            credit_created,
            payment_date,
            due_cycle_date,
            note,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          history.id,
          history.loanId,
          history.type,
          history.paidAmount,
          history.expectedAmount,
          history.unpaidInterestCreated,
          history.creditCreated,
          history.paymentDate ?? null,
          history.dueCycleDate ?? null,
          history.note ?? null,
          history.createdAt
        ]
      );
    }
  });
}
