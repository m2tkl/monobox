type Step = {
  name: string;
  task: () => Promise<void>;
  condition?: () => boolean;
};

export interface WorkflowRunner {
  step: (name: string, task: () => Promise<void>) => WorkflowRunner;
  stepIf: (name: string, condition: () => boolean, task: () => Promise<void>) => WorkflowRunner;
  run: () => Promise<void>;
}

export function createWorkflowRunner(): WorkflowRunner {
  const steps: Step[] = [];

  return {
    step(name, task) {
      steps.push({ name, task });
      return this;
    },

    stepIf(name, condition, task) {
      steps.push({ name, task, condition });
      return this;
    },

    async run() {
      for (const step of steps) {
        if (step.condition && !step.condition()) {
          continue;
        }
        await step.task();
      }
    },
  };
}
