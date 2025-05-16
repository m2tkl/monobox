export type EditorMsg =
  | { type: 'toggleHeading'; level: 1 | 2 | 3 }
  | { type: 'toggleStyle'; style: 'bold' | 'italic' | 'strike' }
  | { type: 'toggleBulletList' }
  | { type: 'toggleOrderedList' }
  | { type: 'toggleBlockQuote' }
  | { type: 'toggleCode' }
  | { type: 'clearFormat' }
  | { type: 'unsetLink' }
  | { type: 'setLink'; href: string }
  ;
