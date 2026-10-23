/**
 * pdfmake ships browser bundles without published types for the build
 * entrypoints. Declare just the surface this app uses.
 */
declare module "pdfmake/build/pdfmake.js" {
  interface PdfMakeInstance {
    vfs: Record<string, string>;
    fonts?: Record<string, unknown>;
    createPdf(
      docDefinition: Record<string, unknown>,
      tableLayouts?: Record<string, unknown>,
      fonts?: Record<string, unknown>,
      vfs?: Record<string, string>
    ): {
      download(fileName?: string): void;
      open(): void;
      getBlob(cb: (blob: Blob) => void): void;
      getDataUrl(cb: (dataUrl: string) => void): void;
    };
  }
  const pdfMake: PdfMakeInstance;
  export default pdfMake;
}

declare module "pdfmake/build/vfs_fonts.js" {
  /** 0.2.x: default export is the flat vfs map; some builds wrap it in { vfs } or { pdfMake: { vfs } }. */
  const vfs: unknown;
  export default vfs;
  export const vfs: unknown;
  export const pdfMake: unknown;
}

declare module "html-to-pdfmake" {
  type PdfmakeNode = Record<string, unknown>;
  function htmlToPdfmake(html: string, options?: { window?: unknown }): PdfmakeNode[];
  export default htmlToPdfmake;
}
