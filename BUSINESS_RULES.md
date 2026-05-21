# BUSINESS RULES — Personal Loan Tracker App

## Loan Type
This app tracks interest-only personal loans.

Borrower pays interest each cycle.
Principal stays the same until loan closing.

## Borrower Rule
One borrower can have only one active loan.

Borrower data:
- name only

## Interest Rule
Interest is calculated as a percentage of principal.

Each loan can have a different interest rate.

Example:
Principal = 10,000
Interest rate = 10%
Expected interest = 1,000

## Payment Cycle
Supported cycles:
- monthly
- every 10 days

## Monthly Due Date Rule
Normally, monthly due date uses the same day of the next month.

If the target day does not exist, use the last day of that month.

Example:
January 31 → February 28 or February 29

## Fixed Billing Cycle
If borrower pays early, the current cycle is marked as paid.
The next due date is still based on the original billing cycle, not the payment date.

## Partial Payment Rule
If borrower pays less than expected, count the paid amount as actual profit.

The remaining amount becomes unpaid interest and rolls into the next cycle.

Example:
Expected = 1,000
Paid = 600

Accumulated profit +600
Unpaid interest = 400

Next cycle due = expected interest + unpaid interest

## Overpayment Rule
If borrower pays more than due, the extra amount becomes credit balance.

Example:
Due = 1,400
Paid = 2,000

Credit balance = 600

Next cycle automatically uses credit balance.

## Credit Auto Deduction
If credit balance exists, it should automatically reduce the next amount due.

Example:
Next due = 1,000
Credit balance = 600

Actual amount due = 400

If credit balance is greater than or equal to due amount, the cycle is considered paid automatically.

## Profit Rule
Accumulated profit counts only actual received interest.

Do not count expected interest as profit.

Profit should be tracked:
- globally across the app
- per loan

## Dashboard Visibility
Dashboard should show only loans that need attention.

Show loans when:
- overdue
- due today
- due within 7 days

Hide loans that are not close to due date.

## Dashboard Sorting
Sort loan cards by urgency:
1. overdue first
2. due today
3. nearest due date

## Notification Rule
Notify only on due date.

Notification time:
09:00

No spam notifications.

## Reschedule Rule
Reschedule changes only the current cycle due date.
It does not permanently change the loan billing cycle.

## Close Loan Rule
To close a loan, borrower must fully pay:
- principal
- current interest
- unpaid interest

Apply credit balance if available.

After closing, move loan to archive.

## Archive Rule
Archive should keep everything:
- loan data
- payment history
- profit history
- reschedule history
- close loan history
- timeline records

## Payment History Snapshot
Every payment history record should store:
- paid amount
- expected amount
- unpaid interest created
- credit created
- payment date
- due cycle date
- optional note

## MVP Scope
First usable MVP should include:
- add loan
- dashboard
- receive interest payment