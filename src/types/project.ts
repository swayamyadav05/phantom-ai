export interface Project {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
}

export const MOCK_PROJECTS: Project[] = [
  { id: "1", name: "E-commerce Platform", slug: "e-commerce-platform", isOwned: true },
  { id: "2", name: "Payment Service", slug: "payment-service", isOwned: true },
  { id: "3", name: "Analytics Dashboard", slug: "analytics-dashboard", isOwned: false },
];
