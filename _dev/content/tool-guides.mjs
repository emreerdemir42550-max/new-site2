// Comprehensive Tool-Specific Training Guides for the 15 tools that previously had gaps.
// Each provides authentic, technical, sourced documentation on the underlying browser APIs,
// format specifications (ISO 32000-1, PNG, WebP, ICO, sRGB), edge cases, and verification steps.
export const TOOL_GUIDES = {
  'split-pdf': {
    subtitle: 'How page-tree range slicing works in PDF-lib without re-encoding content streams.',
    overview: 'Splitting a PDF does not cut a stream of pixels in half. A PDF document stores its pages in a hierarchical Page Tree (§7.7.3 of ISO 32000-1). When you split a document by page range in your browser, PDF-lib parses the source cross-reference table, allocates a new empty PDFDocument for each requested range, and copies only the referenced page dictionaries and their dependent resources (fonts, XObjects, content streams) into each target file.',
    mechanics: [
      ['Input parsing', 'File.arrayBuffer() → PDFDocument.load(bytes, { updateMetadata: false })'],
      ['Range resolution', '1-indexed range parser validates bounds against getPageCount() before any allocation'],
      ['Object graph copy', 'targetDoc.copyPages(sourceDoc, zeroBasedIndices) clones page nodes & referenced streams'],
      ['Archive packaging', 'JSZip packages multiple output Blobs into a single DEFLATE-compressed .zip in memory'],
    ],
    workflow: [
      'Load the source PDF locally. The tool reads the root `/Pages` `/Count` entry and displays the exact page total.',
      'Select **Split by ranges** (for example `1-3, 4-10, 11-12`) or **One file per page** for single-page extraction.',
      'Inspect the live range preview below the input field — syntax errors or out-of-bounds page numbers are caught immediately.',
      'Run the split and either save individual range PDFs or download all generated parts as a single ZIP archive.',
    ],
    edgeCases: [
      'Document-level structures such as `/Names`, embedded file attachments, and document-wide JavaScript actions belong to the `/Catalog` rather than individual pages and are not copied into split parts.',
      'Interactive form fields (`/AcroForm`) attached to a copied page travel with the page, but cross-page calculation orders are not preserved across separate output files.',
      'Encrypted PDFs cannot be parsed without a password and are rejected upfront rather than producing unreadable slices.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — §7.7.3 Page Tree', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
      { title: 'pdf-lib — PDFDocument.copyPages', publisher: 'pdf-lib', url: 'https://pdf-lib.js.org/docs/api/classes/pdfdocument#copypages' },
    ],
  },
  'extract-pdf-pages': {
    subtitle: 'Selecting non-contiguous pages from a PDF object graph into a clean single document.',
    overview: 'Where Split PDF produces multiple files, Extract PDF Pages builds a single new PDF containing only the exact pages you list — in the order you list them. Because PDF-lib copies page objects by reference graph traversal, unreferenced images and fonts from dropped pages are left behind, making the extracted document genuinely smaller.',
    mechanics: [
      ['Selection syntax', 'Comma-separated pages & ranges (e.g. 2, 5-7, 11) expanded to an ordered 0-based index array'],
      ['Resource pruning', 'Only XObjects, font subsets, and ExtGState dictionaries referenced by kept pages are copied'],
      ['Stream preservation', 'Content streams are copied byte-for-byte — vector paths and text layers remain lossless'],
    ],
    workflow: [
      'Drop your PDF into the local workbench to inspect its total page count and byte size.',
      'Enter the page numbers or ranges you want to keep (such as `1, 4-6, 9`).',
      'Click **Extract pages**. The new document is assembled in tab memory and reports its final page count and byte size.',
    ],
    edgeCases: [
      'Shared font subsets used on at least one extracted page are copied in full; if a 200 KB embedded font is used on page 2, extracting page 2 retains that 200 KB font stream.',
      'Internal links ("GoTo" annotations) that point to a page you dropped will no longer resolve in the extracted file.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — §7.7.3.3 Page Objects', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
    ],
  },
  'rotate-pdf-pages': {
    subtitle: 'Why setting the PDF /Rotate attribute is instant, lossless, and never touches a pixel.',
    overview: 'Every page dictionary in a PDF supports an optional `/Rotate` entry whose value must be a multiple of 90 (`0`, `90`, `180`, or `270`). Rotating a page in a proper PDF tool does not decode images or redraw vectors — it simply updates that integer in the page dictionary and serializes the updated object table.',
    mechanics: [
      ['Attribute target', 'Page dictionary `/Rotate` integer entry (modulo 360, clockwise in degrees)'],
      ['Relative calculation', 'newAngle = (existingPageRotation + selectedDelta) % 360'],
      ['Fidelity impact', 'Zero generation loss — text remains selectable and image streams are untouched'],
    ],
    workflow: [
      'Select the PDF containing sideways or upside-down pages.',
      'Choose whether to rotate **All pages** or **Selected pages** (using ranges like `2, 4-5`).',
      'Pick `90° clockwise`, `180°`, or `90° counter-clockwise` (`270°`) and save the updated PDF.',
    ],
    edgeCases: [
      'Because `/Rotate` is a page-level instruction, rotating a page rotates the entire coordinate system of that page — you cannot rotate a single crooked photo inside an otherwise upright page with this attribute.',
      'If a scan was captured at an arbitrary 3° tilt (deskew), `/Rotate` cannot fix it because the PDF specification only permits 90° increments.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — Table 30: Entries in a page object (/Rotate)', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
    ],
  },
  'reorder-pdf-pages': {
    subtitle: 'Visual thumbnail rendering with PDF.js paired with lossless page-array reordering in PDF-lib.',
    overview: 'Reordering pages combines two browser engines: PDF.js renders low-resolution preview thumbnails onto `<canvas>` elements so you can see what each page looks like, while PDF-lib performs the actual structural rewrite by copying the original page objects in your new sequence.',
    mechanics: [
      ['Thumbnail preview', 'PDF.js getPage(i) rendered at 110px width into an offscreen canvas → JPEG data URI'],
      ['Interaction model', 'HTML5 Drag-and-Drop API paired with accessible ← / → keyboard buttons on every tile'],
      ['Document rebuild', 'PDFDocument.copyPages(source, newOrderIndices) writes a clean `/Pages` kids array'],
    ],
    workflow: [
      'Load a PDF. The first 60 pages render as visual thumbnails inside the workbench.',
      'Drag any page tile to a new slot, use the `←` and `→` buttons on each tile for keyboard-precise moves, or click **Reverse all**.',
      'Click **Save new order** to write and download the reordered PDF.',
    ],
    edgeCases: [
      'Printed page numbers drawn inside the page content stream are static text and do not renumber automatically when you move pages; pair with **Add PDF Page Numbers** if you need fresh numbering.',
      'To keep tab memory responsive on large documents, visual thumbnails are capped at the first 60 pages.',
    ],
    sources: [
      { title: 'PDF.js — PageViewport and render()', publisher: 'Mozilla', url: 'https://mozilla.github.io/pdf.js/' },
      { title: 'pdf-lib — PDFDocument API', publisher: 'pdf-lib', url: 'https://pdf-lib.js.org/docs/api/classes/pdfdocument' },
    ],
  },
  'images-to-pdf': {
    subtitle: 'Converting raster images into paginated PDF geometry with controlled margins and DPI scaling.',
    overview: 'A PDF page is measured in PostScript points (`1 pt = 1/72 inch`), whereas digital images are measured in pixels. Turning images into a clean PDF requires choosing a page geometry — either fixed physical sheets (`A4` at `595.28 × 841.89 pt` or `US Letter` at `612 × 792 pt`) with proportional centering, or fitting each page box directly to the image dimensions.',
    mechanics: [
      ['Bitmap decode', 'createImageBitmap() decodes JPG, PNG, or WebP and applies EXIF orientation automatically'],
      ['Resolution cap', 'Long edge capped at 2600 px on a high-smoothing canvas to prevent multi-hundred-MB PDFs'],
      ['Stream embedding', 'Canvas encoded as JPEG at chosen quality and embedded via pdfDoc.embedJpg()'],
      ['Page placement', 'Centered inside (pageWidth − 2×margin, pageHeight − 2×margin) preserving aspect ratio'],
    ],
    workflow: [
      'Select one or more JPG, PNG, or WebP images and arrange them in page order using the list controls.',
      'Choose a page size (**A4 portrait**, **US Letter**, or **Fit to image**), set the margin in points, and pick a JPEG encoding quality.',
      'Click **Build PDF** to assemble and download the paginated document.',
    ],
    edgeCases: [
      'Because pages are embedded as JPEG streams for predictable file sizes, transparent regions in PNG or WebP inputs are composited onto a clean white page background.',
      'Mixed portrait and landscape photos placed on fixed A4 portrait sheets are letterboxed with even margins rather than cropped.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — §8.3 Coordinate Systems (User Space 1/72 inch)', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
    ],
  },
  'pdf-to-images': {
    subtitle: 'Rasterizing PDF vector and text operators to PNG, JPG, or WebP at exact DPI multiples.',
    overview: 'Rendering a PDF page to an image executes the page content stream inside PDF.js’s 2D canvas graphics backend. Because standard PDF user space is 72 points per inch, a `1×` render equals `72 DPI`, `1.5×` equals `108 DPI`, `2×` equals `144 DPI`, and `3×` equals `216 DPI`.',
    mechanics: [
      ['Viewport scaling', 'page.getViewport({ scale }) multiplies user-space points by the DPI scale factor'],
      ['Canvas rasterizer', 'Opaque white 2D context (`alpha: false`) executes vector paths, font glyphs, and XObjects'],
      ['Codec output', 'canvas.toBlob() encodes PNG (lossless), JPEG (0.86 quality), or WebP per page'],
    ],
    workflow: [
      'Choose a source PDF and specify the page range you want to export (defaulting to the first pages).',
      'Pick an output format (**PNG** for crisp text/diagrams, **JPG** for photos, **WebP** for compact web assets) and a resolution scale (`1×` to `3×`).',
      'Click **Render pages** and download either the first image or a ZIP archive containing every rendered page.',
    ],
    edgeCases: [
      'Rendering many pages at `3×` (`216 DPI`) allocates large canvas backing stores; the tool warns when rendering more than 20 pages at 3×.',
      'Fonts that were not embedded in the original PDF are rendered using PDF.js fallback fonts, which can slightly alter glyph metrics compared to a desktop reader with local system fonts installed.',
    ],
    sources: [
      { title: 'PDF.js — Rendering PDF pages to Canvas', publisher: 'Mozilla', url: 'https://mozilla.github.io/pdf.js/' },
      { title: 'MDN — HTMLCanvasElement.toBlob()', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob' },
    ],
  },
  'pdf-metadata-cleaner': {
    subtitle: 'Inspecting and clearing the PDF Document Information Dictionary (/Info) locally.',
    overview: 'PDF files store authorship and production history in the Document Information Dictionary (`/Info`, §14.3.3 of ISO 32000-1): `/Title`, `/Author`, `/Subject`, `/Keywords`, `/Creator` (the source application, such as Word or InDesign), `/Producer` (the PDF converter), `/CreationDate`, and `/ModDate`. This tool reads every field into a transparent table and lets you strip any or all of them before saving a clean copy.',
    mechanics: [
      ['Dictionary inspection', 'PDFDocument getters read `/Title`, `/Author`, `/Subject`, `/Keywords`, `/Creator`, `/Producer`, dates'],
      ['Selective clearing', 'Unticked fields are overwritten with empty strings or epoch dates before serialization'],
      ['Byte preservation', 'Page content streams, fonts, and images are untouched — only the `/Info` dictionary changes'],
    ],
    workflow: [
      'Drop a PDF to inspect its live `/Info` dictionary in a structured table.',
      'Untick any field you want cleared (by default, populated fields are unticked so one click cleans them).',
      'Click **Save cleaned copy** and download the updated PDF.',
    ],
    edgeCases: [
      'Some PDFs also embed an XML-based `/Metadata` XMP stream on the document catalog or inside individual XObjects. This tool clears the standard `/Info` dictionary and states openly that deep XMP packet scrubbing requires a full document sanitizer.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — §14.3.3 Document Information Dictionary', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
    ],
  },
  'add-pdf-page-numbers': {
    subtitle: 'Stamping real, searchable Helvetica text overlays onto PDF pages with exact coordinate math.',
    overview: 'Unlike image-based stampers, Add PDF Page Numbers embeds the standard PDF `Helvetica` font resource and appends a lightweight text-drawing operator stream to each target page. Because each page is queried for its own `getSize()` width and height, mixed A4, Letter, and landscape pages in the same document each receive properly aligned numbering.',
    mechanics: [
      ['Font embedding', 'pdfDoc.embedFont(StandardFonts.Helvetica) embeds standard Type1 metrics'],
      ['Width measurement', 'font.widthOfTextAtSize(label, fontSize) computes exact horizontal centering & right-alignment'],
      ['Coordinate placement', 'Bottom positions draw at y = margin; top positions draw at y = pageHeight − margin'],
    ],
    workflow: [
      'Select your PDF and choose one of six positions (Bottom/Top × Left/Center/Right).',
      'Pick a number format (`1`, `1 / 12`, `Page 1`, or `— 1 —`), starting number, font size, margin in points, and optional page range.',
      'Click **Add page numbers** to stamp the text layer and download the numbered PDF.',
    ],
    edgeCases: [
      'PDF page overlays draw on top of existing page content. If a page has a full-bleed dark photograph extending into the margin, make sure your margin setting places the number in a clear area.',
    ],
    sources: [
      { title: 'pdf-lib — PDFPage.drawText & StandardFonts', publisher: 'pdf-lib', url: 'https://pdf-lib.js.org/docs/api/classes/pdfpage#drawtext' },
    ],
  },
  'add-pdf-watermark': {
    subtitle: 'Drawing translucent diagonal or horizontal vector text across PDF pages using ExtGState opacity.',
    overview: 'A PDF text watermark is drawn as vector text in `Helvetica-Bold` with an explicit graphics state opacity (`ca` / `CA` in the PDF `ExtGState` dictionary) and a rotation matrix centered on each page’s midpoint. Because the watermark is vector text rather than a raster overlay, it adds virtually zero bytes to the file and stays crisp at any zoom level.',
    mechanics: [
      ['Trigonometric centering', 'x = W/2 − cos(θ)·(textWidth/2), y = H/2 − sin(θ)·(textWidth/2)'],
      ['Graphics state', 'PDF-lib injects an ExtGState dictionary for non-destructive alpha blending (0.04 to 0.60)'],
      ['Scope control', 'Applies to all pages by default or to a specific page range list'],
    ],
    workflow: [
      'Load a PDF and enter your watermark label (e.g., `DRAFT`, `CONFIDENTIAL`, `DO NOT DISTRIBUTE`).',
      'Select the angle (`Diagonal 45°`, `Horizontal 0°`, or `Diagonal −45°`), opacity slider, and font size.',
      'Click **Apply watermark** and download the stamped document.',
    ],
    edgeCases: [
      'A watermark drawn into a PDF content stream is a visual mark, not DRM security — anyone with a PDF object editor can remove content streams.',
    ],
    sources: [
      { title: 'ISO 32000-1:2008 — §8.4.4 Graphics State Parameter Dictionaries', publisher: 'Adobe / ISO', url: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf' },
    ],
  },
  'image-resizer': {
    subtitle: 'High-quality bicubic canvas resampling with locked aspect ratios and batch ZIP export.',
    overview: 'Resizing a raster image recalculates a new pixel grid from the source bitmap. In the browser, `createImageBitmap()` decodes the file off the main thread and `ctx.drawImage()` with `imageSmoothingQuality = "high"` resamples the image to your target width and height or percentage scale.',
    mechanics: [
      ['Aspect lock', 'ratio = sourceWidth / sourceHeight; editing Width automatically updates Height (and vice versa)'],
      ['Resampling filter', '2D Canvas context with imageSmoothingEnabled = true & imageSmoothingQuality = "high"'],
      ['Format preservation', 'PNG inputs stay lossless PNG; photographic inputs encode as high-quality JPEG (0.92)'],
    ],
    workflow: [
      'Drop one or more images. The tool reads the first image’s pixel dimensions and locks the aspect ratio.',
      'Enter an exact pixel width/height or set a **Percent** scale (e.g. `50%`).',
      'Click **Resize** to preview the output dimensions and byte size, then download the image or batch ZIP.',
    ],
    edgeCases: [
      'Upscaling a small image (for example `150%` or `200%`) increases pixel count by interpolation but cannot invent real optical detail that was not present in the source.',
    ],
    sources: [
      { title: 'MDN — CanvasRenderingContext2D.imageSmoothingQuality', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality' },
    ],
  },
  'image-cropper': {
    subtitle: 'Pointer-event region selection mapped to exact source-bitmap pixel coordinates.',
    overview: 'Many online croppers crop the scaled-down CSS preview image instead of the full-resolution source bitmap, silently throwing away resolution. This tool tracks the display scale factor (`displayWidth / bitmapWidth`) and maps every pointer drag and corner-handle resize back to exact integer coordinates `(x, y, w, h)` on the full-resolution `ImageBitmap`.',
    mechanics: [
      ['Coordinate mapping', 'sourceDelta = pointerDelta / (imgElement.clientWidth / bitmap.width)'],
      ['Aspect constraints', 'Supports Free, 1:1, 4:5, 5:4, 16:9, 3:2, and 2:3 ratios with boundary clamping'],
      ['Pixel extraction', 'ctx.drawImage(bitmap, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)'],
    ],
    workflow: [
      'Select an image to open the interactive crop stage.',
      'Choose a preset aspect ratio or leave **Free** selected, then drag the crop box or its four corner handles. The live readout displays the exact pixel dimensions and `(x, y)` origin.',
      'Select `PNG` or `JPG`, click **Crop image**, and download the cropped file.',
    ],
    edgeCases: [
      'Minimum crop region is clamped to `16 × 16 px` so an accidental click never produces a 0-pixel canvas error.',
    ],
    sources: [
      { title: 'MDN — CanvasRenderingContext2D.drawImage() 9-argument sub-rectangle', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage' },
    ],
  },
  'image-format-converter': {
    subtitle: 'Converting between PNG, JPEG, WebP, and AVIF using real browser codec capability checks.',
    overview: 'Browsers include native C++/Rust codecs for decoding and encoding image formats. Rather than pretending every browser can encode every format, this tool runs a live 2×2 `canvas.toDataURL("image/avif")` probe on startup and enables AVIF output only when your browser’s encoder actually supports it.',
    mechanics: [
      ['Codec probe', 'Tests `canvas.toDataURL(mime).startsWith("data:" + mime)` before enabling optional encoders'],
      ['Alpha compositing', 'When converting transparent PNG/WebP to opaque JPEG, fills canvas with your chosen matte color first'],
      ['Batch conversion', 'Processes multiple images in sequence and packages multi-file jobs into a local ZIP'],
    ],
    workflow: [
      'Add one or more images (PNG, JPG, WebP, AVIF, GIF, or BMP).',
      'Pick the **Target format** (`WebP`, `PNG`, `JPG`, or `AVIF`), adjust the quality slider for lossy formats, and choose a background matte color for JPEG.',
      'Click **Convert** and compare the total before/after byte counts before downloading.',
    ],
    edgeCases: [
      'Converting a photographic JPEG to PNG will almost always increase file size dramatically because PNG is a lossless deflate format designed for sharp graphics and alpha channels.',
    ],
    sources: [
      { title: 'MDN — Image file type and format guide', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types' },
    ],
  },
  'image-color-picker': {
    subtitle: 'Sampling exact sRGB pixel values with a 12×12 pixelated loupe and keyboard arrow navigation.',
    overview: 'Image Color Picker renders your image onto a 2D `<canvas>` and reads raw `[R, G, B, A]` bytes from `ctx.getImageData(x, y, 1, 1).data`. Alongside mouse click sampling, the canvas is focusable (`tabindex="0"`) so you can nudge the sample crosshair 1 pixel at a time with the arrow keys (or 10 pixels with `Shift + Arrow`) while watching a magnified `12 × 12 px` loupe.',
    mechanics: [
      ['Pixel readback', 'ctx.getImageData(x, y, 1, 1).data returns unsigned 8-bit sRGB channels [0..255]'],
      ['Color conversions', 'Computes `#RRGGBB` hex, `R, G, B` decimal tuple, and cylindrical `HSL(h°, s%, l%)`'],
      ['Magnifier loupe', '96×96 secondary canvas with `imageSmoothingEnabled = false` renders a 8× zoomed 12×12 patch'],
    ],
    workflow: [
      'Choose an image to render it onto the sampling canvas.',
      'Click any point on the image — or focus the canvas and use the arrow keys for single-pixel precision.',
      'Click any swatch chip in the recent history tray to copy its `#hex` code to your clipboard.',
    ],
    edgeCases: [
      'HTML5 Canvas 2D contexts default to the `sRGB` color space; Display-P3 or AdobeRGB images are converted to sRGB by the browser when drawn.',
    ],
    sources: [
      { title: 'MDN — CanvasRenderingContext2D.getImageData()', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData' },
    ],
  },
  'image-palette-extractor': {
    subtitle: 'Clustering dominant image colors in sRGB space using Paul Heckbert’s median-cut quantization.',
    overview: 'Extracting a meaningful palette from millions of pixels requires clustering similar colors rather than counting identical hex codes. This tool downsamples the image to a maximum edge of `320 px`, filters out transparent pixels (`alpha < 16`), and runs median-cut color quantization: recursively splitting the RGB bounding box with the largest channel range along its median until the requested number of color clusters (`4` to `12`) is reached.',
    mechanics: [
      ['Subsampling', 'Resizes longest edge to ≤320 px so quantization completes in under 30 ms'],
      ['Median-cut split', 'Finds the cluster with max(ΔR, ΔG, ΔB), sorts pixels along that channel, and bisects at the median'],
      ['Population share', 'Reports each cluster’s mean RGB color and its exact percentage share of non-transparent pixels'],
    ],
    workflow: [
      'Select a palette size (`4`, `6`, `8`, `10`, or `12` colors) and drop an image.',
      'Inspect the extracted swatches sorted by pixel share percentage.',
      'Copy the palette as a comma-separated hex list, a ready-to-paste `:root { --palette-1: ... }` CSS block, or structured JSON.',
    ],
    edgeCases: [
      'Because median-cut averages the pixels inside each split box, a tiny neon accent occupying less than 0.5% of the image may be averaged into a neighboring cluster; use **Image Color Picker** to sample small highlights directly.',
    ],
    sources: [
      { title: 'Color Image Quantization for Frame Buffer Display (Median Cut)', publisher: 'Paul Heckbert / SIGGRAPH 1982', url: 'https://dl.acm.org/doi/10.1145/800064.801294' },
    ],
  },
  'favicon-generator': {
    subtitle: 'Building binary ICONDIR .ico containers and multi-size PNG + Web App Manifest packages in JavaScript.',
    overview: 'A modern favicon package needs both a legacy multi-resolution `favicon.ico` (containing `16×16`, `32×32`, and `48×48` images) and high-resolution PNG icons (`180×180` for `apple-touch-icon`, plus `192×192` and `512×512` referenced by `site.webmanifest`). This tool resizes your square logo across all six resolutions on high-smoothing canvases and writes the binary `.ico` header (`ICONDIR` + `ICONDIRENTRY` directory table pointing at embedded PNG payloads) directly in a `DataView` buffer.',
    mechanics: [
      ['Resolution matrix', 'Generates 16, 32, 48, 180, 192, and 512 px square PNGs with centered aspect-fit padding'],
      ['Binary ICO writer', 'Constructs a 6-byte ICONDIR header + drie 16-byte ICONDIRENTRY records + raw PNG byte streams'],
      ['Manifest & HTML', 'Generates a valid `site.webmanifest` JSON file and copy-ready `<link rel="icon">` HTML tags'],
    ],
    workflow: [
      'Choose a square logo (at least `512 × 512 px` recommended; non-square logos are centered automatically).',
      'Toggle **Keep transparent background** or pick a solid background fill color (used both for opaque padding and `theme_color`).',
      'Click **Generate favicon set** to preview the `16px`, `32px`, `48px`, and `180px` renders, copy the HTML `<head>` snippet, and download either the standalone `favicon.ico` or the complete `.zip` bundle.',
    ],
    edgeCases: [
      'Very fine text or thin 1 px strokes in a 512 px logo will disappear when downsampled to `16 × 16 px`; test legibility at the 16 px preview tile in the result pane.',
    ],
    sources: [
      { title: 'ICO file format specification (ICONDIR & PNG-in-ICO)', publisher: 'Wikipedia / Microsoft Win32', url: 'https://en.wikipedia.org/wiki/ICO_(file_format)' },
      { title: 'Web Application Manifest', publisher: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/Manifest' },
    ],
  },
};
