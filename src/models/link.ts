export type Link = {
  id: number;
  slug_title: string;
  title: string;
  description: string | null;
  thumbnail_image: string | null;
  link_id: number;
  link_type: string;
};

export type BaseLink = {
  id: number | string;
  slug_title: string;
  title: string;
};

export type ExistingLink = BaseLink & {
  tag: 'existing';
};

export type NewLink = BaseLink & {
  tag: 'new';
};

export type LinkPaletteItem = ExistingLink | NewLink;

export type LinkPaletteItems = Array<{
  key: string;
  label: string;
  commands: Array<LinkPaletteItem>;
}>;
