export default function PdfFirstPagePreview({ url }) {
  if (!url) return null;

  const previewUrl = `${url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  return (
    <div className="w-full h-48 bg-white overflow-hidden relative border-b border-zinc-100 rounded-t-xl">

      {/* Click block */}
      <div className="absolute inset-0 z-20 bg-transparent cursor-default" />

      {/* === MAIN FIX: Header aur Scrollbar ko size chhota karke bahar fek diya === */}
      <div className="absolute inset-0 overflow-hidden
                      -top- -right- -left-0 -bottom-0">

        <object
          data={previewUrl}
          type="application/pdf"
          className="w-[calc(100%+20px)] h-[calc(100%+36px)] border-0"
          style={{
            // thumb aur header ka size hi chhota kar diya
            scrollbarWidth: 'none'
          }}
        >
          <iframe
            src={previewUrl}
            className="w-[calc(100%+20px)] h-[calc(100%+36px)] border-0"
            style={{ scrollbarWidth: 'none' }}
            title="PDF Preview"
          />
        </object>
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
    </div>
  );
}