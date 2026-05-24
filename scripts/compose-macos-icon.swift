import AppKit
import Foundation

enum ComposeError: Error {
  case invalidArguments
  case cannotLoadImage(String)
  case cannotCreateBitmap
  case cannotReadPixels
  case cannotCreateData
}

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  throw ComposeError.invalidArguments
}

let inputPath = arguments[1]
let outputPath = arguments[2]

guard let image = NSImage(contentsOfFile: inputPath) else {
  throw ComposeError.cannotLoadImage(inputPath)
}

func rgbaBitmap(from image: NSImage) throws -> NSBitmapImageRep {
  let targetSize = image.size
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
    throw ComposeError.cannotCreateBitmap
  }

  bitmap.size = targetSize

  NSGraphicsContext.saveGraphicsState()
  guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    throw ComposeError.cannotCreateBitmap
  }
  NSGraphicsContext.current = context
  context.imageInterpolation = .high
  NSColor.clear.setFill()
  NSBezierPath(rect: NSRect(origin: .zero, size: targetSize)).fill()
  image.draw(in: NSRect(origin: .zero, size: targetSize), from: .zero, operation: .sourceOver, fraction: 1.0)
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()

  return bitmap
}

func contentBounds(in bitmap: NSBitmapImageRep) throws -> CGRect {
  guard let data = bitmap.bitmapData else {
    throw ComposeError.cannotReadPixels
  }

  let width = bitmap.pixelsWide
  let height = bitmap.pixelsHigh
  let bytesPerPixel = bitmap.bitsPerPixel / 8
  let bytesPerRow = bitmap.bytesPerRow

  var minX = width
  var minY = height
  var maxX = -1
  var maxY = -1

  for y in 0..<height {
    for x in 0..<width {
      let offset = y * bytesPerRow + x * bytesPerPixel
      let red = Int(data[offset])
      let green = Int(data[offset + 1])
      let blue = Int(data[offset + 2])
      let alpha = Int(data[offset + 3])

      let brightness = red + green + blue
      let isVisible = alpha > 16 || brightness > 48
      let isNearBlack = brightness < 24

      if isVisible && !isNearBlack {
        minX = min(minX, x)
        minY = min(minY, y)
        maxX = max(maxX, x)
        maxY = max(maxY, y)
      }
    }
  }

  if maxX < minX || maxY < minY {
    return CGRect(origin: .zero, size: image.size)
  }

  return CGRect(
    x: CGFloat(minX),
    y: CGFloat(minY),
    width: CGFloat(maxX - minX + 1),
    height: CGFloat(maxY - minY + 1)
  )
}

let sourceBitmap = try rgbaBitmap(from: image)
let sourceBounds = try contentBounds(in: sourceBitmap)

let canvasSize = CGSize(width: 1024, height: 1024)
let outerInset: CGFloat = 72
let iconRect = CGRect(
  x: outerInset,
  y: outerInset,
  width: canvasSize.width - outerInset * 2,
  height: canvasSize.height - outerInset * 2
)
let cornerRadius: CGFloat = 210
let shadowRect = iconRect.offsetBy(dx: 0, dy: -14)

guard let outputBitmap = NSBitmapImageRep(
  bitmapDataPlanes: nil,
  pixelsWide: Int(canvasSize.width),
  pixelsHigh: Int(canvasSize.height),
  bitsPerSample: 8,
  samplesPerPixel: 4,
  hasAlpha: true,
  isPlanar: false,
  colorSpaceName: .deviceRGB,
  bytesPerRow: 0,
  bitsPerPixel: 0
) else {
  throw ComposeError.cannotCreateBitmap
}

outputBitmap.size = canvasSize

NSGraphicsContext.saveGraphicsState()
guard let outputContext = NSGraphicsContext(bitmapImageRep: outputBitmap) else {
  throw ComposeError.cannotCreateBitmap
}

NSGraphicsContext.current = outputContext
outputContext.imageInterpolation = .high
NSColor.clear.setFill()
NSBezierPath(rect: CGRect(origin: .zero, size: canvasSize)).fill()

let shadow = NSShadow()
shadow.shadowBlurRadius = 42
shadow.shadowOffset = CGSize(width: 0, height: -14)
shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.35)
shadow.set()
NSColor(calibratedWhite: 0, alpha: 0.14).setFill()
NSBezierPath(roundedRect: shadowRect, xRadius: cornerRadius, yRadius: cornerRadius).fill()

NSGraphicsContext.restoreGraphicsState()
NSGraphicsContext.saveGraphicsState()
guard let drawContext = NSGraphicsContext(bitmapImageRep: outputBitmap) else {
  throw ComposeError.cannotCreateBitmap
}
NSGraphicsContext.current = drawContext
drawContext.imageInterpolation = .high

let clipPath = NSBezierPath(roundedRect: iconRect, xRadius: cornerRadius, yRadius: cornerRadius)
clipPath.addClip()
image.draw(in: iconRect, from: sourceBounds, operation: .sourceOver, fraction: 1.0)
drawContext.flushGraphics()
NSGraphicsContext.restoreGraphicsState()

guard let pngData = outputBitmap.representation(using: .png, properties: [:]) else {
  throw ComposeError.cannotCreateData
}

let outputURL = URL(fileURLWithPath: outputPath)
try FileManager.default.createDirectory(
  at: outputURL.deletingLastPathComponent(),
  withIntermediateDirectories: true
)
try pngData.write(to: outputURL)
