'use client';

import { FileText, ImageIcon, MoreVertical } from 'lucide-react';

type AttachmentBubbleProps = {
  fileName: string;
  url?: string | null;
  mimeType?: string | null;
  onDelete?: () => void;
};

export default function AttachmentBubble({
  fileName,
  url,
  mimeType,
  onDelete
}: AttachmentBubbleProps) {
  const isImage = (mimeType || '').startsWith('image/');

  return (
    <div className="relative w-[245px] max-w-full rounded-2xl border border-cyan-200/70 bg-white/75 overflow-hidden">
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full text-cyan-900/60 hover:bg-cyan-100 flex items-center justify-center"
          title="Eliminar adjunto"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      )}

      {isImage && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt={fileName}
            className="w-full max-h-[180px] object-cover bg-cyan-50"
          />
        </a>
      ) : (
        <a
          href={url || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-3 hover:bg-cyan-50/70"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-800 shrink-0">
            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <div className="text-sm font-medium text-[#184B53] truncate">
              {fileName}
            </div>

            <div className="text-[11px] text-cyan-900/50">
              Ver archivo
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
