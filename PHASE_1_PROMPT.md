# PHASE 1 PROMPT — Architecture Setup Only

You are working on a React Native Expo app called Personal Loan Tracker.

Read and follow:
- PROJECT_RULES.md
- BUSINESS_RULES.md

## Phase 1 Goal
Set up project architecture only.

Do not build real screens yet.
Do not implement full business logic yet.
Do not connect UI to database yet.

## Required Setup
Set up:
- Expo project with TypeScript
- Expo Router
- NativeWind
- Zustand
- Expo SQLite
- Reanimated
- Expo Haptics
- Dark theme system
- Folder structure
- Basic shared types
- Basic constants

## Folder Structure

Create or prepare this structure:

app/
  (tabs)/
    index.tsx
    loans.tsx
    archive.tsx
    settings.tsx

  loan/
    [id].tsx

components/
database/
hooks/
services/
store/
constants/
types/

## Phase 1 Screens
Only create placeholder screens.

Allowed placeholder screens:
- Dashboard placeholder
- Loans placeholder
- Archive placeholder
- Settings placeholder
- Loan detail placeholder

Do not design final UI yet.

## Required Files

Create basic files for:

constants/
  theme.ts

types/
  loan.ts
  payment.ts

store/
  loanStore.ts

database/
  database.ts
  schema.ts

services/
  loanCalculator.ts

## Type Requirements

Define basic TypeScript types for:
- Loan
- LoanStatus
- PaymentCycle
- PaymentHistory
- PaymentHistoryType

Do not overcomplicate types yet.

## Database Requirements

Prepare SQLite initialization structure only.

Do not fully implement repository layer yet.

Create schema placeholders for:
- loans
- payment_histories

## Service Requirements

Create loanCalculator.ts with placeholder exported functions only.

Do not implement full logic yet.

Example function placeholders:
- calculateExpectedInterest
- calculateNextDueDate
- calculateAmountDue
- applyPaymentToLoan

Each function can throw "Not implemented yet" for now.

## Strict Restrictions
Do not:
- build full dashboard UI
- build bottom sheets
- build animations
- build notification logic
- build archive logic
- build full payment logic
- add backend
- add auth
- add cloud sync
- add unnecessary libraries
- change business rules

## Before Coding
First respond with:
1. Implementation plan
2. Files to create/change
3. Risks
4. Ask for approval

Only write code after approval.