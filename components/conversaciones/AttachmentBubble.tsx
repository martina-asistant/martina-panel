'use client';

import { useEffect, useState } from 'react';
import { FileText, ImageIcon, File, ExternalLink, MoreVertical } from 'lucide-react';

type AttachmentBubbleProps = {
  fileName?: string | null;
  url?: string | null;
  mimeType?: string | null;
  onDelete?: () => void;
};

const getCleanFileName = (fileName?: string | null, url?: string | null) => {
  const raw = fileName || url || 'Archivo';

  try {
    const last = raw.split('/').pop() || raw;
    return decodeURIComponent(last.split('?')[0]);
  } catch {
    return raw;
  }
};

const getFileKind = (mimeType?: string | null, fileName?: string | null) => {
  const mime = String(mimeType || '').toLowerCase();
  const name = String(fileName || '').toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(name)) {
    return 'image';
  }

  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }

  if (
    mime.includes('word') ||
    mime.includes('document') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return 'word';
  }

  return 'file';
};

const getFileLabel = (kind: string) => {
  if (kind === 'image') return 'Imagen';
  if (kind === 'pdf') return 'PDF';
  if (kind === 'word') return 'Documento';
  return 'Archivo';
};

export default function AttachmentBubble({
  fileName,
  url,
  mimeType,
  onDelete
}: AttachmentBubbleProps) {
  const cleanName = getCleanFileName(fileName, url);
  const kind = getFileKind(mimeType, cleanName);
  const label = getFileLabel(kind);
  const hasUrl = Boolean(url);
  const [signedUrl, setSignedUrl] = useState('');

useEffect(() => {
  let cancelled = false;

  setSignedUrl('');

  if (!url) return;

  const cargarAdjunto = async () => {
    try {
      const res = await fetch(
        `/api/adjunto-signed-url?path=${encodeURIComponent(url)}`
      );

      const data = await res.json();

      if (!res.ok || !data?.signedUrl) {
        throw new Error(data?.error || 'No se pudo obtener signed URL');
      }

      if (!cancelled) {
        setSignedUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Error preparando adjunto:', { url, error });
    }
  };

  cargarAdjunto();

  return () => {
    cancelled = true;
  };
}, [url]);

const finalUrl = signedUrl;
const hasFinalUrl = Boolean(finalUrl);

  const Icon =
    kind === 'image'
      ? ImageIcon
      : kind === 'file'
        ? File
        : FileText;

  return (
    <div className="relative w-[260px] max-w-full rounded-2xl border border-cyan-200/70 bg-white/75 overflow-hidden shadow-[0_0_12px_rgba(34,211,238,.08)]">
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

      {kind === 'image' && hasFinalUrl ? (
        <a href={finalUrl || '#'} target="_blank" rel="noreferrer" className="block">
          <div className="bg-cyan-50">
            <img src={finalUrl || ''}
              alt={cleanName}
              className="w-full max-h-[190px] object-cover"
            />
          </div>

          <div className="py-2 text-center text-[10px] text-cyan-900/50">
  Tocar para abrir
</div>
        </a>
      ) : (
        <a
          href={finalUrl || '#'}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (!hasFinalUrl) e.preventDefault();
          }}
          className="flex items-center gap-3 px-3 py-3 pr-9 hover:bg-cyan-50/80 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-800 shrink-0">
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-[#184B53] truncate">
              {cleanName}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-cyan-900/50">
              <span>{label}</span>
              {hasFinalUrl && (
                <>
                  <span>·</span>
                  <span>Ver archivo</span>
                  <ExternalLink className="w-3 h-3" />
                </>
              )}
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
