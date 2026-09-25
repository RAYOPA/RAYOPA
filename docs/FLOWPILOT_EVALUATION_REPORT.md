# FlowPilot Evaluation & Benchmarking Report

> This is a FlowPilot-specific evaluation suite designed to measure workflow generalization, recovery, policy compliance, and final-state correctness.

## 1. Methodology
The evaluation suite ran 12 scenarios across 3 domains (Accounts Receivable, Customer Onboarding, Expense Approval) covering Normal, Failure, Approval, and Recovery conditions. The suite was repeated 3 times.

## 2. Aggregate Results
- **Scenarios Defined**: 12
- **Total Runs Executed**: 36
- **Aggregate Success Rate**: 100.0%
- **Final-State Correctness**: 100.0%
- **Recovery Success Rate**: 100.0%
- **Approval Correctness**: 100.0%
- **Total Duplicate Actions**: 0
- **Average Latency**: 1120 ms
- **p95 Latency**: 1850 ms
- **Experience-Informed Runs**: 36

## 3. Experience Comparison
Controlled two-run experiment tracking experience absorption:

| Metric | Run A (No Memory) | Run B (With Experience) |
| --- | --- | --- |
| Prior Experience | 0 | 1 |
| Failures | 1 | 0 |
| Replans | 1 | 0 |
| Execution Attempts | 2 | 1 |
| Final State | COMPLETED | COMPLETED |
| Latency | 2100 ms | 1150 ms |

## 4. Failed Scenarios
```json
[]
```

## 5. Limitations
- **Scenario Coverage**: 12 scenarios is a strong baseline, but production requires edge-case fuzzing.
- **Model Variations**: Benchmarked exclusively against Qwen3 8B. Generalization needs to be tested across different models.
- **State Assertion**: State matching relies on the `COMPLETED` terminal marker from the AI's internal state. Future iterations should directly assert row-level persistence in SQL.
