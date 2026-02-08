
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    }, [disabled]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleUpload(file);
        }
    };

    const handleUpload = async (file: File) => {
        try {
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione apenas arquivos de imagem.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('A imagem deve ter no máximo 5MB.');
                return;
            }

            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('produtos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('produtos')
                .getPublicUrl(filePath);

            onChange(data.publicUrl);
            toast.success('Imagem enviada com sucesso!');
        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error('Erro ao enviar imagem: ' + error.message);
        } finally {
            setIsUploading(false);
            // Clear input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className="w-full">
            <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative group cursor-pointer 
          border-2 border-dashed rounded-xl p-4 transition-all duration-200
          flex flex-col items-center justify-center gap-2 min-h-[200px]
          ${isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                    }
          ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    disabled={disabled}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">Enviando imagem...</span>
                    </div>
                ) : value ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-h-[180px] w-auto object-contain rounded-lg shadow-sm"
                        />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="rounded-full shadow-lg"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <p className="absolute bottom-2 text-white text-xs font-medium">
                                    Clique ou arraste para trocar
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className={`
              p-3 rounded-full bg-slate-100 transition-colors
              ${isDragOver ? 'bg-primary/10 text-primary' : 'group-hover:bg-primary/10 group-hover:text-primary'}
            `}>
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-slate-600">
                                Clique ou arraste uma imagem aqui
                            </p>
                            <p className="text-xs text-slate-400">
                                JPG, PNG, WEBP (Máx. 5MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
