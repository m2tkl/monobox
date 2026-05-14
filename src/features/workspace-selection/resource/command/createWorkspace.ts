import { command } from '~/resources/command';

type CreateWorkspaceInput = {
  name: string;
};

export async function createWorkspace(input: CreateWorkspaceInput) {
  return await command.workspace.create(input);
}
