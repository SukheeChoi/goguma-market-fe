// Tailwind CSS 설정 타입을 명시적으로 import (타입 안정성을 위해)
import type { Config } from 'tailwindcss'

// Tailwind CSS 공식 플러그인들 import
import typography from '@tailwindcss/typography'       // 글꼴/문단 스타일 확장
import forms from '@tailwindcss/forms'                 // 폼 요소(input, textarea 등) 스타일 확장
import aspectRatio from '@tailwindcss/aspect-ratio'    // 비율 유지(예: 16:9 등) 유틸리티 제공

// Tailwind 설정 객체
const config: Config = {
    // Tailwind가 사용할 클래스명을 추출할 파일 경로들
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',        // Next.js의 app 디렉터리 내 모든 JS/TS/MDX 파일
        './components/**/*.{js,ts,jsx,tsx,mdx}', // 재사용 컴포넌트 디렉터리
        './src/**/*.{js,ts,jsx,tsx,mdx}',        // 기타 src 디렉터리 내 소스 파일
    ],

    // Tailwind 플러그인 설정
    plugins: [
        typography,   // 글꼴 및 문단 관련 유틸리티 클래스 추가 (ex. prose)
        forms,        // 기본 폼 요소 스타일 초기화 및 커스터마이징
        aspectRatio   // 특정 비율 박스를 만들기 위한 유틸리티 클래스 추가
    ],
}

// 설정을 외부에서 사용할 수 있도록 export
export default config