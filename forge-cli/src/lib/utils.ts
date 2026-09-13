/** userProfile -> UserProfile */
export function toPascalCase(input: string): string {
  return input
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) =>
      c ? c.toUpperCase() : ""
    )
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/** UserProfile -> userProfile */
export function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** UserProfile -> user-profile */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/** Validates a name is safe to use as a directory / package name segment. */
export function isValidName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(name);
}
