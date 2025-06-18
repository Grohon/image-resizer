import ImageResizer from "../image-resizer"
import { FormatInfo } from "../format-info"

export default function Page() {
  return (
    <div className="space-y-8 pb-10">
      <ImageResizer />
      <div className="max-w-6xl mx-auto px-6">
        <FormatInfo />
      </div>
    </div>
  )
}
