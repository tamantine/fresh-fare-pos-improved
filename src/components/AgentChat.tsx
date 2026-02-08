import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, X, Send, User, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export function AgentChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Chama a Edge Function do Supabase
            const response = await fetch('https://juhiiwsxrzhxprgbpeia.supabase.co/functions/v1/ai-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages // Envia historico para manter contexto
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(errorData.error || 'Falha na comunicação com o agente');
            }

            const data = await response.json();

            setMessages(prev => [...prev, { role: 'model', content: data.response }]);
        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: `❌ Erro: ${error.message || 'Verifique sua conexão.'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen ? (
                <Card className="w-[350px] sm:w-[400px] h-[500px] shadow-2xl border-2 border-emerald-500/20 flex flex-col animate-in fade-in slide-in-from-bottom-10">
                    <CardHeader className="bg-emerald-600 text-white p-4 rounded-t-lg flex flex-row items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6" />
                            <div>
                                <CardTitle className="text-base">Agente Inteligente</CardTitle>
                                <p className="text-xs text-emerald-100 opacity-90">Gerente Virtual - Supabase Connected</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-700 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-20 px-4">
                                <Bot className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Olá! Sou seu gerente virtual.</p>
                                <p className="text-xs mt-1">Pergunte sobre vendas, estoque ou preços.</p>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'model' && (
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Bot className="h-5 w-5 text-emerald-600" />
                                    </div>
                                )}

                                <div className={cn(
                                    "px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-emerald-600 text-white rounded-br-none"
                                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                                )}>
                                    {msg.role === 'model' ? (
                                        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                            {msg.content}
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                        <User className="h-5 w-5 text-gray-500" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600 mr-2" />
                                    <span className="text-xs text-gray-500">Analisando dados...</span>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <form
                            className="flex w-full gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                        >
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ex: Como estão as vendas?"
                                className="flex-1 focus-visible:ring-emerald-500 rounded-xl"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            ) : (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl border-4 border-white transition-all hover:scale-110 flex items-center justify-center"
                >
                    <MessageSquare className="h-7 w-7 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                </Button>
            )}
        </div>
    );
}
