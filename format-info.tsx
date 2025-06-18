import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function FormatInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Format Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold mb-1">JPEG</h3>
          <p className="text-muted-foreground">
            Best for photographs and complex images with many colors. Lossy compression means smaller file sizes but
            some quality loss. No transparency support.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">PNG</h3>
          <p className="text-muted-foreground">
            Lossless compression preserves quality but results in larger files. Supports transparency. Best for
            graphics, logos, text, and screenshots.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">WebP</h3>
          <p className="text-muted-foreground">
            Modern format that offers both lossy and lossless compression with smaller file sizes than JPEG or PNG.
            Supports transparency and animation. Excellent all-around choice for web.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">GIF</h3>
          <p className="text-muted-foreground">
            Limited to 256 colors. Supports animation and transparency. Best for simple animations and graphics with
            limited colors.
          </p>
        </div>

        <div>
          <h3 className="font-semibold mb-1">AVIF</h3>
          <p className="text-muted-foreground">
            Newest format with excellent compression and quality. Significantly smaller than JPEG at similar quality.
            Limited browser support (Chrome, Firefox, but not Safari).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
