/**
 * What changed in Occupella, newest first. Rendered at /changelog.
 *
 * ⚠ AN ENTRY IS SOMETHING A CUSTOMER CAN SEE OR USE TODAY. Each comes from a
 * merged AgenticHelixis pull request (`pr`, not shown on the page) and was
 * checked against the app code before it was written here. Internal fixes,
 * eval and CI work, anything behind a flag that is off, and anything about a
 * system the site doesn't name are left out.
 *
 * Adding an entry: put it at the top, dated the day the PR merged to main
 * (Render deploys main), in words a property manager would use. Name the
 * place in the app where they find it. changelog.test.ts checks the order,
 * the PR number and the words that must never appear.
 */
export interface ChangelogEntry {
  date: string;
  pr: number;
  text: string;
}

export const ENTRIES: ChangelogEntry[] = [
  { date: "2026-09-16", pr: 1016, text: "The web app moved to app.occupella.com." },
  { date: "2026-09-08", pr: 998, text: "Two-factor sign-in, with backup codes. Turn it on in Settings." },
  { date: "2026-09-08", pr: 998, text: "Drag a file onto the chat to attach it." },
  {
    date: "2026-09-08",
    pr: 998,
    text: "The invite and password reset screens show how strong a password is as you type it, and each password field has a Show button.",
  },
  {
    date: "2026-09-07",
    pr: 986,
    text: "Export all of your data as a zip of CSV files, or delete your account, from Settings.",
  },
  { date: "2026-09-04", pr: 983, text: "Leasing is part of the Pro and Scale plans." },
  { date: "2026-09-03", pr: 981, text: "Change your password in Settings without being signed out." },
  {
    date: "2026-09-01",
    pr: 972,
    text: "While it works, the chat says what it is doing in plain words, such as “Looking up the property” or “Finding who is on the lease”.",
  },
  {
    date: "2026-08-30",
    pr: 954,
    text: "A chat answer reads as one reply on the page, instead of a stack of separate boxes.",
  },
  { date: "2026-08-28", pr: 935, text: "Spending reports can be broken down by property." },
  {
    date: "2026-08-27",
    pr: 928,
    text: "A contact lookup marks a tenant whose lease has ended as a former tenant.",
  },
  {
    date: "2026-08-27",
    pr: 930,
    text: "After it declines a fair housing question, Occupella won't offer school ratings or crime statistics in its place.",
  },
];
