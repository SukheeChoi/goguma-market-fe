import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    reactStrictMode: true,
    
    images: {
        remotePatterns: [],
    },
    
    compiler: {
        styledComponents: true
    },
    // API 요청만 백엔드 서버로 프록시 처리
    async rewrites() {
        return [
            {
                // API 경로만 프록시 설정
                source: '/api/:path*', // API 요청만 프록시
                destination: 'http://127.0.0.1:8082/api/:path*', // 백엔드 서버로 요청 전달
            }
        ]
    }
}
// 설정 객체를 export (Next.js가 이 설정을 인식함)
export default nextConfig