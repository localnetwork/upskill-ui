export const rolesAndPermissions = [
  {
    id: "1",
    role: "Admin",
    permissions: [],
  },
  {
    id: "2",
    role: "Instructor",
    permissions: [
      "add-course",
      "edit-own-courses",
      "view-own-earnings",
      "view-own-payment-settings",
    ],
  },
  {
    id: "3",
    role: "Learner",
    permissions: ["view-courses", "view-own-learnings"],
  },
];
