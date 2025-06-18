export class WorkflowCancelled extends Error {
  constructor(message = 'Workflow was cancelled') {
    super(message);

    this.name = 'WorkflowCancelled';
  }
}

export type WorkflowResult =
  | { type: 'completed' }
  | { type: 'cancelled'; reason?: string }
  | { type: 'error'; error: unknown };

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
          console.log(`Workflow step "${String(name)}" exec.`);
          await task();
        }
        catch (err) {
          if (err instanceof WorkflowCancelled) {
            return { type: 'cancelled' };
          }
          return { type: 'error', error: err };
        }
      }
      return { type: 'completed' };
    },

    getResult(name) {
      return results[name] as T[typeof name];
    },
  };
}
