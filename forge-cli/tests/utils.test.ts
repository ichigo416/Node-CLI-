import { describe, it, expect } from "vitest";
import {
  toPascalCase,
  toCamelCase,
  toKebabCase,
  isValidName,
} from "../src/lib/utils.js";

describe("toPascalCase", () => {
  it("converts kebab-case", () => {
    expect(toPascalCase("user-profile")).toBe("UserProfile");
  });
  it("converts snake_case", () => {
    expect(toPascalCase("user_profile")).toBe("UserProfile");
  });
  it("leaves single words capitalized", () => {
    expect(toPascalCase("button")).toBe("Button");
  });
});

describe("toCamelCase", () => {
  it("converts kebab-case", () => {
    expect(toCamelCase("user-profile")).toBe("userProfile");
  });
});

describe("toKebabCase", () => {
  it("converts PascalCase", () => {
    expect(toKebabCase("UserProfile")).toBe("user-profile");
  });
});

describe("isValidName", () => {
  it("accepts alphanumeric names starting with a letter", () => {
    expect(isValidName("my-app_2")).toBe(true);
  });
  it("rejects names starting with a digit", () => {
    expect(isValidName("2fast")).toBe(false);
  });
  it("rejects names with spaces or slashes", () => {
    expect(isValidName("my app")).toBe(false);
    expect(isValidName("../etc")).toBe(false);
  });
});
