export type WorkflowResult =
  | 'completed'
  | { cancelled: true; reason: string };

type StepTask<R> = () => R | Promise<R>;

export interface TypedWorkflow<T extends Record<string, unknown>> {
  step<K extends keyof T>(
    name: K,
    task: StepTask<T[K]>
  ): TypedWorkflow<T>;
  run(): Promise<WorkflowResult>;
  getResult<K extends keyof T>(name: K): T[K];
}

export function defineWorkflow<T extends Record<string, unknown>>(): TypedWorkflow<T> {
  const steps: Array<{ name: keyof T; task: () => Promise<void> }> = [];
  const results: Partial<T> = {};

  return {
    step(name, task) {
      steps.push({
        name,
        task: async () => {
          const result = await Promise.resolve().then(task);
          results[name] = result;
        },
      });
      return this;
    },

    async run() {
      for (const { name, task } of steps) {
        try {
          await task();
        }
        catch (err) {
          console.log(err);
          return { cancelled: true, reason: `step "${String(name)}" failed` };
        }
      }
      return 'completed';
    },

    getResult(name) {
      return results[name] as T[typeof name];
    },
  };
}
