export const CAREER_ROLES = [
  {
    id: "all",
    label: "All Roles",
    keywords: [],
  },
  {
    id: "mobile_frontend",
    label: "Mobile / Frontend",
    keywords: ["React Native", "Mobile", "Frontend", "iOS", "Android"],
  },
  {
    id: "product_manager",
    label: "Product Manager",
    keywords: [
      "Product Manager",
      "PM",
      "Growth PM",
      "Platform PM",
      "Technical Product Manager",
    ],
  },
];

export const DEFAULT_CAREER_ROLE_ID = "all";

export function getCareerRole(roleId) {
  return CAREER_ROLES.find((role) => role.id === roleId) || null;
}
