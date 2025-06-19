'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { authService } from '@/services/authService'
import { toast } from 'react-toastify'

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading } = useUserStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeTerms: false,
    agreePrivacy: false
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // 이메일이 변경되면 중복 확인 상태 초기화
    if (name === 'email') {
      setEmailChecked(false)
      setEmailAvailable(false)
    }
    
    // 실시간 유효성 검사
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const checkEmailAvailability = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요' }))
      return
    }
    
    if (!isValidEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }))
      return
    }

    try {
      const result = await authService.checkEmail(formData.email)
      setEmailChecked(true)
      if (result.exists) {
        setEmailAvailable(false)
        setErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다' }))
      } else {
        setEmailAvailable(true)
        setErrors(prev => ({ ...prev, email: '' }))
        toast.success('사용 가능한 이메일입니다')
      }
    } catch (error) {
      console.error('Email check error:', error)
      toast.error('이메일 확인 중 오류가 발생했습니다')
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다'
    } else if (!emailChecked || !emailAvailable) {
      newErrors.email = '이메일 중복 확인을 해주세요'
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요'
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요'
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보처리방침에 동의해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await signup(formData.name, formData.email, formData.password, formData.phone || undefined)
      toast.success('회원가입이 완료되었습니다!')
      router.push('/')
    } catch (error: any) {
      console.error('Signup error:', error)
      const message = error.response?.data?.message || '회원가입 중 오류가 발생했습니다'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          고구마마켓 회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            로그인하기
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름 *
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="이름을 입력해주세요"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 주소 *
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="email@example.com"
                />
                <button
                  type="button"
                  onClick={checkEmailAvailability}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  확인
                </button>
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              {emailChecked && emailAvailable && (
                <p className="mt-2 text-sm text-green-600">사용 가능한 이메일입니다</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호 *
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="최소 6자 이상"
                />
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인 *
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="비밀번호를 다시 입력해주세요"
                />
                {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                전화번호 (선택)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                  <span className="text-red-500">*</span> 이용약관에 동의합니다
                </label>
              </div>
              {errors.agreeTerms && <p className="text-sm text-red-600">{errors.agreeTerms}</p>}

              <div className="flex items-center">
                <input
                  id="agreePrivacy"
                  name="agreePrivacy"
                  type="checkbox"
                  checked={formData.agreePrivacy}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="agreePrivacy" className="ml-2 block text-sm text-gray-900">
                  <span className="text-red-500">*</span> 개인정보처리방침에 동의합니다
                </label>
              </div>
              {errors.agreePrivacy && <p className="text-sm text-red-600">{errors.agreePrivacy}</p>}
            </div>

            {/* 회원가입 버튼 */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}