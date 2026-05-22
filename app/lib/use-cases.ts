export type UseCaseId = "sales" | "apollo";

export type UseCaseConfig = {
  id: UseCaseId;
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  submitLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  detailLabel: string;
  detailPlaceholder: string;
  outcomePositive: string;
  outcomeNegative: string;
  outcomePending: string;
  metricOutcomeLabel: string;
  workflow: { title: string; text: string }[];
  accent: "indigo" | "teal";
};

export const USE_CASES: Record<UseCaseId, UseCaseConfig> = {
  sales: {
    id: "sales",
    label: "B2B sales qualification",
    shortLabel: "Sales",
    tagline: "Qualify inbound leads in minutes",
    description:
      "Trigger an outbound voice call to capture use case, budget, timeline, and demo interest for your sales team.",
    submitLabel: "Start qualification call",
    nameLabel: "Lead name",
    namePlaceholder: "John Doe",
    detailLabel: "Company",
    detailPlaceholder: "Acme Pvt Ltd",
    outcomePositive: "Qualified",
    outcomeNegative: "Not qualified",
    outcomePending: "Pending",
    metricOutcomeLabel: "Qualification rate",
    accent: "indigo",
    workflow: [
      {
        title: "Lead submitted",
        text: "Sales enters name, phone, and company.",
      },
      {
        title: "Voice agent calls",
        text: "Bolna runs your sales qualification script.",
      },
      {
        title: "Qualification captured",
        text: "Agent saves qualified flag and summary via webhook.",
      },
      {
        title: "Dashboard updated",
        text: "View results under Sales or All tabs.",
      },
    ],
  },
  apollo: {
    id: "apollo",
    label: "Apollo post-discharge follow-up",
    shortLabel: "Apollo",
    tagline: "48-hour symptom check by voice",
    description:
      "Call discharged patients (or caregivers) in English or Hindi, run a short symptom checklist, and flag nurse escalation when needed.",
    submitLabel: "Start follow-up call",
    nameLabel: "Patient name",
    namePlaceholder: "Rajesh Kumar",
    detailLabel: "Procedure / ward",
    detailPlaceholder: "Post knee surgery — Ward 4B",
    outcomePositive: "Stable",
    outcomeNegative: "Escalate",
    outcomePending: "Pending",
    metricOutcomeLabel: "Stable rate",
    accent: "teal",
    workflow: [
      {
        title: "Patient logged",
        text: "Care team enters patient, phone, and procedure.",
      },
      {
        title: "Voice agent calls",
        text: "Bolna runs the post-discharge symptom script.",
      },
      {
        title: "Symptoms captured",
        text: "Agent marks stable vs escalate and saves summary.",
      },
      {
        title: "Dashboard updated",
        text: "Nursing ops sees flags under Apollo or All tabs.",
      },
    ],
  },
};

export const USE_CASE_LIST: UseCaseId[] = ["sales", "apollo"];

export function isUseCaseId(value: string): value is UseCaseId {
  return value === "sales" || value === "apollo";
}

export function getUseCaseConfig(id: UseCaseId): UseCaseConfig {
  return USE_CASES[id];
}

export function resolveBolnaAgentId(useCase: UseCaseId): string | undefined {
  if (useCase === "apollo") {
    return (
      process.env.BOLNA_AGENT_ID_APOLLO?.trim() ||
      process.env.BOLNA_AGENT_ID?.trim()
    );
  }
  return (
    process.env.BOLNA_AGENT_ID_SALES?.trim() ||
    process.env.BOLNA_AGENT_ID?.trim()
  );
}
