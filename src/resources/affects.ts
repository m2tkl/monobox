import type { ChangeRef } from './changes';
import { resourceRefs, serializeResourceRef, type ResourceRef } from './refs';

type ChangeRule = {
  source: ChangeRef['type'];
  targets: Array<(change: ChangeRef) => ResourceRef>;
};

function defineAffects<T extends ChangeRef>(source: T['type']) {
  return {
    resource(target: (change: T) => ResourceRef): ChangeRule {
      return {
        source,
        targets: [change => target(change as T)],
      };
    },
    resources(targets: Array<(change: T) => ResourceRef>): ChangeRule {
      return {
        source,
        targets: targets.map(target => change => target(change as T)),
      };
    },
  };
}

const affectRules: ReadonlyArray<ChangeRule> = [
  // workspace collection changed -> workspaceCollection
  defineAffects<Extract<ChangeRef, { type: 'workspaceCollectionChanged' }>>('workspaceCollectionChanged').resource(
    () => resourceRefs.workspaceCollection(),
  ),
  // memo created -> memo, memoCollection
  defineAffects<Extract<ChangeRef, { type: 'memoCreated' }>>('memoCreated').resources([
    change => resourceRefs.memo(change.workspaceSlug, change.memoSlug),
    change => resourceRefs.memoCollection(change.workspaceSlug),
  ]),
  // memo changed -> memo, memoCollection
  defineAffects<Extract<ChangeRef, { type: 'memoChanged' }>>('memoChanged').resources([
    change => resourceRefs.memo(change.workspaceSlug, change.memoSlug),
    change => resourceRefs.memoCollection(change.workspaceSlug),
  ]),
  // memo renamed -> memo, memoCollection, old/new linkCollection, memoLinkCountCollection
  defineAffects<Extract<ChangeRef, { type: 'memoRenamed' }>>('memoRenamed').resources([
    change => resourceRefs.memo(change.workspaceSlug, change.memoSlug),
    change => resourceRefs.memoCollection(change.workspaceSlug),
    change => resourceRefs.linkCollection(change.workspaceSlug, change.previousMemoSlug),
    change => resourceRefs.linkCollection(change.workspaceSlug, change.memoSlug),
    change => resourceRefs.memoLinkCountCollection(change.workspaceSlug),
  ]),
  // memo deleted -> memoCollection, memoLinkCountCollection
  defineAffects<Extract<ChangeRef, { type: 'memoDeleted' }>>('memoDeleted').resources([
    change => resourceRefs.memoCollection(change.workspaceSlug),
    change => resourceRefs.memoLinkCountCollection(change.workspaceSlug),
  ]),
  // memo links changed -> linkCollection, memoLinkCountCollection
  defineAffects<Extract<ChangeRef, { type: 'memoLinksChanged' }>>('memoLinksChanged').resources([
    change => resourceRefs.linkCollection(change.workspaceSlug, change.memoSlug),
    change => resourceRefs.memoLinkCountCollection(change.workspaceSlug),
  ]),
  // bookmark collection changed -> bookmarkCollection
  defineAffects<Extract<ChangeRef, { type: 'bookmarkCollectionChanged' }>>('bookmarkCollectionChanged').resource(
    change => resourceRefs.bookmarkCollection(change.workspaceSlug),
  ),
  // kanban collection changed -> kanbanCollection
  defineAffects<Extract<ChangeRef, { type: 'kanbanCollectionChanged' }>>('kanbanCollectionChanged').resource(
    change => resourceRefs.kanbanCollection(change.workspaceSlug),
  ),
  // kanban status collection changed -> kanbanStatusCollection
  defineAffects<Extract<ChangeRef, { type: 'kanbanStatusCollectionChanged' }>>('kanbanStatusCollectionChanged').resource(
    change => resourceRefs.kanbanStatusCollection(change.workspaceSlug, change.kanbanId),
  ),
  // kanban entry collection changed -> kanbanEntryCollection
  defineAffects<Extract<ChangeRef, { type: 'kanbanEntryCollectionChanged' }>>('kanbanEntryCollectionChanged').resource(
    change => resourceRefs.kanbanEntryCollection(change.workspaceSlug, change.memoSlug),
  ),
];

export function resolveAffectedResources(changes: ReadonlyArray<ChangeRef>): ResourceRef[] {
  const affected: ResourceRef[] = [];
  const seen = new Set<string>();

  for (const change of changes) {
    for (const rule of affectRules) {
      if (rule.source !== change.type) {
        continue;
      }

      for (const target of rule.targets) {
        const resource = target(change);
        const key = serializeResourceRef(resource);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        affected.push(resource);
      }
    }
  }

  return affected;
}
