import RelocationChatbot from "@/components/relocation-chatbot"
import Image from "next/image"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ヒーローセクション */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="美しい山の風景"
          fill
          priority
          className="object-cover brightness-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900/30 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 drop-shadow-md">
            移住支援レコメンドチャットボット
          </h1>
          <p className="text-center text-white/90 max-w-2xl mx-auto text-sm md:text-base drop-shadow-md">
            条件フィルターで絞り込み、チャットで具体的な希望を伝えることで、あなたに最適な移住先を見つけます。
          </p>
        </div>
      </div>

      <div className="container px-4 py-6 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左サイド：イメージギャラリー（タブレット以上で表示） */}
          <div className="hidden md:block">
            <div className="space-y-4">
              <div className="relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                  alt="田舎の家"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                  alt="海辺の家"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1571055107559-3e67626fa8be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1331&q=80"
                  alt="田園風景"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* メインコンテンツ：チャットボット */}
          <div className="md:col-span-2">
            <RelocationChatbot />
          </div>
        </div>
      </div>
    </main>
  )
}

