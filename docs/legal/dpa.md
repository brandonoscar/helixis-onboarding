# Data Processing Agreement (draft)

> Draft for the one product. Written in house, not reviewed by a lawyer. Not published. Blanks
> read `[[LIKE THIS]]` (`README.md`).

Effective [[EFFECTIVE DATE]]

This agreement is between the company that uses Occupella ("you") and [[LEGAL NAME]], a
[[STATE]] limited liability company, at [[MAILING ADDRESS]] ("Occupella", "we"). It is part of the
[Terms of Service](/terms), and where the two differ about personal data, this one governs.

## 1. What it covers

You keep personal data about other people in Occupella: your tenants, owners, applicants,
vendors, their household members and guarantors, and your own staff. That data is yours. We
process it only to provide Occupella to you. In the language of privacy law, you are the
controller (the "business"), and we are your processor (your "service provider" or
"contractor").

What we collect as ourselves (your account, billing and our website) is covered by our
[Privacy Policy](/privacy), not by this agreement.

## 2. What we process, and why

| | |
|---|---|
| **Purpose** | Providing Occupella to you: keeping your books, running the portals, leasing, maintenance, payments you turn on, emails and texts you send through it, and the AI assistant. |
| **Duration** | While your account is open, and then as section 8 says. |
| **People** | Your tenants and their household members, guarantors and emergency contacts; owners; applicants; vendors; your staff; anyone you email or text through Occupella. |
| **Data** | Names and contact details; leases, charges, payments and balances; bills, draws and statements; bank account numbers for paying owners and vendors (sealed); tax IDs (sealed); applications (contact details, current address, previous landlord and employer, an emergency contact, proof of income); screening results you record; signatures and their evidence (time, internet address, browser); maintenance requests and photos; documents you upload; messages through the portals; text consent records. |
| **Not collected** | Occupella's application never asks for a Social Security number or a date of birth, nor anything fair housing law protects. Card and bank details for online payments go to Stripe, not to us. |

## 3. Your instructions

We process the data only as you instruct: these terms, and what you and the people you authorize
do in Occupella. If we believe an instruction breaks the law, we will tell you. If the law
requires us to process the data otherwise, we will tell you first unless the law forbids it.

As your service provider, we will not:

- sell or share it (for advertising across other businesses, or for anything else);
- use, keep or disclose it for any purpose but providing Occupella to you;
- combine it with data from another company or from ourselves, except as running Occupella
  needs and the law allows;
- use it to train AI models.

## 4. Confidentiality and security

Everyone at Occupella who can reach your data is bound to keep it confidential and reaches only
what their work needs. We keep the measures in Annex B, and we may improve them, but never so
that they protect your data less.

## 5. Subprocessors

You allow us to use the service providers listed on our [Privacy Policy](/privacy) page, each
only for what it does there. Each is bound by written terms that protect the data at least as
this agreement does, and we remain responsible to you for them. We will tell your account's
admins at least [[NOTICE DAYS]] days before adding or replacing one. If you object for a
reasonable data protection reason, we will try to address it; if we can't, you may end the
affected service and we will refund any amount paid in advance for it.

## 6. Helping you

- **People's requests:** if someone asks us about data you keep, we will send them to you. Through
  Occupella you can see, correct, export and archive what you keep about a person; where you
  need more, we will help, as far as we reasonably can.
- **Records the law requires:** trust records are never edited or deleted inside Occupella;
  corrections are new entries. When someone asks you to delete data you must keep by law, such as
  the record of money you held for them, that is yours to decide under your obligations.
- **Assessments and authorities:** we will give you the information you reasonably need for a
  privacy assessment, or for an inquiry by a regulator about our processing.

## 7. Security incidents

If we confirm that your data was accessed, disclosed, changed or lost without authorization, we
will tell your account's admins without undue delay, and within [[BREACH HOURS]] hours of
confirming it. We will say what happened, what data and people it touched as far as we know, what
we have done and what you may need to do, and keep you informed as we learn more. Telling you is
not an admission of fault.

## 8. When your account ends

Before your account closes, export your books and records from Occupella's export pages: every
record table, your documents and leases, and the whole ledger. They are your trust records, which
the law may require you to keep for years.

After it closes: [[RETENTION]]. Backups expire on their own schedule ([[BACKUPS]]). Where the law
requires us to keep something longer, we keep only that, only for as long as it requires, and
protect it as this agreement says.

## 9. Information and audits

On request, once a year or after a security incident, we will answer a reasonable written
questionnaire about how we protect your data, and share summaries of our security testing. We
don't host on-site audits except where the law requires it, and then on reasonable notice, at your
cost and under confidentiality.

## 10. Where data is processed

Your data is stored and processed in [[DATA LOCATION]]. Where a subprocessor processes it
elsewhere, it does so under the protections the law requires for that transfer.

## 11. Liability and term

Each party's liability under this agreement is subject to the limits in the
[Terms of Service](/terms). This agreement lasts as long as we process your data for you.

## Annex A: the processing

As section 2.

## Annex B: security measures

- **Each company apart.** Every record carries its company, and every page, report and export is
  answered for the signed-in person's own company. Tests sweep every route of the books' API for
  it.
- **Money behind checks the database enforces.** The application changes the books only through
  functions that refuse what breaks a trust rule (an account below zero, a payment past what was
  charged, a bank account that doesn't tie out). Month-end is prepared by one person and approved
  by another.
- **The AI can't write.** Its database role reads the books and proposes drafts that a person
  approves; it holds no other write.
- **Nothing erased.** Trust records are append-only, and every change is in an audit log naming
  who made it.
- **Sealed secrets.** Bank account numbers, tax IDs, payment keys and webhook secrets are encrypted
  (AES-GCM) under a key only our servers hold; only their last four are shown, and each reveal of
  a whole tax ID is logged.
- **Sign-in.** Passwords kept only as a one-way hash, sessions that expire, repeated failed
  sign-ins refused, and invite and signing links kept only as a fingerprint.
- **In transit and at rest.** HTTPS everywhere, with browsers told to use nothing else, and the
  database provider's encryption where data is stored.
- **Backups.** [[BACKUPS]].
- **Testing.** The books' code is tested on every change, including for one company reaching
  another's records; security testing as Occupella grows (its latest summary on request).
