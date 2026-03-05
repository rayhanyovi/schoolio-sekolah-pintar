export const normalizeSchoolCode = (value: string) =>
  value.trim().toUpperCase();

export const generateSchoolCode = () =>
  `SCH-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export const buildSchoolCodeFromId = (id: string) => {
  const compact = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = compact.slice(0, 8).padEnd(8, "X");
  return `SCH-${suffix}`;
};
