export const isInternalLink = (url: string): boolean => {
  const appHost = window.location.origin;
  try {
    const linkHost = new URL(url, appHost).origin;
    return linkHost === appHost;
  }
  catch (error) {
    console.error(error);
    return false;
  }
};
