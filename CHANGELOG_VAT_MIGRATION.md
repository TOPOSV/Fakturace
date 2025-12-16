# VAT Payer Setting Migration

## Overview
Moved the VAT (DPH) payer configuration from client-level to user-level settings.

## Date
December 16, 2025

## Rationale
VAT registration is a property of the user's company (the invoice issuer), not of their clients. All invoices issued by a VAT-registered company should include VAT calculations, regardless of which client they're issued to.

## Changes Made

### Database Schema Changes

#### Added to `users` table:
- `is_vat_payer` (INTEGER, DEFAULT 1)
  - 1 = VAT payer (DPH plátce)
  - 0 = Non-VAT payer (Neplátce DPH)
  - Default is 1 for backward compatibility

#### Removed from `clients` table:
- `is_vat_payer` column (no longer needed)

### Backend API Changes

**File: `src/controllers/authController.ts`**
- `getProfile()`: Now returns user's `is_vat_payer` status
- `updateProfile()`: Now accepts and saves user's `is_vat_payer` status

**File: `src/controllers/clientController.ts`**
- `createClient()`: Removed `is_vat_payer` parameter
- `updateClient()`: Removed `is_vat_payer` parameter

**File: `src/controllers/invoiceController.ts`**
- `getInvoice()`: Removed `client_is_vat_payer` from SELECT query

### Frontend Changes

**File: `client/src/components/Settings/Settings.tsx`**
- Added checkbox: "Plátce DPH"
- Located in "Základní údaje" (Basic Info) section
- Help text: "Pokud jste plátcem DPH, bude DPH zobrazeno na všech vašich fakturách."

**File: `client/src/components/Clients/ClientForm.tsx`**
- Removed checkbox: "Plátce DPH"
- Simplified form state and handling

**File: `client/src/utils/pdfGenerator.ts`**
- Changed from `invoice.client_is_vat_payer` to `userData.is_vat_payer`
- PDF invoices now use user's VAT status for all calculations

## Migration Path

### For New Users
- Default value of `is_vat_payer = 1` (VAT payer)
- Can be changed in Settings page

### For Existing Users
- Migration automatically adds `is_vat_payer = 1` to all existing users
- Users should verify their VAT status in Settings and update if needed
- Previous client-specific VAT settings are removed

## User Action Required
After deployment, users should:
1. Go to Settings (⚙️ Nastavení profilu)
2. Check "Plátce DPH" checkbox status
3. Update if they are not actually VAT registered
4. Save changes

## Technical Notes

### Migrations
- **Migration 006**: Adds `is_vat_payer` to `users` table
- **Migration 007**: Removes `is_vat_payer` from `clients` table
- Both migrations check for column existence before executing
- Safe to run multiple times

### Backward Compatibility
- Default value ensures existing invoices continue to work
- PDF generation falls back to `true` if value is undefined
- No breaking changes to existing data

## Testing Checklist
- [ ] Create new user → VAT payer checkbox should be checked by default
- [ ] Update user profile → VAT setting should be saved
- [ ] Create/edit client → No VAT checkbox should appear
- [ ] Generate PDF invoice → Should use user's VAT status
- [ ] Non-VAT user → PDF should show no VAT calculations
- [ ] VAT user → PDF should show VAT calculations with rates

## Security
- No security vulnerabilities introduced
- All database queries remain parameterized
- Authentication/authorization unchanged
- Data validation maintained

## Rollback Procedure
If rollback is needed:
1. Restore database from backup before migrations
2. Deploy previous version of code
3. Run: `git revert f81a4d6 a91beac`

## Support
For issues or questions, contact the development team.
