import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import type { LoginData } from '../types/auth.types'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  return useMutation({ mutationFn: (data: LoginData) => login(data) })
}
