import './globals.css'
import type { Metadata } from 'next'
import Header from "@/components/shared/header/Header";
import Footer from "@/components/shared/footer/Footer";

export const metadata: Metadata = {
  title: 'DockerSim',
  description: 'Docker Learn',
  /*description : 페이지의 설명.
  검색 엔진이 이 설명을 사용하여 검색 결과에 페이지를 요약해서 표시할 수 있으므로, SEO(검색 엔진 최적화)에 중요한 역할*/
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" 
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Header/>
        <main>
          {children}
        </main>
        <Footer/>
        <script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" 
          integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" 
          crossOrigin="anonymous"
        ></script>
      </body>
    </html>
  )
}
