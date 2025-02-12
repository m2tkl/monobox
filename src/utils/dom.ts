const LOG_PREFIX = '[utils/dom]:';

/*******************************
 * Heading scroll
 *******************************/

/**
 * Scroll to a specific element within the editor by its ID (only if an ID is assigned).
 * Used to focus on the corresponding position when an item in the ToC is clicked.
 *
 * @param elementId The ID of the element within the editor that is the target of the scroll
 * @param offset
 */
export function scrollToElementWithOffset(elementId: string, offset = 0) {
  const element = document.getElementById(elementId);
  const editorElem = document.getElementById('main');

  if (!element || !editorElem) {
    console.warn(LOG_PREFIX, 'scrollToElementWithOffset() element not found.');
    return;
  }

  // NOTE:
  //   Since scrolling is now confined within a Div, the scroll distance of the container needs to be retrieved
  //   instead of the distance from the window.
  //   For the window, use scrollY, but for an Element, use scrollTop.
  const elementPosition
    = element.getBoundingClientRect().top + editorElem!.scrollTop;
  const offsetPosition = elementPosition - offset;

  editorElem.scrollTo({ top: offsetPosition, behavior: 'instant' });
}
