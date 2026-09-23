export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_UNAVAILABLE';
  }
}

export class AIQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_QUOTA_EXCEEDED';
  }
}

export class AIRateLimitedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_RATE_LIMITED';
  }
}

export class AIAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_AUTH_ERROR';
  }
}

export class AITimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_TIMEOUT';
  }
}

export class AIInvalidOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_INVALID_OUTPUT';
  }
}

export class AILocalProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_LOCAL_PROVIDER_UNAVAILABLE';
  }
}

export class AIBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_BUDGET_EXCEEDED';
  }
}

export class CapabilityUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AI_CAPABILITY_UNAVAILABLE';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VALIDATION_ERROR';
  }
}
