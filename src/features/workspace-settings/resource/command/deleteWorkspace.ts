import { command } from '~/resources/command';

export async function deleteWorkspace(slugName: string) {
  await command.workspace.delete({ slugName });
}
