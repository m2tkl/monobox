/**
 * NOTE: This function addresses the inconsistency in how `asset://` URLs are handled
 * across different operating systems (Windows and macOS).
 *
 * Background:
 * - On macOS, the `asset://localhost` protocol works natively and correctly displays the assets.
 * - On Windows, the same `asset://localhost` protocol is not supported by default, resulting in
 *   a failure to load the assets.
 *
 * To ensure compatibility, this function transforms the `src` value for the `<img>` tag:
 * - On Windows, it replaces `asset://localhost` with `http://asset.localhost`.
 * - On macOS, it retains the original `asset://localhost`.
 *
 * This ensures a consistent user experience across platforms while maintaining the integrity of
 * the asset loading mechanism in Tauri applications.
 *
 * Why not use `convertFileSrc`?
 * - While `convertFileSrc` could convert `file://` paths to valid asset paths depending operating systems,
 *   it does not allow dynamic backend-driven asset path resolution.
 * - In this project, asset file paths need to be dynamically updated by the backend,
 *   which `convertFileSrc` cannot accommodate. This function ensures that assets
 *   are resolved correctly based on the platform while allowing dynamic path handling.
 *
 * @param imageSrc The `src` value from the `<img>` tag.
 * @returns The transformed `src` value based on the current platform.
 */
export const transformImageSrc = (imageSrc: string) => {
  const transformedSrc = isWindows
    ? imageSrc.replace('asset://localhost', 'http://asset.localhost')
    : imageSrc;

  return transformedSrc;
};
