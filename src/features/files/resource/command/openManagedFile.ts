import { command } from '~/resources/command';

export async function openManagedFile(fileId: string) {
  await command.file.openManagedFile(fileId);
}
