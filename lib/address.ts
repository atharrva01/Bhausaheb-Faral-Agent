// Per-country address rules, so a US state/ZIP can't be shipped to Canada by a mis-tapped country button.
import type { CountryCode } from "@/lib/shipping";

const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA PR RI SC SD TN TX UT VT VA WA WV WI WY".split(" "),
);
const CA_PROVINCES = new Set("AB BC MB NB NL NS NT NU ON PE QC SK YT".split(" "));
const AU_STATES = new Set("NSW VIC QLD WA SA TAS ACT NT".split(" "));

type Rule = {
  stateLabel: string | null; // null = no state field required
  statePlaceholder?: string;
  states?: Set<string>;
  postalLabel: string;
  postalPlaceholder?: string;
  postalRequired: boolean;
  postal?: RegExp;
};

export const ADDRESS_RULES: Record<CountryCode, Rule> = {
  US: { stateLabel: "State", statePlaceholder: "NJ", states: US_STATES, postalLabel: "ZIP code", postalPlaceholder: "08817", postalRequired: true, postal: /^\d{5}(-\d{4})?$/ },
  CA: { stateLabel: "Province", statePlaceholder: "ON", states: CA_PROVINCES, postalLabel: "Postal code", postalPlaceholder: "L6X 1A3", postalRequired: true, postal: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/ },
  AU: { stateLabel: "State", statePlaceholder: "NSW", states: AU_STATES, postalLabel: "Postcode", postalPlaceholder: "2150", postalRequired: true, postal: /^\d{4}$/ },
  GB: { stateLabel: null, postalLabel: "Postcode", postalPlaceholder: "LE1 3HQ", postalRequired: true, postal: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/ },
  AE: { stateLabel: null, postalLabel: "PO Box (optional)", postalRequired: false }, // UAE has no postal codes
};

export type AddressIssue = { field: "state" | "postalCode"; message: string };

/** Returns problems with state/postal for the chosen country (empty array = OK). */
export function validateAddress(country: CountryCode, state: string | null | undefined, postalCode: string | null | undefined): AddressIssue[] {
  const rule = ADDRESS_RULES[country];
  const issues: AddressIssue[] = [];
  const st = (state ?? "").trim().toUpperCase();
  const pc = (postalCode ?? "").trim();

  if (rule.states) {
    if (!st) issues.push({ field: "state", message: `${rule.stateLabel} is required` });
    else if (!rule.states.has(st))
      issues.push({ field: "state", message: `"${st}" is not a valid ${rule.stateLabel!.toLowerCase()} code for this country (e.g. ${rule.statePlaceholder})` });
  }
  if (rule.postalRequired && !pc) issues.push({ field: "postalCode", message: `${rule.postalLabel} is required` });
  else if (pc && rule.postal && !rule.postal.test(pc))
    issues.push({ field: "postalCode", message: `That doesn't look like a valid ${rule.postalLabel.toLowerCase()} (e.g. ${rule.postalPlaceholder})` });
  return issues;
}
