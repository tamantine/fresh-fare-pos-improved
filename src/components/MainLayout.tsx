import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Outlet, useSearchParams } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"


export default function MainLayout() {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'

    useEffect(() => {
        const handleFullscreenChange = () => {
            // Se houver algum elemento em fullscreen, consideramos que estamos nesse modo
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    return (
        <SidebarProvider defaultOpen={!isFullscreen && !isStandalone}>
            {/* Esconde a Sidebar se estiver em Fullscreen ou Standalone */}
            {!isFullscreen && !isStandalone && <AppSidebar />}

            <SidebarInset className={(isFullscreen || isStandalone) ? "h-screen p-0 m-0 border-0" : ""}>
                {/* Esconde o Header se estiver em Fullscreen ou Standalone */}
                {!isFullscreen && !isStandalone && (
                    <header className="flex h-14 items-center gap-2 border-b bg-background px-4 lg:h-[60px]">
                        <SidebarTrigger className="-ml-2 h-9 w-9 hover:bg-accent" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <div className="flex-1"></div>
                        <ModeToggle />
                    </header>
                )}

                <main className={`flex-1 overflow-auto ${(isFullscreen || isStandalone) ? "h-screen w-screen" : ""}`}>
                    <Outlet />
                </main>

            </SidebarInset>
        </SidebarProvider>
    )
}
