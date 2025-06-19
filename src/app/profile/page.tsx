'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'react-toastify'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, updateProfile, changePassword, logout, isLoading } = useUserStore()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?returnUrl=/profile')
      return
    }
    
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      })
    }
  }, [user, isAuthenticated, router])

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {}

    if (!profileData.name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    }

    if (!profileData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = '현재 비밀번호를 입력해주세요'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = '새 비밀번호를 입력해주세요'
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다'
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = '새 비밀번호가 일치하지 않습니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      return
    }

    try {
      await updateProfile({
        name: profileData.name,
        phone: profileData.phone || undefined,
        avatar: profileData.avatar || undefined
      })
      toast.success('프로필이 업데이트되었습니다!')
    } catch (error: any) {
      console.error('Profile update error:', error)
      const message = error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다'
      toast.error(message)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      toast.success('비밀번호가 변경되었습니다!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      })
    } catch (error: any) {
      console.error('Password change error:', error)
      const message = error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다'
      toast.error(message)
    }
  }

  const handleLogout = async () => {
    if (confirm('정말 로그아웃하시겠습니까?')) {
      await logout()
      toast.info('로그아웃되었습니다')
      router.push('/')
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
            <p className="mt-1 text-sm text-gray-600">계정 정보를 관리하고 설정을 변경하세요.</p>
          </div>
          
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                프로필 정보
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                비밀번호 변경
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                계정 설정
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="bg-white shadow rounded-lg">
          {/* 프로필 정보 탭 */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">프로필 정보</h2>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* 이름 */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      이름
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      이메일
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      disabled
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                    />
                    <p className="mt-2 text-sm text-gray-500">이메일은 변경할 수 없습니다.</p>
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="010-0000-0000"
                    />
                  </div>

                  {/* 아바타 URL */}
                  <div>
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                      프로필 이미지 URL
                    </label>
                    <input
                      type="url"
                      id="avatar"
                      name="avatar"
                      value={profileData.avatar}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? '저장 중...' : '프로필 저장'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 비밀번호 변경 탭 */}
          {activeTab === 'password' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">비밀번호 변경</h2>
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                {/* 현재 비밀번호 */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.currentPassword && <p className="mt-2 text-sm text-red-600">{errors.currentPassword}</p>}
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.newPassword && <p className="mt-2 text-sm text-red-600">{errors.newPassword}</p>}
                </div>

                {/* 새 비밀번호 확인 */}
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.confirmNewPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmNewPassword}</p>}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 계정 설정 탭 */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">계정 설정</h2>
              
              <div className="space-y-6">
                {/* 계정 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">계정 정보</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">회원 ID</dt>
                      <dd className="text-sm text-gray-900">{user.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">가입일</dt>
                      <dd className="text-sm text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 로그아웃 */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">로그아웃</h3>
                      <p className="text-sm text-gray-500">현재 세션에서 로그아웃합니다.</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-gray-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>

                {/* 계정 삭제 (향후 구현) */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-red-900">계정 삭제</h3>
                      <p className="text-sm text-red-600">계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                    </div>
                    <button
                      disabled
                      className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white opacity-50 cursor-not-allowed"
                    >
                      계정 삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}