import { command } from '~/resources/command';

export async function openInboxFile(path: string) {
  await command.file.openLocalPath(path);
}
