import AppKit
import Foundation

enum RenderError: Error {
  case invalidArguments
  case cannotLoadImage(String)
  case cannotCreateBitmap
  case cannotCreateData
}

func parseDimension(_ rawValue: String) -> CGSize? {
  if rawValue == "original" {
    return nil
  }

  let components = rawValue.split(separator: "x")
  guard components.count == 2,
        let width = Double(components[0]),
        let height = Double(components[1]),
        width > 0,
        height > 0 else {
    return nil
  }

  return CGSize(width: width, height: height)
}

let arguments = CommandLine.arguments
guard arguments.count == 4 else {
  throw RenderError.invalidArguments
}

let inputPath = arguments[1]
let outputPath = arguments[2]
let sizeArgument = arguments[3]

guard let image = NSImage(contentsOfFile: inputPath) else {
  throw RenderError.cannotLoadImage(inputPath)
}

let targetSize = parseDimension(sizeArgument) ?? image.size
guard let bitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: Int(targetSize.width.rounded()),
  pixelsHigh: Int(targetSize.height.rounded()),
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
) else {
  throw RenderError.cannotCreateBitmap
}

bitmap.size = targetSize

NSGraphicsContext.saveGraphicsState()
guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
  throw RenderError.cannotCreateBitmap
}

NSGraphicsContext.current = context
context.imageInterpolation = .high
NSColor.clear.setFill()
NSBezierPath(rect: NSRect(origin: .zero, size: targetSize)).fill()
image.draw(
  in: NSRect(origin: .zero, size: targetSize),
  from: .zero,
  operation: .sourceOver,
  fraction: 1.0
)
context.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
  throw RenderError.cannotCreateData
}

let outputURL = URL(fileURLWithPath: outputPath)
try FileManager.default.createDirectory(
  at: outputURL.deletingLastPathComponent(),
  withIntermediateDirectories: true
)
try pngData.write(to: outputURL)
