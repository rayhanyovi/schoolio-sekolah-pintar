import {
  consumeRateLimit,
  getClientRateLimitKey,
  resetRateLimitForTests,
} from "@/lib/rate-limit";

const policy = {
  name: "test:policy",
  limit: 2,
  windowMs: 1000,
};

const buildRequest = (ip = "203.0.113.10") =>
  new Request("http://localhost/api/test", {
    headers: {
      "x-forwarded-for": `${ip}, 10.0.0.1`,
    },
  });

describe("rate-limit helper", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("menggunakan IP pertama dari x-forwarded-for sebagai client key", () => {
    expect(getClientRateLimitKey(buildRequest())).toBe("ip:203.0.113.10");
  });

  it("menghabiskan token dan mengembalikan retry metadata", () => {
    const request = buildRequest();

    expect(
      consumeRateLimit({ request, policy, identifier: "user@example.com", now: 0 })
    ).toMatchObject({ allowed: true, remaining: 1 });
    expect(
      consumeRateLimit({ request, policy, identifier: "user@example.com", now: 0 })
    ).toMatchObject({ allowed: true, remaining: 0 });
    expect(
      consumeRateLimit({ request, policy, identifier: "user@example.com", now: 0 })
    ).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1,
    });
  });

  it("memisahkan bucket berdasarkan identifier", () => {
    const request = buildRequest();

    consumeRateLimit({ request, policy, identifier: "user-a@example.com", now: 0 });
    consumeRateLimit({ request, policy, identifier: "user-a@example.com", now: 0 });

    expect(
      consumeRateLimit({ request, policy, identifier: "user-b@example.com", now: 0 })
    ).toMatchObject({ allowed: true, remaining: 1 });
  });
});
